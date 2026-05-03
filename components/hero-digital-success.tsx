"use client";

import React, { Suspense, useRef } from "react";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import { TimelineAnimation } from "@/components/timeline-animation";
import { useMediaQuery } from "@/components/use-media-query";
import MotionDrawer from "@/components/motion-drawer";
import { CosmicButton } from "@/components/ui/cosmic-button";

/** Quiro landing brand mesh — warm amber/orange aligned with `landing.css` `--brand` / glow accents */
const QUIRO_MESH = {
  color1: "#FDE68A",
  color2: "#FB923C",
  color3: "#C2410C",
} as const;

export const HeroDigitalSuccess = () => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <section
      ref={timelineRef}
      className="relative flex min-h-screen flex-col overflow-hidden bg-black text-white"
    >
      <Suspense fallback={null}>
        <ShaderGradientCanvas
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
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
            uSpeed={0.28}
            uStrength={0.32}
            uDensity={0.85}
            uFrequency={5.2}
            uAmplitude={3.1}
            positionX={-0.1}
            positionY={0}
            positionZ={0}
            rotationX={0}
            rotationY={130}
            rotationZ={70}
            color1={QUIRO_MESH.color1}
            color2={QUIRO_MESH.color2}
            color3={QUIRO_MESH.color3}
            reflection={0.38}
            cAzimuthAngle={270}
            cPolarAngle={180}
            cDistance={0.5}
            cameraZoom={15.1}
            lightType="env"
            brightness={0.85}
            envPreset="city"
            grain="on"
            toggleAxis={false}
            zoomOut={false}
            hoverState=""
            enableTransition={false}
          />
        </ShaderGradientCanvas>
      </Suspense>

      {isMobile && (
        <div className="flex items-center justify-between gap-4 px-10 pt-4">
          <MotionDrawer
            direction="left"
            width={300}
            backgroundColor={"#000000"}
            clsBtnClassName="border-r border-neutral-900 bg-neutral-800 text-white"
            contentClassName="border-r border-neutral-900 bg-black text-white"
            btnClassName="relative left-0 top-0 w-fit bg-white p-2 text-black"
          >
            <nav className="space-y-4">
              <div className="flex items-center gap-2 text-white">
                <img
                  src="./branding/logo-standalone-png.png"
                  alt="Quiro AI"
                  className="h-8 w-auto"
                />
                <span className="font-semibold">Quiro AI</span>
              </div>
              <a href="/coding-problems" className="block rounded-sm p-2 hover:bg-neutral-100 hover:text-black">
                Coding problems
              </a>
              <a href="/login" className="block rounded-sm p-2 hover:bg-neutral-100 hover:text-black">
                Log in
              </a>
              <a href="/sign-up" className="block rounded-sm p-2 hover:bg-neutral-100 hover:text-black">
                Sign up
              </a>
            </nav>
          </MotionDrawer>
          <TimelineAnimation
            once={true}
            as="a"
            href="/sign-up"
            animationNum={3}
            timelineRef={timelineRef}
            className="flex w-fit items-center gap-2 rounded-full bg-neutral-800 px-6 py-3 text-lg font-bold text-white"
          >
            <span className="h-2 w-2 rounded-full bg-orange-400" />
            <span className="text-sm font-medium">Get started</span>
          </TimelineAnimation>
        </div>
      )}

      {!isMobile && (
        <header className="relative z-10 flex items-center justify-between p-4 px-10">
          <TimelineAnimation
            once={true}
            animationNum={1}
            timelineRef={timelineRef}
            className="flex items-center gap-3"
          >
            <img
              src="./branding/logo-standalone-png.png"
              alt="Quiro AI"
              className="h-9 w-auto"
            />
            <span className="text-sm font-semibold tracking-tight">Quiro AI</span>
          </TimelineAnimation>

          <TimelineAnimation
            once={true}
            as="nav"
            animationNum={2}
            timelineRef={timelineRef}
            className="hidden items-center gap-10 text-sm font-medium text-white md:flex"
          >
            <a href="/coding-problems" className="transition hover:text-orange-200">
              Coding problems
            </a>
            <a href="/login" className="transition hover:text-orange-200">
              Log in
            </a>
            <a href="/sign-up" className="transition hover:text-orange-200">
              Sign up
            </a>
          </TimelineAnimation>
          <TimelineAnimation
            once={true}
            as="a"
            href="/sign-up"
            animationNum={3}
            timelineRef={timelineRef}
            className="flex w-fit items-center gap-2 rounded-full bg-neutral-800 px-8 py-4 text-lg font-bold text-white"
          >
            <span className="h-2 w-2 rounded-full bg-orange-400" />
            <span className="text-sm font-medium">Get started</span>
          </TimelineAnimation>
        </header>
      )}

      <div className="relative z-10 flex grow flex-col justify-center px-12 md:px-24">
        <TimelineAnimation
          once={true}
          as="h1"
          animationNum={4}
          timelineRef={timelineRef}
          className="flex flex-col items-baseline gap-x-8 gap-y-2 pb-10 text-[10vw] font-medium leading-[100%] xl:flex-row xl:text-[6.5vw]"
        >
          Ace your
          <span className="block bg-gradient-to-r from-white via-orange-300 to-amber-300 bg-clip-text pb-8 text-transparent xl:inline-block">
            interviews
          </span>
        </TimelineAnimation>

        <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-center">
          <div className="flex flex-wrap justify-start gap-4">
            <TimelineAnimation once={true} animationNum={5} timelineRef={timelineRef}>
              <CosmicButton
                href="/sign-up"
                className="w-[200px] justify-center rounded-full scale-[1.01] active:scale-100 [&>span.relative]:w-full [&>span.relative]:justify-center [&>span.relative]:px-8 [&>span.relative]:py-4 [&>span.relative]:rounded-full [&>span.relative]:bg-white/95 hover:[&>span.relative]:bg-white"
              >
                Start free
              </CosmicButton>
            </TimelineAnimation>
            <TimelineAnimation
              once={true}
              as="a"
              href="/login"
              animationNum={6}
              timelineRef={timelineRef}
              className="cursor-pointer w-[200px] justify-center rounded-full border border-white/20 bg-white/5 px-8 py-4 text-lg font-medium backdrop-blur-md inline-flex items-center"
            >
              Log in
            </TimelineAnimation>
          </div>
          <TimelineAnimation
            once={true}
            as="p"
            animationNum={7}
            timelineRef={timelineRef}
            className="max-w-md text-xl font-light leading-relaxed text-neutral-100"
          >
            Daily coding challenges, AI mock interviews, and skill reports—so you walk into every loop calm, sharp, and
            prepared.
          </TimelineAnimation>
        </div>
      </div>

      <div className="relative z-10 flex flex-wrap items-end justify-end p-12">
        <TimelineAnimation
          once={true}
          animationNum={8}
          timelineRef={timelineRef}
          className="grid grid-cols-2 gap-x-12 gap-y-4 rounded-lg bg-black/20 p-4 backdrop-blur-lg md:grid-cols-4"
        >
          <TimelineAnimation once={true} animationNum={9} timelineRef={timelineRef}>
            <p className="mb-1 text-sm text-white">Coding practice</p>
            <p className="text-xs text-neutral-300">Curated problem sets</p>
          </TimelineAnimation>
          <TimelineAnimation once={true} animationNum={10} timelineRef={timelineRef}>
            <p className="mb-1 text-sm text-white">AI mock interviews</p>
            <p className="text-xs text-neutral-300">Realistic voice sessions</p>
          </TimelineAnimation>
          <TimelineAnimation once={true} animationNum={11} timelineRef={timelineRef}>
            <p className="mb-1 text-sm text-white">Skill reports</p>
            <p className="text-xs text-neutral-300">See where to improve</p>
          </TimelineAnimation>
          <TimelineAnimation once={true} animationNum={12} timelineRef={timelineRef}>
            <p className="mb-1 text-sm text-white">Built for momentum</p>
            <p className="text-xs text-neutral-300">Streaks &amp; progress</p>
          </TimelineAnimation>
        </TimelineAnimation>
      </div>
    </section>
  );
};
