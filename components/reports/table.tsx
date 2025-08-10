"use client";

import { useReports } from "@/lib/reports";
import {
  CircleCheck,
  ClockArrowUpIcon,
  CornerDownRight,
  Loader,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";

interface Props {
  className?: string;
  agentId?: string;
  variant?: "default" | "outline";
}

export const ReportsTable = ({ className, variant = "default" }: Props) => {
  const router = useRouter();

  const [search, setSearch] = useQueryState("search");
  const { data: reports, isLoading } = useReports({ search });
  const [animate] = useAutoAnimate();

  return (
    <div
      ref={animate}
      className={cn(
        variant === "default"
          ? "mt-14 rounded-2xl border border-border/50 bg-muted-foreground/5"
          : "border border-border/80 bg-white rounded-2xl",
        className
      )}
    >
      {isLoading && (
        <div className="flex items-center justify-center w-full p-5">
          <Loader className="size-5 animate-spin text-muted-foreground/70" />
          <p className="text-sm ml-2 text-muted-foreground/70">
            Loading reports...
          </p>
        </div>
      )}
      {reports?.map((report) => (
        <>
          <div
            onClick={() => router.push(`/reports/${report.id}`)}
            key={report.id}
            className="flex cursor-pointer hover:bg-muted-foreground/10 only:rounded-2xl first:rounded-t-2xl last:rounded-b-2xl transition-all items-center justify-between w-full p-5"
          >
            <div className="flex flex-col gap-2">
              <p className="font-medium text-sm">
                {report.name}{" "}
                <span className="ml-2 border bg-yellow-100 text-yellow-800 border-yellow-300 rounded-xl py-1 px-3 text-xs">
                  {report.type === "ALL"
                    ? "All skillsets"
                    : report.type.slice(0, 1).toUpperCase() +
                      report.type.slice(1).toLocaleLowerCase()}
                </span>
              </p>
              <span className="flex items-center gap-2 text-xs text-muted-foreground/70">
                <CornerDownRight className="size-3 text-muted-foreground/60" />
                {report.field}
                <Badge
                  variant={"outline"}
                  className="text-muted-foreground/70 font-normal"
                >
                  {(() => {
                    const date = new Date(report.createdAt);
                    const now = new Date();
                    const isThisYear = date.getFullYear() === now.getFullYear();

                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      ...(isThisYear ? {} : { year: "numeric" }),
                    });
                  })()}
                </Badge>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant={"outline"}
                className={cn("p-2 min-w-[120px] flex justify-center", !report.score ? "bg-yellow-400/20 border-yellow-400/50 text-yellow-400" : "bg-green-400/20 border-green-400/50 text-green-400")}
              >
                {!report.score ? (
                  <>
                    <ClockArrowUpIcon className="size-4 mr-2" />
                    Upcoming
                  </>
                ) : (
                  <>
                    <CircleCheck className="size-4 mr-2" />
                    Completed
                  </>
                )}
              </Badge>
              {report.summary && (
                <Badge variant={"outline"} className={cn("p-2")}>
                  {report.score}
                </Badge>
              )}
            </div>
          </div>
          {report.id !== reports?.at(-1)?.id && (
            <Separator key={report.id} className="bg-border/60" />
          )}
        </>
      ))}
      {reports?.length === 0 && (
        <div className="flex items-center justify-center w-full p-5">
          <p className="text-sm text-muted-foreground/70">No reports found</p>
        </div>
      )}
    </div>
  );
};
