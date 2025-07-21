"use client";

import { ChevronRight, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
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
  agentId?: string;
}

export const AgentHeading = ({
  secondary = false,
  breadcrumb = null,
  breadcrumbHref = null,
  optionsHidden = false,
  agentId,
}: Props) => {
  const { onOpen } = useModalStore();

  return (
    <div className="flex items-center justify-between w-full">
      {!secondary && (
        <>
          <h1 className="font-semibold md:text-3xl text-xl">My Agents</h1>
          <Button onClick={() => onOpen("createAgent", { agentId: undefined })} className="bg-[#ea721b] hover:bg-opacity-80 transition-all">
            <Plus className="size-5" />
            New Agent
          </Button>
        </>
      )}
      {secondary && (
        <>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="font-semibold md:text-3xl text-xl">
                <BreadcrumbLink asChild>
                  <Link href="/agents">My Agents</Link>
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
                      onOpen("editAgent", { agentId })
                    }
                    className="text-muted-foreground"
                  >
                    <Pencil />
                    Edit Agent
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      onOpen("deleteAgent", { agentId })
                    }
                    className="rounded-none text-destructive focus:text-destructive focus:bg-destructive/10 transition-all"
                  >
                    <Trash2 />
                    Delete Agent
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
