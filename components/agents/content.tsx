"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "../ui/button";
import { InfoIcon, Video } from "lucide-react";
import { useAgent } from "@/lib/agents";
import { GeneratedAvatar } from "../generated-avatar";
import { Skeleton } from "../ui/skeleton";
import { MeetingsTable } from "../meetings/meetings-table";

interface Props {
  agentId: string;
}

export const AgentContent = ({ agentId }: Props) => {
  const [tab, setTab] = useState<"info" | "meetings">("info");

  const { data: agent, isLoading } = useAgent(agentId);

  return (
    <div className="mt-14 flex flex-col gap-10">
      <div className="py-2 px-6 flex items-center rounded-2xl border border-border/50 bg-muted-foreground/5 gap-4">
        <Button
          onClick={() => setTab("info")}
          variant={"ghost"}
          className={cn(
            "hover:bg-transparent rounded-none p-1 text-muted-foreground/70",
            tab === "info" && "border-b-2 border-b-[#ea721b]/80 text-black"
          )}
        >
          <InfoIcon />
          Agent Details
        </Button>
        <Button
          onClick={() => setTab("meetings")}
          variant={"ghost"}
          className={cn(
            "hover:bg-transparent rounded-none p-1 text-muted-foreground/70",
            tab === "meetings" && "border-b-2 border-b-[#ea721b]/80 text-black"
          )}
        >
          <Video />
          Meetings
        </Button>
      </div>

      <div className="py-2 px-6 flex flex-col rounded-2xl border border-border/50 bg-muted-foreground/5 gap-4">
        {tab === "info" && (
          <>
            <h1 className="text-2xl mt-2">Agent Details</h1>
            <div className="flex mt-2 items-center gap-2">
              {isLoading ? (
                <Skeleton className="size-5 w-[300px]" />
              ) : (
                <>
                  <GeneratedAvatar seed={agent?.name!} className="size-5" />
                  <p className="text-sm underline">{agent?.name}</p>
                  <p className="ml-1 text-sm">
                    Created at{" "}
                    {agent?.createdAt
                      ? new Date(agent.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </p>
                </>
              )}
            </div>
            <div>
              <h3 className="text-lg">Instructions</h3>
              {isLoading ? (
                <Skeleton className="mt-2 w-[600px] h-10" />
              ) : (
                <p className="mt-2 text-sm text-muted-foreground/70">
                  {agent?.instructions}
                </p>
              )}
            </div>
          </>
        )}
        {tab === "meetings" && (
          <>
            <h1 className="text-2xl mt-2">Meetings with {agent?.name}</h1>
            <MeetingsTable
              className="mt-2"
              agentId={agent?.name}
              variant="outline"
            />
          </>
        )}
      </div>
    </div>
  );
};
