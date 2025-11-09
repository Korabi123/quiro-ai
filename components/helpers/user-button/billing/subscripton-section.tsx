"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { AFTER_LOGIN } from "@/routes";
import { Subscription } from "@better-auth/stripe";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { User } from "@prisma/client";
import { ArrowRight, ArrowUpDown, Check, Loader, Loader2, Settings, X, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Props {
  user: User;
  subscription?: Subscription;
}

export const SubscriptionSection = ({ user }: Props) => {
  const router = useRouter();

  const [animate] = useAutoAnimate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const [loading, setLoading] = useState<"cancel" | "restore" | null>(null);

  const bottomCardsRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const [isUpgradeBoxOpen, setIsUpgradeBoxOpen] = useState(false);
  const [isManageBoxOpen, setIsManageBoxOpen] = useState(false);

  useEffect(() => {
    const getSubscription = async () => {
      const subscription = await authClient.subscription.list();
      setSubscription(subscription.data?.[0] ?? null);
    };
    getSubscription();

    // console.log("subscription: ", subscription);
  }, []);

  return (
    <div suppressHydrationWarning className="flex md:w-[72%] flex-col gap-10">
      <div ref={animate}>
        <div ref={animate} className="flex items-start justify-between">
          {!isUpgradeBoxOpen ? (
            <div
              ref={animate}
              className="flex md:flex-row md:gap-0 gap-6 flex-col items-start w-full justify-between"
            >
              <p ref={topRef} className="text-sm font-medium mt-3">
                Subscription
              </p>

              {!isManageBoxOpen ? (
                <div className="flex flex-col gap-2 md:w-[65%] w-full pr-2">
                  <div className="flex items-center p-2 px-4 bg-amber-50/5 rounded-xl border border-border/50 shadow-sm w-full justify-between">
                    <p className="text-sm font-medium">
                      quiro{" "}
                      <span
                        className={cn(
                          subscription === null
                            ? ""
                            : "text-transparent bg-clip-text bg-gradient-to-r from-[#ffd43e] via-[#ea721b] to-[#2f2722] pr-[1px]"
                        )}
                      >
                        {subscription === null
                          ? "Free"
                          : subscription?.plan?.charAt(0).toUpperCase() +
                            subscription?.plan?.slice(1)}
                      </span>
                    </p>
                    <p className="text-sm inline-flex items-center">
                      {subscription?.status && subscription !== null && (
                        <Badge
                          className={cn(
                            "py-1 px-3 text-xs font-medium rounded-full",
                            subscription?.status === "active" &&
                              !subscription?.cancelAtPeriodEnd &&
                              "bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700",
                            subscription?.status === "canceled" ||
                              (subscription?.cancelAtPeriodEnd &&
                                "bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700"),
                            subscription?.status === "incomplete" &&
                              "bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700",
                            !["active", "canceled", "incomplete"].includes(
                              subscription?.status!
                            ) &&
                              "bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                          )}
                          variant="outline"
                        >
                          {subscription?.status === "canceled" ||
                          subscription?.cancelAtPeriodEnd
                            ? "Canceled"
                            : subscription?.status.charAt(0).toUpperCase() +
                              subscription?.status.slice(1)}
                        </Badge>
                      )}
                      {subscription?.status && subscription !== null && (
                        <Button
                          className="ml-8 group"
                          variant={"ghost"}
                          size="xs"
                          onClick={() => {
                            setIsManageBoxOpen(true);
                            setTimeout(() => {
                              bottomCardsRef.current?.scrollIntoView({
                                behavior: "smooth",
                              });
                            }, 200);
                          }}
                        >
                          <Settings className="size-3 stroke-[1.6] text-muted-foreground group-hover:text-zinc-700 transition" />
                        </Button>
                      )}
                    </p>
                  </div>

                  <Button
                    onClick={() => {
                      setIsUpgradeBoxOpen(true);
                      setTimeout(() => {
                        bottomCardsRef.current?.scrollIntoView({
                          behavior: "smooth",
                        });
                      }, 200);
                    }}
                    className="w-full group"
                    variant="ghost"
                    size="sm"
                  >
                    <ArrowUpDown className="size-5" />
                    <span className="mr-auto w-full flex flex-row items-center text-start">
                      Switch plans
                      <ArrowRight className="size-5 -ml-5 group-hover:flex text-transparent group-hover:ml-3 group-hover:text-zinc-400 transition-all" />
                    </span>
                  </Button>
                </div>
              ) : (
                <Card
                  ref={bottomCardsRef}
                  className="shadow-md md:w-[65%] w-full"
                >
                  <CardHeader className="w-full flex flex-row items-center justify-between">
                    <CardTitle className="text-sm tracking-tight">
                      quiro{" "}
                      <span
                        className={cn(
                          subscription === null
                            ? ""
                            : "text-transparent bg-clip-text bg-gradient-to-r from-[#ffd43e] via-[#ea721b] to-[#2f2722] pr-[1px]"
                        )}
                      >
                        {/* @ts-expect-error Just a simple type error */}
                        {subscription?.plan.charAt(0).toUpperCase() + subscription?.plan?.slice(1)}
                      </span>
                    </CardTitle>
                    <CardDescription className="pb-1">
                      {subscription?.plan === "pro" ? (
                        <>
                          <span className="font-semibold text-zinc-600">
                            3€
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold text-zinc-600">0€</span>
                      )}
                      /month
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm text-muted-foreground pt-4">
                    {subscription?.status && subscription !== null && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          Status
                        </span>
                        <Badge
                          className={cn(
                            "py-1 px-3 text-xs font-medium rounded-full",
                            subscription?.status === "active" &&
                              !subscription?.cancelAtPeriodEnd &&
                              "bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700",
                            subscription?.status === "canceled" ||
                              (subscription?.cancelAtPeriodEnd &&
                                "bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700"),
                            subscription?.status === "incomplete" &&
                              "bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700",
                            !["active", "canceled", "incomplete"].includes(
                              subscription?.status
                            ) &&
                              "bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                          )}
                          variant="outline"
                        >
                          {subscription?.status === "canceled" ||
                          subscription?.cancelAtPeriodEnd
                            ? "Canceled"
                            : subscription?.status.charAt(0).toUpperCase() +
                              subscription?.status.slice(1)}
                        </Badge>
                      </div>
                    )}
                    {subscription?.periodStart && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          Period started on
                        </span>
                        <span>
                          {new Date(
                            subscription.periodStart
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                    {subscription?.periodEnd &&
                      !subscription?.cancelAtPeriodEnd && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">
                            Renews on
                          </span>
                          <span>
                            {new Date(
                              subscription.periodEnd
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    {subscription?.cancelAtPeriodEnd && (
                      <div className="flex items-center justify-between text-yellow-600 dark:text-yellow-400">
                        <span className="font-medium">Cancels on</span>
                        <span>
                          {new Date(subscription.periodEnd!).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "long", day: "numeric" }
                          )}
                        </span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="w-full md:mt-4 mt-2 flex flex-col gap-2">
                    {subscription?.status === "active" &&
                      !subscription.cancelAtPeriodEnd && (
                        <Button
                          disabled={
                            loading === "cancel" || subscription === null
                          }
                          variant="destructive"
                          size="xs"
                          effect={"gooeyRight"}
                          className="text-sm w-full"
                          onClick={async () => {
                            await authClient.subscription.cancel(
                              {
                                subscriptionId: subscription.id,
                                returnUrl: `${AFTER_LOGIN}`,
                              },
                              {
                                onRequest: () => {
                                  setLoading("cancel");
                                },
                                onError: (ctx) => {
                                  toast.error(ctx.error.message);
                                },
                                onSuccess: () => {
                                  setLoading(null);
                                },
                              }
                            );
                          }}
                        >
                          {loading ? (
                            <Loader className="size-4 animate-spin" />
                          ) : (
                            "Cancel Subscription"
                          )}
                        </Button>
                      )}
                    {subscription?.status === "active" &&
                      subscription.cancelAtPeriodEnd &&
                      new Date(subscription.periodEnd!) > new Date() && (
                        <Button
                          disabled={
                            loading === "restore" || subscription === null
                          }
                          variant="default"
                          size="xs"
                          className="text-sm w-full bg-green-400 hover:bg-green-500 hover:ring-2 hover:ring-green-500/50 hover:ring-offset-[1.5px] transition-all"
                          effect={"shineHover"}
                          onClick={async () => {
                            await authClient.subscription.restore(
                              {
                                subscriptionId: subscription.id,
                              },
                              {
                                onRequest: () => {
                                  setLoading("restore");
                                },
                                onError: (ctx) => {
                                  toast.error(ctx.error.message);
                                },
                                onSuccess: () => {
                                  setLoading(null);
                                  router.refresh();
                                  toast.success(
                                    "Successfully restored, great having you back :)"
                                  );
                                },
                              }
                            );
                          }}
                        >
                          {loading === "restore" ? (
                            <Loader className="size-4 animate-spin" />
                          ) : (
                            "Restore Subscription"
                          )}
                        </Button>
                      )}
                    <Button
                      variant={"secondary"}
                      size="xs"
                      className="text-sm w-full"
                      onClick={() => {
                        setIsManageBoxOpen(false);
                        setTimeout(() => {
                          topRef.current?.scrollIntoView({
                            behavior: "smooth",
                          });
                        }, 200);
                      }}
                    >
                      Close
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex flex-col w-full gap-3 justify-evenly md:flex-row items-stretch">
              <Card className="shadow-md w-full flex flex-col">
                <CardHeader className="w-full flex flex-row items-center justify-between">
                  <CardTitle className="text-sm tracking-tight">
                    quiro Free
                  </CardTitle>
                  <CardDescription className="pb-1">
                    <span className="font-semibold text-zinc-600">0€</span>
                    /month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs flex items-center gap-1">
                      <Check className="size-4 stroke-[1.6] text-zinc-400" />5
                      Meetings
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <Check className="size-4 stroke-[1.6] text-zinc-400" />
                      Monthly problems{" "}
                      <Badge variant="outline" className="text-[9px] py-0.5 px-1.5">
                        Coming soon
                      </Badge>
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <Check className="size-4 stroke-[1.6] text-zinc-400" />
                      General tips{" "}
                      <Badge variant="outline" className="text-[9px] py-0.5 px-1.5">
                        Coming soon
                      </Badge>
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <X className="size-4 stroke-[1.6] text-zinc-400" />
                      Call recording
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <X className="size-4 stroke-[1.6] text-zinc-400" />
                      Coding problems
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <X className="size-4 stroke-[1.6] text-zinc-400" />
                      Tailored tips
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <X className="size-4 stroke-[1.6] text-zinc-400" />
                      Daily problems
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="w-full mt-auto items-center flex gap-2">
                  <Button
                    variant={"ghost"}
                    size="xs"
                    className="text-sm"
                    onClick={() => {
                      setIsUpgradeBoxOpen(false);
                      setTimeout(() => {
                        topRef.current?.scrollIntoView({
                          behavior: "smooth",
                        });
                      }, 200);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={subscription === null ? true : false}
                    variant={"default"}
                    size="xs"
                    className="text-sm"
                    onClick={async () => {
                      await authClient.subscription.cancel(
                        {
                          subscriptionId: subscription?.id,
                          returnUrl: `${AFTER_LOGIN}`,
                        },
                        {
                          onError: (ctx) => {
                            toast.error(ctx.error.message);
                          },
                        }
                      );
                    }}
                  >
                    {subscription === null
                      ? "You're on this plan"
                      : "Downgrade"}
                  </Button>
                </CardFooter>
              </Card>
              <Card className="shadow-md w-full flex flex-col">
                <CardHeader className="w-full flex flex-row items-center justify-between">
                  <CardTitle className="text-sm tracking-tight">
                    quiro <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffd43e] via-[#ea721b] to-[#2f2722] pr-[1px]">
                      Pro
                    </span>
                  </CardTitle>
                  <CardDescription className="pb-1">
                    <span className="font-semibold text-zinc-600">10€</span>
                    /month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs flex items-center gap-1">
                      <Check className="size-4 stroke-[1.6] text-zinc-400" />
                      Unlimited agents
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <Check className="size-4 stroke-[1.6] text-zinc-400" />
                      Unlimited call transcripts
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <Check className="size-4 stroke-[1.6] text-zinc-400" />
                      Unlimited chats
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <Check className="size-4 stroke-[1.6] text-zinc-400" />
                      Call recording
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <Check className="size-4 stroke-[1.6] text-zinc-400" />
                      Skill reports
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <Check className="size-4 stroke-[1.6] text-zinc-400" />
                      Coding problems{" "}
                      <Badge variant="outline" className="text-[9px] py-0.5 px-1.5">
                        Coming soon
                      </Badge>
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <Check className="size-4 stroke-[1.6] text-zinc-400" />
                      Tailored tips{" "}
                      <Badge variant="outline" className="text-[9px] py-0.5 px-1.5">
                        Coming soon
                      </Badge>
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <Check className="size-4 stroke-[1.6] text-zinc-400" />
                      Daily problems{" "}
                      <Badge variant="outline" className="text-[9px] py-0.5 px-1.5">
                        Coming soon
                      </Badge>
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <Check className="size-4 stroke-[1.6] text-zinc-400" />
                      24/7 customer support
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <Check className="size-4 stroke-[1.6] text-zinc-400" />
                      Help development of quiro
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="w-full mt-auto items-center flex gap-2">
                  <Button
                    variant={"ghost"}
                    size="xs"
                    className="text-sm"
                    onClick={() => {
                      setIsUpgradeBoxOpen(false);
                      setTimeout(() => {
                        topRef.current?.scrollIntoView({
                          behavior: "smooth",
                        });
                      }, 200);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={subscription === null ? false : true}
                    variant={"default"}
                    size="xs"
                    effect={subscription === null ? "shine" : null}
                    className="text-sm"
                    onClick={async () => {
                      await authClient.subscription.upgrade(
                        {
                          plan: "pro",
                          successUrl: `${AFTER_LOGIN}?upgraded=true`,
                          cancelUrl: `${AFTER_LOGIN}`,
                        },
                        {
                          onError: (ctx) => {
                            toast.error(ctx.error.message);
                          },
                        }
                      );
                    }}
                  >
                    {subscription === null ? "Upgrade" : "You're on this plan"}
                  </Button>
                </CardFooter>
              </Card>
              <div ref={bottomCardsRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
