import { NonRetriableError } from "inngest";
import prismadb from "@/lib/prismadb";
import { inngest } from "@/lib/inngest/client";
import { markJobRunning, type JobFields } from "@/lib/inngest/jobs";
import { generateReportQuestions } from "@/lib/reports/generate-questions";
import { gradeReportAnswers } from "@/lib/reports/grade-answers";

/**
 * Inngest functions backing the two long-running report flows.
 *
 * Both used to run inline in their route handlers, so an unbounded model call
 * plus up to 18 writes happened inside one HTTP request. Neither had a way to
 * represent failure: completion was inferred from `questions.length` and
 * `summary != null`, so a report whose generation threw was indistinguishable
 * from one that had never been started.
 *
 * The domain logic lives in `@/lib/reports/*`. Keeping it there meant the
 * hand-tuned prompts were moved verbatim rather than rewritten, which matters
 * because they are the product's question-quality contract.
 */

const REPORT_JOB_FIELDS: JobFields = {
  status: "jobStatus",
  stage: "jobStage",
  error: "jobError",
  endedAt: "jobEndedAt",
};

export const generateReport = inngest.createFunction(
  {
    id: "reports-generate",
    triggers: [{ event: "reports/generate" }],
    retries: 2,
    //* One large model call plus a transaction. 15m leaves room for the call
    //* and its retries without the step dying mid-write.
    timeouts: { start: "10m", finish: "15m" },
    //* Keyed on the report, not the user: a single report cannot generate
    //* twice concurrently, but one user's parallel reports are not blocked.
    concurrency: [{ key: "event.data.reportId", limit: 1 }],
  },
  async ({ event, step }) => {
    const { reportId, userId } = event.data;

    const report = await step.run("load-report", () =>
      prismadb.report.findFirst({
        where: { id: reportId, userId },
        select: {
          id: true,
          name: true,
          field: true,
          type: true,
          customType: true,
          jobStatus: true,
          _count: { select: { questions: true } },
        },
      })
    );

    if (!report) {
      //* Deleted between enqueue and pickup. Retrying cannot fix that.
      throw new NonRetriableError("Report not found");
    }

    //* Idempotency that event dedupe cannot provide: a *completed* job that
    //* already has questions. A partial set from an older failed run is
    //* deliberately not skipped - repairing it is the bug this replaces, since
    //* the old route refused to regenerate whenever any question existed.
    if (report.jobStatus === "COMPLETED" && report._count.questions > 0) {
      return { skipped: true };
    }

    await step.run("mark-running", () =>
      markJobRunning(prismadb.report, reportId, "generating questions", REPORT_JOB_FIELDS)
    );

    await step.run("generate", () => generateReportQuestions(report));

    await step.run("complete", () =>
      prismadb.report.update({
        where: { id: reportId },
        data: {
          jobStatus: "COMPLETED",
          jobStage: null,
          jobError: null,
          jobEndedAt: new Date(),
        },
      })
    );

    return { skipped: false, questions: report._count.questions };
  }
);

export const gradeReport = inngest.createFunction(
  {
    id: "reports-grade",
    triggers: [{ event: "reports/grade" }],
    retries: 2,
    timeouts: { start: "10m", finish: "15m" },
    concurrency: [{ key: "event.data.reportId", limit: 1 }],
  },
  async ({ event, step }) => {
    const { reportId, userId } = event.data;
    const answers = event.data.answers;

    const report = await step.run("load-report", () =>
      prismadb.report.findFirst({
        where: { id: reportId, userId },
        select: {
          id: true,
          summary: true,
          jobStatus: true,
          _count: { select: { questions: true } },
        },
      })
    );

    if (!report) {
      throw new NonRetriableError("Report not found");
    }

    if (report._count.questions === 0) {
      //* Grading an empty report burns tokens to produce a meaningless score.
      throw new NonRetriableError("Cannot grade a report with no questions");
    }

    //* Re-running would overwrite a stored result with a different model's
    //* output, so a completed grade is treated as a duplicate delivery.
    if (report.jobStatus === "COMPLETED" && report.summary) {
      return { skipped: true };
    }

    if (answers.length === 0) {
      throw new NonRetriableError("No answers submitted");
    }

    await step.run("mark-running", () =>
      markJobRunning(prismadb.report, reportId, "grading answers", REPORT_JOB_FIELDS)
    );

    const result = await step.run("grade", () =>
      gradeReportAnswers({ reportId, userId, answers })
    );

    await step.run("complete", () =>
      prismadb.report.update({
        where: { id: reportId },
        data: {
          jobStatus: "COMPLETED",
          jobStage: null,
          jobError: null,
          jobEndedAt: new Date(),
        },
      })
    );

    return { skipped: false, score: result.overallScore ?? null };
  }
);