"use client";

/**
 * Motion-based sparkle field matching the props shape used by ui-layouts'
 * sparkles-title block (https://ui-layouts.com/components/sparkles-title).
 * Avoids @tsparticles for a lighter bundle.
 */

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useMemo } from "react";

export interface SparklesProps {
  className?: string;
  size?: number;
  minSize?: number | null;
  density?: number;
  speed?: number;
  minSpeed?: number | null;
  opacity?: number;
  direction?: string;
  opacitySpeed?: number;
  minOpacity?: number | null;
  color?: string;
  mousemove?: boolean;
  hover?: boolean;
  background?: string;
  options?: Record<string, unknown>;
}

export function Sparkles({
  className,
  density = 800,
  size = 1.2,
  direction = "",
  color = "#ffffff",
}: SparklesProps) {
  const count = Math.min(240, Math.max(48, Math.floor(density / 2)));

  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 3 + Math.random() * 5,
        scale: (size / 1.2) * (0.55 + Math.random() * 0.95),
      })),
    [count, size]
  );

  const yAxis =
    direction === "top" ? -36 : direction === "bottom" ? 36 : direction === "left" ? 0 : direction === "right" ? 0 : -22;

  const xAxis = direction === "left" ? -26 : direction === "right" ? 26 : 0;

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full will-change-transform"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.scale,
            height: d.scale,
            backgroundColor: color,
            boxShadow: `0 0 ${Math.max(2, d.scale * 6)}px ${color}`,
          }}
          animate={{
            opacity: [0.12, 0.95, 0.12],
            y: [0, yAxis],
            x: [0, xAxis + Math.sin(d.id * 0.37) * 8],
          }}
          transition={{
            duration: d.duration,
            repeat: Number.POSITIVE_INFINITY,
            delay: d.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
