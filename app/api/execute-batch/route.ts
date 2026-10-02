import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";
import { inngest, eventIds } from "@/lib/inngest/client";
import { markJobFailed } from "@/lib/inngest/jobs";

const EXECUTION_JOB_FIELDS = {
  status: "jobStatus",
  stage: "jobStage",
  error: "jobError",
  endedAt: "jobEndedAt",
} as const;

/**
 * Queues a test-batch run.
 *
 * This endpoint used to execute the batch inline: up to 33 sequential Judge0
 * calls inside the request, ~11 minutes, with the client waiting on an open
 * connection and no way to distinguish a slow run from a hung one. It now
 * creates a `CodeExecution` row and returns 202; results are fetched from the
 * same route's GET once the job settles.
 */
export const POST = async (req: Request) => {
  try {
    const session = await auth.api.getSession(req);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { code, language, testCases, problemContent, generateHidden } = await req.json();

    if (!code || !language || !Array.isArray(testCases)) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    //* Bounded so a client cannot enqueue an arbitrarily expensive job.
    if (testCases.length > 60) {
      return new NextResponse("Too many test cases", { status: 400 });
    }

    const execution = await prismadb.codeExecution.create({
      data: {
        userId: session.user.id,
        code,
        language,
        testCases,
        problemContent: problemContent ?? null,
        generateHidden: Boolean(generateHidden),
      },
      select: { id: true },
    });

    try {
      await inngest.send({
        name: "submissions/execute-batch",
        data: { executionId: execution.id, userId: session.user.id },
        id: eventIds.codeExecuteBatch(execution.id),
      });
    } catch (error) {
      //* No worker will ever pick this up, so the row must not be left claiming
      //* to be queued - the client would poll it forever.
      await markJobFailed(
        prismadb.codeExecution,
        { id: execution.id, status: "PENDING", error: null },
        error,
        { fields: EXECUTION_JOB_FIELDS }
      );

      return NextResponse.json({ error: "Failed to queue test run" }, { status: 500 });
    }

    return NextResponse.json({ executionId: execution.id, status: "PENDING" }, { status: 202 });
  } catch (error) {
    console.log("ERROR QUEUING BATCH: ", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
};

/**
 * Polls a queued batch.
 *
 * Scoped to the caller: an execution id from another account returns 404 rather
 * than an empty result, so ids cannot be probed.
 */
export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const executionId = searchParams.get("id");

  const session = await auth.api.getSession(req);

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!executionId) {
    return new NextResponse("Execution ID not found", { status: 404 });
  }

  const execution = await prismadb.codeExecution.findFirst({
    where: { id: executionId, userId: session.user.id },
    select: { jobStatus: true, jobStage: true, jobError: true, results: true, summary: true },
  });

  if (!execution) {
    return new NextResponse("Execution not found", { status: 404 });
  }

  //* `results`/`summary` are only populated once COMPLETED, so a client can
  //* treat their absence as "still running" without inspecting the status.
  return NextResponse.json({
    status: execution.jobStatus,
    stage: execution.jobStage,
    error: execution.jobError,
    results: execution.jobStatus === "COMPLETED" ? execution.results : undefined,
    summary: execution.jobStatus === "COMPLETED" ? execution.summary : undefined,
  });
};