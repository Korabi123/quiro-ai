import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { title, agent } = await req.json();
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    const subscription = await auth.api.listActiveSubscriptions({
      headers: req.headers,
    });

    console.log("SUBSCRIPTION: ", subscription);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!title || !agent) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const agentDB = await prismadb.agent.findFirst({
      where: {
        name: agent,
        userId: session.user.id,
      }
    });

    if (!agentDB) {
      return new NextResponse("Agent not found", { status: 400 });
    }

    const existingMeetings = await prismadb.meeting.findMany({
      where: {
        userId: session.user.id,
      }
    })

    if (subscription.length === 0 && existingMeetings.length === 5) {
      return new NextResponse("Pro plan required", { status: 402 });
    }

    const meeting = await prismadb.meeting.create({
      data: {
        title,
        agentId: agentDB.id,
        userId: session.user.id,
      }
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.log("ERROR_CREATING_MEETING: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
