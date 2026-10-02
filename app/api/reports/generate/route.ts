import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";
import { inngest, eventIds } from "@/lib/inngest/client";
import { markJobFailed } from "@/lib/inngest/jobs";

/**
 * Enqueues report question generation instead of generating inline.
 *
 * The previous implementation made a large model call and wrote up to 18
 * question/rubric rows inside the request. It had no failure state either:
 * `report.jobStatus` did not exist, so a generation that threw left a report
 * that looked exactly like one that had never been started.
 *
 * Returns 202 with the current status so the client can start polling without
 * having to distinguish "queued" from "finished" by inspecting other fields.
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

  const report = await prismadb.report.findFirst({
    where: { id: reportId, userId: session.user.id },
    select: { id: true, jobStatus: true, _count: { select: { questions: true } } },
  });

  if (!report) {
    return new NextResponse("Report not found", { status: 404 });
  }

  //* Already generated. A *completed* job with questions is final; an
  //* incomplete one is deliberately re-enqueued so a partial or failed run
  //* repairs itself instead of leaving the report permanently stuck.
  if (report.jobStatus === "COMPLETED" && report._count.questions > 0) {
    return NextResponse.json({ status: "COMPLETED", alreadyGenerated: true }, { status: 200 });
  }

  if (report.jobStatus === "PENDING" || report.jobStatus === "RUNNING") {
    //* A job is already in flight. Inngest dedupes on the event id too, but
    //* short-circuiting here avoids a pointless queue write.
    return NextResponse.json({ status: report.jobStatus, alreadyQueued: true }, { status: 202 });
  }

  try {
    await prismadb.report.update({
      where: { id: reportId },
      data: { jobStatus: "PENDING", jobStage: "queued", jobError: null },
    });

    await inngest.send({
      name: "reports/generate",
      data: { reportId, userId: session.user.id },
      id: eventIds.reportGenerate(reportId),
    });

    return NextResponse.json({ status: "PENDING" }, { status: 202 });
  } catch (error) {
    //* The enqueue failed, so no worker will ever pick this up. Clear the
    //* PENDING status we just wrote, otherwise the report sits in "queued"
    //* forever and the guard above refuses every future retry.
    await markJobFailed(
      prismadb.report,
      { id: reportId, status: "PENDING", error: null },
      error,
      { fields: { status: "jobStatus", stage: "jobStage", error: "jobError", endedAt: "jobEndedAt" } }
    );

    return new NextResponse("Internal server error", { status: 500 });
  }
}