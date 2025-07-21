"use client";

import { CornerDownRight, Loader } from "lucide-react";
import { GeneratedAvatar } from "../generated-avatar";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { useAgents } from "@/lib/agents";

export const AgentsTable = () => {
  const router = useRouter();

  const [search, setSearch] = useQueryState("search");
  const { data: agents, isLoading } = useAgents({ search });
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
            Loading agents...
          </p>
        </div>
      )}
      {agents?.map((agent) => (
        <>
          <div
            onClick={() => router.push(`/agents/${agent.id}`)}
            key={agent.id}
            className="flex cursor-pointer hover:bg-muted-foreground/10 only:rounded-2xl first:rounded-t-2xl last:rounded-b-2xl transition-all items-center justify-between w-full p-5"
          >
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-2 text-xs">
                <GeneratedAvatar seed={agent.name} className="size-5" />
                <p className="font-medium text-sm">{agent.name}</p>
              </span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground/70">
                <CornerDownRight className="size-3 text-muted-foreground/60" />
                <Badge
                  variant={"outline"}
                  className="text-muted-foreground/70 font-normal"
                >
                  Created at{" "}
                  {(() => {
                    const date = new Date(agent.createdAt);
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
          </div>
          {agent.id !== agents?.at(-1)?.id && (
            <Separator key={agent.id} className="bg-border/60" />
          )}
        </>
      ))}
      {agents?.length === 0 && (
        <div className="flex items-center justify-center w-full p-5">
          <p className="text-sm text-muted-foreground/70">No agents found</p>
        </div>
      )}
    </div>
  );
};
