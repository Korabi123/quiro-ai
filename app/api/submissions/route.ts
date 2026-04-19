import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { updateStreak } from "@/lib/streak";

export const POST = async (req: Request) => {
  try {
    const {
      problemSlug,
      code,
      language,
      stdin,
      output,
      isCorrect,
      executionTime,
      memoryUsage,
      visiblePassedCount,
      visibleTotalCount,
      hiddenPassedCount,
      hiddenTotalCount,
    } = await req.json();
    const session = await auth.api.getSession(req);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!code || !language) {
      return new NextResponse("Code and language are required", { status: 400 });
    }

    if (!problemSlug) {
      return new NextResponse("Problem slug is required", { status: 400 });
    }

    // Find or create the problem
    let problem = await prismadb.codingProblem.findUnique({
      where: { slug: problemSlug },
    });

    if (!problem) {
      // Fetch problem title from LeetCode API
      let problemTitle = problemSlug;
      let difficulty = "MEDIUM";

      try {
        const leetcodeRes = await fetch(`https://leetcode-api-pied.vercel.app/problem/${problemSlug}`);
        if (leetcodeRes.ok) {
          const problemData = await leetcodeRes.json();
          problemTitle = problemData.title || problemSlug;
          difficulty = problemData.difficulty?.toUpperCase() || "MEDIUM";
        }
      } catch (e) {
        console.log("Could not fetch problem title:", e);
      }

      problem = await prismadb.codingProblem.create({
        data: {
          slug: problemSlug,
          title: problemTitle,
          difficulty: difficulty as "EASY" | "MEDIUM" | "HARD",
        },
      });
    }

    // Save the submission
    const submission = await prismadb.codingAttempt.create({
      data: {
        userId: session.user.id,
        problemId: problem.id,
        language,
        code,
        executionOutput: output,
        passedTests: isCorrect || false,
        executionTime,
        memoryUsage,
        visiblePassedCount,
        visibleTotalCount,
        hiddenPassedCount,
        hiddenTotalCount,
      },
    });

    // Update user progress
    const existingProgress = await prismadb.userProblemProgress.findUnique({
      where: {
        userId_problemId: {
          userId: session.user.id,
          problemId: problem.id,
        },
      },
    });

    if (existingProgress) {
      await prismadb.userProblemProgress.update({
        where: { id: existingProgress.id },
        data: {
          attempts: existingProgress.attempts + 1,
          lastAttempt: new Date(),
          solved: isCorrect || existingProgress.solved,
          bestScore: isCorrect ? Math.max(existingProgress.bestScore || 0, 100) : existingProgress.bestScore,
        },
      });
    } else {
      await prismadb.userProblemProgress.create({
        data: {
          userId: session.user.id,
          problemId: problem.id,
          attempts: 1,
          solved: isCorrect || false,
          bestScore: isCorrect ? 100 : 0,
          lastAttempt: new Date(),
        },
      });
    }

    // If solved, update streak
    if (isCorrect) {
      await updateStreak(session.user.id);
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.log("ERROR SAVING SUBMISSION: ", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const problemSlug = searchParams.get("slug");
    const session = await auth.api.getSession(req);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!problemSlug) {
      return new NextResponse("Problem slug is required", { status: 400 });
    }

    const problem = await prismadb.codingProblem.findUnique({
      where: { slug: problemSlug },
    });

    if (!problem) {
      return NextResponse.json([]);
    }

    const submissions = await prismadb.codingAttempt.findMany({
      where: {
        userId: session.user.id,
        problemId: problem.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      include: {
        grading: true,
      },
    });

    const submissionsWithMeta = submissions.map(s => ({
      id: s.id,
      language: s.language,
      code: s.code,
      executionOutput: s.executionOutput,
      passedTests: s.passedTests,
      createdAt: s.createdAt,
      executionTime: s.executionTime,
      memoryUsage: s.memoryUsage,
      visiblePassedCount: s.visiblePassedCount,
      visibleTotalCount: s.visibleTotalCount,
      hiddenPassedCount: s.hiddenPassedCount,
      hiddenTotalCount: s.hiddenTotalCount,
      grading: s.grading ? {
        id: s.grading.id,
        correctnessScore: s.grading.correctnessScore,
        efficiencyScore: s.grading.efficiencyScore,
        codeQualityScore: s.grading.codeQualityScore,
        bestPracticeScore: s.grading.bestPracticeScore,
        totalScore: s.grading.totalScore,
        timeComplexity: s.grading.timeComplexity,
        spaceComplexity: s.grading.spaceComplexity,
        summary: s.grading.summary,
        strengths: s.grading.strengths as string[],
        improvements: s.grading.improvements as string[],
      } : null,
    }));

    return NextResponse.json({ attempts: submissionsWithMeta });
  } catch (error) {
    console.log("ERROR FETCHING SUBMISSIONS: ", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};
