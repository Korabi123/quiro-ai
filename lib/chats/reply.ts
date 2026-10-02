import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are an AI assistant that helps answer questions based on the provided call transcript OR a report summary with its breakdowns.
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

Avoid vague phrases like “good question” or “interesting” unless paired with useful guidance.`;

/**
 * Generates an AI reply for a user chat message.
 */
export const generateChatReply = async (args: {
  userChatId: string;
  transcript: string;
  content: string;
}): Promise<string> => {
  const ai = new OpenAI({
    apiKey: process.env.AI_SECRET!,
    baseURL: "https://router.huggingface.co/v1",
  });

  const response = await ai.chat.completions.create({
    model: "deepseek-ai/DeepSeek-V3-0324",
    messages: [
      {
        role: "system",
        content: `${SYSTEM_PROMPT}

Transcript/Report Summary:
${args.transcript}`,
      },
      { role: "user", content: args.content },
    ],
  });

  const finalResponse = response.choices[0]?.message?.content;

  if (!finalResponse) {
    throw new Error("Model returned empty content");
  }

  return finalResponse;
};