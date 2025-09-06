"use client";

import { authClient } from "@/lib/auth-client";
import { useReport } from "@/lib/reports";
import { ClipboardPen, Loader } from "lucide-react";
import { ReportEmptySvg } from "../svg/report-empty";
import { Button } from "../ui/button";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Response } from "../ai-elements/response";
import { Question } from "@prisma/client";

interface Props {
  reportId: string;
}

export const ReportContent = ({ reportId }: Props) => {
  const { data: report, isLoading } = useReport(reportId);
  const session = authClient.useSession();
  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  return (
    <>
      {isLoading ? (
        <div className="mt-14 py-4 flex items-center justify-center rounded-2xl border border-border/50 bg-muted-foreground/5">
          <Loader className="size-5 animate-spin text-muted-foreground/70" />
          <p className="text-sm ml-2 text-muted-foreground/70">
            Loading report...
          </p>
        </div>
      ) : (
        <>
          {!report?.summary ? (
            <div className="mt-14 py-4 flex items-center justify-center rounded-2xl border border-border/50 bg-muted-foreground/5">
              <div className="flex flex-col gap-2">
                <ReportEmptySvg />
                <div className="flex flex-col items-center justify-center gap-4">
                  <p className="text-center font-medium text-xl">
                    Not started yet
                  </p>
                  <p className="text-center text-sm text-muted-foreground/70">
                    Once you start this report, a summary will appear here.
                  </p>
                  <div className="inline-flex items-center gap-2">
                    <Button
                      disabled={isPending}
                      onClick={() => router.push(`/reports/${reportId}/start`)}
                      className="bg-[#ea721b] hover:bg-opacity-80 transition-all"
                    >
                      <ClipboardPen className="size-5" />
                      Start report
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-10 mt-14">
              <Response>
                {report?.summary}
              </Response>
              <Response>
                {report?.breakdown}
              </Response>
              {/* @ts-ignore */}
              {report.questions.map((question: Question) => (
                <div className="flex flex-col gap-3 p-4 border border-border/50 rounded-2xl">
                  <p className="text-sm text-muted-foreground/70">
                    {question.content}
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    {question.answer}
                  </p>
                  <Response className="text-sm text-muted-foreground/70">
                    {question.feedback}
                  </Response>
                  <p className="i">
                    {/* @ts-ignore */}
                    {question.score} out of {/* question.rubric.maxScore */}
                  </p>
                </div>
              ))}

            </div>
          )}
        </>
      )}
    </>
  );
}
