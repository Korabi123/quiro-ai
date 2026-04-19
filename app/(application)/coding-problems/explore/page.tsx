"use client";

import { useColumns } from '@/components/coding-problems/explore-table/columns';
import { DataTable } from '@/components/coding-problems/explore-table/data-table';
import { CodingProblemHeading } from '@/components/coding-problems/heading';
import { useProblems } from '@/lib/problems';
import { Suspense } from 'react';

const CodingProblemExplorePage = () => {
  const { data, isLoading } = useProblems();
  const columns = useColumns();
  
  return (
    <Suspense>
      <div className="flex flex-col gap-4 md:px-10 px-4 py-4">
        <CodingProblemHeading secondary breadcrumb={"Explore Coding Problems"} />
        <DataTable columns={columns} data={data || []} isLoading={isLoading} />
      </div>
    </Suspense>
  );
};

export default CodingProblemExplorePage;