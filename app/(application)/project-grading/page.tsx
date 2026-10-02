"use client";

import { Github, Loader2, Plus, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RepositoryTable } from "@/components/project-grading/repository-table";
import { RepoPickerDialog } from "@/components/project-grading/repo-picker-dialog";
import { InsightsPanel } from "@/components/project-grading/insights-panel";
import { useProjectGrading } from "@/lib/project-grading";

export const ProjectGradingPage = () => {
  const { data, error, isLoading, hasActiveRun } = useProjectGrading();

  const quota = data?.quota;
  const usedPercent = quota
    ? Math.min(100, Math.round((quota.usedToday / Math.max(1, quota.dailyLimit)) * 100))
    : 0;

  return (
    <div className="flex flex-col gap-6 md:px-10 px-4 py-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Project grading</h1>
            {hasActiveRun && (
              <Badge variant="outline" className="gap-1.5 border-blue-500/30 bg-blue-500/5 text-blue-700">
                <Loader2 className="size-3 animate-spin" />
                Review in progress
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            AI reviews of your public GitHub repositories, scored across five
            categories with findings tied to real files.
          </p>
        </div>

        <RepoPickerDialog
          repoCapReached={quota?.repoCapReached}
          trigger={
            <Button size="sm" disabled={quota?.repoCapReached}>
              <Plus className="size-4" />
              Add repository
            </Button>
          }
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error.message}</p>
      )}

      {quota && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Github className="size-3" />
            {quota.linkedRepos} / {quota.repoLimit} repositories linked
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3" />
            {quota.usedToday} / {quota.dailyLimit} reviews today
          </span>
          <span className="flex items-center gap-1.5">
            <TrendingUp className="size-3" />
            {quota.plan === "pro" ? "Pro plan" : "Free plan"}
          </span>
          {usedPercent >= 80 && (
            <Badge
              variant="outline"
              className="text-[10px] border-orange-500/30 bg-orange-500/5 text-orange-700"
            >
              {quota.remaining} left today
            </Badge>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          <RepositoryTable repositories={data?.repositories ?? []} isLoading={isLoading} />
          <InsightsPanel />
          <p className="text-[11px] text-muted-foreground">
            Reviews are automated. Treat them as a starting point for your own review,
            not a final word. Connected accounts are managed from the{" "}
            <span className="font-medium text-foreground">Security</span> tab of your
            profile menu.
          </p>
        </>
      )}
    </div>
  );
};

export default ProjectGradingPage;
