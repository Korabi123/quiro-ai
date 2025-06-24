"use client";

import * as React from "react"
import { GalleryVerticalEnd, Star, Video } from "lucide-react"

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
    title: "Reports",
    url: "/reports",
    icon: GalleryVerticalEnd,
  },
  {
    title: "Questions",
    url: "/questions",
    icon: Star,
  }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const pathname = usePathname();

  const session = authClient.useSession();

  const user = session.data?.user;

  return (
    <Sidebar {...props}>
      <SidebarHeader className="p-2">
        <SidebarMenu>
          <SidebarMenuItem className="px-2">
            <a href="#">
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
                onClick={() => router.push(route.url)}
                className={cn(
                  "p-2 px-3 inline-flex items-center gap-2 font-medium text-black/50 rounded-xl cursor-pointer hover:bg-black/5 transition-all",
                  pathname === route.url &&
                    "bg-[#ffd43e]/25 hover:bg-[#ffd43e]/35 transition-all text-black"
                )}
              >
                <route.icon className="size-5" />
                {route.title}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="mt-2">
          <SidebarMenu className="gap-2">
            <SidebarMenuItem className="p-2 bg-black/5 rounded-xl inline-flex items-center hover:bg-black/10 cursor-pointer transition-all">
              {/* @ts-expect-error Just a simple type error */}
              <UserButton showExtraInfo className="w-full" align={"start"} user={user} />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
