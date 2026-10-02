import { auth } from "@/auth";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { CATEGORIES, type GradePayload } from "@/lib/grading/schema";

/**
 * Cross-repository insights: the user's average score per category and which
 * dimension is dragging the average down the most.
 */
export const GET = async (req: Request) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const runs = await prismadb.gradeRun.findMany({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
      },
      select: {
        id: true,
        overallScore: true,
        letterGrade: true,
        grade: true,
        completedAt: true,
        repository: { select: { id: true, fullName: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 50,
    });

    if (runs.length === 0) {
      return NextResponse.json({
        sampleSize: 0,
        overallAverage: null,
        categories: CATEGORIES.map((key) => ({ key, average: null, count: 0 })),
        weakestCategory: null,
        strongestCategory: null,
        timeline: [],
      });
    }

    //* One run per repository: the most recent completed grade, otherwise a
    //* frequently-regraded repo would dominate the average.
    const latestByRepository = new Map<string, (typeof runs)[number]>();
    for (const run of runs) {
      if (!latestByRepository.has(run.repository.id)) {
        latestByRepository.set(run.repository.id, run);
      }
    }
    const samples = [...latestByRepository.values()];

    const scoreTotals = new Map<string, { total: number; count: number }>();

    for (const key of CATEGORIES) {
      scoreTotals.set(key, { total: 0, count: 0 });
    }

    for (const run of samples) {
      const payload = run.grade as GradePayload | null;

      for (const key of CATEGORIES) {
        const bucket = scoreTotals.get(key);
        const entry = payload?.categories?.find(
          (category) => category.key === key
        );

        if (bucket && entry) {
          bucket.total += entry.score;
          bucket.count += 1;
        }
      }
    }

    const categories = CATEGORIES.map((key) => {
      const bucket = scoreTotals.get(key)!;
      return {
        key,
        average:
          bucket.count > 0
            ? Math.round(bucket.total / bucket.count)
            : null,
        count: bucket.count,
      };
    });

    const scored = categories.filter(
      (category): category is { key: (typeof CATEGORIES)[number]; average: number; count: number } =>
        category.average !== null
    );

    const sorted = [...scored].sort((a, b) => a.average - b.average);

    const overallScores = samples
      .map((run) => run.overallScore)
      .filter((score): score is number => score !== null);

    return NextResponse.json({
      sampleSize: samples.length,
      overallAverage:
        overallScores.length > 0
          ? Math.round(
              overallScores.reduce((sum, score) => sum + score, 0) /
                overallScores.length
            )
          : null,
      categories,
      weakestCategory: sorted[0] ?? null,
      strongestCategory: sorted.at(-1) ?? null,
      //* Newest first, capped for chart rendering.
      timeline: samples.slice(0, 12).map((run) => ({
        runId: run.id,
        repositoryId: run.repository.id,
        fullName: run.repository.fullName,
        score: run.overallScore,
        letterGrade: run.letterGrade,
        completedAt: run.completedAt,
      })),
    });
  } catch (error) {
    console.log("ERROR_FETCHING_GRADING_INSIGHTS: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
};