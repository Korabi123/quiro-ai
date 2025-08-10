"use client";

import { ReportsFilters } from "@/components/reports/filters";
import { ReportsHeading } from "@/components/reports/heading";
import { ReportsTable } from "@/components/reports/table";

const ReportsPage = () => {
  return (
    <div className="flex flex-col gap-4 md:px-10 px-4 py-4">
      <ReportsHeading />
      <ReportsFilters />
      <ReportsTable />
    </div>
  );
}

export default ReportsPage;
