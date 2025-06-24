"use client";

import { useMeetings } from "@/lib/meetings";
import { CircleCheck, CircleX, ClockArrowUpIcon, CornerDownRight, Loader, Video } from "lucide-react";
import { GeneratedAvatar } from "../generated-avatar";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";

export const MeetingsTable = () => {
  const router = useRouter();

  const [search, setSearch] = useQueryState("search");
  const [status, setStatus] = useQueryState("status");
  const [agent, setAgent] = useQueryState("agent");
  const { data: meetings, isLoading } = useMeetings({  search, status, agent });
  const [animate] = useAutoAnimate();

  return (
    <div
      ref={animate}
      className="mt-14 rounded-2xl border border-border/50 bg-muted-foreground/5"
    >
      {isLoading && (
        <div className="flex items-center justify-center w-full p-5">
          <Loader className="size-5 animate-spin text-muted-foreground/70" />
          <p className="text-sm ml-2 text-muted-foreground/70">
            Loading meetings...
          </p>
        </div>
      )}
      {meetings?.map((meeting) => (
        <>
          <div
            onClick={() => router.push(`/meetings/${meeting.id}`)}
            key={meeting.id}
            className="flex cursor-pointer hover:bg-muted-foreground/10 only:rounded-2xl first:rounded-t-2xl last:rounded-b-2xl transition-all items-center justify-between w-full p-5"
          >
            <div className="flex flex-col gap-2">
              <p className="font-medium text-sm">{meeting.title}</p>
              <span className="flex items-center gap-2 text-xs text-muted-foreground/70">
                <CornerDownRight className="size-3 text-muted-foreground/60" />
                {/* @ts-expect-error Just a simple type error */}
                {meeting.agent.name}
                {/* @ts-expect-error Just a simple type error */}
                <GeneratedAvatar seed={meeting.agent.name} className="size-5" />
                <Badge
                  variant={"outline"}
                  className="text-muted-foreground/70 font-normal"
                >
                  {(() => {
                    const date = new Date(meeting.createdAt);
                    const now = new Date();
                    const isThisYear = date.getFullYear() === now.getFullYear();

                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      ...(isThisYear ? {} : { year: "numeric" }),
                    });
                  })()}
                </Badge>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant={"outline"}
                className={cn(
                  meeting.status === "UPCOMING" &&
                    "bg-yellow-400/20 border-yellow-400/50 text-yellow-400",
                  meeting.status === "COMPLETED" &&
                    "bg-green-400/20 border-green-400/50 text-green-400",
                  meeting.status === "ACTIVE" &&
                    "bg-blue-400/20 border-blue-400/50 text-blue-400",
                  meeting.status === "CANCELED" &&
                    "bg-red-400/20 border-red-400/50 text-red-400",
                  "p-2 min-w-[120px] flex justify-center"
                )}
              >
                {meeting.status === "UPCOMING" && (
                  <ClockArrowUpIcon className="size-4 mr-2" />
                )}
                {meeting.status === "COMPLETED" && (
                  <CircleCheck className="size-4 mr-2" />
                )}
                {meeting.status === "ACTIVE" && (
                  <Video className="size-4 mr-2" />
                )}
                {meeting.status === "PROCESSING" && (
                  <Loader className="size-4 mr-2 animate-spin" />
                )}
                {meeting.status === "CANCELED" && (
                  <CircleX className="size-4 mr-2" />
                )}
                {meeting.status.charAt(0).toUpperCase() +
                  meeting.status.slice(1).toLowerCase()}
              </Badge>
              <Badge variant={"outline"} className={cn("p-2")}>
                {(() => {
                  const date = new Date(meeting.createdAt);
                  const now = new Date();
                  const isThisYear = date.getFullYear() === now.getFullYear();
                  return date.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    ...(isThisYear ? {} : { year: "numeric" }),
                  });
                })()}
              </Badge>
            </div>
          </div>
          {meeting.id !== meetings?.at(-1)?.id && (
            <Separator key={meeting.agentId} className="bg-border/60" />
          )}
        </>
      ))}
      {meetings?.length === 0 && (
        <div className="flex items-center justify-center w-full p-5">
          <p className="text-sm text-muted-foreground/70">No meetings found</p>
        </div>
      )}
    </div>
  );
}
