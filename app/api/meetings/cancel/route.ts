import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    const idParam = searchParams.get("id");

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!idParam) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const meeting = await prismadb.meeting.update({
      data: {
        status: "CANCELED"
      },
      where: {
        id: idParam,
        userId: session.user.id,
      }
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.log("ERROR_CANCELING_MEETING: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
