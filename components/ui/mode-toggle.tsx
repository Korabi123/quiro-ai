"use client";

import { ChevronsUpDownIcon } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();

  //* The resolved theme lives in localStorage, so the server has no idea what it
  //* is. Rendering nothing until after hydration is what keeps the markup
  //* identical between the two.
  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-1 px-2 py-0 text-xs">
          <span className="capitalize">{theme}</span>
          <span className="inline"> theme</span>
          <ChevronsUpDownIcon className="size-3" />
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

/**
 * Reports whether the component has hydrated on the client.
 *
 * Implemented with `useSyncExternalStore` rather than the usual
 * `useEffect(() => setMounted(true), [])` so the value is known during the first
 * client render instead of arriving one render later.
 */
export function useIsMounted() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}