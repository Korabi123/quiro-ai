"use client";

import { MeetingFilters } from "@/components/meetings/filters";
import { MeetingHeading } from "@/components/meetings/heading";
import { MeetingsTable } from "@/components/meetings/meetings-table";
import { Suspense } from "react";

const MeetingsPage = () => {
  return (
    <Suspense>
      <div className="flex flex-col gap-4 md:px-10 px-4 py-4">
        <MeetingHeading />
        <MeetingFilters />
        <MeetingsTable />
      </div>
    </Suspense>
  );
}

export default MeetingsPage;
