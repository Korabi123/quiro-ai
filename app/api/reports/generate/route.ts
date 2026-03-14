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

    let response;

    if (report.field !== "Generated from a LinkedIn job posting") {
      response = await ai.chat.completions.create({
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
    } else {
      const jobInfo = await fetch(`https://extract-quiro.netlify.app/.netlify/functions/worker?url=${report.customType}`).then(res => res.json());

      response = await ai.chat.completions.create({
        model: "deepseek-ai/DeepSeek-V3-0324",
        messages: [
          {
            role: "system",
            content: `
            Act as an expert technical interviewer and career coach.

            Your task is to generate a **comprehensive skill assessment consisting of exactly 18 questions** based on a LinkedIn job listing provided as JSON.

            The goal of the assessment is to determine whether a candidate possesses the **skills required for the specific role described in the job listing**.

            The questions must strictly follow the provided database schema and enum definitions and must include a **rubric object for each question** so the system can auto-grade or guide manual grading.

            ---

            JOB LISTING DATA (JSON)

            {{JOB_JSON: ${JSON.stringify(jobInfo)}}}

            Example structure:

            {
            "companyName": "...",
            "jobTitle": "...",
            "jobDescription": "..."
            }

            You must **extract all relevant information from this JSON before generating questions**.

            ---

            STEP 1 — EXTRACT JOB CONTEXT

            Analyze the JSON and internally extract:

            • Company name
            • Job title
            • Seniority level (Junior / Mid / Senior / Lead / Staff / Principal)
            • Core responsibilities
            • Required technical skills
            • Mentioned frameworks and tools
            • Architecture expectations
            • Debugging or performance expectations
            • Collaboration and communication expectations

            Use these signals to determine the **most important skills required for the role**.

            ---

            STEP 2 — DESIGN THE SKILL ASSESSMENT

            Create an **18-question assessment** that evaluates whether a candidate has the skills needed for this role.

            The assessment should measure a mix of:

            • technical knowledge
            • real-world engineering decision making
            • debugging ability
            • architecture thinking
            • problem solving ability
            • communication ability
            • teamwork and collaboration

            Avoid generic questions when the job description mentions specific technologies.

            Example:

            If the listing mentions **React**, include React questions.
            If it mentions **performance optimization**, include performance questions.
            If it mentions **system architecture**, include architecture questions.

            The assessment should feel like a **real technical screening for this job**.

            ---

            STEP 2.5 — BALANCED SKILL EVALUATION SIGNALS

            Design the assessment so it evaluates multiple types of engineering ability.

            Internally categorize questions into these evaluation signals:

            KNOWLEDGE — understanding of concepts and technologies
            APPLICATION — applying knowledge to real problems
            DEBUGGING — diagnosing and fixing issues
            ARCHITECTURE — system design and trade-offs
            COMMUNICATION — explaining ideas clearly
            TEAMWORK — collaboration and working with others

            Ensure the assessment contains a balanced mix.

            Approximate distribution:

            • 3 KNOWLEDGE
            • 4 APPLICATION
            • 3 DEBUGGING
            • 3 ARCHITECTURE
            • 3 COMMUNICATION
            • 2 TEAMWORK

            These categories are **internal reasoning only** and must NOT appear in the final output.

            ---

            STEP 3 — QUESTION TYPE DISTRIBUTION (IMPORTANT)

            You must include a mix of all question types.

            Required distribution:

            • 7 FREE_TEXT
            • 5 MULTIPLE_CHOICE
            • 3 FILL_BLANK
            • 3 TRUE_FALSE

            Do NOT exceed or reduce these counts.

            ---

            QUESTION QUALITY FILTER (IMPORTANT)

            Before finalizing questions, apply the following quality rules.

            Avoid weak or trivial questions such as:

            • "What is React?"
            • "What is JavaScript?"
            • "What is a database?"

            Instead, prefer questions that evaluate:

            • engineering reasoning
            • real-world debugging
            • architecture trade-offs
            • performance thinking
            • applied knowledge

            Examples of GOOD questions:

            "How would you diagnose a React component that re-renders excessively?"

            "What trade-offs would you consider when choosing between client-side rendering and server-side rendering?"

            "How would you investigate a slow API response in production?"

            If a question could be answered with **a simple definition**, rewrite it into a **real-world scenario question**.

            ---

            IMPORTANT QUESTION RULES

            1. Do not include the answer in the question text.
            2. Avoid factual statements — every question must be phrased as a question.
            3. No duplicates — all questions must be unique.
            4. Use the provided QuestionType enum exactly:

              * FREE_TEXT
              * MULTIPLE_CHOICE
              * FILL_BLANK
              * TRUE_FALSE
            5. Ensure difficulty balance:
              • ~5 easy questions
              • ~7 medium questions
              • ~6 hard questions
            6. No trick questions or misleading phrasing.
            7. GENERATE EXACTLY 18 QUESTIONS — NO MORE, NO LESS.

            If more or fewer than 18 questions are generated, regenerate until the output contains exactly 18.

            ---

            MULTIPLE_CHOICE FORMAT RULE

            For MULTIPLE_CHOICE questions:

            • The answer options MUST be included directly inside the "content" field.
            • Provide exactly **4 options** labeled **A), B), C), D)**.
            • Options must appear **inline separated by spaces**, not line breaks.
            • Only **ONE option may be correct**.
            • The "answer" field must contain the correct option exactly as written.

            Example:

            "Which of these is NOT a valid HTTP method? A) GET B) POST C) FETCH D) DELETE"

            Answer field:

            "C) FETCH"

            ---

            FILL_BLANK FORMAT RULE

            • The question must contain exactly **one blank** written as:

            ---

            Example:

            "In Redux, application state is stored in a single ____."

            The "answer" field must contain the correct missing word or phrase.

            ---

            SENIORITY ADAPTATION RULE

            If the role appears to be **Senior, Staff, Lead, or Principal**:

            Prefer deeper questions involving:

            • architecture decisions
            • engineering trade-offs
            • system design reasoning
            • real-world debugging scenarios

            However, you must **still respect the required question type distribution**.

            ---

            SCORING GUIDELINES

            Each question must include a rubric explaining:

            • what skill the question evaluates
            • how to evaluate the answer
            • what qualifies as weak, partial, and strong answers

            Use scoring ranges based on difficulty:

            Easy → 2–5 points
            Medium → 5–10 points
            Hard → 10–15 points

            Rubrics must clearly explain **how to award points**.

            ---

            SCHEMA

            enum QuestionType {
            FREE_TEXT
            MULTIPLE_CHOICE
            FILL_BLANK
            TRUE_FALSE
            }

            model Question {
            id String // Omit, auto-generated
            content String
            answer String?
            type QuestionType
            rubric Rubric
            }

            model Rubric {
            criteria: string
            scoring: string
            maxScore: number
            }

            ---

            OUTPUT FORMAT

            Return **ONLY a JSON array containing exactly 18 Question objects** that strictly follow the schema above.

            Do NOT include:

            • explanations
            • markdown
            • comments
            • text before or after the JSON

            ONLY RETURN JSON.


          `,
          },
        ],
      });
    }

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
