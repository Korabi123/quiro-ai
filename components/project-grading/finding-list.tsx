"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, FileCode2, Lightbulb, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/grading/schema";
import { SEVERITY_ORDER, severityMeta } from "@/lib/grading/types";
import type { GradeFindingRecord } from "@/lib/project-grading";

const SEVERITY_FILTERS = ["ALL", "HIGH", "MEDIUM", "LOW", "INFO"] as const;

type Filter = (typeof SEVERITY_FILTERS)[number];

const FindingRow = ({
  finding,
  defaultOpen,
}: {
  finding: GradeFindingRecord;
  defaultOpen: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const meta = severityMeta[finding.severity] ?? severityMeta.INFO;

  return (
    <div className="rounded-xl border border-border/50 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted-foreground/5 transition-colors"
      >
        <span className={cn("size-2 rounded-full mt-1.5 shrink-0", meta.dot)} />
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{finding.title}</span>
            <Badge variant="outline" className={cn("text-[10px]", meta.className)}>
              {meta.label}
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] text-muted-foreground font-normal"
            >
              {CATEGORY_LABELS[finding.category] ?? finding.category}
            </Badge>
          </div>
          {finding.path && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono truncate">
              <FileCode2 className="size-3 shrink-0" />
              {finding.path}
              {finding.line ? `:${finding.line}` : ""}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="size-4 text-muted-foreground shrink-0 mt-0.5" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pl-10 flex flex-col gap-3">
          {finding.detail && (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {finding.detail}
            </p>
          )}
          {finding.fix && (
            <div className="flex gap-2.5 rounded-lg bg-green-500/5 border border-green-500/20 p-3">
              <Lightbulb className="size-4 text-green-600 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-700">
                  Suggested fix
                </span>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {finding.fix}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Findings list, grouped by severity with a filter strip. The top few HIGH
 * findings start expanded so the most important problems are visible without
 * any interaction.
 */
export const FindingList = ({
  findings,
  className,
}: {
  findings: GradeFindingRecord[];
  className?: string;
}) => {
  const [filter, setFilter] = useState<Filter>("ALL");

  const sorted = [...findings].sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
  );

  const visible =
    filter === "ALL" ? sorted : sorted.filter((finding) => finding.severity === filter);

  const counts = sorted.reduce<Record<string, number>>((accumulator, finding) => {
    accumulator[finding.severity] = (accumulator[finding.severity] ?? 0) + 1;
    return accumulator;
  }, {});

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Wrench className="size-4 text-[#ea721b]" />
          Findings
          <Badge variant="outline" className="text-[10px]">
            {sorted.length}
          </Badge>
        </h3>

        <div className="flex items-center gap-1.5">
          {SEVERITY_FILTERS.filter((severity) => severity === "ALL" || counts[severity]).map(
            (severity) => (
              <button
                key={severity}
                type="button"
                onClick={() => setFilter(severity)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all",
                  filter === severity
                    ? "bg-black text-white border-black"
                    : "bg-white text-muted-foreground border-border/50 hover:bg-muted-foreground/5"
                )}
              >
                {severity === "ALL" ? "All" : severity}
                {severity !== "ALL" && counts[severity] ? ` ${counts[severity]}` : ""}
              </button>
            )
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="py-10 text-center rounded-2xl border border-dashed border-border/50">
          <p className="text-sm text-muted-foreground">
            {findings.length === 0
              ? "No findings — automated reviewers found nothing worth flagging."
              : "No findings match this severity."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visible.map((finding, index) => (
            <FindingRow
              key={finding.id}
              finding={finding}
              defaultOpen={index < 2 && filter !== "ALL"}
            />
          ))}
        </div>
      )}

      {findings.some((finding) => finding.severity === "HIGH") && (
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="size-3.5 text-orange-500 shrink-0 mt-0.5" />
          High severity findings point at correctness or security risk. Worth fixing
          before this repo goes anywhere near a review.
        </p>
      )}
    </div>
  );
};