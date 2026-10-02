import useSWR from "swr";
import { fetcher } from "./fetcher";

export interface SavedProblem {
  id: string;
  slug: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  attempts: number;
  solved: boolean;
  bestScore: number | null;
  lastAttempt: Date | null;
  createdAt: Date;
}

export const useSavedProblems = () => {
  const { data, error, isLoading } = useSWR<SavedProblem[]>(
    "/api/problems/saved",
    fetcher
  );

  return { data, error, isLoading };
};
