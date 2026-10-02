import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";
import { withRateLimit } from "@/app/api/rate-limited-routes";
import { inngest, eventIds } from "@/lib/inngest/client";

/**
 * Creates a user chat message and enqueues the AI reply.
 *
 * The previous implementation wrote the AI message from inside a `setTimeout`
 * after returning the response. Timers do not survive process restarts, cold
 * boots, or abrupt request termination - so if the container recycled during
 * those 500ms, the reply was never written and the chat stayed unanswered.
 * This is now a durable job (Inngest), so the reply is generated and persisted
 * even if the original request process dies.
 */
export const POST = withRateLimit(async (req: Request) => {
  try {
    const { meetingId, reportId, content, type, transcript } = await req.json();
    const session = await auth.api.getSession(req);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!content || !type || !transcript) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const chat = await prismadb.chat.create({
      data: {
        type: "USER",
        userId: session.user.id,
        meetingId,
        reportId,
        content,
      },
      select: { id: true },
    });

    await inngest.send({
      name: "chats/reply",
      data: {
        userChatId: chat.id,
        userId: session.user.id,
        meetingId,
        reportId,
      },
      id: eventIds.chatReply(chat.id),
    });

    return NextResponse.json({ chat }, { status: 202 });
  } catch (error) {
    console.log("ERROR CREATING CHAT: ", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
});
