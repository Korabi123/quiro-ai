import useSWR from "swr";
import { fetcher } from "./fetcher";
import { Agent } from "@prisma/client";

interface Props {
  search?: string | null | undefined;
}

export const useAgents = ({ search }: Props) => {
  const queryParams = [];

  if (search) {
    queryParams.push(`search=${search}`);
  }

  const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

  const { data, error, isLoading } = useSWR<Agent[]>(
    `/api/agents/get${queryString}`,
    fetcher,
    { refreshInterval: 2500 }
  );

  return {
    data,
    error,
    isLoading
  }
}
