"use client";

import { SearchIcon } from "lucide-react";
import { Input } from "../ui/input"
import { useQueryState } from "nuqs";
import { useAutoAnimate } from "@formkit/auto-animate/react";

export const AgentFilters = () => {
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
    </div>
  )
}
