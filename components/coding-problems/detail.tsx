"use client";

import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { useInView } from "react-intersection-observer";
import { fetcher } from "@/lib/fetcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Loader2, Play, Sparkles, CheckCircle, XCircle, Trophy, Clock, Target, Code2, TrendingUp, Star, GitCommit, FileCode, ArrowRightIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { toast } from "sonner";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-muted-foreground">Loading editor...</div>,
});

interface Props {
  problemId: string;
  problemSlug?: string;
}

interface Attempt {
  id: string;
  language: string;
  code: string;
  executionOutput: string | null;
  passedTests: boolean;
  createdAt: Date;
  executionTime?: string | null;
  memoryUsage?: string | null;
  visiblePassedCount?: number | null;
  visibleTotalCount?: number | null;
  hiddenPassedCount?: number | null;
  hiddenTotalCount?: number | null;
}

interface Grading {
  id: string;
  correctnessScore: number;
  efficiencyScore: number;
  codeQualityScore: number;
  bestPracticeScore: number;
  totalScore: number;
  timeComplexity: string | null;
  spaceComplexity: string | null;
  summary: string;
  strengths: string[];
  improvements: string[];
}

interface AttemptWithGrading extends Attempt {
  grading?: Grading | null;
}

interface SubmissionsResponse {
  attempts: AttemptWithGrading[];
  nextCursor?: string;
  totalCount: number;
}

type TabType = "code" | "grading";

export const ProblemDetail = ({ problemId, problemSlug }: Props) => {
  const router = useRouter();
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("code");
  const [isLoadingGrading, setIsLoadingGrading] = useState(false);

  const { ref, inView } = useInView();

  const { data, size, setSize, isValidating, mutate } = useSWRInfinite<SubmissionsResponse>(
    (index, previousPageData) => {
      if (previousPageData && !previousPageData.nextCursor) return null;
      const cursor = previousPageData?.nextCursor ? `&cursor=${previousPageData.nextCursor}` : "";
      return `/api/submissions?slug=${problemSlug || problemId}${cursor}&limit=15`;
    },
    async (url: string) => {
      const res = await fetch(url);
      return res.json();
    }
  );

  const attempts = data ? data.flatMap((page) => page.attempts) : [];
  const totalCount = data?.[0]?.totalCount || 0;
  const nextCursor = data?.[data.length - 1]?.nextCursor;
  const isLoadingMore = isValidating && (data?.length || 0) > 0;
  const hasMore = !!nextCursor;

  useEffect(() => {
    if (inView && hasMore && !isLoadingMore) {
      setSize(size + 1);
    }
  }, [inView, hasMore, isLoadingMore, size, setSize]);

  const selectedAttempt = attempts.find(a => a.id === selectedAttemptId) || attempts[0] || null;
  const solvedCount = attempts.filter(a => a.passedTests).length;

  const handleGetGrading = async (attempt: AttemptWithGrading) => {
    setSelectedAttemptId(attempt.id);
    setActiveTab("grading");
    setIsLoadingGrading(true);

    try {
      const response = await fetch("/api/submissions/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug: problemSlug || problemId,
          code: attempt.code,
          language: attempt.language,
          output: attempt.executionOutput || "",
          expectedOutput: "",
          attemptId: attempt.id,
        }),
      });

      const grading = await response.json();

      // Update the local cache with the new grading
      mutate((currentData) => {
        if (!currentData) return currentData;
        return currentData.map((page) => ({
          ...page,
          attempts: page.attempts.map((a) =>
            a.id === attempt.id ? { ...a, grading } : a
          ),
        }));
      }, false);

      toast.success("AI grading complete!");
    } catch (error) {
      console.error("Grading error:", error);
      toast.error("Failed to get AI grading");
    } finally {
      setIsLoadingGrading(false);
    }
  };

  if (!data && isValidating) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="py-4 px-6 flex flex-col rounded-2xl border border-border/50 bg-muted-foreground/5 gap-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Submissions</p>
            <Target className="size-4 text-[#ea721b]" />
          </div>
          <p className="text-3xl font-bold">{totalCount}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Total attempts made</p>
        </div>

        <div className={cn(
          "py-4 px-6 flex flex-col rounded-2xl border gap-1",
          solvedCount > 0 ? "border-green-500/30 bg-green-500/5" : "border-border/50 bg-muted-foreground/5"
        )}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
            <CheckCircle className={cn("size-4", solvedCount > 0 ? "text-green-500" : "text-muted-foreground")} />
          </div>
          <p className={cn("text-3xl font-bold", solvedCount > 0 ? "text-green-500" : "text-black")}>
            {solvedCount > 0 ? "Solved" : "Unsolved"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {solvedCount} successful {solvedCount === 1 ? "submission" : "submissions"}
          </p>
        </div>

        <div className="py-4 px-6 flex flex-col rounded-2xl border border-border/50 bg-muted-foreground/5 gap-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Best Accuracy</p>
            <Trophy className="size-4 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold">
            {attempts.length > 0 ? Math.max(...attempts.map(a => {
              if (!a.visibleTotalCount) return a.passedTests ? 100 : 0;
              const visiblePassed = a.visiblePassedCount || 0;
              const visibleTotal = a.visibleTotalCount || 1;
              const hiddenPassed = a.hiddenPassedCount || 0;
              const hiddenTotal = a.hiddenTotalCount || 0;
              return Math.round(((visiblePassed + hiddenPassed) / (visibleTotal + hiddenTotal)) * 100);
            }), 0) : 0}%
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Highest test case pass rate</p>
        </div>

        <div className="py-4 px-6 flex flex-col rounded-2xl border border-border/50 bg-muted-foreground/5 gap-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Activity</p>
            <Clock className="size-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold mt-1">
            {attempts[0] ? new Date(attempts[0].createdAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric' }) : "N/A"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-2">
            {attempts[0] ? new Date(attempts[0].createdAt).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }) : "No activity yet"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Submissions List */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="py-2 px-4 flex items-center justify-between rounded-2xl border border-border/50 bg-muted-foreground/5">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Code2 className="size-4 text-[#ea721b]" />
              History
            </h3>
            <Badge variant="outline" className="text-[10px] bg-white">
              {totalCount}
            </Badge>
          </div>

          <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {attempts.length === 0 && !isValidating ? (
              <div className="py-10 text-center rounded-2xl border border-dashed border-border/50">
                <p className="text-sm text-muted-foreground">No submissions yet</p>
              </div>
            ) : (
              <>
                {attempts.map((attempt, idx) => (
                  <div
                    key={attempt.id}
                    onClick={() => setSelectedAttemptId(attempt.id)}
                    className={cn(
                      "group relative p-4 rounded-2xl border transition-all cursor-pointer",
                      (selectedAttemptId === attempt.id || (!selectedAttemptId && idx === 0))
                        ? "bg-white border-[#ea721b]/40 shadow-sm"
                        : "bg-muted-foreground/5 border-transparent hover:border-border/50 hover:bg-muted-foreground/10"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "size-2 rounded-full",
                          attempt.passedTests ? "bg-green-500" : "bg-red-500"
                        )} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Attempt #{totalCount - idx}
                        </span>
                      </div>
                      {attempt.passedTests ? (
                        <span className="text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">PASSED</span>
                      ) : (
                        <span className="text-[10px] font-bold text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">FAILED</span>
                      )}
                    </div>

                    <div className="flex items-end justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] py-0 h-4 px-1.5 font-medium border-border/50">
                            {attempt.language}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(attempt.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {(attempt.visibleTotalCount ?? 0) > 0 && (
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="text-muted-foreground">Tests:</span>
                              <span className="font-bold text-black">
                                {(attempt.visiblePassedCount || 0) + (attempt.hiddenPassedCount || 0)}/{(attempt.visibleTotalCount || 0) + (attempt.hiddenTotalCount || 0)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px]">
                              {attempt.executionTime && (
                                <div className="flex items-center gap-1">
                                  <Clock className="size-2.5 text-blue-500" />
                                  <span className="text-muted-foreground">{Math.round(parseFloat(attempt.executionTime) * 1000)}ms</span>
                                </div>
                              )}
                              {attempt.memoryUsage && (
                                <div className="flex items-center gap-1">
                                  <Target className="size-2.5 text-purple-500" />
                                  <span className="text-muted-foreground">{Math.round(parseFloat(attempt.memoryUsage) / 1024)}MB</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {(selectedAttemptId === attempt.id || (!selectedAttemptId && idx === 0)) && (
                        <div className="size-6 rounded-full bg-[#ea721b]/10 flex items-center justify-center text-[#ea721b]">
                          <ArrowRightIcon className="size-3" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {hasMore && (
                  <div ref={ref} className="py-4 flex justify-center">
                    <Loader2 className="size-6 animate-spin text-[#ea721b]" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Column: Details & Content */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="py-2 px-6 flex items-center rounded-2xl border border-border/50 bg-muted-foreground/5 justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setActiveTab("code")}
                variant={"ghost"}
                className={cn(
                  "hover:bg-transparent rounded-none p-1 text-xs font-medium h-10 text-muted-foreground/70 flex items-center gap-2",
                  activeTab === "code" &&
                    "border-b-2 border-b-[#ea721b]/80 text-black"
                )}
              >
                <FileCode className="size-4" />
                Submission Code
              </Button>
              <Button
                onClick={() => setActiveTab("grading")}
                variant={"ghost"}
                className={cn(
                  "hover:bg-transparent rounded-none p-1 text-xs font-medium h-10 text-muted-foreground/70 flex items-center gap-2",
                  activeTab === "grading" &&
                    "border-b-2 border-b-[#ea721b]/80 text-black"
                )}
              >
                <Sparkles className="size-4" />
                AI Analysis & Grading
              </Button>
            </div>

            {selectedAttempt && (
              <div className="flex items-center gap-2">
                {activeTab === "grading" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGetGrading(selectedAttempt)}
                    disabled={isLoadingGrading}
                    className="h-8 text-[10px] font-bold uppercase tracking-wider gap-2 border-border/50 bg-white"
                  >
                    {isLoadingGrading ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Sparkles className="size-3 text-[#ea721b]" />
                    )}
                    {selectedAttempt.grading ? "Re-analyze" : "Analyze Code"}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => router.push(`/coding-problems/${problemSlug || problemId}`)}
                  className="h-8 text-[10px] font-bold uppercase tracking-wider gap-2 bg-[#ea721b] hover:bg-[#ea721b]/90"
                >
                  <Play className="size-3" />
                  New Attempt
                </Button>
              </div>
            )}
          </div>

          {selectedAttempt && (
            <div className="px-6 py-3 flex items-center gap-6 rounded-2xl border border-border/50 bg-white">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Language</span>
                <span className="text-xs font-semibold">{selectedAttempt.language}</span>
              </div>
              <div className="w-px h-6 bg-border/50" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Test Cases</span>
                <span className="text-xs font-semibold">
                  {(selectedAttempt.visiblePassedCount || 0) + (selectedAttempt.hiddenPassedCount || 0)}/{(selectedAttempt.visibleTotalCount || 0) + (selectedAttempt.hiddenTotalCount || 0)} Passed
                </span>
              </div>
              <div className="w-px h-6 bg-border/50" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Runtime</span>
                <span className="text-xs font-semibold">{selectedAttempt.executionTime ? `${Math.round(parseFloat(selectedAttempt.executionTime) * 1000)}ms` : "N/A"}</span>
              </div>
              <div className="w-px h-6 bg-border/50" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Memory</span>
                <span className="text-xs font-semibold">{selectedAttempt.memoryUsage ? `${Math.round(parseFloat(selectedAttempt.memoryUsage) / 1024)}MB` : "N/A"}</span>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border/50 bg-muted-foreground/5 overflow-hidden flex flex-col min-h-[500px]">
            {selectedAttempt ? (
              <div className="flex-1 flex flex-col">
                {activeTab === "code" ? (
                  <div className="flex-1 p-2 bg-white">
                    <Editor
                      height="100%"
                      width="100%"
                      language={selectedAttempt.language}
                      theme="vs-light"
                      value={selectedAttempt.code}
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                        fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
                        fontLigatures: true,
                        automaticLayout: true,
                        cursorBlinking: "smooth",
                        smoothScrolling: true,
                        cursorSmoothCaretAnimation: "on",
                        contextmenu: true,
                        renderLineHighlight: "all",
                        lineHeight: 1.6,
                        roundedSelection: true,
                        padding: { top: 10, bottom: 10 },
                        scrollbar: {
                          verticalScrollbarSize: 8,
                          horizontalScrollbarSize: 8
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {selectedAttempt.grading || isLoadingGrading ? (
                      isLoadingGrading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
                          <Loader2 className="size-10 animate-spin text-[#ea721b]" />
                          <div className="text-center">
                            <p className="font-semibold text-lg">AI is analyzing your code</p>
                            <p className="text-sm text-muted-foreground">This may take a few seconds...</p>
                          </div>
                        </div>
                      ) : selectedAttempt.grading ? (
                        <div className="space-y-8 animate-in fade-in duration-500">
                          <div className="flex items-center justify-between border-b pb-6">
                            <div>
                              <h4 className="text-2xl font-bold flex items-center gap-3">
                                <Sparkles className="size-6 text-[#ea721b]" />
                                AI Performance Review
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">Detailed analysis based on correctness, efficiency, and quality.</p>
                            </div>
                            <div className="flex flex-col items-center gap-1 bg-[#ea721b]/5 p-4 rounded-2xl border border-[#ea721b]/20">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Overall Score</span>
                              <span className="text-4xl font-black text-[#ea721b]">{selectedAttempt.grading.totalScore}<span className="text-sm font-normal text-muted-foreground">/100</span></span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                              { label: "Correctness", score: selectedAttempt.grading.correctnessScore, color: "bg-green-500" },
                              { label: "Efficiency", score: selectedAttempt.grading.efficiencyScore, color: "bg-blue-500" },
                              { label: "Quality", score: selectedAttempt.grading.codeQualityScore, color: "bg-purple-500" },
                              { label: "Best Practices", score: selectedAttempt.grading.bestPracticeScore, color: "bg-orange-500" }
                            ].map((item, i) => (
                              <div key={i} className="bg-muted-foreground/5 p-4 rounded-2xl border border-border/30 flex flex-col gap-2">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{item.label}</span>
                                <div className="flex items-end justify-between">
                                  <span className="text-2xl font-bold">{item.score}</span>
                                  <div className="w-16 h-1 bg-muted rounded-full mb-2">
                                    <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.score}%` }} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-6 text-sm bg-[#ea721b]/5 p-4 rounded-2xl border border-[#ea721b]/10">
                            <div className="flex-1 space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Time Complexity</p>
                              <code className="text-[#ea721b] font-bold text-base">{selectedAttempt.grading.timeComplexity || "O(N)"}</code>
                            </div>
                            <div className="w-px bg-[#ea721b]/20" />
                            <div className="flex-1 space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Space Complexity</p>
                              <code className="text-[#ea721b] font-bold text-base">{selectedAttempt.grading.spaceComplexity || "O(1)"}</code>
                            </div>
                          </div>

                          <div className="space-y-6">
                            {selectedAttempt.grading.summary && (
                              <div className="space-y-2">
                                <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Executive Summary</h5>
                                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-sm text-blue-900/80 leading-relaxed italic">
                                  &ldquo;{selectedAttempt.grading.summary}&rdquo;
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                              {selectedAttempt.grading.strengths && selectedAttempt.grading.strengths.length > 0 && (
                                <div className="space-y-4">
                                  <h5 className="text-sm font-bold flex items-center gap-2 text-green-600">
                                    <CheckCircle className="size-4" /> Strengths
                                  </h5>
                                  <ul className="space-y-3">
                                    {selectedAttempt.grading.strengths.map((strength, idx) => (
                                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-3">
                                        <div className="mt-1.5 size-1.5 rounded-full bg-green-500 shrink-0" />
                                        {strength}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {selectedAttempt.grading.improvements && selectedAttempt.grading.improvements.length > 0 && (
                                <div className="space-y-4">
                                  <h5 className="text-sm font-bold flex items-center gap-2 text-orange-600">
                                    <Sparkles className="size-4" /> Areas for Improvement
                                  </h5>
                                  <ul className="space-y-3">
                                    {selectedAttempt.grading.improvements.map((improvement, idx) => (
                                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-3">
                                        <div className="mt-1.5 size-1.5 rounded-full bg-orange-500 shrink-0" />
                                        {improvement}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-20 text-center gap-6">
                        <div className="size-20 rounded-full bg-[#ea721b]/5 flex items-center justify-center">
                          <Sparkles className="size-10 text-[#ea721b]/40" />
                        </div>
                        <div className="max-w-xs space-y-2">
                          <p className="font-semibold text-lg text-black">No AI analysis yet</p>
                          <p className="text-sm text-muted-foreground">Analyze your submission to get detailed feedback on efficiency and quality.</p>
                        </div>
                        <Button
                          onClick={() => handleGetGrading(selectedAttempt)}
                          className="bg-[#ea721b] hover:bg-[#ea721b]/90 gap-2 h-10 px-6 font-bold text-xs uppercase tracking-widest"
                        >
                          <Sparkles className="size-4" />
                          Start AI Analysis
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 py-20 text-muted-foreground gap-4">
                <Code2 className="size-12 opacity-20" />
                <p className="text-sm font-medium">Select a submission from the history to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
