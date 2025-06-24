import useSWR from "swr";
import { fetcher } from "./fetcher";
import { Agent } from "@prisma/client";

export const useAgents = () => {
  const { data, error, isLoading } = useSWR<Agent[]>(`/api/agents/get`, fetcher);

  return {
    data,
    error,
    isLoading
  }
}
