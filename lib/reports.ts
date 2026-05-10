import useSWR from "swr";
import { fetcher } from "./fetcher";
import { Question, Report } from "@prisma/client";

export const useReports = () => {
  const queryString = "";

  const { data, error, isLoading } = useSWR<Report[]>(
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
  const { data, error, isLoading } = useSWR<Report>(
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
  const { data, error, isLoading } = useSWR<Question[]>(
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
