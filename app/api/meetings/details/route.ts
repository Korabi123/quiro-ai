import { auth } from "@/auth";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { inngest, eventIds } from "@/lib/inngest/client";

/**
 * Enqueues fetching of completed meeting artifacts from Vapi.
 */
export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const session = await auth.api.getSession({ headers: req.headers });

    const meetingId = searchParams.get("meetingId");
    const vapiAgent = searchParams.get("vapiAgent");

    if (!meetingId || !vapiAgent) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const meeting = await prismadb.meeting.findFirst({
      where: { id: meetingId, userId: session.user.id },
      select: { id: true, jobStatus: true },
    });

    if (!meeting) {
      return new NextResponse("Meeting not found", { status: 404 });
    }

    if (meeting.jobStatus === "COMPLETED") {
      return NextResponse.json({ status: "COMPLETED", alreadyCompleted: true }, { status: 200 });
    }

    if (meeting.jobStatus === "PENDING" || meeting.jobStatus === "RUNNING") {
      return NextResponse.json({ status: meeting.jobStatus, alreadyQueued: true }, { status: 202 });
    }

    await prismadb.meeting.update({
      where: { id: meetingId },
      data: { jobStatus: "PENDING", jobStage: "queued", jobError: null },
    });

    await inngest.send({
      name: "meetings/details",
      data: { meetingId, userId: session.user.id, vapiAgent },
      id: eventIds.meetingDetails(meetingId),
    });

    return NextResponse.json({ status: "PENDING" }, { status: 202 });
  } catch (error) {
    console.log("ERROR QUEUING MEETING DETAILS: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
