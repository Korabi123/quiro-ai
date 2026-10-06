"use client";

import { AnimatedLoader } from "@/components/animated-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { Textarea } from "@/components/ui/textarea";
import { useQuestionsFromReport, useReport, useQuestionGeneration, QuestionWithRubric } from "@/lib/reports";
import { QuestionType } from "@prisma/client";
import axios from "axios";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useTransition, useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { StreakSuccessDialog } from "@/components/dialogs/streak-success-dialog";

interface Props {
  reportId: string;
}

/**
 * One collected answer, posted verbatim to `/api/reports/grade`. The rubric is
 * copied along with the answer so the grader has the scoring context even if the
 * question row changes before grading runs.
 */
type ReportAnswer = {
  content: string;
  answer: string;
  type: QuestionType;
  id: string;
  rubric: Pick<NonNullable<QuestionWithRubric["rubric"]>, "criteria" | "scoring" | "maxScore">;
};

export const Wrapper = ({ reportId }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [loadingText, setLoadingText] = useState("");
  const [value, setValue] = useState("");

  const [showStreakDialog, setShowStreakDialog] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  const [onQuestion, setOnQuestion] = useState(0);

  const { data: questions } = useQuestionsFromReport(reportId);
  const { data: report } = useReport(reportId);
  const { isGenerating } = useQuestionGeneration(reportId);

  const router = useRouter();
  const hasRun = useRef(false);

  const [answers, setAnswers] = useState<ReportAnswer[]>([]);
  const [gradeStatus, setGradeStatus] = useState<"idle" | "queued" | "failed">("idle");
  const handledGrade = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    setLoadingText("Generating questions...");
    if (!report?.summary && !questions?.length) {
      //* Starts an Inngest job and returns 202. The questions arrive later via
      //* the polling hook, so there is nothing to await here - the transition
      //* spinner is replaced by the same loader the poll drives.
      startTransition(async () => {
        await axios.post(`/api/reports/generate?id=${reportId}`).catch(() => {
          toast.error("Could not start question generation");
        });

        mutate(`/api/questions/get?reportId=${reportId}`);
        mutate(`/api/reports/get?id=${reportId}`);
      });
    } else if (questions) {
      return;
    } else if (report?.summary) {
      router.push(`/reports/${reportId}`);
    }
  }, [report, reportId]);

  //* Grading is also an Inngest job now. Watch the report row until it settles,
  //* then run the streak check and move on. Previously this was the `finally`
  //* of the POST, which only worked because grading happened inline.
  const gradeFailed = gradeStatus === "queued" && report?.jobStatus === "FAILED";
  const gradeSettled =
    gradeStatus === "queued" &&
    report?.jobStatus === "COMPLETED" &&
    !!report?.summary;

  useEffect(() => {
    //* A ref rather than state: this must fire exactly once when grading
    //* settles, and flipping a state flag here would re-render the whole
    //* assessment view a second time for no visual gain.
    if (!gradeSettled || handledGrade.current) return;
    handledGrade.current = true;

    void (async () => {
      await mutate("/api/user/streak");

      try {
        const { data: streakData } = await axios.get("/api/user/streak");
        if (streakData && streakData.streak > 0) {
          setStreakCount(streakData.streak);
          setShowStreakDialog(true);
        } else {
          router.push(`/reports/${reportId}`);
        }
      } catch {
        router.push(`/reports/${reportId}`);
      }
    })();
  }, [gradeSettled, reportId, router]);

  const currentQuestion = questions?.[onQuestion];

  //* Parsed from the question text rather than synced into state from an effect:
  //* the options are a pure function of the current question.
  const multipleChoiceOptions = useMemo(() => {
    if (!currentQuestion || currentQuestion.type !== "MULTIPLE_CHOICE") {
      return [];
    }

    const optionPatterns = [
      /\s+[A-D][\)\.]\s+/i, // Space before option
      /^[A-D][\)\.]\s+/i, // Option at start of string
    ];

    let firstOptionIndex = -1;

    for (const pattern of optionPatterns) {
      const match = currentQuestion.content.match(pattern);
      if (match && match.index !== undefined) {
        firstOptionIndex = match.index;
        break;
      }
    }

    if (firstOptionIndex < 0) {
      return [];
    }

    const optionsText = currentQuestion.content.substring(firstOptionIndex);
    const optionRegex =
      /\s*([A-D])[\)\.](\s+)([^\n]+?)(?=\s*[A-D][\)\.](\s+)|$)/g;
    const options: Array<{ label: string; text: string }> = [];
    let optionMatch;

    while ((optionMatch = optionRegex.exec(optionsText)) !== null) {
      options.push({
        label: optionMatch[1].trim(), // Just the letter (A, B, C, D)
        text: optionMatch[3].trim(), // Just the option text
      });
    }

    return options;
  }, [currentQuestion]);

  const getQuestionTextWithoutOptions = (content: string) => {
    if (!content) return "";

    const optionPatterns = [
      /\s+[A-D][\)\.]\s+/i, // Space before option
      /^[A-D][\)\.]\s+/i, // Option at start of string
    ];

    let firstOptionIndex = -1;

    for (const pattern of optionPatterns) {
      const match = content.match(pattern);
      if (match && match.index !== undefined) {
        firstOptionIndex = match.index;
        break;
      }
    }

    if (firstOptionIndex >= 0) {
      return content.substring(0, firstOptionIndex).trim();
    }

    return content;
  };

  const onAnswerSubmit = async (
    question: QuestionWithRubric,
    answer?: string,
    selectedOption?: string
  ) => {
    if (
      (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") &&
      !selectedOption
    ) {
      toast.error("Please select an option");
      return;
    }

    if (
      (question.type === "FREE_TEXT" || question.type === "FILL_BLANK") &&
      !answer
    ) {
      toast.error("Please enter an answer");
      return;
    }

    const answerObj: ReportAnswer = {
      content: question.content,
      answer:
        question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE"
          ? (selectedOption ?? "")
          : (answer ?? ""),
      type: question.type,
      id: question.id,
      rubric: {
        criteria: question.rubric.criteria,
        scoring: question.rubric.scoring,
        maxScore: question.rubric.maxScore,
      },
    };

    setAnswers([...answers, answerObj]);
    setValue("");

    if (onQuestion + 1 < (questions?.length ?? 0)) {
      setOnQuestion(onQuestion + 1);
    } else {
      const updatedAnswers = [...answers, answerObj];
      setLoadingText("Grading report...");
      toast.success("You have completed the report");
      setGradeStatus("queued");

      startTransition(async () => {
        await axios
          .post(`/api/reports/grade?id=${reportId}`, { answers: updatedAnswers })
          .catch(() => setGradeStatus("failed"));

        //* Pick up the PENDING status so the polling hook starts.
        mutate(`/api/reports/get?id=${reportId}`);
      });
    }
  };

  return (
    <>
      {isPending || isGenerating || (gradeStatus === "queued" && !gradeSettled && !showStreakDialog) ? (
        <div className="flex flex-col mt-[10%] h-full w-full items-center justify-center">
          <AnimatedLoader className="w-[600px]" />
          <TextShimmer className="text-lg -mt-12">
            {gradeFailed ? "Grading failed" : loadingText}
          </TextShimmer>
          <p className="text-muted-foreground/80 text-xs">
            {gradeFailed
              ? "Something went wrong while grading this report."
              : "Please wait, this may take a few minutes."}
          </p>
          {gradeFailed && (
            <Button className="mt-6" onClick={() => router.push(`/reports/${reportId}`)}>
              Back to reports
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col w-full gap-4">
          <div className="mt-14 mx-auto max-w-screen-sm rounded-lg">
            <div className="flex flex-col gap-4 mt-4 p-6">
              <div className="w-full flex items-center justify-between">
                <p className="text-sm">
                  {onQuestion + 1} of {questions?.length}
                </p>
              </div>
              <h3 className="text-lg font-bold">
                {currentQuestion?.type === "MULTIPLE_CHOICE"
                  ? getQuestionTextWithoutOptions(currentQuestion.content)
                  : currentQuestion?.content}
              </h3>
              <Progress
                className="mb-4"
                value={
                  questions?.length
                    ? ((onQuestion + 1) * 100) / questions.length
                    : 0
                }
              />
              {currentQuestion?.type === "MULTIPLE_CHOICE" &&
                multipleChoiceOptions.length > 0 && (
                  <>
                    {multipleChoiceOptions.map((option, index) => (
                      <div
                        onClick={() =>
                          onAnswerSubmit(
                            currentQuestion!,
                            undefined,
                            `${option.label}) ${option.text}`
                          )
                        }
                        key={index}
                        className="transition-all cursor-pointer hover:ring-[1.8px] hover:ring-offset-[2.5px] hover:ring-[#ffd43e] flex items-center gap-4 rounded-xl p-4 bg-muted-foreground/5"
                      >
                        <div className="px-3 py-1.5 rounded-lg bg-[#473a33]/90 max-w-fit">
                          <p className="text-sm text-white">{option.label}</p>
                        </div>
                        <p className="text-md text-black/70">{option.text}</p>
                      </div>
                    ))}
                  </>
                )}
              {currentQuestion?.type === "FREE_TEXT" && (
                <div className="mt-4 flex flex-col gap-4">
                  <Textarea
                    placeholder="Type your answer here..."
                    rows={5}
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                    className="resize-none"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                  <Button
                    onClick={() =>
                      onAnswerSubmit(currentQuestion!, value, undefined)
                    }
                    className="hover:ring-[2px] hover:ring-offset-2 hover:ring-[#ffd43e] relative group ml-auto bg-[#ffd43e] text-black/80 hover:bg-[#ffd43e]/80"
                  >
                    Submit Answer
                    <ArrowRight className="-ml-[20%] text-transparent group-hover:text-black group-hover:ml-0 transition-all" />
                  </Button>
                </div>
              )}
              {currentQuestion?.type === "TRUE_FALSE" && (
                <>
                  <div
                    onClick={() =>
                      onAnswerSubmit(currentQuestion!, undefined, "A) True")
                    }
                    className="transition-all cursor-pointer hover:ring-[1.8px] hover:ring-offset-[2.5px] hover:ring-[#ffd43e] flex items-center gap-4 rounded-xl p-4 bg-muted-foreground/5"
                  >
                    <div className="px-3 py-1.5 rounded-lg bg-[#473a33]/90 max-w-fit">
                      <p className="text-sm text-white">A</p>
                    </div>
                    <p className="text-md text-black/70">True</p>
                  </div>
                  <div
                    onClick={() =>
                      onAnswerSubmit(currentQuestion!, undefined, "B) False")
                    }
                    className="transition-all cursor-pointer hover:ring-[1.8px] hover:ring-offset-[2.5px] hover:ring-[#ffd43e] flex items-center gap-4 rounded-xl p-4 bg-muted-foreground/5"
                  >
                    <div className="px-3 py-1.5 rounded-lg bg-[#473a33]/90 max-w-fit">
                      <p className="text-sm text-white">B</p>
                    </div>
                    <p className="text-md text-black/70">False</p>
                  </div>
                </>
              )}
              {currentQuestion?.type === "FILL_BLANK" && (
                <div className="mt-4 flex flex-col gap-4">
                  <Input
                    placeholder="Type your answer here..."
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                    className="resize-none"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                  <Button
                    onClick={() =>
                      onAnswerSubmit(currentQuestion!, value, undefined)
                    }
                    className="hover:ring-[2px] hover:ring-offset-2 hover:ring-[#ffd43e] relative group ml-auto bg-[#ffd43e] text-black/80 hover:bg-[#ffd43e]/80"
                  >
                    Submit Answer
                    <ArrowRight className="-ml-[20%] text-transparent group-hover:text-black group-hover:ml-0 transition-all" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <StreakSuccessDialog
        isOpen={showStreakDialog}
        streak={streakCount}
        onClose={() => router.push(`/reports/${reportId}`)}
      />
    </>
  );
};
