"use client";

import { useSavedProblems } from "@/lib/saved-problems";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { CircleCheckIcon, Loader, SearchIcon, ChevronDown, ArrowRight, Calendar, Circle, CircleX, ChevronsUpDown } from "lucide-react";
import { useState, useMemo } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useQueryState } from "nuqs";
import { cn, formatProblemTitle } from "@/lib/utils";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useRouter } from "next/navigation";

const DifficultyFilter = () => {
  const [open, setOpen] = useState(false);
  const [difficulty, setDifficulty] = useQueryState("difficulty");

  const difficulties = [
    { label: "All", value: "", icon: Circle },
    { label: "Easy", value: "EASY", icon: Circle },
    { label: "Medium", value: "MEDIUM", icon: Circle },
    { label: "Hard", value: "HARD", icon: Circle }
  ];

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="text-muted-foreground/70 hover:text-muted-foreground transition-all relative"
      >
        {!difficulty ? (
          <>
            Difficulty
            <ChevronsUpDown />
          </>
        ) : (
          <>
            {(() => {
              const DifficultyIcon = difficulties.find((s) => s.value === difficulty)?.icon;
              return DifficultyIcon ? (
                <DifficultyIcon className={cn(
                  "inline",
                  difficulty === "EASY" && "fill-green-500 text-green-500",
                  difficulty === "MEDIUM" && "fill-yellow-500 text-yellow-500",
                  difficulty === "HARD" && "fill-red-500 text-red-500",
                )} />
              ) : null;
            })()}
            {difficulties.find((s) => s.value === difficulty)?.label}
            <ChevronsUpDown />
          </>
        )}
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Filter by difficulty..." />
        <CommandList className="px-0 mx-0">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup className="mx-0 font-normal">
            {difficulties.map((s) => (
              <CommandItem onSelect={() => {
                setDifficulty(s.value || null);
                setOpen(false);
              }} key={s.value}>
                {s.value ? (
                  <Circle className={cn(
                    "-ml-[0.5px] text-muted-foreground/70 size-4 mr-[1px]",
                    s.value === "EASY" && "fill-green-500 text-green-500",
                    s.value === "MEDIUM" && "fill-yellow-500 text-yellow-500",
                    s.value === "HARD" && "fill-red-500 text-red-500",
                  )} />
                ) : (
                  <Circle className="-ml-[0.5px] text-muted-foreground/70 size-4 mr-[1px]" />
                )}
                <span>{s.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

const StatusFilter = () => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useQueryState("status");

  const statuses = [
    { label: "All", value: "", icon: Circle },
    { label: "Solved", value: "solved", icon: CircleCheckIcon },
    { label: "Unsolved", value: "unsolved", icon: Circle }
  ];

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="text-muted-foreground/70 hover:text-muted-foreground transition-all relative"
      >
        {!status ? (
          <>
            Status
            <ChevronsUpDown />
          </>
        ) : (
          <>
            {(() => {
              const StatusIcon = statuses.find((s) => s.value === status)?.icon;
              return StatusIcon ? <StatusIcon className="inline" /> : null;
            })()}
            {statuses.find((s) => s.value === status)?.label}
            <ChevronsUpDown />
          </>
        )}
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Filter by status..." />
        <CommandList className="px-0 mx-0">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup className="mx-0 font-normal">
            {statuses.map((s) => (
              <CommandItem onSelect={() => {
                setStatus(s.value || null);
                setOpen(false);
              }} key={s.value}>
                <s.icon className={cn(
                  "-ml-[0.5px] text-muted-foreground/70 size-4 mr-[1px]",
                  s.value === "solved" && "text-green-500"
                )} />
                <span>{s.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

const ClearFiltersButton = () => {
  const [difficulty, setDifficulty] = useQueryState("difficulty");
  const [status, setStatus] = useQueryState("status");

  if (difficulty || status) {
    return (
      <Button
        variant={"outline"}
        size={"sm"}
        className={cn("text-black shadow-sm")}
        onClick={() => {
          setDifficulty(null);
          setStatus(null);
        }}
      >
        <CircleX className="size-5" />
        Clear
      </Button>
    );
  }
};

export const ProblemFilters = () => {
  const [animate] = useAutoAnimate();
  const [search, setSearch] = useQueryState("search");

  return (
    <div ref={animate} className="flex items-center gap-2">
      <div className="relative">
        <Input
          className="peer ps-9 pe-9"
          placeholder="Search..."
          type="search"
          value={search!}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
        />
        <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
          <SearchIcon size={16} />
        </div>
      </div>
      <DifficultyFilter />
      <StatusFilter />
      <ClearFiltersButton />
    </div>
  )
};

export const SavedProblemsTable = ({ className }: { className?: string }) => {
  const router = useRouter();
  const [search] = useQueryState("search");
  const [difficulty] = useQueryState("difficulty");
  const [status] = useQueryState("status");
  const { data: allProblems, isLoading } = useSavedProblems();
  const [animate] = useAutoAnimate();

  const problems = useMemo(() => {
    if (!allProblems) return [];

    let result = allProblems;

    if (difficulty) {
      result = result.filter(p => p.difficulty === difficulty);
    }

    if (status === "solved") {
      result = result.filter(p => p.solved);
    } else if (status === "unsolved") {
      result = result.filter(p => !p.solved);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(searchLower) ||
          p.slug.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [allProblems, search, difficulty, status]);

  return (
    <div className="flex flex-col gap-3">
      <ProblemFilters />

      <div
        ref={animate}
        className={cn(
          "mt-14 rounded-2xl border border-border/50 bg-muted-foreground/5",
          className
        )}
      >
        {isLoading && (
          <div className="flex items-center justify-center w-full p-5">
            <Loader className="size-5 animate-spin text-muted-foreground/70" />
            <p className="text-sm ml-2 text-muted-foreground/70">
              Loading problems...
            </p>
          </div>
        )}
        {problems?.map((problem: any, index: number) => (
          <>
            <div
              onClick={() => router.push(`/coding-problems/problem/${problem.id}`)}
              key={problem.id + index}
              className="flex cursor-pointer hover:bg-muted-foreground/10 only:rounded-2xl first:rounded-t-2xl last:rounded-b-2xl transition-all items-center justify-between w-full p-5"
            >
              <div className="flex flex-col gap-2">
                <span className="flex items-center gap-2 text-xs">
                  <p className="font-medium text-sm">{formatProblemTitle(problem.title)}</p>
                  {problem.solved && <CircleCheckIcon className="size-4 text-green-500" />}
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground/70">
                  <Calendar className="size-3 text-muted-foreground/60" />
                  <Badge
                    variant={"outline"}
                    className="text-muted-foreground/70 font-normal"
                  >
                    {problem.lastAttempt
                      ? new Date(problem.lastAttempt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Never"
                    }
                  </Badge>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={"outline"}
                  className={cn(
                    problem.difficulty.toUpperCase() === "EASY" &&
                      "bg-green-400/20 border-green-400/50 text-green-400",
                    problem.difficulty.toUpperCase() === "MEDIUM" &&
                      "bg-yellow-400/20 border-yellow-400/50 text-yellow-400",
                    problem.difficulty.toUpperCase() === "HARD" &&
                      "bg-red-400/20 border-red-400/50 text-red-400",
                  )}
                >
                  {problem.difficulty}
                </Badge>
                {problem.attempts > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/coding-problems/${problem.slug}`);
                    }}
                  >
                    <ArrowRight className="size-4" />
                    Solve
                  </Button>
                )}
              </div>
            </div>
            {problem.id !== problems?.at(-1)?.id && (
              <Separator key={problem.id} className="bg-border/60" />
            )}
          </>
        ))}
        {!isLoading && problems?.length === 0 && (
          <div className="flex items-center justify-center w-full p-5">
            <p className="text-sm text-muted-foreground/70">
              {search || difficulty || status ? "No problems match your filters" : "No saved problems yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
