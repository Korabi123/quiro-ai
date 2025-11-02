"use client";

import * as React from "react"
import { ChevronsLeftRight, GalleryVerticalEnd, Star, Video } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Separator } from "./ui/separator";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FaRobot } from "react-icons/fa";
import { UserButton } from "./auth/user-button";
import { authClient } from "@/lib/auth-client";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Subscription } from "@better-auth/stripe";
import { useMeetings } from "@/lib/meetings";
import { Progress } from "./ui/progress";
import { Skeleton } from "./ui/skeleton";
import { useModalStore } from "@/hooks/use-modal-store";

const routes = [
  {
    title: "Meetings",
    url: "/meetings",
    icon: Video,
  },
  {
    title: "Agents",
    url: "/agents",
    icon: FaRobot,
  },
  {
    title: "Skill Reports",
    url: "/reports",
    icon: GalleryVerticalEnd,
  },
  {
    title: "Coding Problems",
    url: "/coding",
    icon: ChevronsLeftRight,
  },
  {
    title: "Tips",
    url: "/tips",
    icon: Star,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const { isLoading: loadingMeetings, data: meetings, error } = useMeetings();
  const router = useRouter();
  const pathname = usePathname();

  const { onOpen } = useModalStore();

  const session = authClient.useSession();

  const user = session.data?.user;

  useEffect(() => {
    const getSubscription = async () => {
      await authClient.subscription.list()
        .then((res) => setSubscription(res?.data?.[0] ?? null));
    }
    getSubscription();
  }, []);

  return (
    <Sidebar {...props}>
      <SidebarHeader className="p-2">
        <SidebarMenu>
          <SidebarMenuItem className="px-2">
            <a href="/">
              <img
                src="/branding/logo-png.png"
                alt="Logo"
                width={150}
                height={150}
              />
            </a>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <Separator className="bg-sidebar-border/50 px-4" />
      <SidebarContent className="flex p-2 flex-col justify-between">
        <SidebarGroup className="mt-2">
          <SidebarMenu className="gap-2">
            {routes.map((route) => (
              <SidebarMenuItem
                onClick={() => {
                  if (route.title === "Coding Problems" || route.title === "Tips") {
                    toast.info(
                      "Please be patient, we're working on this feature!"
                    );
                  } else if (route.title === "Skill Reports" && subscription?.status !== "active") {
                    onOpen("restrictionDialog", {
                      restrictionDialogData: {
                        dialogDescription:
                          `This feature is pro only, please upgrade your plan to access it! The pro plan includes:`,
                      },
                    });
                  } else {
                    router.push(route.url);
                  }
                }}
                className={cn(
                  "p-2 px-3 inline-flex items-center gap-2 font-medium text-black/50 rounded-xl cursor-pointer hover:bg-black/5 transition-all",
                  pathname === route.url &&
                    "bg-[#ffd43e]/25 hover:bg-[#ffd43e]/35 transition-all text-black",
                  route.title === "Coding Problems" &&
                    "cursor-not-allowed text-black/50 hover:bg-transparent",
                  route.title === "Tips" && "cursor-not-allowed text-black/50 hover:bg-transparent",
                  route.title === "Skill Reports" && subscription?.status !== "active" && "cursor-not-allowed text-black/50 hover:bg-transparent"
                )}
              >
                <route.icon className="size-5" />
                {route.title}
                {route.title === "Coding Problems" && (
                  <Badge className="ml-auto text-xs font-medium bg-[#ffd43e] hover:bg-[#ffd43e]/80">
                    Coming Soon
                  </Badge>
                )}
                {route.title === "Tips" && (
                  <Badge className="ml-auto text-xs font-medium bg-[#ffd43e] hover:bg-[#ffd43e]/80">
                    Coming Soon
                  </Badge>
                )}
                {route.title === "Skill Reports" && subscription?.status !== "active" && (
                  <Badge className="ml-auto text-xs font-medium bg-[#ffd43e] hover:bg-[#ffd43e]/80">
                    Pro Only
                  </Badge>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          {loadingMeetings ? (
            <Skeleton className="h-28" />
          ) : (
            <>
              {subscription?.status !== "active" && (
                <div className="p-4 rounded-xl flex flex-col gap-4 bg-[#473a33]/75">
                  <p className="text-white font-medium text-md">
                    Upgrade to get access to all features
                  </p>
                  <div className="flex flex-col gap-2">
                    <p className="text-white text-sm">
                      {meetings?.length}/5 meetings
                    </p>
                    <Progress value={(meetings?.length! / 5) * 100} />
                  </div>
                </div>
              )}
            </>
          )}
        </SidebarGroup>
        <SidebarGroup className="mt-2">
          <SidebarMenu className="gap-2">
            <SidebarMenuItem className="p-2 bg-black/5 rounded-xl inline-flex items-center hover:bg-black/10 cursor-pointer transition-all">
              <UserButton
                showExtraInfo
                className="w-full"
                align={"start"}
                // @ts-expect-error Just a simple type error
                user={user}
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
