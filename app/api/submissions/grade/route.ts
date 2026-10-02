import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";
import { inngest, eventIds } from "@/lib/inngest/client";
import { markJobFailed } from "@/lib/inngest/jobs";

const GRADE_JOB_FIELDS = {
  status: "gradeStatus",
  stage: "gradeStage",
  error: "gradeError",
} as const;

/**
 * Enqueues AI grading for a coding attempt.
 *
 * The previous implementation made a model call inline and, worse, fabricated
 * 50/50/50 scores if the model's JSON failed to parse - persisting those as a
 * "review" rather than failing the request. The work is now durable: a failed
 * parse throws, the job is marked FAILED, and Inngest can retry, so no grades
 * are invented.
 */
export const POST = async (req: Request) => {
  try {
    const { attemptId } = await req.json();
    const session = await auth.api.getSession(req);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!attemptId) {
      return new NextResponse("attemptId is required", { status: 400 });
    }

    const attempt = await prismadb.codingAttempt.findFirst({
      where: { id: attemptId, userId: session.user.id },
      select: { id: true, gradeStatus: true, grading: { select: { id: true } } },
    });

    if (!attempt) {
      return new NextResponse("Attempt not found", { status: 404 });
    }

    //* Already graded. Do not overwrite.
    if (attempt.grading || attempt.gradeStatus === "COMPLETED") {
      return NextResponse.json({ status: "COMPLETED", alreadyGraded: true }, { status: 200 });
    }

    if (attempt.gradeStatus === "PENDING" || attempt.gradeStatus === "RUNNING") {
      return NextResponse.json({ status: attempt.gradeStatus, alreadyQueued: true }, { status: 202 });
    }

    await prismadb.codingAttempt.update({
      where: { id: attemptId },
      data: { gradeStatus: "PENDING", gradeStage: "queued", gradeError: null },
    });

    try {
      await inngest.send({
        name: "submissions/grade",
        data: { attemptId, userId: session.user.id },
        id: eventIds.codeGrade(attemptId),
      });
    } catch (error) {
      await markJobFailed(
        prismadb.codingAttempt,
        { id: attemptId, status: "PENDING", error: null },
        error,
        { fields: GRADE_JOB_FIELDS }
      );
      return new NextResponse("Internal server error", { status: 500 });
    }

    return NextResponse.json({ status: "PENDING" }, { status: 202 });
  } catch (error) {
    console.log("ERROR QUEUING CODE GRADE: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
};