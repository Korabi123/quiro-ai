"use client";

import {
  ArrowRightIcon,
  BookOpenTextIcon,
  Captions,
  FileAudio2,
  Loader,
  MessageCircleIcon,
  SearchIcon,
  Sparkles,
  UserIcon,
  Video,
  XCircle,
} from "lucide-react";
import { MeetingEmptySvg } from "../svg/meeting-empty";
import { Button } from "../ui/button";
import { useMeeting } from "@/lib/meetings";
import { useEffect, useRef, useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { GeneratedAvatar } from "../generated-avatar";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { AudioPlayer } from "../ui/audio-player";
import { Input } from "@/components/ui/input";
import { useChats } from "@/lib/chats";
import { Response } from '@/components/ai-elements/response';

interface Props {
  meetingId: string;
}

export const MeetingContent = ({ meetingId }: Props) => {
  const session = authClient.useSession();
  const { data: meeting, isLoading } = useMeeting(meetingId);

  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<
    "summary" | "transcript" | "recording" | "askAI"
  >("summary");
  const [content, setContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();

  const { data: chats } = useChats(meetingId);

  const endOfChatsRef = useRef<HTMLDivElement>(null);

  const memoizedTranscript = useMemo(() => {
    if (!meeting?.callTranscript) return null;

    // @ts-ignore
    const transcriptParts = meeting.callTranscript
      .split(/\s*(AI:|User:)\s*/)
      .filter(Boolean);
    const structuredTranscript = [];
    for (let i = 0; i < transcriptParts.length; i += 2) {
      const speaker = transcriptParts[i]?.replace(":", "");
      const utterance = transcriptParts[i + 1];
      if (speaker && utterance) {
        structuredTranscript.push({ speaker, utterance });
      }
    }

    const filteredTranscript = structuredTranscript.filter((item) =>
      item.utterance.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filteredTranscript.length === 0) {
      return <p className="text-center text-muted-foreground/70 mb-4">No results found for "{searchQuery}".</p>;
    }

    return filteredTranscript.map((item, index) => {
        const { speaker, utterance } = item;
        return (
          <div key={index} className="border rounded-2xl p-3 bg-card">
            <div className="flex items-center gap-2 mb-2">
              {speaker === "AI" ? (
                <GeneratedAvatar
                  // @ts-ignore
                  seed={meeting?.agent?.name}
                  className="size-6"
                />
              ) : (
                <Avatar className="size-6">
                  <AvatarImage src={session.data?.user.image!} />
                  <AvatarFallback className="bg-gradient-to-b from-gray-700 via-gray-900 to-black text-white">
                    <UserIcon className="size-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <p className="text-md">
                {speaker === "AI"
                  ? // @ts-ignore
                    meeting?.agent?.name
                  : session?.data?.user.name || "User"}
              </p>
            </div>
            <p className="text-sm text-muted-foreground/70">
              {searchQuery
                ? utterance
                    .split(new RegExp(`(${searchQuery})`, "gi"))
                    .map((part, i) =>
                      part.toLowerCase() === searchQuery.toLowerCase() ? (
                        <span key={i} className="bg-yellow-200">
                          {part}
                        </span>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    )
                : utterance}
            </p>
          </div>
        );
      });
  }, [
    meeting?.callTranscript,
    searchQuery,
    session.data?.user.image,
    session.data?.user.name,
    // @ts-ignore
    meeting?.agent?.name,
  ]);

  const onSubmit = () => {
    setContent("");

    startTransition(async () => {
      try {
        await axios.post(`/api/chats/create?meetingId=${meetingId}`, {
          meetingId,
          content,
          type: "USER",
          transcript: meeting?.callTranscript,
        });
      } catch (error) {
        toast.error("Something went wrong");
      }
    });
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "l" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onSubmit();
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [onSubmit])

  const onMeetingCancel = () => {
    startTransition(async () => {
      toast.promise(axios.patch(`/api/meetings/cancel?id=${meetingId}`), {
        loading: "Cancelling meeting...",
        success: () => {
          router.push("/meetings");
          return "Meeting cancelled successfully";
        },
        error: "Something went wrong",
      });
    });
  };

  useEffect(() => {
    endOfChatsRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  return (
    <>
      {isLoading ? (
        <div className="mt-14 py-4 flex items-center justify-center rounded-2xl border border-border/50 bg-muted-foreground/5">
          <Loader className="size-5 animate-spin text-muted-foreground/70" />
          <p className="text-sm ml-2 text-muted-foreground/70">
            Loading meeting...
          </p>
        </div>
      ) : (
        <>
          {!meeting?.vapiCallId && (
            <div className="mt-14 py-4 flex items-center justify-center rounded-2xl border border-border/50 bg-muted-foreground/5">
              <div className="flex flex-col gap-2">
                <MeetingEmptySvg />
                <div className="flex flex-col items-center justify-center gap-4">
                  <p className="text-center font-medium text-xl">
                    Not started yet
                  </p>
                  <p className="text-center text-sm text-muted-foreground/70">
                    Once you start this meeting, a summary will appear here.
                  </p>
                  <div className="inline-flex items-center gap-2">
                    <Button
                      disabled={isPending}
                      onClick={onMeetingCancel}
                      variant={"outline"}
                    >
                      <XCircle className="size-5" />
                      Cancel meeting
                    </Button>
                    <Button
                      disabled={isPending}
                      onClick={() => router.push(`/meetings/${meetingId}/call`)}
                      className="bg-[#ea721b] hover:bg-opacity-80 transition-all"
                    >
                      <Video className="size-5" />
                      Start meeting
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {meeting?.vapiCallId && meeting?.callTranscript && (
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
                  onClick={() => setTab("transcript")}
                  variant={"ghost"}
                  className={cn(
                    "hover:bg-transparent rounded-none p-1 text-muted-foreground/70",
                    tab === "transcript" &&
                      "border-b-2 border-b-[#ea721b]/80 text-black"
                  )}
                >
                  <Captions />
                  Transcript
                </Button>
                <Button
                  onClick={() => setTab("recording")}
                  variant={"ghost"}
                  className={cn(
                    "hover:bg-transparent rounded-none p-1 text-muted-foreground/70",
                    tab === "recording" &&
                      "border-b-2 border-b-[#ea721b]/80 text-black"
                  )}
                >
                  <FileAudio2 />
                  Recording
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
                    <h1 className="text-2xl mt-2">{meeting?.title}</h1>
                    <div className="flex mt-2 items-center gap-2">
                      <GeneratedAvatar
                        // @ts-ignore
                        seed={meeting?.agent?.name}
                        className="size-5"
                      />
                      <p className="text-sm underline">
                        {/* @ts-ignore */}
                        {meeting?.agent?.name}
                      </p>
                      <p className="ml-1 text-sm">
                        {meeting?.createdAt
                          ? new Date(meeting.createdAt).toLocaleDateString(
                              "en-US",
                              { year: "numeric", month: "long", day: "numeric" }
                            )
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg">Overview</h3>
                      <p className="mt-2 text-sm text-muted-foreground/70">
                        {meeting?.summary}
                      </p>
                    </div>
                  </>
                )}
                {tab === "transcript" && (
                  <>
                    <h1 className="text-2xl mt-2">Transcript</h1>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search transcript..."
                        className="mb-4 peer ps-9 pe-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <div className="text-muted-foreground/80 bottom-[28%] pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                        <SearchIcon size={16} />
                      </div>
                    </div>
                    <div className="mt-2 flex flex-col gap-2">
                      {memoizedTranscript}
                    </div>
                  </>
                )}
                {tab === "recording" && (
                  <div className="flex flex-col gap-2">
                    <h1 className="text-2xl mt-2">Recording</h1>
                    <AudioPlayer
                      src={meeting?.recordingURL!}
                      controls
                      autoPlay
                      preload="auto"
                    />
                  </div>
                )}
                {tab === "askAI" && (
                  <div className="flex flex-col gap-2 max-h-[400px] h-[400px]">
                    {chats?.length === 0 ? (
                      <div className="w-full h-full flex flex-col gap-3 items-center justify-center p-4">
                        <MessageCircleIcon className="size-16 text-muted-foreground/40" />
                        <p className="text-muted-foreground/40">
                          No chats yet. Ask AI to start a chat.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col p-2 gap-6 w-full h-full overflow-y-scroll">
                        {chats?.map((chat) => (
                          <>
                            {chat.type === "AI" && (
                              <div
                                key={chat.id}
                                className="self-start flex flex-col gap-2 rounded-2xl border border-border/50 bg-card p-4"
                              >
                                <div className="flex items-center gap-2">
                                  <GeneratedAvatar
                                    // @ts-ignore
                                    seed={meeting?.agent?.name}
                                    className="size-6"
                                  />
                                  <p className="text-md">
                                    {/* @ts-ignore */}
                                    {meeting?.agent?.name}
                                  </p>
                                </div>
                                <Response className="text-sm text-muted-foreground/70">
                                  {chat.content}
                                </Response>
                              </div>
                            )}
                            {chat.type === "USER" && (
                              <div
                                key={chat.id}
                                className="self-end flex flex-col gap-2 rounded-2xl border border-border/50 bg-card p-4"
                              >
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
                              </div>
                            )}
                            <div ref={endOfChatsRef} />
                          </>
                        ))}
                      </div>
                    )}
                    <div className="p-2">
                      <div className="relative">
                        <Input
                          onChange={(e) => setContent(e.target.value)}
                          value={content}
                          className="peer pe-9"
                          placeholder="Ask AI..."
                        />
                        <button
                          className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Submit search"
                          type="submit"
                          onClick={onSubmit}
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
