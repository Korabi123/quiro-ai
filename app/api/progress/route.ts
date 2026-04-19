import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  try {
    const session = await auth.api.getSession(req);

    if (!session) {
      return NextResponse.json({ solved: [], attempted: [] });
    }

    const progress = await prismadb.userProblemProgress.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        problemId: true,
        solved: true,
        attempts: true,
        bestScore: true,
      },
    });

    const solved = progress.filter(p => p.solved).map(p => p.problemId);
    const attempted = progress.filter(p => p.attempts > 0 && !p.solved).map(p => p.problemId);

    return NextResponse.json({ solved, attempted, progress });
  } catch (error) {
    console.log("ERROR FETCHING PROGRESS: ", error);
    return NextResponse.json({ solved: [], attempted: [] });
  }
};