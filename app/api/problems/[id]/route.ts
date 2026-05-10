import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const session = await auth.api.getSession(req);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!id) {
      return new NextResponse("Problem ID required", { status: 400 });
    }

    const progress = await prismadb.userProblemProgress.findUnique({
      where: {
        userId_problemId: {
          userId: session.user.id,
          problemId: id,
        },
      },
      include: {
        problem: true,
      },
    });

    if (!progress) {
      const problem = await prismadb.codingProblem.findUnique({
        where: { id },
      });
      
      if (!problem) {
        return new NextResponse("Problem not found", { status: 404 });
      }
      
      return NextResponse.json({
        progress: {
          id: "",
          attempts: 0,
          solved: false,
          bestScore: null,
          lastAttempt: null,
          problem: {
            id: problem.id,
            slug: problem.slug,
            title: problem.title,
            difficulty: problem.difficulty,
          },
        },
        attempts: [],
      });
    }

    const attempts = await prismadb.codingAttempt.findMany({
      where: {
        userId: session.user.id,
        problemId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    return NextResponse.json({
      progress,
      attempts,
    });
  } catch (error) {
    console.log("ERROR FETCHING PROBLEM: ", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};