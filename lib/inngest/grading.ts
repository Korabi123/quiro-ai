import { NonRetriableError } from "inngest";
import prismadb from "@/lib/prismadb";
import { inngest } from "@/lib/inngest/client";
import { markJobFailed, markJobRunning, type JobFields } from "@/lib/inngest/jobs";
import { gradeCode } from "@/lib/problems/grade-code";

const GRADE_FIELDS: JobFields = {
  status: "gradeStatus",
  stage: "gradeStage",
  error: "gradeError",
};

/**
 * Grades a coding attempt's solution with an LLM.
 *
 * The original inline route had a "fallback" that wrote 50/50/50 scores when
 * the model's JSON failed to parse - effectively fabricating a review and
 * persisting it. Fabricating grades is the wrong call when work is durable:
 * better to fail the job so it can be retried, or return an explicit error to
 * the user. That behavior is corrected here (the function throws on parse
 * failure, letting Inngest retry).
 */
export const gradeSubmission = inngest.createFunction(
  {
    id: "problems-grade-submission",
    triggers: [{ event: "submissions/grade" }],
    retries: 2,
    timeouts: { start: "5m", finish: "15m" },
    //* Keyed on attempt: a single attempt should not be graded twice concurrently.
    concurrency: [{ key: "event.data.attemptId", limit: 1 }],
  },
  async ({ event, step }) => {
    const { attemptId, userId } = event.data;

    const attempt = await step.run("load-attempt", () =>
      prismadb.codingAttempt.findFirst({
        where: { id: attemptId, userId },
        select: {
          id: true,
          passedTests: true,
          problemId: true,
          code: true,
          language: true,
          executionOutput: true,
          expectedOutput: true,
          problem: { select: { slug: true } },
          gradeStatus: true,
          grading: { select: { id: true } },
        },
      })
    );

    if (!attempt) {
      throw new NonRetriableError("Attempt not found");
    }

    //* Already graded. Do not overwrite an existing review with a fresh model
    //* call - re-runs should return the existing result.
    if (attempt.grading || attempt.gradeStatus === "COMPLETED") {
      return { skipped: true };
    }

    await step.run("mark-running", () =>
      markJobRunning(prismadb.codingAttempt, attemptId, "grading code", GRADE_FIELDS)
    );

    const grade = await step.run("grade", () =>
      gradeCode({
        problemSlug: attempt.problem?.slug ?? "",
        code: attempt.code,
        language: attempt.language,
        output: attempt.executionOutput,
        expectedOutput: attempt.expectedOutput,
      })
    );

    await step.run("persist", () => {
      const data = {
        attemptId: attempt.id,
        isCorrect: attempt.passedTests,
        passedTests: attempt.passedTests,
        correctnessScore: grade.correctnessScore || 0,
        efficiencyScore: grade.efficiencyScore || 0,
        codeQualityScore: grade.codeQualityScore || 0,
        bestPracticeScore: grade.bestPracticeScore || 0,
        totalScore: grade.totalScore || 0,
        timeComplexity: grade.timeComplexity ?? null,
        spaceComplexity: grade.spaceComplexity ?? null,
        summary: grade.summary ?? "",
        strengths: grade.strengths ?? [],
        improvements: grade.improvements ?? [],
      };

      return prismadb.codeGrading.upsert({
        where: { attemptId: attempt.id },
        update: data,
        create: data,
      });
    });

    await step.run("complete", () =>
      prismadb.codingAttempt.update({
        where: { id: attemptId },
        data: {
          gradeStatus: "COMPLETED",
          gradeStage: null,
          gradeError: null,
        },
      })
    );

    return { skipped: false, totalScore: grade.totalScore };
  }
);