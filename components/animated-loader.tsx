"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { cn } from "@/lib/utils";

export const AnimatedLoader = ({ className }: { className?: string }) => {
  return (
    <DotLottieReact
      src="/loader.lottie"
      loop
      autoplay
      className={cn("aspect-auto w-[400px] h-auto", className)}
    />
  )
};
