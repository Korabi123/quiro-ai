import { auth } from "@/auth";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { getQuotaState } from "@/lib/grading/limits";

/**
 * The project-grading index payload: every linked repository with its most
 * recent completed grade and run history summary.
 */
export const GET = async (req: Request) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const [repositories, quota] = await Promise.all([
      prismadb.repository.findMany({
        where: { userId: session.user.id },
        select: {
          id: true,
          fullName: true,
          name: true,
          owner: true,
          description: true,
          language: true,
          defaultBranch: true,
          stars: true,
          pushedAt: true,
          lastSyncedAt: true,
          createdAt: true,
          runs: {
            select: {
              id: true,
              status: true,
              stage: true,
              commitSha: true,
              overallScore: true,
              letterGrade: true,
              createdAt: true,
              completedAt: true,
              error: true,
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      getQuotaState(session.user.id),
    ]);

    return NextResponse.json({
      repositories: repositories.map((repository) => {
        //* runs arrive newest-first from Prisma.
        const completedRuns = repository.runs.filter(
          (run) => run.status === "COMPLETED" && run.overallScore !== null
        );

        const latestCompleted = completedRuns[0] ?? null;
        const previousCompleted = completedRuns[1] ?? null;
        const activeRun = repository.runs.find(
          (run) => run.status === "PENDING" || run.status === "RUNNING"
        );

        const scores = completedRuns.map((run) => run.overallScore as number);
        const averageScore =
          scores.length > 0
            ? Math.round(
                scores.reduce((sum, score) => sum + score, 0) / scores.length
              )
            : null;

        return {
          ...repository,
          latestRun: latestCompleted,
          activeRun: activeRun ?? null,
          runCount: repository.runs.length,
          completedRunCount: completedRuns.length,
          averageScore,
          scoreDelta:
            latestCompleted && previousCompleted
              ? (latestCompleted.overallScore ?? 0) -
                (previousCompleted.overallScore ?? 0)
              : null,
        };
      }),
      quota: {
        plan: quota.plan,
        usedToday: quota.usedToday,
        dailyLimit: quota.dailyLimit,
        remaining: quota.remaining,
        linkedRepos: quota.linkedRepos,
        repoLimit: quota.repoLimit,
        repoCapReached: quota.repoCapReached,
        quotaExhausted: quota.quotaExhausted,
      },
    });
  } catch (error) {
    console.log("ERROR_LISTING_LINKED_REPOS: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
};