import { auth } from "@/auth";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { getQuotaState, isProSubscriber } from "@/lib/grading/limits";
import { getGitHubClientForUser } from "@/lib/github-server";
import { GitHubError } from "@/lib/github";
import { gradingEventId, inngest } from "@/lib/inngest/client";

export const maxDuration = 30;

/**
 * Starts a grading run for a linked repository.
 *
 * Returns immediately with a run id; the pipeline itself executes as an Inngest
 * function. If the repository HEAD has already been graded the existing run is
 * returned rather than re-running, unless `force` is set.
 */
export const POST = async (req: Request) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const repositoryId =
      typeof body?.repositoryId === "string" ? body.repositoryId : null;
    const force = body?.force === true;

    if (!repositoryId) {
      return new NextResponse("Repository ID is required", { status: 400 });
    }

    //* Project grading is a paid feature; gate before any spend.
    if (!(await isProSubscriber(session.user.id))) {
      return NextResponse.json(
        {
          message:
            "Project grading is a Pro feature. Upgrade your plan to analyse your GitHub repositories.",
          code: "PRO_REQUIRED",
        },
        { status: 402 }
      );
    }

    const repository = await prismadb.repository.findFirst({
      where: { id: repositoryId, userId: session.user.id },
      select: {
        id: true,
        fullName: true,
        githubId: true,
        name: true,
        defaultBranch: true,
      },
    });

    if (!repository) {
      return new NextResponse("Repository not found", { status: 404 });
    }

    const quota = await getQuotaState(session.user.id);

    if (quota.activeRun) {
      return NextResponse.json(
        {
          message: "A grading run is already in progress. Please wait for it to finish.",
          code: "RUN_IN_PROGRESS",
          runId: quota.activeRun.id,
        },
        { status: 409 }
      );
    }

    if (quota.quotaExhausted) {
      return NextResponse.json(
        {
          message: `You have used all ${quota.dailyLimit} grading runs for today. They reset in 24 hours.`,
          code: "QUOTA_EXHAUSTED",
        },
        { status: 429 }
      );
    }

    //* Resolve the current HEAD so runs can be cached per commit.
    const client = await getGitHubClientForUser(session.user.id);

    let commitSha: string;
    try {
      commitSha = await client.getHeadSha(
        repository.fullName,
        repository.defaultBranch
      );
    } catch (error) {
      if (error instanceof GitHubError) {
        return NextResponse.json(
          {
            message:
              error.status === 404
                ? "That repository is no longer available. It may have been deleted or made private."
                : error.message,
            code: "GITHUB_ERROR",
          },
          { status: 400 }
        );
      }
      throw error;
    }

    if (!force) {
      const cached = await prismadb.gradeRun.findUnique({
        where: {
          repositoryId_commitSha: {
            repositoryId: repository.id,
            commitSha,
          },
        },
        select: {
          id: true,
          status: true,
          overallScore: true,
          letterGrade: true,
          completedAt: true,
        },
      });

      if (cached?.status === "COMPLETED") {
        return NextResponse.json({ runId: cached.id, cached: true, run: cached });
      }

      if (cached?.status === "RUNNING" || cached?.status === "PENDING") {
        return NextResponse.json({
          runId: cached.id,
          cached: false,
          run: cached,
        });
      }
    }

    //* Upsert so the unique (repositoryId, commitSha) constraint is respected
    //* when force-regrading a commit that has already been graded.
    const run = await prismadb.gradeRun.upsert({
      where: {
        repositoryId_commitSha: {
          repositoryId: repository.id,
          commitSha,
        },
      },
      create: {
        userId: session.user.id,
        repositoryId: repository.id,
        commitSha,
        status: "PENDING",
        stage: "queued",
      },
      update: {
        status: "PENDING",
        stage: "queued",
        error: null,
        completedAt: null,
      },
      select: { id: true, status: true },
    });

    await inngest.send({
      name: "project-grading/run",
      data: {
        runId: run.id,
        userId: session.user.id,
        repositoryId: repository.id,
        fullName: repository.fullName,
      },
      id: gradingEventId(run.id),
    });

    return NextResponse.json(
      { runId: run.id, cached: false, quotaRemaining: quota.remaining - 1 },
      { status: 202 }
    );
  } catch (error) {
    console.log("ERROR_STARTING_GRADE_RUN: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
};