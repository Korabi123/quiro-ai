"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { ChevronsUpDownIcon } from "lucide-react";

/**
 * Reports whether the component has hydrated on the client.
 *
 * Implemented with `useSyncExternalStore` rather than the usual
 * `useEffect(() => setMounted(true), [])` so the value is known during the
 * first client render instead of arriving one render later.
 */
function useIsMounted() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();

  //* The resolved theme lives in localStorage, so the server cannot know it.
  //* Returning nothing until after hydration keeps the markup identical on
  //* both sides.
  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-1 px-2 py-0 text-xs">
          <span className="capitalize">{theme}</span>
          <span className="inline"> theme</span>
          <ChevronsUpDownIcon className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
