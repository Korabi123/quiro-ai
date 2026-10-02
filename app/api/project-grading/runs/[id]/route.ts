import { auth } from "@/auth";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { RUN_CANCELLED_ERROR } from "@/lib/inngest/client";

/**
 * Fetches a single grade run with its findings and parsed payload.
 * Scoped to the caller's own runs.
 */
export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const run = await prismadb.gradeRun.findFirst({
      where: { id, userId: session.user.id },
      select: {
        id: true,
        commitSha: true,
        status: true,
        stage: true,
        overallScore: true,
        letterGrade: true,
        summary: true,
        grade: true,
        error: true,
        durationMs: true,
        llmCalls: true,
        createdAt: true,
        completedAt: true,
        repository: {
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
          },
        },
        findings: {
          select: {
            id: true,
            category: true,
            severity: true,
            title: true,
            detail: true,
            fix: true,
            path: true,
            line: true,
          },
        },
      },
    });

    if (!run) {
      return new NextResponse("Grade run not found", { status: 404 });
    }

    return NextResponse.json({
      ...run,
      findings: [...run.findings].sort(
        (a, b) => severityRank(a.severity) - severityRank(b.severity)
      ),
    });
  } catch (error) {
    console.log("ERROR_FETCHING_GRADE_RUN: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
};

/**
 * Cancels an in-progress run or deletes a finished one.
 *
 * A PENDING/RUNNING Inngest step cannot be killed mid-execution, so cancelling
 * is cooperative: the row is marked FAILED with `RUN_CANCELLED_ERROR`, and the
 * worker aborts at its next progress checkpoint and refuses to persist. Deleting
 * is only allowed once the run is terminal.
 */
export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const run = await prismadb.gradeRun.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, status: true },
    });

    if (!run) {
      return new NextResponse("Grade run not found", { status: 404 });
    }

    if (run.status === "PENDING" || run.status === "RUNNING") {
      await prismadb.gradeRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          stage: null,
          error: RUN_CANCELLED_ERROR,
          completedAt: new Date(),
        },
      });
      return NextResponse.json({ status: "cancelled" });
    }

    await prismadb.gradeRun.delete({ where: { id: run.id } });

    return NextResponse.json({ status: "deleted" });
  } catch (error) {
    console.log("ERROR_DELETING_GRADE_RUN: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
};

const severityRank = (severity: string): number =>
  severity === "HIGH"
    ? 0
    : severity === "MEDIUM"
      ? 1
      : severity === "LOW"
        ? 2
        : 3;