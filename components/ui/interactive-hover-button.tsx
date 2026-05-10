import * as React from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type InteractiveHoverButtonProps = React.ComponentPropsWithoutRef<"button">;

export function InteractiveHoverButton({
  children,
  className,
  ...props
}: InteractiveHoverButtonProps) {
  return (
    <button
      data-slot="interactive-hover-button"
      className={cn(
        "group relative w-auto cursor-pointer overflow-hidden rounded-full border bg-background p-2 px-6 text-center font-semibold",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        <span
          data-slot="interactive-hover-button-mosaic"
          aria-hidden
          className={cn(
            "relative grid h-3 w-3 shrink-0 grid-cols-3 grid-rows-3 gap-[1px] rounded-full",
            "transition-[transform,filter,opacity] duration-500 ease-out",
            "opacity-90",
            "group-hover:scale-[46] group-hover:blur-[2px] group-hover:opacity-100"
          )}
        >
          {Array.from({ length: 9 }).map((_, idx) => (
            <span
              key={idx}
              data-slot="interactive-hover-button-mosaic-cell"
              className={cn(
                "h-full w-full rounded-[2px] bg-primary/60",
                idx % 2 === 0 ? "opacity-90" : "opacity-70"
              )}
            />
          ))}
        </span>
        <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {children}
        </span>
      </div>
      <div
        data-slot="interactive-hover-button-overlay"
        className="absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 text-primary-foreground opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100"
      >
        <span>{children}</span>
        <ArrowRight className="h-4 w-4" aria-hidden />
      </div>
    </button>
  );
}
