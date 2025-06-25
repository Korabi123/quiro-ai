"use client";

import {
  BookOpenTextIcon,
  Captions,
  FileAudio2,
  Loader,
  Sparkle,
  Sparkles,
  UserIcon,
  Video,
  XCircle,
} from "lucide-react";
import { MeetingEmptySvg } from "../svg/meeting-empty";
import { Button } from "../ui/button";
import { useMeeting } from "@/lib/meetings";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FaPagelines } from "react-icons/fa";
import { GeneratedAvatar } from "../generated-avatar";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { AudioPlayer } from "../ui/audio-player";

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

  const router = useRouter();

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
                    <h1 className="text-2xl">Transcript</h1>
                    <div className="mt-2 flex flex-col gap-2">
                      {meeting?.callTranscript &&
                        meeting.callTranscript
                          .split(/\s*(AI:|User:)\s*/)
                          .filter(Boolean)
                          .map((part, index, arr) => {
                            if (part === "AI:" || part === "User:") {
                              const speaker = part.replace(":", "");
                              const utterance = arr[index + 1];
                              if (utterance) {
                                return (
                                  <div
                                    key={index}
                                    className="border rounded-2xl p-3 bg-card"
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      {speaker === "AI" ? (
                                        <GeneratedAvatar
                                          // @ts-ignore
                                          seed={meeting?.agent?.name}
                                          className="size-6"
                                        />
                                      ) : (
                                        <Avatar className="size-6">
                                          <AvatarImage
                                            src={session.data?.user.image!}
                                          />
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
                                      {utterance}
                                    </p>
                                  </div>
                                );
                              }
                            }
                            return null;
                          })}
                    </div>
                  </>
                )}
                {tab === "recording" && (
                  <div className="flex flex-col gap-2">
                    <h1 className="text-2xl">Recording</h1>
                    <AudioPlayer
                      src={meeting?.recordingURL!}
                      controls
                      autoPlay
                      preload="auto"
                    />
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
