import OpenAI from "openai";
import prismadb from "@/lib/prismadb";
import { updateStreak } from "@/lib/streak";

export type ReportAnswer = {
  content: string;
  answer: string;
  type: string;
  id: string;
  rubric: { criteria: string; scoring: string; maxScore: number };
};

/**
 * Grades a report's answers and persists per-question scores plus the report summary.
 *
 * Extracted from `app/api/reports/grade/route.ts` during the Inngest migration. The
 * grading prompt is unchanged.
 *
 * Throws on failure so the caller can mark the job FAILED; the previous version
 * returned a 500 and left the report indistinguishable from an ungraded one.
 */
export const gradeReportAnswers = async (args: {
  reportId: string;
  userId: string;
  answers: ReportAnswer[];
}) => {
  const { reportId, userId, answers } = args;

  const owned = await prismadb.report.findFirst({
    where: { id: reportId, userId },
    select: { id: true },
  });

  if (!owned) {
    throw new Error("Report not found");
  }

  const ownedQuestions = await prismadb.question.findMany({
    where: { reportId },
    select: { id: true },
  });
  const ownedQuestionIds = new Set(ownedQuestions.map((q) => q.id));

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
          Act as a professional interview evaluator.

          You will be provided with:
          1. A set of assessment questions (with their database IDs).
          2. The correct answers (if applicable).
          3. A scoring rubric for each question.
          4. The user's answers.

          Your task is to:
          - Assign a numeric score for each question according to the rubric's "maxScore" and "scoring" rules.
          - Provide brief feedback for each question explaining why the score was awarded.
          - Output an overall score and a high-level summary of the user’s strengths and areas for improvement.

          ---

          ### Input Data (JSON):
          ${JSON.stringify(answers)}

          ---

          ### Rules for Grading:
          - Always follow the rubric's scoring instructions exactly.
          - For FREE_TEXT answers:
            - Compare the user's reasoning and completeness against the rubric's description.
          - For MULTIPLE_CHOICE, FILL_BLANK, and TRUE_FALSE:
            - Award full points if the user answer matches exactly (case-insensitive match), otherwise 0.
          - Be concise in feedback (1–2 sentences).
          - Be objective and avoid vague language like "good job" — explain why.
          - For the summary and breakdown, feel free to use markdown formatting and also go more in-depth, on the breakdown you can also include a list of strengths and weaknesses and how to improve.
          - For the summary and breakdown:
            - The summary should be a clear, high-level narrative.
            - The breakdown must be returned as a **single string** (you may use bullet points or markdown lists inside the string).
            - Do NOT output JSON objects for strengths/weaknesses; instead, embed them in markdown inside the string.

          ---

          ### Output Format (JSON only):
          {
            "results": [
              {
                "id": "question-id-here",
                "content": "Question text",
                "type": "FREE_TEXT",
                "answer": "user's answer here",
                "feedback": "Your feedback here",
                "score": 5,
                "rubric": {
                  "criteria": "Evaluates structured thinking...",
                  "scoring": "0 points = ... 10 points = ...",
                  "maxScore": 10
                }
              }
            ],
            "overallScore": 42,
            "maxPossibleScore": 60,
            "summary": "High-level summary of performance",
            "breakdown": "Detailed breakdown of strengths and weaknesses"
          }
          `,
        },
      ],
    });

    const finalResponse = response.choices[0].message.content;

    let cleanResponse = finalResponse?.trim();

    //* Remove "```json" and "```" if they exist
    cleanResponse = cleanResponse
      ?.replace(/^```json\s*/, "")
      .replace(/```$/, "");

    //* Now parse
    const responseJ: {
      results?: {
        id: string;
        answer?: string | null;
        feedback?: string | null;
        score?: number | null;
      }[];
      overallScore?: number | null;
      maxPossibleScore?: number | null;
      summary?: string | null;
      breakdown?: string | null;
    } = JSON.parse(cleanResponse!);

    //* Persist results to DB
    if (responseJ?.results && Array.isArray(responseJ.results)) {
      const appliedResults = responseJ.results.filter((result) =>
        ownedQuestionIds.has(result.id)
      );

      if (appliedResults.length !== responseJ.results.length) {
        console.log(
          `ERROR_GRADING_REPORT: dropped ${
            responseJ.results.length - appliedResults.length
          } result(s) with unrecognized question ids`
        );
      }

      //* updateMany so a single bad row can't abort the whole grade, and so
      //* this stays at one round-trip instead of one per question.
      for (const result of appliedResults) {
        await prismadb.question.updateMany({
          where: {
            id: result.id,
            reportId,
          },
          data: {
            answer: result.answer,
            feedback: result.feedback,
            score: result.score,
          },
        });
      }
    }

    //* Persist overall grading summary at report level
    await prismadb.report.update({
      where: {
        id: reportId,
      },
      data: {
        score: responseJ.overallScore,
        maxPossibleScore: responseJ.maxPossibleScore,
        summary: responseJ.summary,
        breakdown: responseJ.breakdown,
      },
    });

    //* Streak is updated here rather than in the route: with the work moved off
    //* the request path, the route has already returned by the time grading
    //* finishes, so a streak bump there would be a lie.
    await updateStreak(userId);

    return responseJ;
};
