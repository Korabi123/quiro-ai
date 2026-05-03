"use client";

import Link from "next/link";

import { Sparkles } from "@/components/ui-layouts/sparkles";

export default function UILayoutsSparklesHero() {
  return (
    <div className="min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="relative h-80 w-full overflow-hidden mask-[radial-gradient(50%_50%,white,transparent)] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_bottom_center,#369eff,transparent_90%)] before:opacity-100 after:absolute after:-left-1/2 after:top-1/2 after:aspect-[1/1.8] after:w-[200%] after:rounded-[50%] after:border-2 after:border-b after:border-[#7876c566] after:bg-zinc-900">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff2c_1px,transparent_1px),linear-gradient(to_bottom,#3a3a3a01_1px,transparent_1px)] bg-[length:70px_80px]" />
        <Sparkles
          density={400}
          size={1.4}
          direction="top"
          className="absolute inset-x-0 top-0 h-full w-full mask-[radial-gradient(50%_50%,white,transparent_85%)]"
        />
      </div>

      <div className="relative z-10 mx-auto -mt-52 w-full max-w-2xl px-4">
        <div className="mx-auto grid h-28 w-28 place-content-center rounded-full border border-neutral-800 bg-white/95 p-4 backdrop-blur-lg dark:bg-neutral-950/90">
          <img src="./branding/logo-standalone-png.png" alt="Quiro AI" className="h-12 w-12 object-contain dark:invert" />
        </div>

        <article className="relative z-10 mx-auto block w-full max-w-2xl pt-6 text-center">
          <h1 className="bg-gradient-to-b from-white to-neutral-400 bg-clip-text py-3 text-5xl font-medium text-transparent md:text-6xl">
            Ace your interviews with Quiro AI
          </h1>
          <p className="mx-auto max-w-xl text-pretty text-lg text-neutral-300 md:text-xl">
            Daily coding challenges, AI mock interviews, and tailored prep—built to help you ship confidence on interview day.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-200"
            >
              Start free
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
            >
              Log in
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
