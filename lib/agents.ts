import useSWR from "swr";
import { fetcher } from "./fetcher";
import { Agent } from "@prisma/client";

export const useAgents = () => {
  const queryString = "";

  const { data, error, isLoading } = useSWR<Agent[]>(
    `/api/agents/get${queryString}`,
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

export const useAgent = (agentId: string) => {
  const { data, error, isLoading } = useSWR<Agent>(
    `/api/agents/get?id=${agentId}`,
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
