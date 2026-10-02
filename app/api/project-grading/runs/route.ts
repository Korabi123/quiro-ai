import { auth } from "@/auth";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

/**
 * Lists grade runs for the current user, most recent first. Optionally filtered
 * to a single repository via `?repositoryId=`.
 */
export const GET = async (req: Request) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const repositoryId = searchParams.get("repositoryId");

    const runs = await prismadb.gradeRun.findMany({
      where: {
        userId: session.user.id,
        ...(repositoryId ? { repositoryId } : {}),
      },
      select: {
        id: true,
        commitSha: true,
        status: true,
        stage: true,
        overallScore: true,
        letterGrade: true,
        createdAt: true,
        completedAt: true,
        durationMs: true,
        error: true,
        repository: {
          select: {
            id: true,
            fullName: true,
            name: true,
            owner: true,
            language: true,
            stars: true,
          },
        },
        _count: { select: { findings: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      //* Flattened to match `GradeRunListItem`: the client only needs the
      //* finding count per row, and nesting a `repository` object on every
      //* entry of a per-repository list just repeats the same repository 100
      //* times.
      runs: runs.map((run) => ({
        id: run.id,
        commitSha: run.commitSha,
        status: run.status,
        stage: run.stage,
        overallScore: run.overallScore,
        letterGrade: run.letterGrade,
        createdAt: run.createdAt.toISOString(),
        completedAt: run.completedAt?.toISOString() ?? null,
        durationMs: run.durationMs,
        error: run.error,
        findingCount: run._count.findings,
      })),
    });
  } catch (error) {
    console.log("ERROR_LISTING_GRADE_RUNS: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
};