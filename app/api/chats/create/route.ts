import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { meetingId, content, type, transcript } = await req.json();
    const session = await auth.api.getSession(req);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!meetingId || !content || !type || !transcript) {
      return new NextResponse("Missing required fields", { status: 400 });
    };

    const chat = await prismadb.chat.create({
      data: {
        type: "USER",
        userId: session.user.id,
        meetingId,
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
          You are an AI assistant that answers questions based solely on the following call transcript. Do not use outside knowledge or make assumptions. If the information is not mentioned or clearly implied in the transcript, respond with:
          "That information was not mentioned in the call."
          Be concise, accurate, and neutral. If helpful, refer to who said what or summarize relevant portions.
          Transcript:
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
          content: finalResponse!,
        }
      });

      return NextResponse.json({ aiChat }, { status: 201 });
    }, 500);

    return NextResponse.json({ chat }, { status: 201 });
  } catch (error) {
    console.log("Error creating chat", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
