"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { Subscription } from "@better-auth/stripe";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { User } from "@prisma/client";
import { ArrowRight, ArrowUpDown, Check, Settings, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  user: User;
  subscription?: Subscription;
}

export const SubscriptionSection = ({ user }: Props) => {
  const [animate] = useAutoAnimate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const bottomCardsRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const [isUpgradeBoxOpen, setIsUpgradeBoxOpen] = useState(false);

  useEffect(() => {
    const getSubscription = async () => {
      const subscription = await authClient.subscription.list();
      setSubscription(subscription.data?.[0] ?? null);
    };
    getSubscription();

    console.log("subscription: ", subscription);
  }, []);

  return (
    <div className="flex md:w-[72%] flex-col gap-10">
      <div ref={animate}>
        <div ref={animate} className="flex items-start justify-between">
          {!isUpgradeBoxOpen ? (
            <>
              <p ref={topRef} className="text-sm font-medium mt-2">Subscription</p>
              <div className="flex flex-col gap-2 w-[65%]">
                <div className="flex items-center p-2 px-4 bg-amber-50/5 rounded-xl border border-border/50 shadow-sm w-full justify-between">
                  <p className="text-sm">
                    {subscription === null ? "Free" : subscription?.plan}
                  </p>
                  <p className="text-sm inline-flex items-center">
                    {subscription === null ? null : subscription?.priceId}
                    <Button className="ml-8 group" variant={"ghost"} size="xs">
                      <Settings className="size-3 stroke-[1.6] text-muted-foreground group-hover:text-zinc-700 transition" />
                    </Button>
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
            </>
          ) : (
            <div className="flex flex-col w-full gap-3 justify-evenly md:flex-row">
              <Card className="shadow-md w-full">
                <CardHeader className="w-full flex flex-row items-center justify-between">
                  <CardTitle className="text-sm tracking-tight">
                    quiro Free
                  </CardTitle>
                  <CardDescription className="pb-1">
                    <span className="font-semibold text-zinc-600">0€</span>/month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs flex items-center gap-1">
                      <Check className="size-4 stroke-[1.6] text-zinc-400" />
                      3 Agents
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <Check className="size-4 stroke-[1.6] text-zinc-400" />
                      Call transcript for one agent
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <Check className="size-4 stroke-[1.6] text-zinc-400" />
                      10 Chats per day
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <Check className="size-4 stroke-[1.6] text-zinc-400" />
                      Monthly problems
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <Check className="size-4 stroke-[1.6] text-zinc-400" />
                      General tips
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="w-full md:mt-[43%] mt-0 items-center flex gap-2">
                  <Button variant={"ghost"} size="xs" className="text-sm" onClick={() => {
                    setIsUpgradeBoxOpen(false);
                    setTimeout(() => {
                      topRef.current?.scrollIntoView({
                        behavior: "smooth",
                      });
                    }, 200);
                  }}>
                    Cancel
                  </Button>
                  <Button disabled variant={"default"} size="xs" className="text-sm" onClick={() => {
                    setIsUpgradeBoxOpen(false);
                    setTimeout(() => {
                      topRef.current?.scrollIntoView({
                        behavior: "smooth",
                      });
                    }, 200);
                  }}>
                    You're on this plan
                  </Button>
                </CardFooter>
              </Card>
              <Card className="shadow-md w-full">
                <CardHeader className="w-full flex flex-row items-center justify-between">
                  <CardTitle className="text-sm tracking-tight">
                    quiro Pro
                  </CardTitle>
                  <CardDescription className="pb-1">
                    <span className="font-semibold text-zinc-600">3€</span>/month
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
                      Skill evaluation
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <Check className="size-4 stroke-[1.6] text-zinc-400" />
                      Tailored tips to improve your hireability
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <Check className="size-4 stroke-[1.6] text-zinc-400" />
                      Daily problems
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
                <CardFooter className="w-full items-center flex gap-2">
                  <Button variant={"ghost"} size="xs" className="text-sm" onClick={() => {
                    setIsUpgradeBoxOpen(false);
                    setTimeout(() => {
                      topRef.current?.scrollIntoView({
                        behavior: "smooth",
                      });
                    }, 200);
                  }}>
                    Cancel
                  </Button>
                  <Button variant={"default"} size="xs" effect={"shine"} className="text-sm" onClick={() => {
                    setIsUpgradeBoxOpen(false);
                    setTimeout(() => {
                      topRef.current?.scrollIntoView({
                        behavior: "smooth",
                      });
                    }, 200);
                  }}>
                    Upgrade
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
