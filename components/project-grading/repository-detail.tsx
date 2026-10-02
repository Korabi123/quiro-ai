"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Github, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RunDetail } from "@/components/project-grading/run-detail";
import { RunHistory } from "@/components/project-grading/run-history";
import { useGradeMutations, useProjectGrading } from "@/lib/project-grading";

/**
 * Repository landing page. Shows the most recent review inline, or an empty
 * state that starts the first one.
 */
export const RepositoryDetail = ({ repositoryId }: { repositoryId: string }) => {
  const { data, isLoading } = useProjectGrading();
  const { startRun } = useGradeMutations();
  const [isPending, setIsPending] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const repository = data?.repositories.find((repo) => repo.id === repositoryId);

  if (!repository) {
    return (
      <div className="py-14 text-center flex flex-col items-center gap-3">
        <p className="text-sm text-muted-foreground">
          This repository is not linked to your account.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/project-grading">Back to reviews</Link>
        </Button>
      </div>
    );
  }

  const latestRunId =
    repository.activeRun?.id ?? repository.latestRun?.id ?? null;

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="xs" className="w-fit -ml-2 gap-1.5" asChild>
        <Link href="/project-grading">
          <ArrowLeft className="size-3.5" />
          All reviews
        </Link>
      </Button>

      {latestRunId ? (
        <>
          <RunDetail runId={latestRunId} />
          <RunHistory repositoryId={repositoryId} currentRunId={latestRunId} />
        </>
      ) : (
        <div className="py-14 text-center rounded-2xl border border-dashed border-border/50 flex flex-col items-center gap-3">
          <Github className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">{repository.fullName} has not been graded</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            We read the public source, score it across five categories, and pull out
            findings tied to specific files.
          </p>
          <Button
            size="sm"
            disabled={isPending}
            onClick={async () => {
              setIsPending(true);
              try {
                await startRun(repository.id);
                toast.success("Grading started");
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : "Could not start grading"
                );
              } finally {
                setIsPending(false);
              }
            }}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Grade this repository
          </Button>
        </div>
      )}

      {/** Shown in both branches: a repository can have no *completed* run and
        still have cancelled or failed attempts worth seeing. */}
      {!latestRunId && <RunHistory repositoryId={repositoryId} />}
    </div>
  );
};
