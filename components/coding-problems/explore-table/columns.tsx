"use client";

import { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

export type Problem = {
  id: string,
  title: string,
  difficulty: "Easy" | "Medium" | "Hard",
  isDaily?: boolean
}

export const columns: ColumnDef<Problem>[] = [
  {
    accessorKey: "id",
    header: "Problem",
    cell: ({ row }) => {
      const problem = row.original;
      const isDaily = problem.isDaily;
      return (
        <div className="flex items-center gap-3">
          {isDaily ? (
            <>
              <Calendar className="size-4 text-orange-500" />
              <span className="font-medium text-orange-500">{problem.title}</span>
            </>
          ) : (
            <>
              <span className="text-muted-foreground/70 text-sm">{problem.id}</span>
              <span className="font-medium">{problem.title}</span>
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
            difficulty === "Easy" && "bg-green-400/20 border-green-400/50 text-green-500",
            difficulty === "Medium" && "bg-yellow-400/20 border-yellow-400/50 text-yellow-500",
            difficulty === "Hard" && "bg-red-400/20 border-red-400/50 text-red-500"
          )}
        >
          {difficulty}
        </Badge>
      );
    }
  },
]
