import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    const meetingId = searchParams.get("meetingId");

    if (!meetingId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const meeting = await prismadb.meeting.delete({
      where: {
        id: meetingId,
        userId: session.user.id,
      }
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.log("ERROR_DELETING_MEETING: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
