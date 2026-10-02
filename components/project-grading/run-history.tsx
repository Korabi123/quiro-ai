"use client";

import Link from "next/link";
import { History, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatRelativeDate, scoreTextClass } from "@/lib/grading/types";
import { RUN_CANCELLED_ERROR } from "@/lib/grading/types";
import { useGradeRuns, type GradeRunListItem } from "@/lib/project-grading";

/**
 * Run history for a single repository.
 *
 * The index endpoint only returns the newest run per repository, so this is the
 * only place a user can see whether a re-grade actually moved the score. Each
 * row links to the run detail page.
 */
export const RunHistory = ({
  repositoryId,
  currentRunId,
  className,
}: {
  repositoryId: string;
  currentRunId?: string | null;
  className?: string;
}) => {
  const { data, isLoading } = useGradeRuns(repositoryId);

  const runs = data?.runs ?? [];

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
        <Loader2 className="size-3.5 animate-spin" />
        Loading run history
      </div>
    );
  }

  if (runs.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <History className="size-4 text-[#ea721b]" />
        Run history
        <Badge variant="outline" className="text-[10px]">
          {runs.length}
        </Badge>
      </h3>

      <div className="flex flex-col divide-y divide-border/40 rounded-xl border border-border/50">
        {runs.map((run, index) => (
          <HistoryRow
            key={run.id}
            run={run}
            previous={runs[index + 1] ?? null}
            isCurrent={run.id === currentRunId}
          />
        ))}
      </div>
    </div>
  );
};

const HistoryRow = ({
  run,
  previous,
  isCurrent,
}: {
  run: GradeRunListItem;
  previous: GradeRunListItem | null;
  isCurrent: boolean;
}) => {
  //* Only compare against the run immediately before this one, and only when
  //* both actually produced a score. Comparing against a failed run would show
  //* a meaningless jump from nothing.
  const delta =
    run.overallScore !== null && previous?.overallScore != null
      ? run.overallScore - previous.overallScore
      : null;

  const isCancelled = run.status === "FAILED" && run.error === RUN_CANCELLED_ERROR;

  return (
    <Link
      href={`/project-grading/runs/${run.id}`}
      className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted-foreground/5 transition-colors"
    >
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[11px] text-muted-foreground shrink-0">
            {run.commitSha.slice(0, 7)}
          </span>
          {isCurrent && (
            <Badge variant="outline" className="text-[10px] shrink-0">
              Viewing
            </Badge>
          )}
          {isCancelled && (
            <Badge
              variant="outline"
              className="text-[10px] shrink-0 border-border/50 text-muted-foreground"
            >
              Cancelled
            </Badge>
          )}
          {run.status === "FAILED" && !isCancelled && (
            <Badge
              variant="outline"
              className="text-[10px] border-red-500/30 bg-red-500/5 text-red-600 shrink-0"
            >
              Failed
            </Badge>
          )}
          {(run.status === "PENDING" || run.status === "RUNNING") && (
            <Badge
              variant="outline"
              className="text-[10px] border-blue-500/30 bg-blue-500/5 text-blue-700 shrink-0"
            >
              In progress
            </Badge>
          )}
        </div>

        <span className="text-[11px] text-muted-foreground">
          {formatRelativeDate(run.createdAt)}
          {run.findingCount > 0 && ` · ${run.findingCount} findings`}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {delta !== null && delta !== 0 && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-[11px] font-medium",
              delta > 0 ? "text-green-600" : "text-red-500"
            )}
          >
            {delta > 0 ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        )}
        {run.overallScore !== null ? (
          <span className={cn("text-sm font-bold", scoreTextClass(run.overallScore))}>
            {run.overallScore}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
    </Link>
  );
};