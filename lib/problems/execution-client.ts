import type { BatchResult, BatchTestCase } from "./run-batch";

/**
 * Client helpers for the queued test-batch endpoint.
 *
 * `/api/execute-batch` used to answer with results directly. It now returns 202
 * and a job id, so every caller needs the same "enqueue, then poll until
 * settled" dance. It lives here rather than in the component so the test-run and
 * submit paths cannot drift apart.
 */

const POLL_INTERVAL_MS = 1500;

/** How long to wait before giving up. Generous: a 33-case batch can take ~11 min. */
const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000;

export type BatchRequest = {
  code: string;
  language: string;
  testCases: BatchTestCase[];
  problemContent?: string;
  generateHidden?: boolean;
};

export class ExecutionFailedError extends Error {}

/**
 * Starts a batch and resolves with its results once the job completes.
 *
 * `signal` should be the caller's abort signal so navigating away mid-run stops
 * the polling. The job itself keeps running server-side either way - cancelling
 * the request only stops the client from waiting for it.
 */
export const runBatchAndWait = async (
  request: BatchRequest,
  { signal, timeoutMs = DEFAULT_TIMEOUT_MS }: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<BatchResult> => {
  const response = await fetch("/api/execute-batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ExecutionFailedError(payload?.error ?? "Failed to start test run");
  }

  const executionId: string | undefined = payload?.executionId;

  if (!executionId) {
    throw new ExecutionFailedError("Test run did not return a job id");
  }

  return pollExecution(executionId, { signal, timeoutMs });
};

/** Polls an existing execution until it settles. */
export const pollExecution = async (
  executionId: string,
  { signal, timeoutMs = DEFAULT_TIMEOUT_MS }: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<BatchResult> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const res = await fetch(`/api/execute-batch?id=${executionId}`, { signal });
    const state = await res.json().catch(() => null);

    if (!res.ok) {
      throw new ExecutionFailedError(state?.error ?? "Failed to read test run");
    }

    if (state.status === "COMPLETED") {
      return { results: state.results ?? [], summary: state.summary };
    }

    if (state.status === "FAILED") {
      throw new ExecutionFailedError(state.error ?? "Test run failed");
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new ExecutionFailedError("Test run timed out");
};