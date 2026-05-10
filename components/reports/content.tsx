"use client";

import { authClient } from "@/lib/auth-client";
import { useReport } from "@/lib/reports";
import {
  ArrowRightIcon,
  BookOpenTextIcon,
  Captions,
  ClipboardPen,
  Loader,
  MessageCircleIcon,
  Sparkles,
  UserIcon,
} from "lucide-react";
import { ReportEmptySvg } from "../svg/report-empty";
import { Button } from "../ui/button";
import { useEffect, useRef, useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Response } from "../ai-elements/response";
import { Chat, Question } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { GeneratedAvatar } from "../generated-avatar";
import { Badge } from "../ui/badge";
import { useChats } from "@/lib/chats";
import { Input } from "../ui/input";
import { toast } from "sonner";
import axios from "axios";

interface Props {
  reportId: string;
}

export const ReportContent = ({ reportId }: Props) => {
  const { data: report, isLoading } = useReport(reportId);
  const session = authClient.useSession();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"summary" | "questionBreakdown" | "askAI">(
    "summary"
  );
  const [content, setContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endOfChatsRef = useRef<HTMLDivElement>(null);

  const { data: chats } = useChats(undefined, report?.id);

  const router = useRouter();
  let badgeColor = "";

  if (report !== undefined) {
    // @ts-ignore
    const scorePercentage = (report.score / report.maxPossibleScore) * 100;

    if (scorePercentage < 50) {
      badgeColor = "bg-red-400/20 border-red-400/50 text-red-500";
    } else if (scorePercentage < 75) {
      badgeColor = "bg-yellow-400/20 border-yellow-400/50 text-yellow-500";
    } else {
      badgeColor = "bg-green-400/20 border-green-400/50 text-green-500";
    }
  }

  const [lastSentMessage, setLastSentMessage] = useState<string>("");

  const [optimisticChats, setOptimisticChats] = useState<Chat[]>([]);
  const [pendingMessage, setPendingMessage] = useState<string>("");

  const onSubmit = () => {
    // Add optimistic update
    const tempChat: Chat = {
      id: `temp-${Date.now()}`,
      content: content,
      type: "USER",
      meetingId: null,
      reportId: reportId,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: session?.data?.user.id!,
    };

    setOptimisticChats((prev) => [...prev, tempChat]);
    setPendingMessage(content);
    setContent("");
    setLastSentMessage(content);

    startTransition(async () => {
      try {
        await axios.post(`/api/chats/create?reportId=${reportId}`, {
          reportId: report?.id,
          content,
          type: "USER",
          // @ts-ignore
          transcript: `SUMMARY: ${report?.summary}\nBREAKDOWN: ${report?.breakdown}\nQUESTIONS AND FEEDBACK:\n${report?.questions.map((question: Question) => `${question.content}: ${question.answer}\n${question.feedback}\n`).join("\n")}`,
        });
        setOptimisticChats((prev) =>
          prev.filter((chat) => chat.id !== tempChat.id)
        );
        setPendingMessage("");
      } catch (error) {
        toast.error("Something went wrong");
        setOptimisticChats((prev) =>
          prev.filter((chat) => chat.id !== tempChat.id)
        );
        setPendingMessage("");
        setIsTyping(false);
        setLastSentMessage("");
      }
    });
  };

  useEffect(() => {
    const down = (pressedKey: KeyboardEvent) => {
      if (
        pressedKey.key === "l" &&
        (pressedKey.metaKey || pressedKey.ctrlKey)
      ) {
        pressedKey.preventDefault();
        onSubmit();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onSubmit]);

  useEffect(() => {
    if (chats && chats.length > 0) {
      const lastMessage = chats[chats.length - 1];

      if (
        lastSentMessage &&
        lastMessage.type === "USER" &&
        lastMessage.content === lastSentMessage
      ) {
        setIsTyping(true);
        setLastSentMessage("");
      } else if (lastMessage.type === "AI") {
        setIsTyping(false);
      }
    }
  }, [chats, lastSentMessage]);

  const displayChats = useMemo(() => {
    if (!chats) return optimisticChats;

    const filteredOptimistic = optimisticChats.filter(
      (optChat) =>
        !chats.some(
          (serverChat) =>
            serverChat.content === optChat.content &&
            serverChat.type === optChat.type &&
            Math.abs(
              new Date(serverChat.createdAt).getTime() -
                new Date(optChat.createdAt).getTime()
            ) < 5000
        )
    );

    return [...chats, ...filteredOptimistic];
  }, [chats, optimisticChats]);

  useEffect(() => {
    const scrollToBottom = () => {
      const scrollContainer = endOfChatsRef.current?.closest('.overflow-y-scroll');
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    };

    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  });

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
              <div className="py-2 px-6 flex items-center rounded-2xl border border-border/50 bg-muted-foreground/5 gap-4">
                <Button
                  onClick={() => setTab("summary")}
                  variant={"ghost"}
                  className={cn(
                    "hover:bg-transparent rounded-none p-1 text-muted-foreground/70",
                    tab === "summary" &&
                      "border-b-2 border-b-[#ea721b]/80 text-black"
                  )}
                >
                  <BookOpenTextIcon />
                  Summary
                </Button>
                <Button
                  onClick={() => setTab("questionBreakdown")}
                  variant={"ghost"}
                  className={cn(
                    "hover:bg-transparent rounded-none p-1 text-muted-foreground/70",
                    tab === "questionBreakdown" &&
                      "border-b-2 border-b-[#ea721b]/80 text-black"
                  )}
                >
                  <Captions />
                  Individual Question Breakdown
                </Button>
                <Button
                  onClick={() => setTab("askAI")}
                  variant={"ghost"}
                  className={cn(
                    "hover:bg-transparent rounded-none p-1 text-muted-foreground/70",
                    tab === "askAI" &&
                      "border-b-2 border-b-[#ea721b]/80 text-black"
                  )}
                >
                  <Sparkles />
                  Ask AI
                </Button>
              </div>

              <div className="py-2 px-6 flex flex-col rounded-2xl border border-border/50 bg-muted-foreground/5 gap-4">
                {tab === "summary" && (
                  <>
                    <h1 className="inline-flex items-center gap-2 text-2xl mt-2 mb-2">
                      {report?.name}

                      {report !== undefined && (
                        <Badge
                          variant={"outline"}
                          className={cn("p-2 ml-2", badgeColor)}
                        >
                          {report.score} / {report.maxPossibleScore} points
                        </Badge>
                      )}
                    </h1>
                    <div className="flex mb-3 items-center gap-2">
                      <p className="font-medium text-sm">
                        {report.field}{" "}
                        <span className="ml-2 border bg-slate-100 text-slate-800 border-slate-300/50 rounded-xl py-1 px-3 text-xs">
                          {report.type === "ALL"
                            ? "All skillsets"
                            : report.type.slice(0, 1).toUpperCase() +
                              report.type.slice(1).toLocaleLowerCase()}
                        </span>
                        {report.type === "CUSTOM" && (
                          <span className="ml-2 border bg-slate-100 text-slate-800 border-slate-300/50 rounded-xl py-1 px-3 text-xs">
                            {report?.customType!.slice(0, 1).toUpperCase() +
                              report?.customType!.slice(1).toLocaleLowerCase()}
                          </span>
                        )}
                      </p>
                      <p className="ml-2 text-muted-foreground underline text-sm">
                        {report?.createdAt
                          ? new Date(report.createdAt).toLocaleDateString(
                              "en-US",
                              { year: "numeric", month: "long", day: "numeric" }
                            )
                          : "N/A"}
                      </p>
                    </div>
                    <div className="space-y-5">
                      <div>
                        <h3 className="text-lg">Overview</h3>
                        <Response className="mt-2 text-sm text-muted-foreground/70">
                          {report?.summary}
                        </Response>
                      </div>
                      <div>
                        <h3 className="text-lg">Breakdown</h3>
                        <Response className="mt-2 text-sm text-muted-foreground/70">
                          {report?.breakdown}
                        </Response>
                      </div>
                    </div>
                  </>
                )}
                {tab === "questionBreakdown" && (
                  <>
                    <h1 className="text-2xl mt-2">
                      Individual Question Breakdown
                    </h1>
                    <div className="mt-2 flex flex-col gap-2">
                      {/* @ts-ignore */}
                      {report?.questions.map((question: Question) => (
                        <>
                          <div
                            key={question.id}
                            className="border rounded-2xl p-3 bg-card"
                          >
                            <div className="flex items-center justify-between gap-2 mb-4">
                              <p className="text-md">{question.content}</p>
                              <p className="text-xs">
                                {/* @ts-ignore */}
                                {question.score} / {question.rubric?.maxScore}{" "}
                                points
                              </p>
                            </div>
                            <div className="mt-2 ml-2 flex items-start gap-2 mb-2">
                              <Avatar className="size-6">
                                <AvatarImage src={session.data?.user.image!} />
                                <AvatarFallback className="bg-gradient-to-b from-gray-700 via-gray-900 to-black text-white">
                                  <UserIcon className="size-4" />
                                </AvatarFallback>
                              </Avatar>
                              <p className="text-sm text-muted-foreground/70">
                                {question.answer}
                              </p>
                            </div>
                            <div className="flex ml-2 items-center gap-2 mb-2">
                              <GeneratedAvatar
                                // @ts-ignore
                                seed="AnswerAI"
                                className="size-6"
                              />
                              <p className="text-sm text-muted-foreground/70">
                                {question.feedback}
                              </p>
                            </div>
                          </div>
                        </>
                      ))}
                    </div>
                  </>
                )}
                {tab === "askAI" && (
                  <div className="flex flex-col gap-2 max-h-[450px] h-[450px]">
                    {displayChats?.length === 0 ? (
                      <div className="w-full h-full flex flex-col gap-3 items-center justify-center p-4">
                        <MessageCircleIcon className="size-16 text-muted-foreground/40" />
                        <p className="text-muted-foreground/40">
                          No chats yet. Ask AI to start a chat.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col p-2 gap-6 w-full h-full overflow-y-scroll">
                        {displayChats?.map((chat) => (
                          <div
                            key={chat.id}
                            className={cn(
                              "flex flex-col gap-2 rounded-2xl border border-border/50 bg-card p-4",
                              chat.type === "AI" ? "self-start" : "self-end"
                            )}
                          >
                            {chat.type === "AI" && (
                              <>
                                <div className="flex items-center gap-2">
                                  <GeneratedAvatar
                                    // @ts-ignore
                                    seed={report?.name}
                                    className="size-6"
                                  />
                                  <p className="text-md">
                                    {/* @ts-ignore */}
                                    {`${report?.name} AI`}
                                  </p>
                                </div>
                                <Response className="text-sm text-muted-foreground/70">
                                  {chat.content}
                                </Response>
                              </>
                            )}
                            {chat.type === "USER" && (
                              <>
                                <div className="flex items-center gap-2">
                                  <Avatar className="size-6">
                                    <AvatarImage
                                      src={session.data?.user.image!}
                                    />
                                    <AvatarFallback className="bg-gradient-to-b from-gray-700 via-gray-900 to-black text-white">
                                      <UserIcon className="size-4" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <p className="text-md">
                                    {session.data?.user.name || "User"}
                                  </p>
                                </div>
                                <Response className="text-sm text-muted-foreground/70">
                                  {chat.content}
                                </Response>
                              </>
                            )}
                          </div>
                        ))}
                        {isTyping && (
                          <div className="self-start flex flex-col gap-2 rounded-2xl border border-border/50 bg-card p-4">
                            <div className="flex items-center gap-2">
                              <GeneratedAvatar
                                // @ts-ignore
                                seed={report?.name}
                                className="size-6"
                              />
                              <p className="text-md">
                                {/* @ts-ignore */}
                                {`${report?.name} AI`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                              <div
                                className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                            </div>
                          </div>
                        )}
                        <div ref={endOfChatsRef} />
                      </div>
                    )}
                    <div className="p-2">
                      <div className="relative">
                        <Input
                          onChange={(e) => setContent(e.target.value)}
                          value={content}
                          className="peer pe-9"
                          placeholder="Ask AI..."
                          disabled={isTyping || isPending}
                        />
                        <button
                          className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Submit search"
                          type="submit"
                          onClick={onSubmit}
                          disabled={isTyping || isPending || !content.trim()}
                        >
                          <ArrowRightIcon size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};
