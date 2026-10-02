import { NonRetriableError } from "inngest";
import prismadb from "@/lib/prismadb";
import { getGitHubClientForUser } from "@/lib/github-server";
import { runGradingPipeline, type PipelineEvent } from "@/lib/grading/pipeline";
import { buildGradePayload } from "@/lib/grading/schema";
import { updateStreak } from "@/lib/streak";
import { inngest, RUN_CANCELLED_ERROR } from "@/lib/inngest/client";

/**
 * Returns true when the user cancelled this run while it was in flight.
 *
 * Cancellation is cooperative: the HTTP request marks the row FAILED, and the
 * worker notices on its next progress tick.
 */
const isCancelled = async (runId: string): Promise<boolean> => {
  const run = await prismadb.gradeRun.findUnique({
    where: { id: runId },
    select: { status: true, error: true },
  });

  return run?.status === "FAILED" && run.error === RUN_CANCELLED_ERROR;
};

/**
 * Durable grading job.
 *
 * The pipeline is one long unit of work, so it lives in a single step rather
 * than being split across `step.run()` boundaries: every model call depends on
 * the previous one, which means memoisation would only add overhead. The run
 * row is the durable state, so a retry re-reads it and continues from the
 * top.
 */
export const gradeRepository = inngest.createFunction(
  {
    id: "project-grading-grade-repository",
    triggers: [{ event: "project-grading/run" }],
    //* Runs are expensive; retry on transient infrastructure failures only.
    retries: 2,
    //* `start` bounds the queue wait before the function body begins.
    //*
    //* `finish` bounds the entire function including every retry, so it must
    //* exceed `start`. These were previously `start: 10m` / `finish: 5m`, which
    //* is self-contradictory: Inngest enforces finish from the moment the event
    //* is scheduled, so a run that sat in the queue for even a few minutes was
    //* killed before the body could finish. The ceiling is kept finite so a
    //* genuinely stuck run is eventually reaped rather than running forever.
    timeouts: {
      start: "10m",
      finish: "45m",
    },
    concurrency: {
      //* One grading run per user at a time. This protects the AI budget from
      //* a user queuing the same repo repeatedly.
      //*
      //* `key` is a CEL expression evaluated against the triggering event, not a
      //* `{{ ... }}` template. It must parse as CEL and evaluate to a string -
      //* any static prefix has to be concatenated with `+` rather than written
      //* inline, e.g. `"project-grading:user:" + event.data.userId`.
      key: "event.data.userId",
      limit: 1,
    },
  },
  async ({ event, step }) => {
    const { runId, userId, repositoryId, fullName } = event.data;
    const startedAt = Date.now();

    //* Steps receive events from anywhere; verify ownership before doing work.
    const run = await step.run("load-run", async () => {
      const existing = await prismadb.gradeRun.findFirst({
        where: { id: runId, userId },
        select: { id: true, status: true },
      });

      if (!existing) {
        throw new NonRetriableError(`Grade run ${runId} not found for user`);
      }

      return existing;
    });

    if (run.status === "COMPLETED") {
      return { runId, skipped: true, reason: "already completed" };
    }

    const result = await step.run("run-pipeline", async () => {
      await prismadb.gradeRun.update({
        where: { id: runId },
        data: { status: "RUNNING", stage: "starting", error: null },
      });

      const client = await getGitHubClientForUser(userId);

      try {
        const pipelineResult = await runGradingPipeline(
          client,
          fullName,
          async (event: PipelineEvent) => {
            //* Progress is written best-effort; a failed progress write must
            //* never fail the run.
            if (event.stage === "done" || event.stage === "failed") {
              return;
            }

            //* Cancellation checkpoint. Throwing NonRetriableError unwinds the
            //* pipeline before it spends more tokens on a run the user already
            //* walked away from.
            if (await isCancelled(runId)) {
              throw new NonRetriableError(RUN_CANCELLED_ERROR);
            }

            await prismadb.gradeRun.update({
              where: { id: runId },
              data: { stage: `${event.stage}:${event.progress}` },
            });
          }
        );

        return pipelineResult;
      } catch (error) {
        //* A cancellation is already recorded by the DELETE handler as
        //* `RUN_CANCELLED_ERROR`. Re-writing it here with the NonRetriableError
        //* message would destroy the sentinel, and `isCancelled` — which
        //* matches on the exact string — would stop reporting the run as
        //* cancelled. Leave the existing row alone and just propagate.
        if (!(await isCancelled(runId))) {
          await prismadb.gradeRun.update({
            where: { id: runId },
            data: {
              status: "FAILED",
              stage: null,
              error:
                error instanceof Error
                  ? error.message.slice(0, 1000)
                  : "Unknown error",
              completedAt: new Date(),
            },
          });
        }

        throw error;
      }
    });

    await step.run("persist", async () => {
      //* Last line of defence: if the run was cancelled after the pipeline
      //* finished but before this step ran, refuse to write results.
      if (await isCancelled(runId)) {
        throw new NonRetriableError(RUN_CANCELLED_ERROR);
      }

      const payload = buildGradePayload({
        categories: result.categories,
        understanding: result.understanding,
        synthesis: result.synthesis,
        stats: {
          filesAnalyzed: result.filesAnalyzed,
          skippedFiles: result.skippedFiles,
          treeTruncated: result.treeTruncated,
          llmCalls: result.llmCalls,
          secretsRedacted: result.redactions.secretsRedacted,
          injectionHits: result.redactions.injectionHits,
        },
      });

      await prismadb.$transaction([
        //* Replace findings wholesale: a re-grade supersedes the previous one
        //* rather than accumulating duplicates.
        prismadb.gradeFinding.deleteMany({ where: { runId } }),
        prismadb.gradeFinding.createMany({
          data: result.findings.map((finding) => ({
            runId,
            category: finding.category,
            severity: finding.severity,
            title: finding.title,
            detail: finding.detail ?? null,
            fix: finding.fix ?? null,
            path: finding.path ?? null,
            line: finding.line ?? null,
          })),
        }),
        prismadb.gradeRun.update({
          where: { id: runId },
          data: {
            status: "COMPLETED",
            stage: null,
            commitSha: result.commitSha,
            overallScore: result.synthesis.overallScore,
            letterGrade: result.synthesis.letterGrade,
            summary: result.synthesis.executiveSummary,
            grade: payload,
            error: null,
            durationMs: Date.now() - startedAt,
            llmCalls: result.llmCalls,
            completedAt: new Date(),
          },
        }),
        prismadb.repository.update({
          where: { id: repositoryId },
          data: { lastSyncedAt: new Date() },
        }),
      ]);
    });

    //* Streaks are Pro-gated and fail silently on their own; not worth a step.
    await step.run("streak", () => updateStreak(userId));

    return {
      runId,
      score: result.synthesis.overallScore,
      findings: result.findings.length,
    };
  }
);

export const inngestFunctions = [gradeRepository];