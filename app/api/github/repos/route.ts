import { auth } from "@/auth";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { getGitHubClientForUser, hasGitHubConnection } from "@/lib/github-server";
import { GitHubError } from "@/lib/github";
import { getQuotaState } from "@/lib/grading/limits";

export const maxDuration = 30;

/**
 * Lists the public repositories available to link, annotated with whether they
 * are already linked and whether they hold a completed grade.
 *
 * `?owner=login` lists a specific user or org instead of the viewer's own
 * repositories.
 */
export const GET = async (req: Request) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const owner = searchParams.get("owner");

    const quota = await getQuotaState(session.user.id);
    const connected = await hasGitHubConnection(session.user.id);

    const client = await getGitHubClientForUser(session.user.id);

    let repos;
    try {
      repos = owner
        ? await client.listReposForOwner(owner)
        : await client.listRepos();
    } catch (error) {
      if (error instanceof GitHubError && error.status === 401) {
        return NextResponse.json(
          {
            message:
              "Your GitHub connection has expired. Remove and re-add GitHub under Settings to continue.",
            code: "GITHUB_TOKEN_EXPIRED",
          },
          { status: 401 }
        );
      }
      throw error;
    }

    const linked = await prismadb.repository.findMany({
      where: { userId: session.user.id },
      select: {
        githubId: true,
        updatedAt: true,
        runs: {
          where: { status: "COMPLETED" },
          select: { overallScore: true, letterGrade: true, completedAt: true },
          orderBy: { completedAt: "desc" },
          take: 1,
        },
      },
    });

    const linkedByGithubId = new Map(
      linked.map((repo) => [repo.githubId, repo])
    );

    return NextResponse.json({
      connected,
      quota: {
        plan: quota.plan,
        linkedRepos: quota.linkedRepos,
        repoLimit: quota.repoLimit,
        repoCapReached: quota.repoCapReached,
        remaining: quota.remaining,
        dailyLimit: quota.dailyLimit,
        usedToday: quota.usedToday,
      },
      repositories: repos.map((repo) => {
        const match = linkedByGithubId.get(repo.id);
        const latestRun = match?.runs[0];

        return {
          ...repo,
          pushedAt: repo.pushedAt ? repo.pushedAt.toISOString() : null,
          isLinked: Boolean(match),
          lastGradedAt: latestRun?.completedAt
            ? latestRun.completedAt.toISOString()
            : null,
          lastScore: latestRun?.overallScore ?? null,
          lastLetterGrade: latestRun?.letterGrade ?? null,
        };
      }),
    });
  } catch (error) {
    console.log("ERROR_LISTING_GITHUB_REPOS: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
};