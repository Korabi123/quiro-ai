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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useModalStore } from "@/hooks/use-modal-store";

interface Props {
  secondary?: boolean;
  breadcrumb?: string | null | undefined;
  breadcrumbHref?: string | null | undefined;
  optionsHidden?: boolean;
  reportId?: string;
}

export const ReportsHeading = ({
  secondary = false,
  breadcrumb = null,
  breadcrumbHref = null,
  optionsHidden = false,
  reportId,
}: Props) => {
  const { onOpen } = useModalStore();

  return (
    <div className="flex items-center justify-between w-full">
      {!secondary && (
        <>
          <h1 className="font-semibold md:text-3xl text-xl">My Skill Reports</h1>
          <Button
            onClick={() =>
              onOpen("createReport", {
                reportId: undefined,
                agentId: undefined,
                meetingId: undefined,
              })
            }
            className="bg-[#ea721b] hover:bg-opacity-80 transition-all"
          >
            <Plus className="size-5" />
            New Report
          </Button>
        </>
      )}
      {secondary && (
        <>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="font-semibold md:text-3xl text-xl">
                <BreadcrumbLink asChild>
                  <Link href="/reports">My Skill Reports</Link>
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
                    onClick={() => onOpen("editReport", { reportId: reportId })}
                    className="text-muted-foreground"
                  >
                    <Pencil />
                    Edit Report
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      onOpen("deleteReport", { reportId: reportId })
                    }
                    className="rounded-none text-destructive focus:text-destructive focus:bg-destructive/10 transition-all"
                  >
                    <Trash2 />
                    Delete Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </>
      )}
    </div>
  );
};
