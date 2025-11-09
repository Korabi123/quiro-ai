"use client";

import { AgentFilters } from "@/components/agents/filters";
import { AgentHeading } from "@/components/agents/heading";
import { AgentsTable } from "@/components/agents/table";
import { Suspense } from "react";

const AgentsPage = () => {
  return (
    <Suspense>
      <div className="flex flex-col gap-4 md:px-10 px-4 py-4">
        <AgentHeading />
        <AgentFilters />
        <AgentsTable />
      </div>
    </Suspense>
  );
}

export default AgentsPage;
