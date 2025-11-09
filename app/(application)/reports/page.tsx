"use client";

import { ReportsFilters } from "@/components/reports/filters";
import { ReportsHeading } from "@/components/reports/heading";
import { ReportsTable } from "@/components/reports/table";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { Subscription } from "@better-auth/stripe";
import { Suspense, useEffect, useState, useTransition } from "react";

const ReportsPage = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const getSubscription = async () => {
      startTransition(async () => {
        await authClient.subscription.list()
          .then((res) => setSubscription(res?.data?.[0] ?? null));
      });
    }
    getSubscription();
  }, []);

  if (isPending) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center w-full p-5">
        <Skeleton className="w-full h-12" />
        <Skeleton className="w-full h-12" />
        <Skeleton className="w-full h-6" />
        <Skeleton className="w-full h-6" />
      </div>
    )
  }

  if (subscription?.plan !== "pro") {
    return null;
  }

  return (
    <Suspense>
      <div className="flex flex-col gap-4 md:px-10 px-4 py-4">
        <ReportsHeading />
        <ReportsFilters />
        <ReportsTable />
      </div>
    </Suspense>
  );
}

export default ReportsPage;
