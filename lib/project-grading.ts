import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";
import type {
  GradePayload,
  GradingCategory,
  Severity,
} from "@/lib/grading/schema";

/* ------------------------------------------------------------------ */
/* Response shapes                                                     */
/* ------------------------------------------------------------------ */

export type GradingQuota = {
  plan: "pro" | "free";
  usedToday: number;
  dailyLimit: number;
  remaining: number;
  linkedRepos: number;
  repoLimit: number;
  repoCapReached: boolean;
  quotaExhausted: boolean;
};

export type RunSummary = {
  id: string;
  commitSha: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  stage: string | null;
  overallScore: number | null;
  letterGrade: string | null;
  createdAt: string;
  completedAt: string | null;
  durationMs: number | null;
  error: string | null;
};

export type LinkedRepository = {
  id: string;
  fullName: string;
  name: string;
  owner: string;
  description: string | null;
  language: string | null;
  defaultBranch: string;
  stars: number;
  pushedAt: string | null;
  lastSyncedAt: string;
  createdAt: string;
  latestRun: RunSummary | null;
  activeRun: Pick<RunSummary, "id" | "status" | "stage"> | null;
  runCount: number;
  completedRunCount: number;
  averageScore: number | null;
  scoreDelta: number | null;
};

export type ProjectGradingIndex = {
  repositories: LinkedRepository[];
  quota: GradingQuota;
};

export type GitHubRepoOption = {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  description: string | null;
  language: string | null;
  isFork: boolean;
  stars: number;
  defaultBranch: string;
  pushedAt: string | null;
  topics: string[];
  sizeKb: number;
  isLinked: boolean;
  lastGradedAt: string | null;
  lastScore: number | null;
  lastLetterGrade: string | null;
};

export type GitHubReposResponse = {
  connected: boolean;
  quota: {
    plan: "pro" | "free";
    linkedRepos: number;
    repoLimit: number;
    repoCapReached: boolean;
    remaining: number;
    dailyLimit: number;
    usedToday: number;
  };
  repositories: GitHubRepoOption[];
};

export type GradeFindingRecord = {
  id: string;
  category: GradingCategory;
  severity: Severity;
  title: string;
  detail: string | null;
  fix: string | null;
  path: string | null;
  line: number | null;
};

export type GradeRunDetail = {
  id: string;
  commitSha: string;
  status: RunSummary["status"];
  stage: string | null;
  overallScore: number | null;
  letterGrade: string | null;
  summary: string | null;
  grade: GradePayload | null;
  error: string | null;
  durationMs: number | null;
  llmCalls: number | null;
  createdAt: string;
  completedAt: string | null;
  repository: {
    id: string;
    fullName: string;
    name: string;
    owner: string;
    description: string | null;
    language: string | null;
    defaultBranch: string;
    stars: number;
    pushedAt: string | null;
  };
  findings: GradeFindingRecord[];
};

/** A row in the per-repository run history list. */
export type GradeRunListItem = RunSummary & {
  findingCount: number;
};

export type GradeRunListResponse = {
  runs: GradeRunListItem[];
};

export type InsightsResponse = {
  sampleSize: number;
  overallAverage: number | null;
  categories: Array<{
    key: GradingCategory;
    average: number | null;
    count: number;
  }>;
  weakestCategory: { key: GradingCategory; average: number; count: number } | null;
  strongestCategory: { key: GradingCategory; average: number; count: number } | null;
  timeline: Array<{
    runId: string;
    repositoryId: string;
    fullName: string;
    score: number | null;
    letterGrade: string | null;
    completedAt: string | null;
  }>;
};

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

export const PROJECT_GRADING_KEY = "/api/project-grading/get";

/**
 * Linked repositories plus quota. Polls while any run is active so the progress
 * bar advances without the user refreshing.
 */
export const useProjectGrading = () => {
  const { data, error, isLoading } = useSWR<ProjectGradingIndex>(
    PROJECT_GRADING_KEY,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5_000,
    }
  );

  const hasActiveRun = data?.repositories.some((repo) => repo.activeRun) ?? false;

  return { data, error, isLoading, hasActiveRun };
};

/** Polls only while a run for this repository is in flight. */
export const useGradeRun = (runId: string | null, poll = false) => {
  const { data, error, isLoading } = useSWR<GradeRunDetail>(
    runId ? `/api/project-grading/runs/${runId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2_000,
      //* Only poll while running; stop the timer once terminal.
      refreshInterval: (latest) => {
        if (!poll) return 0;
        const status = latest?.status;
        return status === "PENDING" || status === "RUNNING" ? 3_000 : 0;
      },
    }
  );

  return { data, error, isLoading };
};

export const useGitHubRepos = (owner?: string | null) => {
  const queryString = owner ? `?owner=${encodeURIComponent(owner)}` : "";
  const { data, error, isLoading, mutate } = useSWR<GitHubReposResponse>(
    `/api/github/repos${queryString}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );
  return { data, error, isLoading, mutate };
};

/**
 * Run history for one repository, newest first. Powers the history strip on the
 * repository detail page.
 */
export const useGradeRuns = (repositoryId: string | null) => {
  const { data, error, isLoading } = useSWR<GradeRunListResponse>(
    repositoryId
      ? `/api/project-grading/runs?repositoryId=${encodeURIComponent(repositoryId)}`
      : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5_000 }
  );

  return { data, error, isLoading };
};

export const useGradingInsights = () => {
  const { data, error, isLoading } = useSWR<InsightsResponse>(
    "/api/project-grading/insights",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );
  return { data, error, isLoading };
};

/**
 * Mutations revalidate both the index and any open run, so the table, the
 * detail view, and the quota badge never disagree.
 */
export const useGradeMutations = () => {
  const { mutate } = useSWRConfig();

  const refreshAll = () =>
    Promise.all([
      mutate(PROJECT_GRADING_KEY),
      mutate((key) =>
        typeof key === "string" && key.startsWith("/api/project-grading/runs")
      ),
    ]);

  const linkRepository = async (fullName: string) => {
    const res = await fetch("/api/github/repos/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(body.message ?? "Failed to link repository");
    }

    await mutate((key) => typeof key === "string" && key.startsWith("/api/github/repos"));
    await refreshAll();

    return body as { id: string; alreadyLinked: boolean };
  };

  const unlinkRepository = async (repositoryId: string) => {
    const res = await fetch(
      `/api/github/repos/link?repositoryId=${encodeURIComponent(repositoryId)}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      throw new Error("Failed to unlink repository");
    }

    await refreshAll();
  };

  const startRun = async (repositoryId: string, force = false) => {
    const res = await fetch("/api/project-grading/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repositoryId, force }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(body.message ?? "Failed to start grading run");
    }

    await refreshAll();

    return body as { runId: string; cached: boolean };
  };

  const cancelRun = async (runId: string) => {
    const res = await fetch(`/api/project-grading/runs/${runId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Failed to cancel run");
    }

    await refreshAll();
  };

  const deleteRun = async (runId: string) => {
    const res = await fetch(`/api/project-grading/runs/${runId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Failed to delete run");
    }

    await refreshAll();
  };

  return { linkRepository, unlinkRepository, startRun, cancelRun, deleteRun, refreshAll };
};