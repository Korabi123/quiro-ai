import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prismadb.user.findUnique({
      where: { id: session.user.id },
      select: {
        streak: true,
        lastStreakUpdate: true,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const now = new Date();
    const last = user.lastStreakUpdate ? new Date(user.lastStreakUpdate) : null;
    if (last) {
      const msDiff = now.getTime() - last.getTime();
      const twentyFourHours = 1000 * 60 * 60 * 24;
      if (msDiff >= twentyFourHours && user.streak > 0) {
        const updated = await prismadb.user.update({
          where: { id: session.user.id },
          data: { streak: 0 },
          select: { streak: true, lastStreakUpdate: true },
        });
        return NextResponse.json(updated);
      }
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching streak:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
