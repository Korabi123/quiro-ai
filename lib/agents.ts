import useSWR from "swr";
import { fetcher } from "./fetcher";
import { Agent } from "@prisma/client";

export const useAgents = () => {
  const queryString = "";

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

export const useAgent = (agentId: string) => {
  const { data, error, isLoading } = useSWR<Agent>(
    `/api/agents/get?id=${agentId}`,
    fetcher
  );

  return {
    data,
    error,
    isLoading,
  };
}
