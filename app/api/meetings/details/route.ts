import { auth } from "@/auth";
import { NextResponse } from "next/server";

import { VapiClient } from "@vapi-ai/server-sdk";
import prismadb from "@/lib/prismadb";

export async function PATCH(req: Request) {
  const vapi = new VapiClient({
    token: process.env.VAPI_TOKEN!,
  });

  try {
    const { searchParams } = new URL(req.url);

    const session = await auth.api.getSession({
      headers: req.headers,
    });

    const meetingId = searchParams.get("meetingId");
    const vapiAgent = searchParams.get("vapiAgent");

    if (!meetingId || !vapiAgent) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const vapiMeetingsByAgent = await vapi.calls.list({
      assistantId: vapiAgent,
      limit: 1,
    });

    const vapiMeeting = vapiMeetingsByAgent[0];

    console.log("transcript: ", vapiMeeting.artifact?.transcript);
    console.log("summary: ", vapiMeeting.analysis?.summary);

    const meeting = await prismadb.meeting.update({
      where: {
        id: meetingId,
        userId: session.user.id,
      },
      data: {
        callTranscript: vapiMeeting.artifact?.transcript,
        transcript: vapiMeeting.artifact?.transcript,
        summary: vapiMeeting.analysis?.summary,
        status: "COMPLETED",
      }
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.log("ERROR_UPDATING_MEETING: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
