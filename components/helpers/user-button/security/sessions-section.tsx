"use client";

import { ErrorCard } from "@/components/auth/error-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { User } from "@prisma/client";
import { Session } from "better-auth";
import { Ellipsis, Laptop, Loader, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { UAParser } from "ua-parser-js";

export const SessionsSection = ({
  user,
}: {
  user: User;
}) => {
  const [animate] = useAutoAnimate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isRevokeBoxOpen, setIsRevokeBoxOpen] = useState<string | boolean>(false);

  const topRef = useRef<HTMLDivElement>(null);
  const bottomCardsRef = useRef<HTMLDivElement>(null);

  const currentSession = authClient.useSession();

  // We need to fetch sessions on mount.
  // Base better-auth provides authClient.listSessions().
  useEffect(() => {
    const getSessions = async () => {
      await authClient
        .listSessions?.()
        .then((res) => {
          if (res?.data) {
            setSessions(res.data);
          }
        })
        .catch((err: any) => {
          console.error(err);
        });
    };
    getSessions();
  }, []);

  const onRevokeSession = async (token: string) => {
    setIsLoading(true);

    try {
      await authClient.revokeSession({ token });
      setSessions((prev) => prev.filter((s) => s.token !== token));
      setIsRevokeBoxOpen(false);
    } catch (e: any) {
      setError(e.message || "Failed to revoke session");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-3 border-b border-zinc-200 dark:border-zinc-800 py-6">
      <p ref={topRef} className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
        Active Devices
      </p>
      <div ref={animate} className="w-full">
        <div ref={animate} className="flex flex-col gap-4 items-start w-full">
          {error && (
            <ErrorCard className="w-full -mt-2" size="sm" error={error} />
          )}

          {sessions.length === 0 ? (
            <div className="flex flex-col gap-2 w-full">
              <Skeleton className="w-full h-10 rounded-xl" />
              <Skeleton className="w-full h-10 rounded-xl" />
            </div>
          ) : (
            <>
              {[...sessions].sort((a, b) => {
                const isACurrent = a.token === currentSession.data?.session?.token;
                const isBCurrent = b.token === currentSession.data?.session?.token;
                if (isACurrent) return -1;
                if (isBCurrent) return 1;
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
              }).map((session) => {
                const parsedAgent = UAParser(session.userAgent || "");
                const isMobile = parsedAgent.device.type === "mobile" || parsedAgent.device.type === "tablet";
                const isCurrentSession = session.token === currentSession.data?.session?.token;

                return (
                  <div
                    key={session.id}
                    ref={animate}
                    className="flex flex-col w-full gap-2"
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex items-start gap-3">
                        <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg mt-0.5">
                          {isMobile ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-600 dark:text-zinc-400">
                              <path d="M7 2h10c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm5 17c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zM7 4v12h10V4H7z"/>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-600 dark:text-zinc-400">
                              <path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex flex-col gap-[2px]">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                              {parsedAgent.os.name || "Unknown OS"}
                            </p>
                            {isCurrentSession && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium border-green-200 text-green-700 bg-green-50 dark:border-green-900/50 dark:text-green-400 dark:bg-green-900/20">
                                This device
                              </Badge>
                            )}
                          </div>
                          <p className="text-[13px] text-zinc-500">
                            {parsedAgent.browser.name || "Unknown Browser"} {parsedAgent.browser.version ? parsedAgent.browser.version.split('.')[0] + ".0.0.0" : ""}
                          </p>
                          <p className="text-[13px] text-zinc-500">
                            {session.ipAddress || "Unknown IP"}
                          </p>
                          <p className="text-[13px] text-zinc-500">
                            {(() => {
                              const date = new Date(session.updatedAt);
                              const today = new Date();
                              const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
                              const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                              return isToday ? `Today at ${time}` : `${date.toLocaleDateString()} at ${time}`;
                            })()}
                          </p>
                        </div>
                      </div>

                      {!isCurrentSession && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant={"ghost"} size="icon" className="group">
                              <Ellipsis className="h-4 w-4 text-zinc-400 group-hover:text-zinc-800 transition" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-fit py-0 px-0">
                            <DropdownMenuItem
                              className="cursor-pointer px-3 py-1 text-zinc-600 focus:text-zinc-800 transition-all"
                              onClick={() => {
                                setIsRevokeBoxOpen(session.token);
                                setTimeout(() => {
                                  bottomCardsRef.current?.scrollIntoView({ behavior: "smooth" });
                                }, 200);
                              }}
                            >
                              <p className="text-[13px] text-destructive">Sign out</p>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {isRevokeBoxOpen === session.token && (
                      <Card className="my-4 shadow-md w-full bg-muted-foreground/5 border-zinc-600/15 max-w-[400px]">
                        <CardHeader className="w-full flex flex-col pb-4">
                          <CardTitle className="text-sm tracking-tight">Sign out of device</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            Are you sure you want to sign out of this device? You will need to log back in to access your account from it.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center gap-2">
                          <Button
                            disabled={isLoading}
                            onClick={() => {
                              setIsRevokeBoxOpen(false);
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => onRevokeSession(session.token)}
                            variant="destructive"
                            disabled={isLoading}
                            size="sm"
                            className="text-xs shadow-sm"
                          >
                            {isLoading && <Loader className="size-3 mr-1 text-white animate-spin" />}
                            {!isLoading && "Sign out"}
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                );
              })}
            </>
          )}
          <div ref={bottomCardsRef} />
        </div>
      </div>
    </div>
  );
};
