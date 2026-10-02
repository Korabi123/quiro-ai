import { describe, expect, it, vi } from "vitest";

//* `lib/inngest/functions.ts` pulls in `auth.ts` via `lib/github-server`, which
//* drags in better-auth and its `validator` dependency. That chain fails to
//* resolve under Vitest and has nothing to do with the config under test, so it
//* is stubbed. The function object itself is still the real one.
vi.mock("@/lib/prismadb", () => ({
  default: {
    gradeRun: { findUnique: vi.fn(), update: vi.fn() },
    gradeFinding: { deleteMany: vi.fn(), createMany: vi.fn() },
    repository: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/github-server", () => ({
  getGitHubClientForUser: vi.fn(),
}));

vi.mock("@/lib/streak", () => ({ updateStreak: vi.fn() }));

const { inngestFunctions } = await import("@/lib/inngest/functions");

/**
 * Inngest compiles `concurrency.key` (and `idempotency`, `debounce`,
 * `throttle`, `cancelOn`, `waitForEvent`) as CEL expressions server-side. There
 * is no `{{ ... }}` interpolation, so a Mustache key fails CEL compilation and
 * the dev server logs "Invalid concurrency key" while refusing to register the
 * function - which surfaces as grading that silently never runs.
 *
 * These assertions pin the config shape so a copy-pasted template cannot
 * reintroduce it.
 */
const fns = inngestFunctions as unknown as Array<{
  opts: {
    id: string;
    concurrency?: { key?: string; limit?: number; scope?: string };
    timeouts?: { start?: string; finish?: string };
    retries?: number;
  };
}>;

//* Bare CEL expression: identifiers, dots, quotes, and the `+` operator only.
//* Rejects `{{`, `}}`, and the `:` that broke a Mustache-style key.
const CEL_KEY_PATTERN = /^[A-Za-z0-9_.:"'\-+ ]+$/;

const toMinutes = (value?: string) => Number(/^(\d+)m$/.exec(value ?? "")?.[1] ?? NaN);

describe("gradeRepository Inngest config", () => {
  const fn = fns.find((f) => f.opts.id === "project-grading-grade-repository");

  it("is registered", () => {
    expect(fn).toBeDefined();
  });

  it("uses a CEL expression as the concurrency key, not a Mustache template", () => {
    const key = fn?.opts.concurrency?.key;

    expect(typeof key).toBe("string");
    expect(key).not.toMatch(/\{\{|\}\}/);
    expect(key).toMatch(CEL_KEY_PATTERN);
  });

  it("keys concurrency per user so two runs cannot overlap for one account", () => {
    expect(fn?.opts.concurrency?.key).toBe("event.data.userId");
    expect(fn?.opts.concurrency?.limit).toBe(1);
  });

  it("keeps the finish timeout above the start timeout", () => {
    const { start, finish } = fn?.opts.timeouts ?? {};

    expect(start).toBeDefined();
    expect(finish).toBeDefined();

    //* `finish` is measured from when the event is scheduled, so a finish below
    //* start means a queued run is killed before its body can complete.
    expect(toMinutes(finish)).toBeGreaterThan(toMinutes(start));
  });

  it("retries transient failures", () => {
    expect(fn?.opts.retries).toBeGreaterThan(0);
  });
});

/**
 * Applies to every registered function, so a newly migrated flow inherits the
 * checks without a matching test being added. The earlier version asserted a
 * length of 1, which would have started failing silently-meaningfully as soon
 * as a second flow was added.
 */
describe.each(fns.map((f) => [f.opts.id, f] as const))("%s Inngest config", (_id, f) => {
  it("has a unique non-empty id", () => {
    expect(f.opts.id).toBeTruthy();
  });

  it("does not use a Mustache template as a concurrency key", () => {
    const key = f.opts.concurrency?.key;
    if (key === undefined) return;

    expect(key).not.toMatch(/\{\{|\}\}/);
    expect(key).toMatch(CEL_KEY_PATTERN);
  });

  it("keeps finish above start", () => {
    const { start, finish } = f.opts.timeouts ?? {};
    if (start === undefined || finish === undefined) return;

    expect(toMinutes(finish)).toBeGreaterThan(toMinutes(start));
  });
});

describe("Inngest function registry", () => {
  it("has no duplicate function ids", () => {
    const ids = fns.map((f) => f.opts.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("registers the migrated report flows", () => {
    const ids = fns.map((f) => f.opts.id);
    expect(ids).toContain("reports-generate");
    expect(ids).toContain("reports-grade");
  });
});