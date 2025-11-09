"use client";

import {
  ArrowRightIcon,
  ChevronsUpDown,
  CircleCheck,
  CircleX,
  ClockArrowUpIcon,
  Loader,
  SearchIcon,
  Video,
  XIcon,
} from "lucide-react";
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { useAgents } from "@/lib/agents";
import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";
import { useAutoAnimate } from "@formkit/auto-animate/react";

const StatusFilter = () => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useQueryState("status");

  const statuses = [
    {
      label: "Upcoming",
      value: "UPCOMING",
      icon: ClockArrowUpIcon,
    },
    {
      label: "Completed",
      value: "COMPLETED",
      icon: CircleCheck,
    },
    {
      label: "Active",
      value: "ACTIVE",
      icon: Video,
    },
    {
      label: "Processing",
      value: "PROCESSING",
      icon: Loader,
    },
    {
      label: "Canceled",
      value: "CANCELED",
      icon: CircleX,
    }
  ]

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="text-muted-foreground/70 hover:text-muted-foreground transition-all relative"
      >
        {!status ? (
          <>
            Status
            <ChevronsUpDown />
          </>
        ): (
          <>
            {(() => {
              const StatusIcon = statuses.find((s) => s.value === status)?.icon;
              return StatusIcon ? <StatusIcon className="inline" /> : null;
            })()}
            {statuses.find((s) => s.value === status)?.label}
            <ChevronsUpDown />
          </>
        )}
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search..." />
        <CommandList className="px-0 mx-0">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup className="mx-0 font-normal">
            {statuses.map((s) => (
              <CommandItem onSelect={() => {
                setStatus(s.value)
                setOpen(false)
              }} key={s.value}>
                <s.icon className="-ml-[0.5px] text-muted-foreground/70 size-8 mr-[1px]" />
                <span>{s.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

const AgentFilter = () => {
  const [open, setOpen] = useState(false);
  const [agent, setAgent] = useQueryState("agent");
  const agents = useAgents();

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="text-muted-foreground/70 max-w-[250px] hover:text-muted-foreground transition-all"
      >
        {!agent ? (
          <>
            Agent
            <ChevronsUpDown />
          </>
        ) : (
          <>
            <GeneratedAvatar seed={agent} className="size-5" />
            <span className="truncate">{agent}</span>
            <ChevronsUpDown />
          </>
        )}
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search..." />
        <CommandList className="px-0 mx-0">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup className="mx-0 font-normal">
            {agents.data?.map((agent) => (
              <CommandItem
                onSelect={() => {
                  setAgent(agent.name);
                  setOpen(false);
                }}
                key={agent.id}
              >
                <GeneratedAvatar seed={agent.name} className="size-8" />
                <span>{agent.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

const ClearFilterButton = () => {
  const [status, setStatus] = useQueryState("status");
  const [agent, setAgent] = useQueryState("agent");

  if (status || agent) {
    return (
      <Button
        variant={"outline"}
        size={"sm"}
        className={cn("text-black shadow-sm")}
        onClick={() => {
          setStatus(null);
          setAgent(null);
        }}
      >
        <CircleX className="size-5" />
        Clear
      </Button>
    );
  }
};

export const MeetingFilters = () => {
  const [animate] = useAutoAnimate();
  const [search, setSearch] = useQueryState("search");

  return (
    <div ref={animate} className="flex items-center gap-2">
      <div className="relative">
        <Input
          className="peer ps-9 pe-9"
          placeholder="Search..."
          type="search"
          value={search!}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
        />
        <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
          <SearchIcon size={16} />
        </div>
      </div>
      <StatusFilter />
      <AgentFilter />
      <ClearFilterButton />
    </div>
  )
}
