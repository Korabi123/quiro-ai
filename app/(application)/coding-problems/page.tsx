"use client";

import { CodingProblemHeading } from "@/components/coding-problems/heading";
import { SavedProblemsTable } from "@/components/coding-problems/saved-table";
import { Suspense } from "react";

const CodingProblemsPage = () => {
  return (
    <Suspense>
      <div className="flex flex-col gap-4 md:px-10 px-4 py-4">
        <CodingProblemHeading />
        <SavedProblemsTable />
      </div>
    </Suspense>
  );
};

export default CodingProblemsPage;
