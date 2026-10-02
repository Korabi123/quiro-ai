"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  FileCode2,
  Github,
  Loader2,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatRelativeDate, sortBySeverity } from "@/lib/grading/types";
import { OverallScore, ScoreMeter } from "@/components/project-grading/score-display";
import { CategoryRadar } from "@/components/project-grading/category-radar";
import { FindingList } from "@/components/project-grading/finding-list";
import { InterviewQuestions } from "@/components/project-grading/interview-questions";
import { useGradeMutations, useGradeRun } from "@/lib/project-grading";

const RunProgress = ({ stage }: { stage: string | null }) => {
  const steps = [
    { key: "fetching", label: "Resolving the repository" },
    { key: "reading", label: "Reading source files" },
    { key: "understanding", label: "Understanding the codebase" },
    { key: "grading", label: "Grading categories" },
    { key: "synthesizing", label: "Writing the review" },
    { key: "persisting", label: "Saving results" },
  ];

  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.key === stage)
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Loader2 className="size-5 animate-spin text-[#ea721b]" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">
            {steps[currentIndex]?.label ?? "Starting the review"}
          </span>
          <span className="text-xs text-muted-foreground">
            This runs in the background. You can leave this page — we keep the result
            for you.
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 pl-1">
        {steps.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.key} className="flex items-center gap-2.5">
              <span
                className={cn(
                  "size-4 rounded-full border flex items-center justify-center shrink-0",
                  isDone && "bg-green-500 border-green-500 text-white",
                  isCurrent && "border-[#ea721b] bg-[#ea721b]/10",
                  !isDone && !isCurrent && "border-border"
                )}
              >
                {isDone ? (
                  <Check className="size-2.5" />
                ) : isCurrent ? (
                  <span className="size-1.5 rounded-full bg-[#ea721b]" />
                ) : null}
              </span>
              <span
                className={cn(
                  "text-xs",
                  isCurrent && "font-medium",
                  !isDone && !isCurrent && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const RunDetail = ({ runId }: { runId: string }) => {
  const { data, error, isLoading } = useGradeRun(runId, true);
  const { cancelRun, deleteRun, startRun } = useGradeMutations();
  const [isActing, setIsActing] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-14 text-center">
        <p className="text-sm text-muted-foreground">
          {error ? "Could not load this review." : "Review not found."}
        </p>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href="/project-grading">Back to reviews</Link>
        </Button>
      </div>
    );
  }

  const isRunning = data.status === "PENDING" || data.status === "RUNNING";
  const payload = data.grade;
  const findings = sortBySeverity(data.findings);

  const handleCancel = async () => {
    setIsActing(true);
    try {
      await cancelRun(runId);
      toast.success("Run cancelled");
    } catch (cancelError) {
      toast.error(
        cancelError instanceof Error ? cancelError.message : "Could not cancel"
      );
    } finally {
      setIsActing(false);
    }
  };

  const handleRegrade = async () => {
    setIsActing(true);
    try {
      await startRun(data.repository.id, true);
      toast.success("New run queued");
    } catch (regradeError) {
      toast.error(
        regradeError instanceof Error ? regradeError.message : "Could not re-grade"
      );
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2">
          <Button variant="ghost" size="xs" className="w-fit -ml-2 gap-1.5" asChild>
            <Link href="/project-grading">
              <ArrowLeft className="size-3.5" />
              All reviews
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Github className="size-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">{data.repository.fullName}</h1>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="font-mono">{data.commitSha.slice(0, 7)}</span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {formatRelativeDate(data.completedAt ?? data.createdAt)}
            </span>
            {data.durationMs && <span>{(data.durationMs / 1000).toFixed(0)}s</span>}
            {payload && (
              <span className="flex items-center gap-1">
                <FileCode2 className="size-3" />
                {payload.stats.filesAnalyzed} files
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRunning && (
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={isActing}>
              Cancel
            </Button>
          )}
          {data.status === "COMPLETED" && (
            <Button variant="outline" size="sm" onClick={handleRegrade} disabled={isActing}>
              {isActing ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              Re-grade
            </Button>
          )}
          {!isRunning && (
            <Button
              variant="ghost"
              size="iconSm"
              onClick={async () => {
                await deleteRun(runId);
                toast.success("Review deleted");
              }}
              className="text-muted-foreground hover:text-red-600"
              title="Delete review"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {isRunning && <RunProgress stage={data.stage} />}

      {data.status === "FAILED" && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/5 p-4">
          <TriangleAlert className="size-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">The review failed</span>
            <p className="text-sm text-muted-foreground">
              {data.error ?? "Something went wrong while grading this repository."}
            </p>
          </div>
        </div>
      )}

      {payload && (
        <>
          <div className="grid lg:grid-cols-[minmax(0,320px)_1fr] gap-4">
            <OverallScore
              score={payload.synthesis.overallScore}
              letterGrade={payload.synthesis.letterGrade}
              headline={payload.synthesis.headline}
            />

            <CategoryRadar payload={payload} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {payload.categories.map((category) => (
              <ScoreMeter
                key={category.key}
                label={category.label}
                score={category.score}
                caption={`weight ${Math.round(category.weight * 100)}%`}
              />
            ))}
          </div>

          <Tabs defaultValue="summary">
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="findings">
                Findings
                {findings.length > 0 && (
                  <Badge variant="outline" className="ml-1.5 text-[10px]">
                    {findings.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="questions">
                Interview
                {payload.synthesis.interviewQuestions.length > 0 && (
                  <Badge variant="outline" className="ml-1.5 text-[10px]">
                    {payload.synthesis.interviewQuestions.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="code">Codebase</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="flex flex-col gap-5 pt-2">
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="size-4 text-[#ea721b]" />
                  What we found
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {payload.synthesis.executiveSummary}
                </p>
              </div>

              {payload.synthesis.topStrengths.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">Strengths</h3>
                  <ul className="flex flex-col gap-1.5">
                    {payload.synthesis.topStrengths.map((strength) => (
                      <li key={strength} className="flex gap-2 text-sm text-muted-foreground">
                        <Check className="size-4 text-green-600 shrink-0 mt-0.5" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {payload.synthesis.topPriorities.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Target className="size-4 text-[#ea721b]" />
                    Where to start
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    {payload.synthesis.topPriorities.map((priority, index) => (
                      <div
                        key={priority.title}
                        className="rounded-xl border border-border/50 p-4 flex flex-col gap-2"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-[10px] font-bold text-muted-foreground mt-1">
                            {index + 1}
                          </span>
                          <div className="flex flex-col gap-1.5 flex-1">
                            <span className="text-sm font-medium">{priority.title}</span>
                            <p className="text-sm text-muted-foreground">{priority.why}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge
                                variant="outline"
                                className="text-[10px] text-muted-foreground font-normal"
                              >
                                effort: {priority.effort}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-[10px] text-muted-foreground font-normal"
                              >
                                impact: {priority.impact}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {payload.synthesis.skillTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {payload.synthesis.skillTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="findings" className="pt-2">
              <FindingList findings={findings} />
            </TabsContent>

            <TabsContent value="questions" className="pt-2">
              <InterviewQuestions questions={payload.synthesis.interviewQuestions} />
            </TabsContent>

            <TabsContent value="code" className="flex flex-col gap-5 pt-2">
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">What this repo is</h3>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">{payload.understanding.projectType}</Badge>
                  {payload.understanding.techStack.map((tech) => (
                    <Badge key={tech} variant="outline" className="font-normal">
                      {tech}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap mt-1">
                  {payload.understanding.summary}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Architecture notes</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {payload.understanding.architectureNotes}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Maturity notes</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {payload.understanding.maturityNotes}
                </p>
              </div>

              {payload.understanding.coreFilePaths.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">Core files reviewed</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {payload.understanding.coreFilePaths.map((path) => (
                      <Badge
                        key={path}
                        variant="outline"
                        className="text-[10px] font-mono font-normal"
                      >
                        {path}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4 pt-1 text-[11px] text-muted-foreground">
                <span>{payload.stats.filesAnalyzed} files analyzed</span>
                {payload.stats.skippedFiles > 0 && (
                  <span>{payload.stats.skippedFiles} skipped</span>
                )}
                {payload.stats.treeTruncated && <span>tree truncated</span>}
                {payload.stats.secretsRedacted > 0 && (
                  <span className="text-orange-600">
                    {payload.stats.secretsRedacted} secrets redacted
                  </span>
                )}
                {payload.stats.injectionHits > 0 && (
                  <span className="text-orange-600">
                    {payload.stats.injectionHits} injection attempts stripped
                  </span>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};