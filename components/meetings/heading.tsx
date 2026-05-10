"use client";

import {
  ChevronRight,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { useModalStore } from "@/hooks/use-modal-store";
import { useMeetings } from "@/lib/meetings";
import { useSubscription } from "@/lib/subscription";

interface Props {
  secondary?: boolean;
  breadcrumb?: string | null | undefined;
  breadcrumbHref?: string | null | undefined;
  optionsHidden?: boolean;
  meetingId?: string;
}

export const MeetingHeading = ({
  secondary = false,
  breadcrumb = null,
  optionsHidden = false,
  meetingId,
}: Props) => {
  const { data: subscription } = useSubscription();
  const meetings = useMeetings();

  const { onOpen } = useModalStore();

  return (
    <>
      <div className="flex items-center justify-between w-full">
        {!secondary && (
          <>
            <h1 className="font-semibold md:text-3xl text-xl">My Meetings</h1>
            <Button
              onClick={() => {
                if (
                  subscription?.plan !== "pro" &&
                  meetings?.data?.length === 5
                ) {
                  onOpen("restrictionDialog", {
                    restrictionDialogData: {
                      dialogDescription:
                        `You have reached the maximum number of meetings allowed for this plan, please upgrade your plan to create more meetings.`,
                    },
                  });
                } else {
                  onOpen("createMeeting", {});
                }
              }}
              className="bg-[#ea721b] hover:bg-opacity-80 transition-all"
            >
              <Plus className="size-5" />
              New Meeting
            </Button>
          </>
        )}
        {secondary && (
          <>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="font-semibold md:text-3xl text-xl">
                  <BreadcrumbLink asChild>
                    <Link href="/meetings">My Meetings</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className=" text-black" />
                </BreadcrumbSeparator>
                <BreadcrumbItem className="font-medium md:text-3xl text-xl">
                  <BreadcrumbPage className="font-medium">
                    {breadcrumb}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            {!optionsHidden && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant={"ghost"} size={"icon"}>
                      <MoreVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="p-0">
                    <DropdownMenuItem
                      onClick={() =>
                        onOpen("editMeeting", { meetingId: meetingId })
                      }
                      className="text-muted-foreground"
                    >
                      <Pencil />
                      Edit Meeting
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        onOpen("deleteMeeting", { meetingId: meetingId })
                      }
                      className="rounded-none text-destructive focus:text-destructive focus:bg-destructive/10 transition-all"
                    >
                      <Trash2 />
                      Delete Meeting
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};
