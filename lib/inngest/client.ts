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

export { RUN_CANCELLED_ERROR } from "@/lib/grading/types";