import { auth } from "@/auth";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { getGitHubClientForUser } from "@/lib/github-server";
import { GitHubError } from "@/lib/github";
import { getQuotaState, MAX_FULL_NAME_LENGTH } from "@/lib/grading/limits";

/**
 * Links a public repository so it can be graded.
 *
 * The repository is resolved through the GitHub API rather than trusted from the
 * request body: the client only sends a `fullName`, and the stored row is what
 * the grading pipeline and UI both read back, so an unverified name would let a
 * caller link a repository that does not exist or is private.
 */
export const POST = async (req: Request) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";

    if (!fullName || fullName.length > MAX_FULL_NAME_LENGTH) {
      return new NextResponse("Repository name is required", { status: 400 });
    }

    //* Enforce the linked-repo cap before spending a GitHub call, otherwise a
    //* user at the limit could still resolve repos and only fail on insert.
    const quota = await getQuotaState(session.user.id);

    const client = await getGitHubClientForUser(session.user.id);

    let repo;
    try {
      repo = await client.getRepo(fullName);
    } catch (error) {
      if (error instanceof GitHubError) {
        return NextResponse.json(
          {
            message:
              error.status === 404
                ? "That repository could not be found. Check the name and make sure it is public."
                : error.message,
            code: "GITHUB_ERROR",
          },
          { status: error.status === 404 ? 404 : 400 }
        );
      }
      throw error;
    }

    //* Existing rows are returned untouched rather than re-synced: linking is
    //* idempotent, and the `@@unique([userId, githubId])` constraint means a
    //* second insert of the same repo would otherwise throw.
    const existing = await prismadb.repository.findUnique({
      where: {
        userId_githubId: {
          userId: session.user.id,
          githubId: repo.id,
        },
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({
        id: existing.id,
        alreadyLinked: true,
        quota: { linkedRepos: quota.linkedRepos, repoLimit: quota.repoLimit },
      });
    }

    if (quota.repoCapReached) {
      return NextResponse.json(
        {
          message: `You have reached your limit of ${quota.repoLimit} linked repositories. Unlink one to add another.`,
          code: "REPO_CAP_REACHED",
        },
        { status: 409 }
      );
    }

    const created = await prismadb.repository.create({
      data: {
        userId: session.user.id,
        githubId: repo.id,
        fullName: repo.fullName,
        name: repo.name,
        owner: repo.owner,
        description: repo.description,
        language: repo.language,
        isFork: repo.isFork,
        stars: repo.stars,
        defaultBranch: repo.defaultBranch,
        pushedAt: repo.pushedAt,
      },
      select: { id: true },
    });

    return NextResponse.json(
      {
        id: created.id,
        alreadyLinked: false,
        quota: {
          linkedRepos: quota.linkedRepos + 1,
          repoLimit: quota.repoLimit,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("ERROR_LINKING_GITHUB_REPO: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
};

/**
 * Unlinks a repository. Scoped to the caller's own rows, and cascades to the
 * associated grade runs and findings via the schema.
 */
export const DELETE = async (req: Request) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const repositoryId = searchParams.get("repositoryId");

    if (!repositoryId) {
      return new NextResponse("Repository ID is required", { status: 400 });
    }

    const { count } = await prismadb.repository.deleteMany({
      where: {
        id: repositoryId,
        userId: session.user.id,
      },
    });

    if (count === 0) {
      return new NextResponse("Repository not found", { status: 404 });
    }

    return NextResponse.json({ message: "Repository unlinked" });
  } catch (error) {
    console.log("ERROR_UNLINKING_GITHUB_REPO: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
};