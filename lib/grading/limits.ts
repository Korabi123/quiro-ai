import prismadb from "@/lib/prismadb";

/**
 * Quota and gating rules for the project-grading feature.
 *
 * The general `middleware/rate-limit.ts` limiter keys on IP and lives in
 * per-instance memory, so it neither distinguishes users nor holds across
 * serverless cold starts. Grading runs cost real money per invocation, so this
 * enforces limits from durable state in Postgres, keyed on userId.
 */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const GRADING_LIMITS = {
  pro: { perDay: 50, maxRepos: 20 },
  free: { perDay: 3, maxRepos: 3 },
} as const;

export type Plan = keyof typeof GRADING_LIMITS;

export const isProSubscriber = async (userId: string): Promise<boolean> => {
  const subscription = await prismadb.subscription.findFirst({
    where: { referenceId: userId, status: "active", plan: "pro" },
    select: { id: true },
  });
  return subscription !== null;
};

export const getPlan = async (userId: string): Promise<Plan> =>
  (await isProSubscriber(userId)) ? "pro" : "free";

export type QuotaState = {
  plan: Plan;
  usedToday: number;
  dailyLimit: number;
  remaining: number;
  linkedRepos: number;
  repoLimit: number;
  activeRun: { id: string; status: string } | null;
  repoCapReached: boolean;
  quotaExhausted: boolean;
};

export const getQuotaState = async (userId: string): Promise<QuotaState> => {
  const plan = await getPlan(userId);
  const limits = GRADING_LIMITS[plan];

  const hourAgo = new Date(Date.now() - HOUR);
  const dayAgo = new Date(Date.now() - DAY);

  const [usedToday, linkedRepos, activeRun] = await Promise.all([
    //* Every run started in the last 24h counts, not just the active ones,
    //* otherwise the quota resets as soon as a run finishes.
    prismadb.gradeRun.count({
      where: { userId, createdAt: { gte: dayAgo } },
    }),
    prismadb.repository.count({ where: { userId } }),
    //* A run is "active" only while it is young; a PENDING row whose worker
    //* died must not block the user forever.
    prismadb.gradeRun.findFirst({
      where: {
        userId,
        status: { in: ["PENDING", "RUNNING"] },
        createdAt: { gte: hourAgo },
      },
      select: { id: true, status: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    plan,
    usedToday,
    dailyLimit: limits.perDay,
    remaining: Math.max(0, limits.perDay - usedToday),
    linkedRepos,
    repoLimit: limits.maxRepos,
    activeRun: activeRun ?? null,
    repoCapReached: linkedRepos >= limits.maxRepos,
    quotaExhausted: usedToday >= limits.perDay,
  };
};

/** Minimal repo shape kept in the DB; anything a grader needs comes from GitHub. */
export const MAX_FULL_NAME_LENGTH = 200;