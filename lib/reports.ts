import useSWR from "swr";
import { fetcher } from "./fetcher";
import { Prisma } from "@prisma/client";

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
      dedupingInterval: 5000,
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
      dedupingInterval: 5000,
    }
  );

  return {
    data,
    error,
    isLoading,
  };
}
