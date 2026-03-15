"use client";

import { columns, Problem } from '@/components/coding-problems/explore-table/columns';
import { DataTable } from '@/components/coding-problems/explore-table/data-table';
import { CodingProblemHeading } from '@/components/coding-problems/heading';
import type { FC } from 'react';

import { useEffect, useState } from "react";

import { Suspense } from 'react';

const CodingProblemExplorePage: FC = () => {
  const [data, setData] = useState<Problem[]>([]);
  
  useEffect(() => {
    const fetchProblems = async () => {
      const response = await fetch("https://leetcode-api-pied.vercel.app/problems");
      const problems = await response.json();
      
      const res = await fetch("https://leetcode-api-pied.vercel.app/daily")
      const dailyProblem = await res.json();
      
      const dailyData: Problem[] = dailyProblem.question ? [{
        id: dailyProblem.question.questionFrontendId,
        title: dailyProblem.question.title,
        difficulty: dailyProblem.question.difficulty as "Easy" | "Medium" | "Hard",
        isDaily: true
      }] : [];
      
      const formattedData: Problem[] = problems.map((problem: { id: string; title: string; difficulty: string }) => ({
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1).toLowerCase() as "Easy" | "Medium" | "Hard"
      }));
      
      setData([...dailyData, ...formattedData]);
    };
    fetchProblems();
  }, []);
  
  return (
    <Suspense>
      <div className="flex flex-col gap-4 md:px-10 px-4 py-4">
        <CodingProblemHeading secondary breadcrumb={"Explore Coding Problems"} />
        <DataTable columns={columns} data={data} />
      </div>
    </Suspense>
  );
};

export default CodingProblemExplorePage;
