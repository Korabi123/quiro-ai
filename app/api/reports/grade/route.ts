import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const answers = await req.json();
    const reportId = searchParams.get("id");
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!reportId) {
      return new NextResponse("Report ID not found", { status: 404 });
    }

    if (!answers) {
      return new NextResponse("Invalid request", { status: 400 });
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
    const responseJ = JSON.parse(cleanResponse!);

    //* Persist results to DB
    if (responseJ?.results && Array.isArray(responseJ.results)) {
      for (const result of responseJ.results) {
        await prismadb.question.update({
          where: { id: result.id },
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
      where: { id: reportId },
      data: {
        score: responseJ.overallScore,
        maxPossibleScore: responseJ.maxPossibleScore,
        summary: responseJ.summary,
        breakdown: responseJ.breakdown,
      },
    });

    return NextResponse.json(responseJ);
  } catch (error) {
    console.log("ERROR_GRADING_REPORT: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
