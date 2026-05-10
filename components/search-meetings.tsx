"use client";

import * as React from "react";
import {
  Search,
  Calendar,
  FileText,
  CalendarPlus,
  UserPlus,
  FilePlus,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { GeneratedAvatar } from "./generated-avatar";
import { useAgents } from "@/lib/agents";
import { useMeetings } from "@/lib/meetings";
import { useReports } from "@/lib/reports";
import { useModalStore } from "@/hooks/use-modal-store";
import { useSubscription } from "@/lib/subscription";

export default function MeetingsSearch() {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const router = useRouter();
  const { onOpen } = useModalStore();
  const { data: subscription } = useSubscription();

  const { data: agents, isLoading: agentsLoading } = useAgents();
  const { data: meetings, isLoading: meetingsLoading } = useMeetings();
  const { data: reports, isLoading: reportsLoading } = useReports();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const filteredAgents = React.useMemo(() => {
    if (!agents) return [];
    return agents
      .filter((agent) =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5);
  }, [agents, searchQuery]);

  const filteredMeetings = React.useMemo(() => {
    if (!meetings) return [];
    return meetings
      .filter((meeting) =>
        meeting.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5);
  }, [meetings, searchQuery]);

  const filteredReports = React.useMemo(() => {
    if (!reports) return [];
    return reports
      .filter((report) =>
        report.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5);
  }, [reports, searchQuery]);

  const handleAgentClick = (agentId: string) => {
    router.push(`/agents/${agentId}`);
    setOpen(false);
  };

  const handleMeetingClick = (meetingId: string) => {
    router.push(`/meetings/${meetingId}`);
    setOpen(false);
  };

  const handleReportClick = (reportId: string) => {
    router.push(`/reports/${reportId}`);
    setOpen(false);
  };

  const handleCreateAgent = () => {
    onOpen("createAgent", {
      reportId: undefined,
      agentId: undefined,
      meetingId: undefined,
    });
    setOpen(false);
  };

  const handleCreateMeeting = () => {
    onOpen("createMeeting", {
      reportId: undefined,
      agentId: undefined,
      meetingId: undefined,
    });
    setOpen(false);
  };

  const handleCreateReport = () => {
    onOpen("createReport", {
      reportId: undefined,
      agentId: undefined,
      meetingId: undefined,
    });
    setOpen(false);
  };

  const hasResults =
    filteredAgents.length > 0 ||
    filteredMeetings.length > 0 ||
    filteredReports.length > 0;

  return (
    <div className="w-full p-4">
      <Button
        variant="outline"
        className="relative h-8 w-full justify-start rounded-[0.5rem] text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-1 text-muted-foreground/70 size-4" />
        <span className="hidden lg:inline-flex">Search...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Type a command or search..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList className="px-0 mx-0 max-h-[400px] overflow-y-auto shadow-inner">
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Quick Actions" className="mx-0 font-normal">
            <CommandItem onSelect={handleCreateMeeting}>
              <CalendarPlus className="mr-2 text-muted-foreground/70 size-4" />
              <span>Create Meeting</span>
            </CommandItem>
            <CommandItem onSelect={handleCreateAgent}>
              <UserPlus className="mr-2 text-muted-foreground/70 size-4" />
              <span>Create Agent</span>
            </CommandItem>
            {subscription?.plan === "pro" && (
              <CommandItem onSelect={handleCreateReport}>
                <FilePlus className="mr-2 text-muted-foreground/70 size-4" />
                <span>Create Report</span>
              </CommandItem>
            )}
          </CommandGroup>


          {filteredAgents.length > 0 && (
            <CommandGroup heading="Agents" className="mx-0 font-normal">
              {filteredAgents.map((agent) => (
                <CommandItem
                  key={agent.id}
                  onSelect={() => handleAgentClick(agent.id)}
                >
                  <GeneratedAvatar seed={agent.name} className="size-6 mr-2" />
                  <span>{agent.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {filteredMeetings.length > 0 && (
            <CommandGroup heading="Meetings" className="mx-0 font-normal">
              {filteredMeetings.map((meeting) => (
                <CommandItem
                  key={meeting.id}
                  onSelect={() => handleMeetingClick(meeting.id)}
                >
                  <Calendar className="mr-2 text-muted-foreground/70 size-4" />
                  <span>{meeting.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {filteredReports.length > 0 && (
            <CommandGroup heading="Reports" className="mx-0 font-normal">
              {filteredReports.map((report) => (
                <CommandItem
                  key={report.id}
                  onSelect={() => handleReportClick(report.id)}
                >
                  <FileText className="mr-2 text-muted-foreground/70 size-4" />
                  <span>{report.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!searchQuery && !hasResults && (
            <>
              {agents && agents.length > 0 && (
                <CommandGroup
                  heading="Recent Agents"
                  className="mx-0 font-normal"
                >
                  {agents.slice(0, 3).map((agent) => (
                    <CommandItem
                      key={agent.id}
                      onSelect={() => handleAgentClick(agent.id)}
                    >
                      <GeneratedAvatar
                        seed={agent.name}
                        className="size-6 mr-2"
                      />
                      <span>{agent.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {meetings && meetings.length > 0 && (
                <CommandGroup
                  heading="Recent Meetings"
                  className="mx-0 font-normal"
                >
                  {meetings.slice(0, 3).map((meeting) => (
                    <CommandItem
                      key={meeting.id}
                      onSelect={() => handleMeetingClick(meeting.id)}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>{meeting.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {reports && reports.length > 0 && (
                <CommandGroup
                  heading="Recent Reports"
                  className="mx-0 font-normal"
                >
                  {reports.slice(0, 3).map((report) => (
                    <CommandItem
                      key={report.id}
                      onSelect={() => handleReportClick(report.id)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      <span>{report.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </div>
  );
}
