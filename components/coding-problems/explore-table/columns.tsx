"use client";

import { ColumnDef } from "@tanstack/react-table";
import { cn, formatProblemTitle } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, Circle } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export type Problem = {
  id: string,
  title: string,
  slug: string,
  difficulty: "Easy" | "Medium" | "Hard",
  isDaily?: boolean
}

const useProgress = () => {
  const { data } = useSWR<{ solved: string[]; attempted: string[] }>("/api/progress", fetcher);
  return data;
};

export const useColumns = (): ColumnDef<Problem>[] => {
  const progress = useProgress();

  return [
    {
      accessorKey: "id",
      header: "Problem",
      cell: ({ row }) => {
        const problem = row.original;
        const isDaily = problem.isDaily;
        const slug = problem.slug;
        const isSolved = progress?.solved?.includes(slug);
        const isAttempted = progress?.attempted?.includes(slug);

        return (
          <div className="flex items-center gap-3">
            {isSolved ? (
              <CheckCircle className="size-4 text-green-500" />
            ) : isAttempted ? (
              <Circle className="size-4 text-yellow-500" />
            ) : null}
            {isDaily ? (
              <>
                <Calendar className="size-4 text-orange-500" />
                <span className="font-medium text-orange-500">{formatProblemTitle(problem.title)}</span>
              </>
            ) : (
              <>
                <span className="text-muted-foreground/70 text-sm">{problem.id}</span>
                <span className="font-medium">{formatProblemTitle(problem.title)}</span>
              </>
            )}
          </div>
        );
      }
    },
    {
      id: "title",
      accessorKey: "title",
    },
    {
      accessorKey: "difficulty",
      header: "Difficulty",
      cell: ({ row }) => {
        const difficulty = row.getValue("difficulty") as string;
        return (
          <Badge
            variant={"outline"}
            className={cn(
              "font-medium",
              difficulty.toUpperCase() === "EASY" && "bg-green-400/20 border-green-400/50 text-green-500",
              difficulty.toUpperCase() === "MEDIUM" && "bg-yellow-400/20 border-yellow-400/50 text-yellow-500",
              difficulty.toUpperCase() === "HARD" && "bg-red-400/20 border-red-400/50 text-red-500"
            )}
          >
            {difficulty}
          </Badge>
        );
      }
    },
  ];
};
