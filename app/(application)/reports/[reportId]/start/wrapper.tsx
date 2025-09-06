"use client";

import { AnimatedLoader } from "@/components/animated-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { Textarea } from "@/components/ui/textarea";
import { useQuestionsFromReport, useReport } from "@/lib/reports";
import { Question } from "@prisma/client";
import axios from "axios";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useTransition, useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

interface Props {
  reportId: string;
}

export const Wrapper = ({ reportId }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [loadingText, setLoadingText] = useState("");
  const [value, setValue] = useState("");

  const [onQuestion, setOnQuestion] = useState(0);
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<
    Array<{ label: string; text: string }>
  >([]);

  const { data: questions } = useQuestionsFromReport(reportId);
  const { data: report } = useReport(reportId);

  const router = useRouter();
  const hasRun = useRef(false);

  const [answers, setAnswers] = useState<Array<any>>([]);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    setLoadingText("Generating questions...");
    // @ts-ignore
    if (!report?.summary && !questions) {
      startTransition(async () => {
        await axios.post(`/api/reports/generate?id=${reportId}`).finally(() => {
          mutate(`/api/questions/get?reportId=${reportId}`);
          router.refresh();
        });
      });
    } else if (questions) {
      return;
    } else if (report?.summary) {
      router.push(`/reports/${reportId}`);
    }
  }, [report, reportId]);

  const currentQuestion = questions?.[onQuestion];

  // Extract multiple choice options when the current question changes
  useEffect(() => {
    if (!currentQuestion) return;

    if (currentQuestion.type === "MULTIPLE_CHOICE") {
      // Find the first occurrence of multiple choice options
      // This regex looks for patterns like "A) ", "A. ", " A) ", etc.
      const optionPatterns = [
        /\s+[A-D][\)\.]\s+/i, // Space before option
        /^[A-D][\)\.]\s+/i, // Option at start of string
      ];

      let firstOptionIndex = -1;
      const options: Array<{ label: string; text: string }> = [];

      // Try each pattern
      for (const pattern of optionPatterns) {
        const match = currentQuestion.content.match(pattern);
        if (match && match.index !== undefined) {
          firstOptionIndex = match.index;
          break;
        }
      }

      // If we found an option pattern
      if (firstOptionIndex >= 0) {
        // Extract options
        const optionsText = currentQuestion.content.substring(firstOptionIndex);
        const optionRegex =
          /\s*([A-D])[\)\.](\s+)([^\n]+?)(?=\s*[A-D][\)\.](\s+)|$)/g;
        let optionMatch;

        while ((optionMatch = optionRegex.exec(optionsText)) !== null) {
          options.push({
            label: optionMatch[1].trim(), // Just the letter (A, B, C, D)
            text: optionMatch[3].trim(), // Just the option text
          });
        }

        setMultipleChoiceOptions(options);
      } else {
        setMultipleChoiceOptions([]);
      }
    } else {
      setMultipleChoiceOptions([]);
    }
  }, [currentQuestion]);

  // Function to extract question text without options
  const getQuestionTextWithoutOptions = (content: string) => {
    if (!content) return "";

    const optionPatterns = [
      /\s+[A-D][\)\.]\s+/i, // Space before option
      /^[A-D][\)\.]\s+/i, // Option at start of string
    ];

    let firstOptionIndex = -1;

    // Try each pattern
    for (const pattern of optionPatterns) {
      const match = content.match(pattern);
      if (match && match.index !== undefined) {
        firstOptionIndex = match.index;
        break;
      }
    }

    // If we found an option pattern
    if (firstOptionIndex >= 0) {
      return content.substring(0, firstOptionIndex).trim();
    }

    // If no pattern is found, return the original content
    return content;
  };

  const onAnswerSubmit = async (
    question: Question,
    answer?: string,
    selectedOption?: string
  ) => {
    // Check if input is valid based on question type
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

    // Create the answer object
    const answerObj = {
      content: question.content,
      answer:
        question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE"
          ? selectedOption
          : answer,
      type: question.type,
      id: question.id,
      rubric: {
        // @ts-ignore
        criteria: question.rubric.criteria,
        // @ts-ignore
        scoring: question.rubric.scoring,
        // @ts-ignore
        maxScore: question.rubric.maxScore,
      },
    };

    // Update answers state
    setAnswers([...answers, answerObj]);
    setValue("");

    // Move to next question or finish
    // @ts-ignore
    if (onQuestion + 1 < questions?.length) {
      setOnQuestion(onQuestion + 1);
    } else {
      // Add the last answer to the answers array before submitting
      const updatedAnswers = [...answers, answerObj];
      setLoadingText("Grading report...");
      toast.success("You have completed the report");
      startTransition(async () => {
        await axios.post(`/api/reports/grade?id=${reportId}`, {
          answers: updatedAnswers,
        }).finally(() => {
          router.push(`/reports/${reportId}`);
        });
      });
    }
  };

  return (
    <>
      {isPending ? (
        <div className="flex flex-col mt-[10%] h-full w-full items-center justify-center">
          <AnimatedLoader className="w-[600px]" />
          <TextShimmer className="text-lg -mt-12">{loadingText}</TextShimmer>
          <p className="text-muted-foreground/80 text-xs">
            Please wait, this may take a few minutes.
          </p>
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
                // @ts-ignore
                value={((onQuestion + 1) * 100) / questions?.length}
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
    </>
  );
};
