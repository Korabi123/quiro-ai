import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Authorization regression tests for the coding-submission grading route.
 *
 * The route accepted an `attemptId` and looked it up with
 * `findUnique({ where: { id } })` - no ownership filter. Because the grading
 * write is keyed on that same `attemptId`, any authenticated user could pass
 * someone else's attempt id and overwrite that user's stored scores. The
 * `code`-based fallback two lines below *was* scoped to the session user, which
 * is exactly why this survived review: the file contained a correct
 * authorization check right next to an incorrect one.
 *
 * These tests pin the ownership requirement at the query, not just the outcome,
 * so a future refactor that reintroduces an unscoped lookup fails even if the
 * surrounding logic happens to still return 404 for some other reason.
 */

const session = { user: { id: "user-alice" } };

const findFirst = vi.fn();
const findUniqueCodingAttempt = vi.fn();
const codeGradingFindUnique = vi.fn();
const codeGradingUpdate = vi.fn();
const codeGradingCreate = vi.fn();
const codingProblemFindUnique = vi.fn();

vi.mock("@/auth", () => ({
  auth: { api: { getSession: vi.fn(async () => session) } },
}));

vi.mock("@/lib/prismadb", () => ({
  default: {
    codingAttempt: {
      findFirst,
      //* Present so a regression to `findUnique({ where: { id } })` is
      //* detectable rather than silently undefined.
      findUnique: findUniqueCodingAttempt,
    },
    codingProblem: { findUnique: codingProblemFindUnique },
    codeGrading: {
      findUnique: codeGradingFindUnique,
      update: codeGradingUpdate,
      create: codeGradingCreate,
    },
  },
}));

//* The route reaches OpenAI only after it has resolved an attempt. Tests that
//* exercise the ownership guard never get that far, but the import must resolve.
vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: vi.fn() } };
  },
}));

const { POST } = await import("@/app/api/submissions/grade/route");

const body = (extra: Record<string, unknown> = {}) =>
  new Request("http://localhost/api/submissions/grade", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      code: "console.log(1)",
      language: "javascript",
      problemSlug: "two-sum",
      ...extra,
    }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  codingProblemFindUnique.mockResolvedValue({ id: "prob-1", slug: "two-sum" });
});

describe("POST /api/submissions/grade authorization", () => {
  it("scopes the attemptId lookup to the session user", async () => {
    //* The attempt belongs to somebody else, so the scoped query returns null.
    findFirst.mockResolvedValue(null);

    const res = await POST(body({ attemptId: "attempt-owned-by-someone-else" }));

    expect(res.status).toBe(404);

    //* The critical assertion: ownership is part of the query itself.
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "attempt-owned-by-someone-else", userId: "user-alice" },
      })
    );
  });

  it("does not use an unscoped unique lookup for attemptId", async () => {
    findFirst.mockResolvedValue(null);

    await POST(body({ attemptId: "attempt-x" }));

    expect(findUniqueCodingAttempt).not.toHaveBeenCalled();
  });

  it("never writes a grading for an attempt it does not own", async () => {
    findFirst.mockResolvedValue(null);

    await POST(body({ attemptId: "attempt-owned-by-someone-else" }));

    expect(codeGradingUpdate).not.toHaveBeenCalled();
    expect(codeGradingCreate).not.toHaveBeenCalled();
  });

  it("rejects a missing attemptId-owned attempt the same way as a nonexistent one", async () => {
    //* Identical response for "not yours" and "does not exist", so the endpoint
    //* cannot be used to enumerate which attempt ids are real.
    findFirst.mockResolvedValue(null);

    const missing = await POST(body({ attemptId: "no-such-attempt" }));
    const notYours = await POST(body({ attemptId: "real-but-other-users" }));

    expect(missing.status).toBe(404);
    expect(notYours.status).toBe(404);
    expect(await missing.text()).toBe(await notYours.text());
  });
});