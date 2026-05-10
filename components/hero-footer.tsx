"use client";

import React, { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import { ArrowUp, Github, Linkedin, Mail, Twitter } from "lucide-react";
import { toast } from "sonner";

import { CosmicButton } from "@/components/ui/cosmic-button";

const QUIRO_MESH = {
  color1: "#FDBA74",
  color2: "#FB923C",
  color3: "#EA580C",
} as const;

export const HeroFooter = () => {
  const ctaRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error("Something went wrong");
      }

      toast.success("Subscribed successfully!");
      setEmail("");
    } catch (error) {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" style={{ scrollMarginTop: "-5vh" }} className="bg-black pt-40">
      <div className="mx-auto w-[80%] px-6">
        {/* Floating Call to Action */}
        <div className="relative z-10 -mb-24">
          {/* Soft glow behind CTA card for separation */}
          <div className="pointer-events-none absolute -inset-x-8 -inset-y-8 -z-10 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(251,146,60,0.22)_0%,rgba(251,146,60,0.10)_34%,transparent_72%)] blur-2xl" />
          <div
            ref={ctaRef}
            className="relative h-96 overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl ring-1 ring-white/10"
          >
            <Suspense fallback={null}>
              <ShaderGradientCanvas
                style={{
                  position: "absolute",
                  inset: "-8%",
                  width: "116%",
                  height: "116%",
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
                  uStrength={0.42}
                  uDensity={0.8}
                  uFrequency={5.25}
                  uAmplitude={6.2}
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
                  brightness={1.35}
                  envPreset="city"
                  grain="on"
                  toggleAxis={false}
                  zoomOut={false}
                  hoverState=""
                  enableTransition={false}
                />
              </ShaderGradientCanvas>
            </Suspense>

            <div className="absolute inset-0 bg-[radial-gradient(130%_130%_at_15%_12%,rgba(251,146,60,0.34)_0%,rgba(251,146,60,0.12)_32%,transparent_65%),radial-gradient(120%_120%_at_85%_20%,rgba(234,88,12,0.34)_0%,rgba(234,88,12,0.1)_36%,transparent_72%),radial-gradient(120%_120%_at_50%_85%,rgba(253,186,116,0.24)_0%,rgba(253,186,116,0.08)_34%,transparent_70%)]" />

            <div className="absolute inset-0 bg-black/5 backdrop-blur-[18px]" />
            <div className="absolute inset-0 opacity-[0.72] mix-blend-soft-light animate-[texture-drift_12s_linear_infinite] [background-image:linear-gradient(to_right,rgba(255,255,255,0.34)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.28)_1px,transparent_1px),linear-gradient(to_right,rgba(0,0,0,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.2)_1px,transparent_1px)] [background-size:14px_14px,14px_14px,28px_28px,28px_28px] [background-position:0_0,0_0,3px_3px,3px_3px]" />
            <div className="absolute inset-0 opacity-[0.3] mix-blend-overlay [background-image:conic-gradient(from_45deg_at_50%_50%,rgba(255,255,255,0.16)_0deg,transparent_90deg,rgba(255,255,255,0.08)_180deg,transparent_270deg,rgba(255,255,255,0.16)_360deg)] [background-size:22px_22px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] via-black/6 to-black/16" />

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
        <div className="rounded-t-3xl bg-neutral-900 px-6 pb-20 pt-40 text-white ring-1 ring-white/10 md:px-12">
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
                      href="https://github.com/Korabi123/quiro-ai"
                      target="_blank"
                      className="flex size-10 items-center justify-center rounded-full border border-gray-700 transition-colors hover:bg-white hover:text-black"
                      aria-label="GitHub"
                    >
                      <Github className="size-5" />
                    </a>
                    <a
                      href="https://x.com/QuiroAI"
                      target="_blank"
                      className="flex size-10 items-center justify-center rounded-full border border-gray-700 transition-colors hover:bg-white hover:text-black"
                      aria-label="Twitter"
                    >
                      <Twitter className="size-5" />
                    </a>
                    <a
                      href="mailto:contact-quiro@korabimeri.work.gd"
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
                <form onSubmit={handleSubscribe} className="relative ml-auto max-w-md">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Enter your email"
                    className="w-full rounded-full border border-gray-700 bg-transparent px-6 py-3 pr-12 text-white transition-colors placeholder:text-gray-500 focus:border-[hsl(var(--brand))] focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50 disabled:hover:bg-white/10 disabled:hover:text-white"
                    aria-label="Subscribe"
                  >
                    {isSubmitting ? (
                      <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      "›"
                    )}
                  </button>
                </form>
              </div>
            </div>

            <nav className="grid grid-cols-2 gap-6 border-t border-border/15 py-10 text-sm font-medium text-gray-300 md:grid-cols-3 lg:grid-cols-6">
              <a href="/meetings" className="transition-colors hover:text-white">
                Meetings
              </a>
              <a href="/agents" className="transition-colors hover:text-white">
                Agents
              </a>
              <a href="/reports" className="transition-colors hover:text-white">
                Skill reports
              </a>
              <a href="/coding-problems" className="transition-colors hover:text-white">
                Coding problems
              </a>
              <a href="/legal/privacy-policy" className="transition-colors hover:text-white">
                Privacy Policy
              </a>
              <a href="/legal/terms-conditions" className="transition-colors hover:text-white">
                Terms & Conditions
              </a>
            </nav>

            <div className="flex flex-col items-center justify-between gap-6 border-t border-border/15 py-10 md:flex-row">
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
