'use client';

import type React from 'react';
import { cn } from '@/lib/utils';

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { motion } from 'framer-motion';

interface BentoItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  status?: string;
  tags?: string[];
  meta?: string;
  cta?: string;
  colSpan?: number;
  hasPersistentHover?: boolean;
}

interface BentoGridProps {
  items?: BentoItem[];
}

const itemsSample = [
  {
    title: "AI Interview Simulations",
    description: "Simulate real interview calls with AI agents you create and customize.",
    icon: <img src="https://emojicdn.elk.sh/%F0%9F%8E%99%EF%B8%8F" alt="🎙️" className="h-4 w-4" />,
    tags: ["AI", "Interviews", "Practice"],
    colSpan: 2,
    cta: "/sign-up",
  },
  {
    title: "Customizable AI Agents",
    description: "Create and customize AI agents with specific prompts for tailored meeting simulations.",
    icon: <img src="https://emojicdn.elk.sh/%F0%9F%A4%96" alt="🤖" className="h-4 w-4" />,
    tags: ["AI", "Customization", "Agents"],
    cta: "/sign-up",
  },
  {
    title: "Comprehensive Skill Reports",
    description: "Generate detailed skill reports by field and type, with AI-powered feedback.",
    icon: <img src="https://emojicdn.elk.sh/%F0%9F%93%84" alt="📄" className="h-4 w-4" />,
    tags: ["Skills", "Reports", "Feedback"],
    cta: "/sign-up",
  },
  {
    title: "LinkedIn Job Integrations",
    description: "Generate agent instructions and skill reports directly from LinkedIn job URLs.",
    icon: <img src="https://emojicdn.elk.sh/%F0%9F%94%97" alt="🔗" className="h-4 w-4" />,
    tags: ["LinkedIn", "Integration", "Jobs"],
    colSpan: 2,
    cta: "/sign-up",
  },
  {
    title: "AI-Powered Coding Challenges",
    description: "Solve coding problems with AI grading and performance improvement suggestions.",
    icon: <img src="https://emojicdn.elk.sh/%F0%9F%92%BB" alt="💻" className="h-4 w-4" />,
    tags: ["Coding", "AI", "Practice"],
    cta: "/sign-up",
  },
  {
    title: "AI-Powered Project Grading",
    description: "Grade coding projects with AI and receive.",
    icon: <img src="https://emojicdn.elk.sh/%F0%9F%92%BB" alt="💻" className="h-4 w-4" />,
    tags: ["Coding", "AI", "Practice"],
    cta: "/sign-up",
  },
  {
    title: "Personalized Hireability Insights",
    description: "Receive daily hireability tips based on your skill reports, meetings, and coding problems.",
    icon: <img src="https://emojicdn.elk.sh/%F0%9F%92%A1" alt="💡" className="h-4 w-4" />,
    tags: ["Tips", "Insights", "Career"],
    status: 'Coming Soon',
    cta: "/sign-up",
  },
];

export default function BentoGrid({ items = itemsSample }: BentoGridProps) {
  return (
    <motion.section
      className="relative overflow-hidden py-12 bg-black mt-32"
      initial={{ opacity: 0, y: 50, filter: "blur(20px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid-bento"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="rgba(204,204,204,0.08)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-bento)" />
      </svg>

      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-4xl font-extralight tracking-tight text-white sm:text-5xl">
          Unlock Your Potential
        </h2>
        <p className="mt-4 text-lg leading-8 text-gray-300">
          Explore the powerful features designed to help you ace your interviews and advance your career.
        </p>
      </div>
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-4 p-4 md:grid-cols-3">
        {items.map((item, index) => (
          <motion.a
            href="#"
            key={`${item.title}-${item.status || item.meta}`}
            className={cn(
              item.colSpan || 'col-span-1',
              item.colSpan === 2 ? 'md:col-span-2' : '',
            )}
            initial={{ opacity: 0, y: 20, filter: "blur(20px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card
              className={cn(
                'group relative h-full overflow-hidden rounded-xl border border-white/10 bg-neutral-900 p-3 transition-all duration-300 hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/10 will-change-transform hover:-translate-y-1',
                {
                  '-translate-y-1 shadow-md': item.hasPersistentHover,
                },
              )}
            >
              <div
                className={cn(
                  'absolute inset-0',
                  item.hasPersistentHover
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-100',
                  'transition-opacity duration-300',
                )}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.05)_1px,transparent_1px)] bg-[length:4px_4px] dark:bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.05)_1px,transparent_1px)]" />
              </div>

              <CardHeader className="relative space-y-0 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                    {item.icon}
                  </div>
                  {item.status && (
                    <span className="rounded-md bg-orange-500/10 px-2 py-1 text-xs font-medium text-orange-500">
                      {item.status}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="relative space-y-2 p-4 pt-0">
                <h3 className="text-[15px] font-medium tracking-tight text-white">
                  {item.title}
                  {item.meta && (
                    <span className="ml-2 text-xs font-normal text-neutral-400">
                      {item.meta}
                    </span>
                  )}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-400">
                  {item.description}
                </p>
              </CardContent>

              <CardFooter className="relative p-4">
                <div className="flex w-full items-center justify-between">
                  <div className="flex flex-wrap gap-2 text-xs text-neutral-400">
                    {item.tags?.map((tag) => (
                      <span
                        key={`${item.title}-${tag}`}
                        className="rounded-md bg-neutral-800 px-2 py-1 backdrop-blur-xs transition-all duration-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <span onClick={() => window.location.href = item.cta!} className="text-xs font-medium text-orange-500 opacity-0 transition-opacity group-hover:opacity-100">
                    Explore →
                  </span>
                </div>
              </CardFooter>

              <div
                className={cn(
                  // absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-orange-500/10 via-black to-yellow-500/10 p-px
                  'absolute inset-0 -z-10 rounded-xl bg-gradient-to-br group-hover:from-orange-500/5 via-black group-hover:to-yellow-500/5 p-px',
                  item.hasPersistentHover
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-100',
                  'transition-opacity duration-300',
                )}
              />
            </Card>
          </motion.a>
        ))}
      </div>
    </motion.section>
  );
}
