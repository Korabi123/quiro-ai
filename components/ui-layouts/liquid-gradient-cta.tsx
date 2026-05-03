"use client";

import Link from "next/link";
import { useState } from "react";

import { Liquid, type Colors } from "@/components/ui/liquid-gradient";

const brandLiquidColors: Colors = {
  color1: "#0a0a0a",
  color2: "#fb923c",
  color3: "#fdba74",
  color4: "#fff7ed",
  color5: "#ffffff",
  color6: "#ea580c",
  color7: "#c2410c",
  color8: "#ffedd5",
  color9: "#fed7aa",
  color10: "#fdba74",
  color11: "#7c2d12",
  color12: "#fbbf24",
  color13: "#f59e0b",
  color14: "#fde68a",
  color15: "#fb7185",
  color16: "#f43f5e",
  color17: "#fda4af",
};

/**
 * CTA using the Liquid gradient visuals from ui-layouts
 * (https://ui-layouts.com/components/liquid-gradient).
 */
export default function UILayoutsLiquidGradientCta() {
  const [hovered, setHovered] = useState(false);

  return (
    <section className="relative bg-black py-24">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
        <h2 className="text-3xl font-semibold text-white md:text-4xl">Ready when you are</h2>
        <p className="mt-3 max-w-xl text-neutral-400">
          Jump into guided practice, realistic AI interviews, and progress you can measure—starting free.
        </p>

        <Link
          href="/sign-up"
          className="relative mt-10 inline-flex h-14 min-w-[220px] items-center justify-center overflow-hidden rounded-full border border-white/10 bg-neutral-950 px-10 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <span className="pointer-events-none absolute inset-0 opacity-90">
            <Liquid isHovered={hovered} colors={brandLiquidColors} />
          </span>
          <span className="relative z-10">Create your account</span>
        </Link>
      </div>
    </section>
  );
}
