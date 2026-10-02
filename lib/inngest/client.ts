import { Inngest } from "inngest";
import { z } from "zod";

/**
 * Single Inngest client for the app.
 *
 * The `schemas` map gives compile-time payload safety at `inngest.send()` call
 * sites and runtime validation inside the handler, so a malformed trigger fails
 * immediately instead of partway through a multi-minute grading run.
 */
/**
 * Resolves dev vs cloud mode explicitly.
 *
 * Inngest's own fallback when `isDev` is omitted is `INNGEST_DEV`, then
 * "assume cloud". With neither set - the common case for a fresh `.env` - the
 * client silently runs in cloud mode, and since no signing key is configured
 * `checkModeConfiguration()` fails and *every* request to this endpoint returns
 * `500 {"code":"internal_server_error"}`. That failure looks like a broken
 * deploy rather than a missing flag, so it is worth being explicit.
 *
 * `INNGEST_DEV` still wins when set, which is what production needs to opt back
 * into cloud mode; otherwise `NODE_ENV` decides.
 */
const isDevMode = (): boolean => {
  const explicit = process.env.INNGEST_DEV?.trim().toLowerCase();

  if (explicit === "1" || explicit === "true") return true;
  //* `INNGEST_DEV=0` means cloud. Note this is NOT the same as leaving it unset.
  if (explicit === "0" || explicit === "false") return false;

  return process.env.NODE_ENV !== "production";
};

export const inngest = new Inngest({
  id: "quiro-ai",
  isDev: isDevMode(),
  schemas: {
    "project-grading/run": z.object({
      runId: z.string().min(1),
      userId: z.string().min(1),
      repositoryId: z.string().min(1),
      fullName: z.string().min(3).max(200),
    }),

    /* Reports: question generation, then grading the answers. */
    "reports/generate": z.object({
      reportId: z.string().min(1),
      userId: z.string().min(1),
    }),
    "reports/grade": z.object({
      reportId: z.string().min(1),
      userId: z.string().min(1),
      //* The submitted answers travel with the event rather than being re-read
      //* from the database, because the client has them in memory and they are
      //* not persisted until grading succeeds. Bounded so a malformed client
      //* cannot push an unbounded payload into the queue.
      answers: z
        .array(
          z.object({
            id: z.string().min(1),
            content: z.string().max(5000),
            answer: z.string().max(5000),
            type: z.string().max(50),
            rubric: z.object({
              criteria: z.string().max(2000),
              scoring: z.string().max(4000),
              maxScore: z.number(),
            }),
          })
        )
        .min(1)
        .max(50),
    }),

    /* Coding problems: test execution and AI grading of a submission. */
    "submissions/execute-batch": z.object({
      executionId: z.string().min(1),
      userId: z.string().min(1),
    }),
    "submissions/grade": z.object({
      attemptId: z.string().min(1),
      userId: z.string().min(1),
    }),

    /* Chat: generate the assistant reply for a user message. */
    "chats/reply": z.object({
      userChatId: z.string().min(1),
      userId: z.string().min(1),
      meetingId: z.string().min(1).nullable(),
      reportId: z.string().min(1).nullable(),
    }),

    /* Agents: turn a LinkedIn URL into Vapi interviewer instructions. */
    "agents/instructions": z.object({
      requestId: z.string().min(1),
      userId: z.string().min(1),
      linkedInUrl: z.string().min(1).max(2000),
      role: z.string().min(1).max(200),
      agentId: z.string().min(1).nullable(),
    }),

    /* Meetings: fetch the finished call artifact from Vapi once it exists. */
    "meetings/details": z.object({
      meetingId: z.string().min(1),
      userId: z.string().min(1),
      vapiAgent: z.string().min(1),
    }),
  },
});

/**
 * Idempotency key for a grading run. Re-sending the same key within Inngest's
 * dedupe window returns the original event rather than starting a second run,
 * which protects against a double-clicked button or a retried request.
 */
export const gradingEventId = (runId: string): string =>
  `project-grading/run:${runId}`;

export const PROJECT_GRADING_RUN_EVENT = "project-grading/run" as const;

export { RUN_CANCELLED_ERROR } from "@/lib/inngest/jobs";

/* ------------------------------------------------------------------ */
/* Event ids                                                          */
/* ------------------------------------------------------------------ */

/**
 * Idempotency keys, one per flow.
 *
 * Inngest deduplicates on this key inside a 24h window, so a double-clicked
 * button, a retried fetch, or a flaky mobile connection that replays the
 * request cannot start a second run and bill the model twice. Every enqueue
 * site must pass one of these.
 */
export const eventIds = {
  reportGenerate: (reportId: string) => `reports/generate:${reportId}`,
  reportGrade: (reportId: string) => `reports/grade:${reportId}`,
  codeGrade: (attemptId: string) => `submissions/grade:${attemptId}`,
  codeExecuteBatch: (executionId: string) => `submissions/execute-batch:${executionId}`,
  chatReply: (chatId: string) => `chats/reply:${chatId}`,
  agentInstructions: (key: string) => `agents/instructions:${key}`,
  meetingDetails: (meetingId: string) => `meetings/details:${meetingId}`,
} as const;