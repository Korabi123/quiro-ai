"use client";

import React, { Suspense, useRef } from "react";
import Link from "next/link";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import { ArrowUp, Github, Linkedin, Mail, Twitter } from "lucide-react";

import { CosmicButton } from "@/components/ui/cosmic-button";

const QUIRO_MESH = {
  // Blend multiple brand-adjacent tones (warm + a cooler accent) to avoid the "all yellow" look
  color1: "#FDE68A", // warm highlight
  color2: "#FB923C", // brand orange
  color3: "#1F469A", // cool accent for contrast
} as const;

export const HeroFooter = () => {
  const ctaRef = useRef<HTMLDivElement>(null);

  return (
    <section className="bg-black pt-40">
      <div className="mx-auto w-[80%] px-6">
        {/* Floating Call to Action */}
        <div className="relative z-10 -mb-24">
          <div
            ref={ctaRef}
            className="relative h-96 overflow-hidden rounded-2xl bg-neutral-950 shadow-2xl"
          >
            {/* Mesh background (replaces image) — inspired by UI-Layouts AI Infrastructure hero */}
            <Suspense fallback={null}>
              <ShaderGradientCanvas
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                }}
                lazyLoad={false}
                pixelDensity={1}
                pointerEvents="none"
              >
                <ShaderGradient
                  animate="on"
                  type="sphere"
                  wireframe={false}
                  shader="defaults"
                  uTime={0}
                  uSpeed={0.3}
                  uStrength={0.55}
                  uDensity={0.8}
                  uFrequency={5.5}
                  uAmplitude={7}
                  positionX={0}
                  positionY={0}
                  positionZ={0}
                  rotationX={0}
                  rotationY={0}
                  rotationZ={140}
                  color1={QUIRO_MESH.color1}
                  color2={QUIRO_MESH.color2}
                  color3={QUIRO_MESH.color3}
                  reflection={0.5}
                  cAzimuthAngle={250}
                  cPolarAngle={140}
                  cDistance={1.5}
                  cameraZoom={12.5}
                  lightType="3d"
                  brightness={1.6}
                  envPreset="city"
                  grain="on"
                  toggleAxis={false}
                  zoomOut={false}
                  hoverState=""
                  enableTransition={false}
                />
              </ShaderGradientCanvas>
            </Suspense>

            {/* Contrast overlay */}
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35" />

            <div className="relative z-10 flex h-full flex-col justify-center px-12 py-14 md:px-24 md:py-20">
              <h2 className="mb-6 max-w-3xl text-4xl font-semibold leading-tight text-white md:text-6xl">
                Start preparing with daily problems and AI mock interviews.
              </h2>
              <p className="mb-10 max-w-2xl text-base text-white/80 md:text-lg">
                Build confidence with structured practice, realistic interview simulations, and clear skill feedback.
              </p>

              <CosmicButton
                href="/sign-up"
                className="w-fit rounded-full [&>span.relative]:rounded-full [&>span.relative]:bg-white/95 hover:[&>span.relative]:bg-white"
              >
                Start free
              </CosmicButton>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full px-6">
        {/* Main Black Footer Area */}
        <div className="rounded-t-3xl bg-black px-6 pb-20 pt-40 text-white md:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 items-start gap-10 pb-10 lg:grid-cols-2">
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <img
                    src="./branding/logo-standalone-png.png"
                    alt="Quiro AI"
                    className="h-10 w-auto"
                  />
                  <span className="text-xl font-semibold">Quiro AI</span>
                </div>

                <p className="max-w-md text-sm text-gray-400">
                  A focused interview-prep workflow: coding practice, AI mock interviews, and reports you can improve on.
                </p>

                <div className="space-y-3">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Connect
                  </h4>
                  <div className="flex gap-3">
                    <a
                      href="#"
                      className="flex size-10 items-center justify-center rounded-full border border-gray-700 transition-colors hover:bg-white hover:text-black"
                      aria-label="GitHub"
                    >
                      <Github className="size-5" />
                    </a>
                    <a
                      href="#"
                      className="flex size-10 items-center justify-center rounded-full border border-gray-700 transition-colors hover:bg-white hover:text-black"
                      aria-label="Twitter"
                    >
                      <Twitter className="size-5" />
                    </a>
                    <a
                      href="#"
                      className="flex size-10 items-center justify-center rounded-full border border-gray-700 transition-colors hover:bg-white hover:text-black"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="size-5" />
                    </a>
                    <a
                      href="mailto:hello@quiro.ai"
                      className="flex size-10 items-center justify-center rounded-full border border-gray-700 transition-colors hover:bg-white hover:text-black"
                      aria-label="Email"
                    >
                      <Mail className="size-5" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="space-y-4 lg:text-right">
                <h3 className="text-lg font-medium text-gray-300">
                  Get product updates
                </h3>
                <p className="ml-auto max-w-md text-sm text-gray-500">
                  Occasional updates about new problem sets, interview modes, and improvements.
                </p>
                <div className="relative ml-auto max-w-md">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full rounded-full border border-gray-700 bg-transparent px-6 py-3 pr-12 text-white transition-colors placeholder:text-gray-500 focus:border-[hsl(var(--brand))] focus:outline-none"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white hover:text-black"
                    aria-label="Subscribe"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>

            <nav className="grid grid-cols-2 gap-6 border-t border-gray-800 py-10 text-sm font-medium text-gray-300 md:grid-cols-3 lg:grid-cols-6">
              <Link href="/coding-problems" className="transition-colors hover:text-white">
                Coding problems
              </Link>
              <Link href="/meetings" className="transition-colors hover:text-white">
                Mock interviews
              </Link>
              <Link href="/reports" className="transition-colors hover:text-white">
                Skill reports
              </Link>
              <Link href="/agents" className="transition-colors hover:text-white">
                Agents
              </Link>
              <Link href="/legal/privacy-policy" className="transition-colors hover:text-white">
                Privacy
              </Link>
              <Link href="/legal/terms-conditions" className="transition-colors hover:text-white">
                Terms
              </Link>
            </nav>

            <div className="flex flex-col items-center justify-between gap-6 border-t border-gray-800 py-10 md:flex-row">
              <span className="text-sm font-semibold">Quiro AI</span>
              <span className="text-sm text-gray-500">
                © {new Date().getFullYear()} Quiro AI. All rights reserved.
              </span>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
              >
                Back to top
                <span className="flex size-10 items-center justify-center rounded-full bg-white text-black">
                  <ArrowUp className="size-5" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
