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
      return NextResponse.json({ progress: null, attempts: [] });
    }

    // First check if problem exists
    const problem = await prismadb.codingProblem.findUnique({
      where: { id },
    });

    if (!problem) {
      // Try finding by slug instead
      const problemBySlug = await prismadb.codingProblem.findUnique({
        where: { slug: id },
      });
      
      if (!problemBySlug) {
        return NextResponse.json({ progress: null, attempts: [] });
      }
      
      const problemId = problemBySlug.id;
      
      const progress = await prismadb.userProblemProgress.findUnique({
        where: {
          userId_problemId: {
            userId: session.user.id,
            problemId,
          },
        },
      });

      if (!progress) {
        return NextResponse.json({
          progress: {
            id: "",
            attempts: 0,
            solved: false,
            bestScore: null,
            lastAttempt: null,
            problem: {
              id: problemBySlug.id,
              slug: problemBySlug.slug,
              title: problemBySlug.title,
              difficulty: problemBySlug.difficulty,
            },
          },
          attempts: [],
        });
      }

      const attempts = await prismadb.codingAttempt.findMany({
        where: {
          userId: session.user.id,
          problemId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      });

      return NextResponse.json({
        progress: {
          id: progress.id,
          attempts: progress.attempts,
          solved: progress.solved,
          bestScore: progress.bestScore,
          lastAttempt: progress.lastAttempt,
          problem: {
            id: problemBySlug.id,
            slug: problemBySlug.slug,
            title: problemBySlug.title,
            difficulty: problemBySlug.difficulty,
          },
        },
        attempts,
      });
    }

    // Problem exists by id
    const progress = await prismadb.userProblemProgress.findUnique({
      where: {
        userId_problemId: {
          userId: session.user.id,
          problemId: id,
        },
      },
    });

    if (!progress) {
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
      progress: {
        id: progress.id,
        attempts: progress.attempts,
        solved: progress.solved,
        bestScore: progress.bestScore,
        lastAttempt: progress.lastAttempt,
        problem: {
          id: problem.id,
          slug: problem.slug,
          title: problem.title,
          difficulty: problem.difficulty,
        },
      },
      attempts,
    });
  } catch (error) {
    console.log("ERROR FETCHING PROBLEM: ", error);
    return NextResponse.json({ progress: null, attempts: [] });
  }
};
