"use client";

import axios from "axios";
import { ErrorCard } from "@/components/auth/error-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { User } from "@prisma/client";
import { Account } from "better-auth";
import { ArrowRight, Ellipsis, Loader } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Skeleton } from "@/components/ui/skeleton";
import { AFTER_LOGIN } from "@/routes";

export const ConnectionsSection = ({
  user,
}: {
  user: User;
}) => {
  const [animate] = useAutoAnimate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [connections, setConnections] = useState<Account[]>([]);
  const [isDeleteConnectionBoxOpen, setIsDeleteConnectionBoxOpen] = useState<"github" | "google" | "closed">("closed");

  const passkeys = authClient.useListPasskeys();

  const bottomCardsRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getConnections = async () => {
      await authClient
        .listAccounts({}, {
          onRequest: () => {
            setIsLoading(true);
          },
          onSuccess: () => {
            setTimeout(() => {
              setIsLoading(false);
            }, 250);
          },
          onError: (ctx) => {
            alert(ctx.error.message);
            setIsLoading(false);
          }
        })
        // @ts-expect-error Just a simple type error
        .then((res) => setConnections(res.data));
    };
    getConnections();
  }, []);

  const onGithubDelete = async () => {
    setIsLoading(true);

    setTimeout(async () => {
      await axios
        .delete("/api/connections/delete/github")
        .catch((error) => {
          setError(error.response.data.message);
          setIsLoading(false);
        })
        .finally(() => {
          setIsLoading(false);
          setIsDeleteConnectionBoxOpen("closed");
          window.location.reload();
        });
    }, 1000);
  }

  const onGoogleDelete = async () => {
    setIsLoading(true);

    setTimeout(async () => {
      await axios
        .delete("/api/connections/delete/google")
        .catch((error) => {
          setError(error.response.data.message);
          setIsLoading(false);
        })
        .finally(() => {
          setIsLoading(false);
          setIsDeleteConnectionBoxOpen("closed");
          window.location.reload();
        });
    })
  }

  return (
    <div className="flex w-full flex-col gap-3 border-b border-zinc-200 dark:border-zinc-800 py-6">
      <p ref={topRef} className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
        Connected Accounts
      </p>
      <div
        ref={animate}
        className="w-full"
      >
        <div
          ref={animate}
          className="flex flex-col gap-4 items-start w-full"
        >
          {error && (
            <ErrorCard className="w-full -mt-2" size="sm" error={error} />
          )}
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="min-w-[350px] h-7 rounded-xl" />
              <Skeleton className="min-w-[350px] h-7 rounded-xl" />
              <Skeleton className="min-w-[125px] max-w-[125px] h-9 rounded-xl" />
            </div>
          ) : (
            <>
              {connections.map((connection) => {
                // @ts-expect-error Just a simple type error
                const provider: string = connection.provider;
                const formattedProvider =
                  provider.charAt(0).toUpperCase() + provider.slice(1);

                return (
                  <div
                    key={connection.id}
                    ref={animate}
                    className="min-w-[350px] -mt-1"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        key={connection.id}
                        className={cn(
                          "flex items-center justify-between -mt-2 gap-4",
                          provider === "credential" && "hidden"
                        )}
                      >
                        <div className={cn("flex items-center gap-2")}>
                          {provider === "google" && <FcGoogle size={18} />}
                          {provider === "github" && <FaGithub size={18} />}
                          <p className="text-sm">{formattedProvider}</p>
                          <p className="text-sm text-zinc-500">•</p>
                          <p className="text-sm text-zinc-500/85">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          className={cn(
                            "inline-flex ml-auto",
                            provider === "credential" && "hidden"
                          )}
                        >
                          <Button
                            variant={"ghost"}
                            size="icon"
                            className="group"
                          >
                            <Ellipsis className="h-4 w-4 text-zinc-400 group-hover:text-zinc-800 transition" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="center"
                          className="min-w-fit py-0 px-0"
                        >
                          <DropdownMenuItem
                            className="cursor-pointer px-3 py-1 text-zinc-600 focus:text-zinc-800 transition-all"
                            onClick={() => {
                              setIsDeleteConnectionBoxOpen(
                                provider === "github" ? "github" : "google"
                              );
                              setTimeout(() => {
                                bottomCardsRef.current?.scrollIntoView({
                                  behavior: "smooth",
                                });
                              }, 200);
                            }}
                          >
                            <p className="text-sm text-destructive">Remove</p>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {isDeleteConnectionBoxOpen === "github" && (
                      <>
                        <Card
                          className={cn(
                            "my-4 shadow-md w-full bg-muted-foreground/5 border-zinc-600/15 md:max-w-[350px]",
                            isDeleteConnectionBoxOpen === "github" &&
                              provider !== "github" &&
                              "hidden"
                          )}
                        >
                          <CardHeader className="w-full flex flex-col">
                            <CardTitle className="text-sm tracking-tight">
                              Remove Connection
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Are you sure you want to remove this connection?
                              <br />
                              This action cannot be undone.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Button
                              disabled={isLoading}
                              onClick={() => {
                                setIsDeleteConnectionBoxOpen("closed");
                                setTimeout(() => {
                                  topRef.current?.scrollIntoView({
                                    behavior: "smooth",
                                  });
                                }, 200);
                              }}
                              variant={"ghost"}
                              size={"sm"}
                              className="mt-4 mr-2"
                            >
                              Cancel
                            </Button>
                            <Button
                              ref={animate}
                              onClick={() => onGithubDelete()}
                              variant={"destructive"}
                              disabled={isLoading}
                              size={"sm"}
                              className="mt-4 mr-2"
                            >
                              {isLoading && (
                                <Loader className="size-2 text-white animate-spin" />
                              )}
                              {!isLoading && "Delete"}
                            </Button>
                          </CardContent>
                        </Card>
                        <div ref={bottomCardsRef} />
                      </>
                    )}
                    {isDeleteConnectionBoxOpen === "google" && (
                      <>
                        <Card
                          className={cn(
                            "my-4 shadow-md w-full bg-muted-foreground/5 border-zinc-600/15 md:max-w-[350px]",
                            isDeleteConnectionBoxOpen === "google" &&
                              provider !== "google" &&
                              "hidden"
                          )}
                        >
                          <CardHeader className="w-full flex flex-col">
                            <CardTitle className="text-sm tracking-tight">
                              Remove Connection
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Are you sure you want to remove this connection?
                              <br />
                              This action cannot be undone.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Button
                              disabled={isLoading}
                              onClick={() => {
                                setIsDeleteConnectionBoxOpen("closed");
                                setTimeout(() => {
                                  topRef.current?.scrollIntoView({
                                    behavior: "smooth",
                                  });
                                }, 200);
                              }}
                              variant={"ghost"}
                              size={"sm"}
                              className="mt-4 mr-2"
                            >
                              Cancel
                            </Button>
                            <Button
                              ref={animate}
                              onClick={onGoogleDelete}
                              variant={"destructive"}
                              disabled={isLoading}
                              size={"sm"}
                              className="mt-4 mr-2"
                            >
                              {isLoading && (
                                <Loader className="size-2 text-white animate-spin" />
                              )}
                              {!isLoading && "Delete"}
                            </Button>
                          </CardContent>
                        </Card>
                        <div ref={bottomCardsRef} />
                      </>
                    )}
                  </div>
                );
              })}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="text-[13px] h-8 px-0 hover:bg-transparent"
                    variant="ghost"
                    size="sm"
                  >
                    Add connection
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="rounded-xl shadow-lg min-w-[180px] p-0"
                >
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={async () => {
                      await authClient.linkSocial(
                        {
                          provider: "google",
                          callbackURL: AFTER_LOGIN,
                        },
                        {
                          onError: (ctx) => {
                            setError(ctx.error.message);
                          },
                        }
                      );
                    }}
                  >
                    <FcGoogle size={18} />
                    <p className="text-sm text-zinc-600">Google</p>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={async () => {
                      await authClient.linkSocial(
                        {
                          provider: "github",
                          callbackURL: AFTER_LOGIN,
                        },
                        {
                          onError: (ctx) => {
                            setError(ctx.error.message);
                          },
                        }
                      );
                    }}
                  >
                    <FaGithub size={18} />
                    <p className="text-sm text-zinc-600">Github</p>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
