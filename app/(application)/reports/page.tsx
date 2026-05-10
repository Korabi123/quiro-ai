"use client";

import { ReportsFilters } from "@/components/reports/filters";
import { ReportsHeading } from "@/components/reports/heading";
import { ReportsTable } from "@/components/reports/table";
import { useSubscription } from "@/lib/subscription";
import { Suspense } from "react";

const ReportsPage = () => {
  const { data: subscription, isLoading } = useSubscription();

  if (isLoading) return null;

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
