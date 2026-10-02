"use client";

import { BarChart3, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_LABELS } from "@/lib/grading/schema";
import { cn } from "@/lib/utils";
import { useGradingInsights } from "@/lib/project-grading";

/**
 * Cross-repository view. Only renders once there are at least two graded
 * repos — a single repo has nothing to compare against.
 */
export const InsightsPanel = () => {
  const { data, error, isLoading } = useGradingInsights();

  if (isLoading) {
    return <Skeleton className="h-24 w-full rounded-2xl" />;
  }

  if (error || !data || data.sampleSize < 2) {
    return null;
  }

  const maxAverage = Math.max(...data.categories.map((c) => c.average ?? 0), 1);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/50 p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="size-4 text-[#ea721b]" />
          Across your repositories
        </h3>
        <span className="text-[11px] text-muted-foreground">
          {data.sampleSize} reviews · average{" "}
          <span className="font-medium text-foreground">
            {data.overallAverage ?? 0}
          </span>
        </span>
      </div>

      <div className="grid md:grid-cols-5 gap-3">
        {data.categories.map((category) => {
          const isWeakest = data.weakestCategory?.key === category.key;
          const isStrongest = data.strongestCategory?.key === category.key;

          return (
            <div key={category.key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground truncate">
                  {CATEGORY_LABELS[category.key] ?? category.key}
                </span>
                {(isWeakest || isStrongest) && (
                  <TrendingUp
                    className={cn(
                      "size-3 shrink-0",
                      isWeakest ? "text-red-500 rotate-180" : "text-green-600"
                    )}
                  />
                )}
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isWeakest
                      ? "bg-red-500"
                      : isStrongest
                        ? "bg-green-600"
                        : "bg-[#ea721b]"
                  )}
                  style={{
                    width: `${Math.max(3, ((category.average ?? 0) / maxAverage) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold">
                  {category.average ?? 0}
                </span>
                {isWeakest && (
                  <Badge
                    variant="outline"
                    className="text-[9px] border-red-500/30 text-red-600 px-1 py-0"
                  >
                    focus
                  </Badge>
                )}
                {isStrongest && (
                  <Badge
                    variant="outline"
                    className="text-[9px] border-green-500/30 text-green-700 px-1 py-0"
                  >
                    best
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
