import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const POST = async (req: Request) => {
  try {
    const { problemSlug, code, language, output, expectedOutput, attemptId } = await req.json();
    const session = await auth.api.getSession(req);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!code || !language) {
      return new NextResponse("Code and language are required", { status: 400 });
    }

    const problem = await prismadb.codingProblem.findUnique({
      where: { slug: problemSlug },
    });

    let attempt = null;
    if (attemptId) {
      attempt = await prismadb.codingAttempt.findUnique({
        where: { id: attemptId },
      });
    }

    if (!attempt && code) {
      attempt = await prismadb.codingAttempt.findFirst({
        where: {
          userId: session.user.id,
          code: code,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    const ai = new OpenAI({
      apiKey: process.env.AI_SECRET!,
      baseURL: "https://router.huggingface.co/v1",
    });

    const response = await ai.chat.completions.create({
      model: "deepseek-ai/DeepSeek-V3-0324",
      messages: [
        {
          role: "system",
          content: `
          Act as a professional code reviewer and technical interviewer.

          You will be provided with:
          1. The user's code solution
          2. The programming language
          3. The problem description
          4. The actual output vs expected output

          Your task is to evaluate the code and provide:
          - correctnessScore (0-100): How correct is the solution
          - efficiencyScore (0-100): Time/space complexity analysis
          - codeQualityScore (0-100): Code style, readability, best practices
          - bestPracticeScore (0-100): Use of proper patterns, error handling, tests
          - A brief summary of strengths
          - A list of specific improvements

          ---

          ### Rules for Grading:
          - Be objective and specific in feedback
          - For correctness: Check if output matches expected, handle edge cases
          - For efficiency: Analyze time and space complexity
          - For code quality: Check naming, comments, formatting, SOLID principles
          - For best practices: Check error handling, tests, documentation
          - Provide actionable, specific feedback

          ---

          ### Output Format (JSON only):
          {
            "correctnessScore": 85,
            "efficiencyScore": 90,
            "codeQualityScore": 75,
            "bestPracticeScore": 70,
            "totalScore": 80,
            "timeComplexity": "O(n)",
            "spaceComplexity": "O(n)",
            "summary": "Clear high-level summary of the solution quality",
            "strengths": ["Strength 1", "Strength 2"],
            "improvements": ["Improvement 1 - be specific", "Improvement 2"]
          }
          `,
        },
        {
          role: "user",
          content: `Problem: ${problemSlug}
Language: ${language}

User's Code:
${code}

Actual Output: ${output || "none"}
Expected Output: ${expectedOutput || "none"}`,
        },
      ],
    });

    const finalResponse = response.choices[0].message.content;
    let cleanResponse = finalResponse?.trim() || "";

    const jsonMatch = cleanResponse.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      cleanResponse = jsonMatch[1];
    } else {
      const objMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (objMatch) {
        cleanResponse = objMatch[0];
      }
    }

    let responseJ;
    try {
      responseJ = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.log("JSON parse error, returning default:", parseError);
      responseJ = {
        correctnessScore: 50,
        efficiencyScore: 50,
        codeQualityScore: 50,
        bestPracticeScore: 50,
        totalScore: 50,
        timeComplexity: "Unknown",
        spaceComplexity: "Unknown",
        summary: cleanResponse.substring(0, 500),
        strengths: [],
        improvements: ["Could not parse AI response fully"],
      };
    }

    if (attempt) {
      const existingGrading = await prismadb.codeGrading.findUnique({
        where: { attemptId: attempt.id },
      });

      if (existingGrading) {
        await prismadb.codeGrading.update({
          where: { id: existingGrading.id },
          data: {
            isCorrect: attempt.passedTests,
            passedTests: attempt.passedTests,
            correctnessScore: responseJ.correctnessScore || 0,
            efficiencyScore: responseJ.efficiencyScore || 0,
            codeQualityScore: responseJ.codeQualityScore || 0,
            bestPracticeScore: responseJ.bestPracticeScore || 0,
            totalScore: responseJ.totalScore || 0,
            timeComplexity: responseJ.timeComplexity || null,
            spaceComplexity: responseJ.spaceComplexity || null,
            summary: responseJ.summary || "",
            strengths: responseJ.strengths || [],
            improvements: responseJ.improvements || [],
          },
        });
      } else {
        await prismadb.codeGrading.create({
          data: {
            attemptId: attempt.id,
            isCorrect: attempt.passedTests,
            passedTests: attempt.passedTests,
            correctnessScore: responseJ.correctnessScore || 0,
            efficiencyScore: responseJ.efficiencyScore || 0,
            codeQualityScore: responseJ.codeQualityScore || 0,
            bestPracticeScore: responseJ.bestPracticeScore || 0,
            totalScore: responseJ.totalScore || 0,
            timeComplexity: responseJ.timeComplexity || null,
            spaceComplexity: responseJ.spaceComplexity || null,
            summary: responseJ.summary || "",
            strengths: responseJ.strengths || [],
            improvements: responseJ.improvements || [],
          },
        });
      }
    }

    return NextResponse.json(responseJ);
  } catch (error) {
    console.log("ERROR GRADING CODE: ", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};