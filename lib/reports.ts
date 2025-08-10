import useSWR from "swr";
import { fetcher } from "./fetcher";
import { Report } from "@prisma/client";

interface Props {
  search?: string | null | undefined;
}

export const useReports = ({ search }: Props) => {
  const queryParams = [];

  if (search) {
    queryParams.push(`search=${search}`);
  }

  const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

  const { data, error, isLoading } = useSWR<Report[]>(
    `/api/reports/get${queryString}`,
    fetcher,
    { refreshInterval: 2500 }
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
    fetcher
  );

  return {
    data,
    error,
    isLoading,
  };
}
