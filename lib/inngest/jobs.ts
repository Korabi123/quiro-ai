/**
 * Shared job lifecycle helpers for Inngest functions.
 *
 * Every long-running flow follows the same shape: create a row, enqueue an
 * event, let a worker drive it to a terminal state, and have the client poll
 * for that state. Project grading was the first flow to have that shape and its
 * handling was written inline. Rather than copy those inline blocks seven more
 * times, the rules live here.
 *
 * The status/stage/error columns are named differently per table - grading uses
 * `status`/`stage`/`error`, while the migrated tables use `jobStatus`/`jobStage`
 * or `testStatus`/`gradeStatus` - so the column names are passed in rather than
 * hardcoded.
 */

/** Sentinel written by cancel endpoints. Free of the Inngest SDK import so client components can use it. */
export const RUN_CANCELLED_ERROR = "Cancelled by user";

export const isCancellation = (row: {
  status: string;
  error: string | null;
} | null): boolean =>
  row?.status === "FAILED" && row.error === RUN_CANCELLED_ERROR;

export type JobDelegate = {
  //* Prisma delegates are structurally compatible with this, but not
  //* nominally, so the update arg is left open rather than importing the
  //* generated client into a module meant to stay lightweight.
  update: (args: {
    where: { id: string };
    data: Record<string, unknown>;
  }) => Promise<unknown>;
};

/** Column names for one job on one table. */
export type JobFields = {
  status: string;
  stage?: string;
  error?: string;
  endedAt?: string;
};

export const DEFAULT_JOB_FIELDS: JobFields = {
  status: "status",
  stage: "stage",
  error: "error",
  endedAt: "completedAt",
};

const pick = (
  fields: JobFields,
  values: { status?: string; stage?: string | null; error?: string | null; endedAt?: boolean }
): Record<string, unknown> => {
  const data: Record<string, unknown> = {};

  if (values.status !== undefined) data[fields.status] = values.status;
  if (values.stage !== undefined && fields.stage) data[fields.stage] = values.stage;
  if (values.error !== undefined && fields.error) data[fields.error] = values.error;
  if (values.endedAt && fields.endedAt) data[fields.endedAt] = new Date();

  return data;
};

/**
 * Marks a job as failed with a human-readable message.
 *
 * Returns without writing when the row is already cancelled, so the sentinel
 * survives the worker's own error handling. Overwriting it would restart the
 * run's cancellation checks and let the pipeline keep writing results.
 */
export const markJobFailed = async (
  model: JobDelegate,
  job: { id: string; status: string; error: string | null },
  error: unknown,
  { finalStatus = "FAILED", fields = DEFAULT_JOB_FIELDS }: { finalStatus?: string; fields?: JobFields } = {}
): Promise<void> => {
  if (isCancellation(job)) {
    return;
  }

  const message =
    error instanceof Error ? error.message : String(error ?? "Unknown error");

  await model.update({
    where: { id: job.id },
    data: {
      ...pick(fields, { status: finalStatus, stage: null }),
      ...(fields.error ? { [fields.error]: message.slice(0, 1000) } : {}),
      ...(fields.endedAt ? { [fields.endedAt]: new Date() } : {}),
    },
  });
};

/**
 * Marks a job as running and clears any prior error.
 *
 * Re-running a job that previously failed is a normal retry, so the old error
 * is cleared here rather than shown next to fresh progress.
 */
export const markJobRunning = async (
  model: JobDelegate,
  jobId: string,
  stage = "starting",
  fields: JobFields = DEFAULT_JOB_FIELDS
): Promise<void> => {
  await model.update({
    where: { id: jobId },
    data: pick(fields, { status: "RUNNING", stage, error: null }),
  });
};

/**
 * Marks a job complete, merging any extra columns to write alongside it.
 */
export const markJobCompleted = async (
  model: JobDelegate,
  jobId: string,
  data: Record<string, unknown>,
  fields: JobFields = DEFAULT_JOB_FIELDS
): Promise<void> => {
  await model.update({
    where: { id: jobId },
    data: {
      ...data,
      ...pick(fields, { status: "COMPLETED", stage: null, error: null, endedAt: true }),
    },
  });
};

/** True when a job is still expected to make progress. */
export const isActiveStatus = (status: string | null | undefined): boolean =>
  status === "PENDING" || status === "RUNNING";