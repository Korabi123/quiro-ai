import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
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

    const report = await prismadb.report.findUnique({
      where: {
        id: reportId,
        userId: session.user.id,
      },
      include: {
        questions: true,
      }
    });

    if (!report) {
      return new NextResponse("Report not found", { status: 404 });
    }

    if (report.questions.length > 0) {
      return new NextResponse("Report already generated", { status: 200 });
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
          Act as an expert career coach and interviewer.

          Your task is to generate a short, focused skill assessment consisting of 10 questions.
          The questions must follow the provided database schema and enum definitions exactly, but also include a rubric object for each question so the system can auto-grade or guide manual grading.


          IMPORTANT RULES:
          1. Do not include the answer in the question text.
          2. Avoid factual statements — every question must be phrased as a question the user must answer.
          3. No duplicates — all questions must be unique in content and wording.
          4. Use the provided QuestionType enum:
            - FREE_TEXT: Open-ended answer in the user's own words.
            - MULTIPLE_CHOICE: Provide a question and 4 unique answer choices (labeled A, B, C, D) with exactly ONE correct answer.
            - FILL_BLANK: The question contains a single blank "____" for the user to fill.
            - TRUE_FALSE: The question is a statement; the user must answer True or False.
          5. Ensure difficulty balance: some easy, some medium, some hard.
          6. No trick questions or misleading phrasing.
          7. GENERATE EXACTLY 10 QUESTIONS NO MORE NO LESS.


          ---

          ### Schema:
          enum QuestionType {
            FREE_TEXT
            MULTIPLE_CHOICE
            FILL_BLANK
            TRUE_FALSE
          }

          model Question {
            id        String       // Omit, will be auto-generated
            content   String       // The question text (for MULTIPLE_CHOICE, include options here)
            answer    String?      // Correct answer or expected answer
            type      QuestionType // One of the types (FREE_TEXT, MULTIPLE_CHOICE, FILL_BLANK, TRUE_FALSE)
            rubric    Rubric       // Scoring criteria for this question
          }

          model Rubric {
            criteria: string       // What the question is evaluating
            scoring: string        // How to evaluate the answer (point ranges, what earns full credit)
            maxScore: number       // Maximum points for the question
          }

          ---

          ### Input Parameters:
          - Role: {{${report.field}}}
          - Skill Focus: {{${report.type === "ALL" ? "Communication, Technical knowledge, Problem-solving" : report.type}}}

          ---

          ### Output Format (JSON Array Only):

          [
            {
              "content": "Describe a time when you resolved a team conflict.",
              "answer": null,
              "type": "FREE_TEXT",
              "rubric": {
                "criteria": "Evaluates interpersonal communication, conflict resolution strategy, and self-awareness.",
                "scoring": "0 points = no relevant example, 5 points = vague example with unclear resolution, 10 points = clear, structured example with positive outcome and reflection.",
                "maxScore": 10
              }
            },
            {
              "content": "Which of these is NOT a JavaScript data type? A) Number B) String C) Float D) Boolean",
              "answer": "C) Float",
              "type": "MULTIPLE_CHOICE",
              "rubric": {
                "criteria": "Tests basic knowledge of JavaScript primitive data types.",
                "scoring": "0 points = incorrect choice, 5 points = correct choice.",
                "maxScore": 5
              }
            },
            {
              "content": "React hooks must be called inside ____.",
              "answer": "a React function component",
              "type": "FILL_BLANK",
              "rubric": {
                "criteria": "Evaluates understanding of React hooks usage rules.",
                "scoring": "0 points = incorrect term, 5 points = correct and precise term.",
                "maxScore": 5
              }
            },
            {
              "content": "In Agile methodology, sprints typically last 2 weeks.",
              "answer": "true",
              "type": "TRUE_FALSE",
              "rubric": {
                "criteria": "Tests basic Agile process knowledge.",
                "scoring": "0 points = incorrect answer, 2 points = correct answer.",
                "maxScore": 2
              }
            }
          ]

          ONLY INCLUDE JSON IN THE RESPONSE.
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

    if (!Array.isArray(responseJ)) {
      return new NextResponse("Invalid response format", { status: 400 });
    }

    const createdQuestions = [];

    const uniqueQuestions = responseJ.filter(
      (q, i, arr) => i === arr.findIndex(other => other.content.trim() === q.content.trim())
    );

    //* Create questions and rubrics in DB
    for (const question of uniqueQuestions) {
      const rubric = await prismadb.rubric.create({
        data: {
          criteria: question.rubric.criteria,
          scoring: question.rubric.scoring,
          maxScore: question.rubric.maxScore,
        },
      });

      const questionDB = await prismadb.question.create({
        data: {
          content: question.content,
          answer: question.answer,
          type: question.type as any,
          rubricId: rubric.id,
          reportId,
        },
      });

      createdQuestions.push(questionDB);
    }

    return NextResponse.json(createdQuestions, { status: 201 });
  } catch (error) {
    console.log("ERROR_GENERATING_REPORT: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
