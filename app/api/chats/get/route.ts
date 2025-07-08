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

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!meetingId) {
      return new NextResponse("Missing meetingId", { status: 400 });
    }

    const chats = await prismadb.chat.findMany({
      where: {
        meetingId,
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
