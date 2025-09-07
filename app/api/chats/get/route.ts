import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    const meetingId = searchParams.get("meetingId");
    const reportId = searchParams.get("reportId");

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!meetingId && !reportId) {
      return new NextResponse("Bad request - either meetingId or reportId is required", { status: 400 });
    }

    const chats = await prismadb.chat.findMany({
      where: {
        OR: [
          { meetingId: meetingId || undefined },
          { reportId: reportId || undefined }
        ]
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(chats);
  } catch (error) {
    console.log("Error getting chats", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
