"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  GitBranch,
  Github,
  Loader2,
  Play,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/grading/types";
import { ScoreBadge } from "@/components/project-grading/score-display";
import { useGradeMutations } from "@/lib/project-grading";
import type { LinkedRepository } from "@/lib/project-grading";

const STAGE_LABELS: Record<string, string> = {
  fetching: "Resolving",
  reading: "Reading files",
  understanding: "Understanding code",
  grading: "Grading categories",
  synthesizing: "Writing review",
  persisting: "Saving",
};

const Row = ({ repository }: { repository: LinkedRepository }) => {
  const [isPending, setIsPending] = useState(false);
  const { startRun, unlinkRepository } = useGradeMutations();

  const activeRun = repository.activeRun;
  const isBusy = Boolean(activeRun) || isPending;
  const latest = repository.latestRun;

  const handleRun = async (force: boolean) => {
    setIsPending(true);
    try {
      const result = await startRun(repository.id, force);
      toast.success(
        result.cached
          ? "Already graded at this commit — opening the existing review"
          : "Grading started"
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start grading");
    } finally {
      setIsPending(false);
    }
  };

  const handleUnlink = async () => {
    if (
      !window.confirm(
        `Unlink ${repository.fullName}? Its grading history will be deleted.`
      )
    ) {
      return;
    }
    try {
      await unlinkRepository(repository.id);
      toast.success("Repository unlinked");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not unlink");
    }
  };

  return (
    <TableRow className="group">
      <TableCell>
        <Link
          href={`/project-grading/${repository.id}`}
          className="flex flex-col gap-1 group/link"
        >
          <span className="flex items-center gap-1.5 text-sm font-medium hover:underline underline-offset-4">
            <Github className="size-3.5 text-muted-foreground" />
            {repository.fullName}
            <ArrowUpRight className="size-3 opacity-0 group-hover/link:opacity-100" />
          </span>
          {repository.description && (
            <span className="text-xs text-muted-foreground line-clamp-1 max-w-sm">
              {repository.description}
            </span>
          )}
          <span className="flex items-center gap-3 text-[10px] text-muted-foreground">
            {repository.language && <span>{repository.language}</span>}
            <span className="flex items-center gap-1">
              <Star className="size-2.5" />
              {repository.stars}
            </span>
            <span className="flex items-center gap-1">
              <GitBranch className="size-2.5" />
              {repository.defaultBranch}
            </span>
          </span>
        </Link>
      </TableCell>

      <TableCell className="align-top">
        {activeRun ? (
          <Badge
            variant="outline"
            className="gap-1.5 border-blue-500/30 bg-blue-500/5 text-blue-700 w-fit"
          >
            <Loader2 className="size-3 animate-spin" />
            {STAGE_LABELS[activeRun.stage ?? ""] ?? "Working"}
          </Badge>
        ) : latest ? (
          <div className="flex flex-col gap-1.5">
            <Link href={`/project-grading/runs/${latest.id}`}>
              <ScoreBadge score={latest.overallScore ?? 0} letterGrade={latest.letterGrade} />
            </Link>
            {repository.scoreDelta !== null && repository.scoreDelta !== 0 && (
              <span
                className={cn(
                  "text-[10px] font-medium",
                  repository.scoreDelta > 0 ? "text-green-600" : "text-red-600"
                )}
              >
                {repository.scoreDelta > 0 ? "+" : ""}
                {repository.scoreDelta} since last run
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">
              {latest.completedAt
                ? formatRelativeDate(latest.completedAt)
                : formatRelativeDate(repository.createdAt)}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Not graded yet</span>
        )}
      </TableCell>

      <TableCell className="align-top">
        <div className="flex items-center justify-end gap-1.5">
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={isBusy}
            onClick={() => handleRun(Boolean(latest))}
            title={latest ? "Re-grade against the latest commit" : "Grade this repository"}
          >
            {isBusy ? (
              <Loader2 className="size-3 animate-spin" />
            ) : latest ? (
              <RefreshCw className="size-3" />
            ) : (
              <Play className="size-3" />
            )}
            {latest ? "Re-grade" : "Grade"}
          </Button>

          <Button
            type="button"
            size="iconSm"
            variant="ghost"
            onClick={handleUnlink}
            title="Unlink repository"
            className="text-muted-foreground hover:text-red-600"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export const RepositoryTable = ({
  repositories,
  isLoading,
}: {
  repositories: LinkedRepository[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="py-14 text-center rounded-2xl border border-dashed border-border/50">
        <p className="text-sm font-medium">No repositories linked yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Link a public GitHub repository to get an AI review of its source.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Repository</TableHead>
            <TableHead>Latest review</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {repositories.map((repository) => (
            <Row key={repository.id} repository={repository} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};