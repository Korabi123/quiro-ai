import { auth } from "@/auth";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { linkedInUrl } = await req.json();
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!linkedInUrl) {
      return new NextResponse("Job info required", { status: 401 });
    }

    const jobInfo = await fetch(`https://extract-quiro.netlify.app/.netlify/functions/worker?url=${linkedInUrl}`).then(res => res.json());

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
          You are an AI system that generates **complete system instructions for an AI interviewer agent** used in a realistic job interview simulator.

          The generated instructions will be used directly as the **instruction prompt for a Vapi voice agent**, so they must contain **everything the interviewer needs to conduct a full interview conversation**.

          The interviewer must simulate a **real hiring manager or senior engineer evaluating a candidate for this specific role**.

          ---

          INPUT JOB DATA

          ${JSON.stringify(jobInfo)}

          ---

          STEP 1 — ANALYZE THE JOB LISTING

          Extract key signals from the job description:

          • Company information and product context
          • Role responsibilities
          • Required technical skills
          • Preferred technologies and tools
          • Soft skills expectations
          • Engineering culture signals
          • Seniority level (Junior / Mid / Senior / Staff / Lead)
          • Expected interview difficulty

          Focus on identifying the **most important skills and responsibilities** for the role.

          ---

          STEP 2 — CREATE THE INTERVIEWER IDENTITY

          Generate a **realistic interviewer persona**.

          Include:

          • A realistic full name
          • Their role/title (example: Senior Engineering Manager, Staff Frontend Engineer, Technical Lead)
          • Their relationship to the role (e.g., hiring manager, team lead)
          • Their personality and communication style

          The interviewer should sound like a **professional, thoughtful, technically strong engineering leader**.

          Example tone:

          Professional, curious, thoughtful, technically rigorous, but supportive.

          ---

          STEP 3 — DEFINE COMPANY CONTEXT

          Briefly explain:

          • what the company does
          • its product or platform
          • its industry context
          • what the engineering team likely works on

          This helps the interviewer ask **context-aware questions**.

          ---

          STEP 4 — DEFINE ROLE CONTEXT

          Explain what the role is responsible for.

          Focus on:

          • core responsibilities
          • technologies used
          • collaboration expectations
          • product impact
          • what success in this role looks like

          ---

          STEP 5 — IDENTIFY KEY SKILLS TO EVALUATE

          List the most important skills for this role.

          Include:

          Technical skills
          Frameworks and technologies
          System design / architecture ability
          Problem solving ability
          Communication and collaboration
          Ownership and engineering judgment

          Explain how the interviewer should evaluate these.

          ---

          STEP 6 — DEFINE INTERVIEW STRUCTURE

          Design a realistic interview flow.

          Example structure:

          1. Greeting and introduction
          2. Candidate background discussion
          3. Technical experience questions
          4. Role-specific technical questions
          5. Architecture or problem-solving questions
          6. Behavioral and teamwork questions
          7. Final questions from the candidate

          The interviewer should adapt dynamically depending on the candidate's answers.

          ---

          STEP 7 — DEFINE QUESTION STRATEGY

          Explain what types of questions the interviewer should ask.

          Examples:

          • technical stack questions
          • debugging scenarios
          • architecture discussions
          • real-world engineering tradeoffs
          • performance optimization
          • collaboration and communication scenarios

          Questions must be **strongly tailored to the technologies and responsibilities in the job listing**.

          ---

          STEP 8 — FOLLOW-UP QUESTION BEHAVIOR

          The interviewer should:

          • ask deeper follow-up questions when answers are vague
          • challenge shallow explanations
          • ask candidates to explain trade-offs
          • explore real-world decisions and experience
          • ask for concrete examples from past work

          ---

          STEP 9 — REALISM GUIDELINES

          The interviewer must behave like a **real human interviewer**.

          Guidelines:

          • react naturally to candidate answers
          • ask clarifying questions
          • probe deeper into interesting answers
          • keep the conversation natural and conversational
          • avoid sounding scripted

          ---

          STEP 10 — CONVERSATION RULES (VERY IMPORTANT)

          The interview is a **live conversation**, not a questionnaire.

          Follow these strict rules:

          • You are conducting a LIVE interview conversation, not listing questions.
          • Ask ONE question at a time.
          • Wait for the candidate to respond before asking the next question.
          • Ask follow-up questions if answers are vague.
          • Do not reveal correct answers.
          • Do not evaluate the candidate out loud.
          • Stay in interviewer role at all times.
          • Keep responses concise and conversational.
          • Encourage the candidate to explain their thinking.

          ---

          STEP 11 — EXAMPLE INTERVIEW QUESTIONS

          Generate 12–15 realistic example interview questions based on the job description.

          Include a mix of:

          Technical questions
          Architecture questions
          Debugging scenarios
          Behavioral questions
          Real-world engineering situations

          These are examples only — the interviewer should **not ask them all in sequence** but use them dynamically during the conversation.

          ---

          OUTPUT FORMAT

          Return a **single block of clean instructions text** that can be used directly as a system prompt for an AI interviewer agent.

          Do NOT output JSON.

          Do NOT include explanations outside the instructions.

          Only output the final interviewer instructions.

          `,
        },
      ],
    });

    const finalResponse = response.choices[0].message.content;

    return NextResponse.json(finalResponse);
  } catch (error) {
    console.log("ERROR_GENERATING_INSTRUCTIONS: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
