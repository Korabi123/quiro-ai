"use client";

import { AgentFilters } from "@/components/agents/filters";
import { AgentHeading } from "@/components/agents/heading";
import { AgentsTable } from "@/components/agents/table";

const AgentsPage = () => {
  return (
    <div className="flex flex-col gap-4 md:px-10 px-4 py-4">
      <AgentHeading />
      <AgentFilters />
      <AgentsTable />
    </div>
  );
}

export default AgentsPage;
