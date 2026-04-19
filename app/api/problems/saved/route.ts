import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  try {
    const session = await auth.api.getSession(req);

    if (!session) {
      return NextResponse.json([]);
    }

    const progress = await prismadb.userProblemProgress.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        problem: true,
      },
      orderBy: {
        lastAttempt: "desc",
      },
    });

    const savedProblems = progress.map((p) => ({
      id: p.problem.id,
      slug: p.problem.slug,
      title: p.problem.title,
      difficulty: p.problem.difficulty,
      attempts: p.attempts,
      solved: p.solved,
      bestScore: p.bestScore,
      lastAttempt: p.lastAttempt,
      createdAt: p.problem.createdAt,
    }));

    return NextResponse.json(savedProblems);
  } catch (error) {
    console.log("ERROR FETCHING SAVED PROBLEMS: ", error);
    return NextResponse.json([]);
  }
};