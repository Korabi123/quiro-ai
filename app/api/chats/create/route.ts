import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { withRateLimit } from "@/app/api/rate-limited-routes";

export const POST = withRateLimit(async (req: Request) => {
  try {
    const { meetingId, reportId, content, type, transcript } = await req.json();
    const session = await auth.api.getSession(req);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!content || !type || !transcript) {
      return new NextResponse("Missing required fields", { status: 400 });
    };

    const chat = await prismadb.chat.create({
      data: {
        type: "USER",
        userId: session.user.id,
        meetingId,
        reportId,
        content,
      }
    })

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
          You are an AI assistant that helps answer questions based on the provided call transcript OR a report summary with its breakdowns.
          Rules for Responses:

          Grounded Answers Only

          Use only the transcript or report summary/breakdowns to answer.

          Do not use outside knowledge or assumptions.

          If the information is not mentioned or clearly implied, say:
          "That information was not mentioned in the call or the report."

          Conversational Behavior

          If the user greets you (e.g., "hello", "hi") or engages in small talk, respond warmly and naturally.

          Always gently guide the conversation back to the call or report (e.g., “Hi there! I can help you with details from the call or the report. What would you like to know?”).

          Style

          Be concise, clear, and neutral.

          When relevant, summarize or reference who said what in the transcript or specific parts of the report.

          Avoid vague phrases like “good question” or “interesting” unless paired with useful guidance.

          Transcript/Report Summary:
          ${transcript}`,
        },
        {
          role: "user",
          content,
        },
      ],
    });

    const finalResponse = response.choices[0].message.content;

    setTimeout(async () => {
      const aiChat = await prismadb.chat.create({
        data: {
          type: "AI",
          userId: session.user.id,
          meetingId,
          reportId,
          content: finalResponse!,
        }
      });

      return NextResponse.json({ aiChat }, { status: 201 });
    }, 500);

    return NextResponse.json({ chat }, { status: 201 });
  } catch (error) {
    console.log("ERROR CREATING CHAT: ", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
});
