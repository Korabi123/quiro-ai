import useSWR from "swr";
import { fetcher } from "./fetcher";

export const useProgress = () => {
  const { data, error, isLoading } = useSWR<{
    solved: string[];
    attempted: string[];
  }>("/api/progress", fetcher);

  return {
    data,
    error,
    isLoading,
    solvedCount: data?.solved?.length || 0,
    attemptedCount: data?.attempted?.length || 0,
  };
};