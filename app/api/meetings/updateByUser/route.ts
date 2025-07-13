import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const { meetingTitle, agentName } = await req.json();
    const { searchParams } = new URL(req.url);
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    const meetingId = searchParams.get("meetingId");

    if (!meetingId || !meetingTitle || !agentName) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const agentDB = await prismadb.agent.findFirst({
      where: {
        name: agentName,
        userId: session.user.id,
      }
    });

    if (!agentDB) {
      return new NextResponse("Agent not found", { status: 400 });
    }

    const meeting = await prismadb.meeting.update({
      where: {
        id: meetingId,
        userId: session.user.id,
      },
      data: {
        title: meetingTitle,
        agentId: agentDB?.id,
      }
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.log("ERROR_UPDATING_MEETING_BY_USER: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
