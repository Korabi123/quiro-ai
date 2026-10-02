"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { scoreBarClass, scoreBadgeClass, scoreTextClass } from "@/lib/grading/types";

/**
 * Horizontal score meter lifted out of `components/coding-problems/detail.tsx`,
 * which had this markup inlined. Reused by the category breakdown and the
 * insights view.
 */
export const ScoreMeter = ({
  label,
  score,
  caption,
  className,
}: {
  label: string;
  score: number;
  caption?: string;
  className?: string;
}) => (
  <div
    className={cn(
      "bg-muted-foreground/5 p-4 rounded-2xl border border-border/30 flex flex-col gap-2",
      className
    )}
  >
    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
      {label}
    </span>
    <div className="flex items-end justify-between">
      <span className={cn("text-2xl font-bold", scoreTextClass(score))}>{score}</span>
      <div className="w-16 h-1 bg-muted rounded-full mb-2">
        <div
          className={cn("h-full rounded-full transition-all", scoreBarClass(score))}
          style={{ width: `${Math.max(2, Math.min(100, score))}%` }}
        />
      </div>
    </div>
    {caption && (
      <span className="text-[10px] text-muted-foreground">{caption}</span>
    )}
  </div>
);

/** Compact `72 / 100` pill used in list rows. */
export const ScoreBadge = ({
  score,
  letterGrade,
  className,
}: {
  score: number;
  letterGrade?: string | null;
  className?: string;
}) => (
  <div className={cn("flex items-center gap-2", className)}>
    <Badge
      variant="outline"
      className={cn("p-2", scoreBadgeClass(score))}
    >
      {score} / 100
    </Badge>
    {letterGrade && (
      <Badge
        variant="outline"
        className={cn("p-2 min-w-[46px] justify-center", scoreBadgeClass(score))}
      >
        {letterGrade}
      </Badge>
    )}
  </div>
);

/** Large hero score, matching the report summary treatment. */
export const OverallScore = ({
  score,
  letterGrade,
  headline,
  className,
}: {
  score: number;
  letterGrade?: string | null;
  headline?: string;
  className?: string;
}) => (
  <div
    className={cn(
      "bg-[#ea721b]/5 p-6 rounded-2xl border border-[#ea721b]/20 flex flex-col gap-3",
      className
    )}
  >
    <div className="flex items-end gap-4">
      <span className="text-5xl font-black text-[#ea721b] leading-none">{score}</span>
      <span className="text-lg font-normal text-muted-foreground mb-1">/ 100</span>
      {letterGrade && (
        <span className="text-2xl font-bold text-[#ea721b] mb-0.5 ml-auto">
          {letterGrade}
        </span>
      )}
    </div>
    {headline && (
      <p className="text-sm font-medium text-muted-foreground">{headline}</p>
    )}
  </div>
);