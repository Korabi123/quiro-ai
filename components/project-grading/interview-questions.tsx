"use client";

import { useState } from "react";
import { Check, Copy, Eye, MessageSquareText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InterviewQuestion } from "@/lib/grading/schema";

const DIFFICULTY_META: Record<string, { label: string; className: string }> = {
  easy: { label: "Easy", className: "text-green-700 border-green-500/30 bg-green-500/5" },
  medium: { label: "Medium", className: "text-amber-700 border-amber-500/30 bg-amber-500/5" },
  hard: { label: "Hard", className: "text-red-700 border-red-500/30 bg-red-500/5" },
};

const QuestionCard = ({
  question,
  index,
}: {
  question: InterviewQuestion;
  index: number;
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const meta = DIFFICULTY_META[question.difficulty] ?? DIFFICULTY_META.medium;

  const copyQuestion = async () => {
    const parts = [
      question.question,
      question.hint ? `\nHint for the interviewer: ${question.hint}` : "",
      question.relatedPaths.length
        ? `\nRelevant files:\n${question.relatedPaths.map((path) => `- ${path}`).join("\n")}`
        : "",
    ].join("");

    try {
      await navigator.clipboard.writeText(parts);
      setIsCopied(true);
      toast.success("Question copied");
      setTimeout(() => setIsCopied(false), 2_000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <div className="rounded-xl border border-border/50 bg-white p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="text-[10px] font-bold text-muted-foreground mt-1 shrink-0 w-4">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <p className="text-sm font-medium leading-relaxed">{question.question}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={cn("text-[10px]", meta.className)}>
              {meta.label}
            </Badge>
            {question.relatedPaths.slice(0, 3).map((path) => (
              <Badge
                key={path}
                variant="outline"
                className="text-[10px] font-normal text-muted-foreground font-mono max-w-[180px] truncate"
              >
                {path}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {question.hint && (
        <div className="pl-7">
          {isRevealed ? (
            <p className="text-xs text-muted-foreground leading-relaxed bg-muted-foreground/5 rounded-lg p-3 border border-border/40 whitespace-pre-wrap">
              {question.hint}
            </p>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setIsRevealed(true)}
              className="text-xs text-muted-foreground gap-1.5 px-0 hover:bg-transparent hover:text-black"
            >
              <Eye className="size-3.5" />
              Reveal what a good answer covers
            </Button>
          )}
        </div>
      )}

      <div className="pl-7">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={copyQuestion}
          className="text-xs text-muted-foreground gap-1.5 px-0 hover:bg-transparent hover:text-black"
        >
          {isCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {isCopied ? "Copied" : "Copy question"}
        </Button>
      </div>
    </div>
  );
};

/**
 * Interview questions derived from this specific repo. These are the questions
 * to ask the person who wrote it, so the hints stay hidden by default to avoid
 * priming the interviewer.
 */
export const InterviewQuestions = ({
  questions,
  className,
}: {
  questions: InterviewQuestion[];
  className?: string;
}) => {
  if (questions.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center gap-2">
        <MessageSquareText className="size-4 text-[#ea721b]" />
        <h3 className="text-sm font-semibold">Interview questions</h3>
        <Badge variant="outline" className="text-[10px]">
          {questions.length}
        </Badge>
        <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
          <Sparkles className="size-3" />
          Derived from this code
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {questions.map((question, index) => (
          <QuestionCard key={`${index}-${question.question}`} question={question} index={index} />
        ))}
      </div>
    </div>
  );
};