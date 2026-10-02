import useSWR from "swr";
import { fetcher } from "./fetcher";
import { Prisma } from "@prisma/client";
import { isActiveStatus } from "./inngest/jobs";

/**
 * How often to re-check while a report job is in flight.
 *
 * Generation and grading are Inngest functions now, so the endpoints that start
 * them return 202 immediately and the result arrives later. These hooks poll
 * only while `jobStatus` is PENDING/RUNNING and stop the moment it settles, so
 * an idle report costs nothing.
 */
const JOB_POLL_MS = 2000;

/** Poll while the latest payload shows an unfinished job, otherwise never. */
const pollWhileActive = <T extends { jobStatus?: string | null }>(latest?: T): number =>
  latest && isActiveStatus(latest.jobStatus) ? JOB_POLL_MS : 0;

/**
 * `/api/reports/get?id=...` returns the report with its questions and each
 * question's rubric. The list endpoints return the questions without their
 * rubric, so they get a narrower payload type.
 */
const reportWithQuestions = {
  questions: true,
} satisfies Prisma.ReportInclude;

const reportWithRubrics = {
  questions: {
    include: {
      rubric: true,
    },
  },
} satisfies Prisma.ReportInclude;

export type ReportWithQuestions = Prisma.ReportGetPayload<{
  include: typeof reportWithQuestions;
}>;

export type ReportWithRubrics = Prisma.ReportGetPayload<{
  include: typeof reportWithRubrics;
}>;

/** `/api/questions/get` returns each question with its rubric. */
export type QuestionWithRubric = Prisma.QuestionGetPayload<{
  include: { rubric: true };
}>;

export const useReports = () => {
  const queryString = "";

  const { data, error, isLoading } = useSWR<ReportWithQuestions[]>(
    `/api/reports/get${queryString}`,
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    data,
    error,
    isLoading
  }
}

export const useReport = (reportId: string) => {
  const { data, error, isLoading } = useSWR<ReportWithRubrics>(
    `/api/reports/get?id=${reportId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      //* Below the poll interval, otherwise SWR dedupes away the very
      //* revalidations refreshInterval asks for.
      dedupingInterval: 500,
      refreshInterval: pollWhileActive,
    }
  );

  return {
    data,
    error,
    isLoading,
  };
}

export const useQuestionsFromReport = (reportId: string) => {
  const { data, error, isLoading } = useSWR<QuestionWithRubric[]>(
    `/api/questions/get?reportId=${reportId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 500,
    }
  );

  return {
    data,
    error,
    isLoading,
  };
}

/**
 * Polls question generation until it produces questions or fails.
 *
 * Returns `status` rather than just the data so the caller can distinguish
 * "still working" from "finished with an error" - the old inline flow could
 * only ever resolve one way, so a failed generation looked like a hang.
 */
export const useQuestionGeneration = (reportId: string) => {
  const report = useReport(reportId);
  const { data: questions, error, isLoading } = useQuestionsFromReport(reportId);

  const jobStatus = report.data?.jobStatus ?? "IDLE";

  return {
    questions,
    error,
    isLoading,
    jobStatus,
    isGenerating: isActiveStatus(jobStatus) && !questions,
    //* Generation is only done once questions exist *and* the job settled.
    //* Questions may briefly be empty while the job is still running.
    isComplete: jobStatus === "COMPLETED" && !!questions?.length,
    isFailed: jobStatus === "FAILED",
    reportError: report.data?.jobError ?? null,
  };
};
