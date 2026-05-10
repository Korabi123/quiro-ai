"use client";

import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { ArrowRight, Ellipsis, Loader } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UAParser } from "ua-parser-js";
import { toast } from "sonner";
import { ErrorCard } from "@/components/auth/error-card";

const renamePasskeySchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Name is required",
    })
    .max(25, {
      message: "Name must be less than 25 characters",
    }),
});

export const PasskeySection = () => {
  const [animate] = useAutoAnimate();
  const [isRenamePasskeyBoxOpen, setIsRenamePasskeyBoxOpen] = useState<string | boolean>(false);
  const [isDeletePasskeyBoxOpen, setIsDeletePasskeyBoxOpen] = useState<string | boolean>(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const passkeys = authClient.useListPasskeys();

  const bottomCardsRef = useRef<HTMLDivElement>(null);

  const renamePasskeyForm = useForm<z.infer<typeof renamePasskeySchema>>({
    resolver: zodResolver(renamePasskeySchema),
    defaultValues: {
      name: "",
    },
  });

  const parsedAgent = UAParser(window.navigator.userAgent?.toString());

  const onRenamePasskeySubmit = async (
    data: z.infer<typeof renamePasskeySchema>,
    id: string
  ) => {
    if (data.name.length < 2) {
      setError("Name is required");
    }

    await authClient.passkey.updatePasskey(
      {
        id,
        name: data.name,
      },
      {
        onRequest: () => {
          setIsLoading(true);
        },
        onSuccess: () => {
          setIsLoading(false);
          setIsRenamePasskeyBoxOpen(false);
          window.location.reload();
          setTimeout(() => {
            toast.success("Successfully renamed");
          }, 1000);
        },
        onError: (ctx) => {
          setError(ctx.error.message);
          setIsLoading(false);
        },
      }
    );
  };

  const onAddPasskey = async () => {
    await authClient.passkey.addPasskey({
      name: `${parsedAgent.os.name}, ${parsedAgent.browser.name}`,
    }, {
      onError: (ctx) => {
        setError(ctx.error.message);
      }
    });
  };

  return (
    <div className="flex w-full flex-col gap-3 border-b border-zinc-200 dark:border-zinc-800 py-6">
      <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">Passkeys</p>
      <div
        ref={animate}
        className="w-full"
      >
        <div
          ref={animate}
          className="flex flex-col gap-6 items-start w-full"
        >
          {isLoading ? (
            <div>Loading</div>
          ) : (
            <>
              {passkeys.data && (
                <>
                  {passkeys.data.map((passkey, index) => {
                    let formattedDate;

                    const now = new Date();
                    const createdAt = new Date(passkey.createdAt);

                    const diffInMs = now.getTime() - createdAt.getTime();
                    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

                    const hours = createdAt.getHours();
                    const minutes = createdAt.getMinutes();
                    const amPm = hours >= 12 ? "PM" : "AM";
                    const formattedHours = hours % 12 || 12;
                    const formattedMinutes = minutes
                      .toString()
                      .padStart(2, "0");

                    if (diffInDays < 1) {
                      formattedDate = `Today at ${formattedHours}:${formattedMinutes}${amPm}`;
                    } else if (diffInDays < 2) {
                      formattedDate = `Yesterday at ${formattedHours}:${formattedMinutes}${amPm}`;
                    } else {
                      const day = createdAt.getDate();
                      const month = createdAt.toLocaleString("default", {
                        month: "short",
                      });
                      formattedDate = `${day} ${month} at ${formattedHours}:${formattedMinutes}${amPm}`;
                    }

                    return (
                      <>
                        <div className={cn(!error ? "hidden" : "flex")} ref={animate}>
                          {error && (
                            <ErrorCard error={error} />
                          )}
                        </div>
                        <div
                          key={passkey.id}
                          className="flex -mt-[1px] items-center justify-between self-start gap-4 w-full"
                        >
                          <div className="flex flex-col gap-2">
                            <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                              {passkey.name}
                            </p>
                            <p className="text-[13px] text-zinc-500">
                              Created: {formattedDate}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant={"ghost"}
                                size="icon"
                                className="group self-start -mt-2"
                              >
                                <Ellipsis className="h-4 w-4 text-zinc-400 group-hover:text-zinc-800 transition" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="center"
                              className="rounded-xl shadow-lg p-0 min-w-fit"
                            >
                              <DropdownMenuItem
                                className="cursor-pointer px-3 py-1 text-zinc-600 focus:text-zinc-800 transition-all"
                                onClick={() => {
                                  setIsRenamePasskeyBoxOpen(passkey.id);
                                  setTimeout(() => {
                                    bottomCardsRef.current?.scrollIntoView({
                                      behavior: "smooth",
                                    });
                                  }, 200);
                                }}
                              >
                                <p className="text-[13px]">Rename</p>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer px-3 py-1 text-zinc-600 focus:text-zinc-800 transition-all"
                                onClick={() => {
                                  setIsDeletePasskeyBoxOpen(passkey.id);
                                  setTimeout(() => {
                                    bottomCardsRef.current?.scrollIntoView({
                                      behavior: "smooth",
                                    });
                                  }, 200);
                                }}
                              >
                                <p className="text-[13px] text-destructive">Remove</p>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {isRenamePasskeyBoxOpen !== false && (
                          <>
                            <Card
                              className={cn(
                                "shadow-md w-full md:max-w-[350px]",
                                isRenamePasskeyBoxOpen !== passkey.id &&
                                  "hidden"
                              )}
                            >
                              <CardHeader className="w-full flex flex-col">
                                <CardTitle className="text-sm tracking-tight">
                                  Rename Passkey
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  You can change the passkey name to make it
                                  easier to find.
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <Form {...renamePasskeyForm}>
                                  <form className="space-y-6 flex flex-col">
                                    <FormField
                                      control={renamePasskeyForm.control}
                                      name="name"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input
                                              {...field}
                                              placeholder="Name"
                                              autoCorrect="off"
                                              autoComplete="off"
                                              disabled={isLoading}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <div className="flex items-center">
                                      <Button
                                        size={"sm"}
                                        variant={"ghost"}
                                        type="button"
                                        disabled={isLoading}
                                        className="mt-4 mr-2 text-xs"
                                        onClick={() => {
                                          setIsRenamePasskeyBoxOpen(false);
                                          setError("");
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size={"sm"}
                                        type="button"
                                        disabled={isLoading}
                                        className="mt-4"
                                        onClick={() => {
                                          onRenamePasskeySubmit(
                                            renamePasskeyForm.getValues(),
                                            passkey.id
                                          );
                                        }}
                                      >
                                        {isLoading && (
                                          <Loader className="mr-1 size-2 text-muted-foreground animate-spin" />
                                        )}
                                        Save
                                      </Button>
                                    </div>
                                  </form>
                                </Form>
                              </CardContent>
                            </Card>
                            <div ref={bottomCardsRef} />
                          </>
                        )}
                        {isDeletePasskeyBoxOpen !== false && (
                          <>
                            <Card
                              className={cn(
                                "shadow-md w-full bg-muted-foreground/5 border-zinc-600/15 md:max-w-[350px]",
                                isDeletePasskeyBoxOpen !== passkey.id &&
                                  "hidden"
                              )}
                            >
                              <CardHeader className="w-full flex flex-col">
                                <CardTitle className="text-sm tracking-tight">
                                  Delete Passkey
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  Are you sure you want to delete this passkey?
                                  <br />
                                  This action cannot be undone.
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <Button
                                  disabled={isLoading}
                                  onClick={() =>
                                    setIsDeletePasskeyBoxOpen(false)
                                  }
                                  variant={"ghost"}
                                  size={"sm"}
                                  className="mt-4 mr-2"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  ref={animate}
                                  onClick={() => {
                                    authClient.passkey.deletePasskey(
                                      {
                                        id: passkey.id,
                                      },
                                      {
                                        onRequest: () => {
                                          setIsLoading(true);
                                        },
                                        onSuccess: () => {
                                          setIsLoading(false);
                                          setIsDeletePasskeyBoxOpen(false);
                                          window.location.reload();
                                          setTimeout(() => {
                                            toast.success(
                                              "Successfully deleted"
                                            );
                                          }, 1000);
                                        },
                                        onError: (ctx) => {
                                          setError(ctx.error.message);
                                          setIsLoading(false);
                                        },
                                      }
                                    );
                                  }}
                                  variant={"destructive"}
                                  disabled={isLoading}
                                  size={"sm"}
                                  className="mt-4 mr-2 shadow-inner"
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
                      </>
                    );
                  })}
                </>
              )}
            </>
          )}
          <Button
            onClick={onAddPasskey}
            className="text-[13px] h-8 px-0 hover:bg-transparent"
            variant="ghost"
            size="sm"
          >
            Add a passkey
          </Button>
        </div>
      </div>
    </div>
  );
}
