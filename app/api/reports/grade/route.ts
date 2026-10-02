import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";
import { inngest, eventIds } from "@/lib/inngest/client";
import { markJobFailed } from "@/lib/inngest/jobs";

/**
 * Enqueues report grading instead of grading inline.
 *
 * The previous implementation made a model call and then issued up to 18
 * per-question updates plus a report update, all inside the request, while the
 * client sat behind a spinner.
 *
 * The answers travel with the event because they exist only in the client's
 * memory until grading persists them; nothing stores them earlier.
 */
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const reportId = searchParams.get("id");

  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!reportId) {
    return new NextResponse("Report ID not found", { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const answers = body?.answers;

  if (!Array.isArray(answers) || answers.length === 0) {
    return new NextResponse("Invalid request", { status: 400 });
  }

  const report = await prismadb.report.findFirst({
    where: { id: reportId, userId: session.user.id },
    select: { id: true, jobStatus: true, summary: true },
  });

  if (!report) {
    return new NextResponse("Report not found", { status: 404 });
  }

  //* Already graded. Re-running would overwrite the stored result with a
  //* different model's output for the same answers.
  if (report.jobStatus === "COMPLETED" && report.summary) {
    return NextResponse.json({ status: "COMPLETED", alreadyGraded: true }, { status: 200 });
  }

  if (report.jobStatus === "PENDING" || report.jobStatus === "RUNNING") {
    return NextResponse.json({ status: report.jobStatus, alreadyQueued: true }, { status: 202 });
  }

  try {
    await prismadb.report.update({
      where: { id: reportId },
      data: { jobStatus: "PENDING", jobStage: "queued", jobError: null },
    });

    await inngest.send({
      name: "reports/grade",
      data: { reportId, userId: session.user.id, answers },
      id: eventIds.reportGrade(reportId),
    });

    return NextResponse.json({ status: "PENDING" }, { status: 202 });
  } catch (error) {
    await markJobFailed(
      prismadb.report,
      { id: reportId, status: "PENDING", error: null },
      error,
      { fields: { status: "jobStatus", stage: "jobStage", error: "jobError", endedAt: "jobEndedAt" } }
    );

    return new NextResponse("Internal server error", { status: 500 });
  }
}