"use client";

import React, { useRef } from "react";

import Blocks from "@/components/ui/blocks";

/**
 * Background Blocks demo from ui-layouts (https://ui-layouts.com/components/blocks).
 */
export default function UILayoutsBackgroundBlocks() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative h-[550px] w-full overflow-hidden bg-white before:absolute before:z-[1] before:h-full before:w-full before:bg-gradient-to-t before:from-[#dbdbdb] before:to-transparent dark:bg-black dark:before:from-[#070707] dark:before:to-transparent"
      ref={containerRef}
    >
      <Blocks
        activeDivsClass="bg-[#9ba1a131] dark:bg-[#131212]"
        divClass="border-[#9ba1a131] dark:border-[#131212]"
        classname="w-full"
        containerRef={containerRef}
        activeDivs={{
          0: new Set([2, 4, 6]),
          1: new Set([0, 8]),
          2: new Set([1, 3, 5]),
          4: new Set([0, 5, 8]),
          5: new Set([2, 4]),
          7: new Set([2, 6, 9]),
          8: new Set([0, 4]),
          9: new Set([5]),
          10: new Set([3, 6]),
          11: new Set([1, 5]),
          12: new Set([7]),
          13: new Set([2, 4]),
          14: new Set([5]),
          15: new Set([1, 6]),
        }}
      />
      <div className="pointer-events-none absolute inset-0 z-[2] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-400">
          Quiro AI · Interview prep
        </p>
        <h2 className="mt-3 max-w-xl text-3xl font-semibold text-neutral-900 dark:text-white md:text-4xl">
          Practice coding daily, run AI mock interviews, and track skill progress.
        </h2>
        <p className="mt-4 max-w-2xl text-pretty text-sm text-neutral-600 dark:text-neutral-300 md:text-base">
          Solve curated problems, simulate real interview pressure with voice AI, and get structured feedback you can
          improve on week over week.
        </p>
      </div>
    </div>
  );
}
