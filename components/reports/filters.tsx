"use client";

import {
  ArrowRightIcon,
  ChevronsUpDown,
  CircleCheck,
  CircleX,
  ClockArrowUpIcon,
  Loader,
  SearchIcon,
  Video,
  XIcon,
  MessageSquare,
  Settings,
  Users,
  PenTool,
  ListFilter
} from "lucide-react";
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";
import { useAutoAnimate } from "@formkit/auto-animate/react";

const ClearFilterButton = () => {
  const [search, setSearch] = useQueryState("search");
  const [type, setType] = useQueryState("type");

  if (search || type) {
    return (
      <Button
        variant={"outline"}
        size={"sm"}
        className={cn("text-black shadow-sm")}
        onClick={() => {
          setSearch(null);
          setType(null);
        }}
      >
        <CircleX className="size-5" />
        Clear
      </Button>
    );
  }
};

export const ReportsFilters = () => {
  const [animate] = useAutoAnimate();
  const [search, setSearch] = useQueryState("search");
  const [type, setType] = useQueryState("type");
  const [open, setOpen] = useState(false);

  const types = [
    { label: "All skillsets", value: "ALL", icon: ListFilter },
    { label: "Communication", value: "COMMUNICATION", icon: MessageSquare },
    { label: "Technical", value: "TECHNICAL", icon: Settings },
    { label: "Leadership", value: "LEADERSHIP", icon: Users },
    { label: "Custom", value: "CUSTOM", icon: PenTool },
  ];

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
      <>
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          size="sm"
          className="text-muted-foreground/70 hover:text-muted-foreground transition-all relative"
        >
          {!type ? (
            <>
              Filter by Type
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </>
          ) : (
            <>
              {(() => {
                const TypeIcon = types.find((t) => t.value === type)?.icon;
                return TypeIcon ? <TypeIcon className="inline mr-2" /> : null;
              })()}
              {types.find((t) => t.value === type)?.label}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </>
          )}
        </Button>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Search type..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {types.map((t) => (
                <CommandItem
                  key={t.value}
                  onSelect={() => {
                    setType(t.value);
                    setOpen(false);
                  }}
                >
                  <t.icon className="mr-2 h-4 w-4 text-muted-foreground/70" />
                  {t.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </>
      <ClearFilterButton />
    </div>
  )
}
