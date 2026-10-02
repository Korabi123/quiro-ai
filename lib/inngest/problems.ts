import { NonRetriableError } from "inngest";
import prismadb from "@/lib/prismadb";
import { inngest } from "@/lib/inngest/client";
import { markJobRunning, type JobFields } from "@/lib/inngest/jobs";
import { runBatch, type BatchTestCase } from "@/lib/problems/run-batch";

/**
 * Runs a candidate solution against a batch of test cases as a durable job.
 *
 * This was the worst offender in the app: up to 33 sequential Judge0 calls, each
 * polling for up to 20 seconds, all inside one HTTP request - around eleven
 * minutes during which the client held an open connection and had no way to tell
 * a slow run from a hung one. A disconnect after two minutes meant paying for
 * the whole batch and receiving nothing.
 */

const EXECUTION_JOB_FIELDS: JobFields = {
  status: "jobStatus",
  stage: "jobStage",
  error: "jobError",
  endedAt: "jobEndedAt",
};

export const executeTestBatch = inngest.createFunction(
  {
    id: "problems-execute-batch",
    triggers: [{ event: "submissions/execute-batch" }],
    //* A Judge0 hiccup mid-batch is recoverable; a genuine compile error is
    //* reported per test case rather than thrown, so retries only fire for
    //* transport-level problems.
    retries: 1,
    //* Generous: 33 cases x ~20s of polling is ~11 minutes before overhead.
    timeouts: { start: "10m", finish: "30m" },
    //* One concurrent batch per execution id. Not per user: a user legitimately
    //* runs a batch and a submit back to back, and serialising on the user
    //* would make the second one queue behind the first.
    concurrency: [{ key: "event.data.executionId", limit: 1 }],
  },
  async ({ event, step }) => {
    const { executionId, userId } = event.data;

    const execution = await step.run("load-execution", () =>
      prismadb.codeExecution.findFirst({
        where: { id: executionId, userId },
        select: {
          id: true,
          code: true,
          language: true,
          testCases: true,
          problemContent: true,
          generateHidden: true,
          jobStatus: true,
        },
      })
    );

    if (!execution) {
      throw new NonRetriableError("Execution not found");
    }

    //* Already finished. A duplicate delivery must not re-run 33 judge calls or
    //* overwrite results the client may already have read.
    if (execution.jobStatus === "COMPLETED") {
      return { skipped: true };
    }

    await step.run("mark-running", () =>
      markJobRunning(prismadb.codeExecution, executionId, "executing tests", EXECUTION_JOB_FIELDS)
    );

    const outcome = await step.run("run-batch", () =>
      runBatch({
        code: execution.code,
        language: execution.language,
        testCases: execution.testCases as unknown as BatchTestCase[],
        problemContent: execution.problemContent,
        generateHidden: execution.generateHidden,
        //* Progress is not checkpointed into the row on every tick. Doing so
        //* would mean 33 extra writes for information the client cannot act on
        //* mid-run, so it is left at "executing tests" and the stage advances
        //* only at meaningful boundaries.
      })
    );

    await step.run("persist", () =>
      prismadb.codeExecution.update({
        where: { id: executionId },
        //* results and summary are written together so a poller can never
        //* observe one without the other.
        data: {
          jobStatus: "COMPLETED",
          jobStage: null,
          jobError: null,
          jobEndedAt: new Date(),
          results: outcome.results as unknown as object,
          summary: outcome.summary as unknown as object,
        },
      })
    );

    return { skipped: false, total: outcome.summary.total, passed: outcome.summary.passed };
  }
);