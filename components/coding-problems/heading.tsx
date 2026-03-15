"use client";

import { Calendar, ChevronRight, Globe, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
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
import { useRouter } from "next/navigation";

interface Props {
  secondary?: boolean;
  breadcrumb?: string | null | undefined;
  breadcrumbHref?: string | null | undefined;
  optionsHidden?: boolean;
  agentId?: string;
  explore?: boolean;
}

export const CodingProblemHeading = ({
  secondary = false,
  explore = false,
  breadcrumb = null,
  breadcrumbHref = null,
  optionsHidden = false,
  agentId,
}: Props) => {
  const { onOpen } = useModalStore();
  const router = useRouter();

  return (
    <div className="flex items-center justify-between w-full">
      {(!secondary && !explore) && (
        <>
          <h1 className="font-semibold md:text-3xl text-xl">My Coding Problems</h1>
          <div className="flex gap-2 items-center">
            <Button onClick={() => router.push("/coding-problems/explore")} className="bg-[#ea721b] hover:bg-opacity-80 transition-all">
              <Globe className="size-5" />
              Explore
            </Button>
            {/*<Button onClick={() => router.push("/coding-problems/daily")} variant={"secondary"}>
              <Calendar className="size-5" />
              Daily Problems
            </Button>*/}
          </div>
        </>
      )}
      {secondary && (
        <>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="font-semibold md:text-3xl text-xl">
                <BreadcrumbLink asChild>
                  <Link href="/coding-problems">My Coding Problems</Link>
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
        </>
      )}
    </div>
  );
};
