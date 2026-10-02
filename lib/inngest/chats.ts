import { NonRetriableError } from "inngest";
import prismadb from "@/lib/prismadb";
import { inngest } from "@/lib/inngest/client";
import { generateChatReply } from "@/lib/chats/reply";

/**
 * Generates the AI reply for a chat message asynchronously.
 *
 * The original route created the user message, then fired off a `setTimeout` to
 * create the AI message after returning the HTTP response. That timer runs
 * inside the request handler; if the process restarts, the Lambda is cold-booted,
 * the connection closes, or the platform terminates the in-flight request, the
 * AI message is never written - the reply is effectively lost and the chat
 * stays unanswered. By moving this into Inngest, the job survives restarts and
 * is retried on transient failures.
 */
export const generateChatReplyJob = inngest.createFunction(
  {
    id: "chats-reply",
    triggers: [{ event: "chats/reply" }],
    retries: 2,
    timeouts: { start: "2m", finish: "10m" },
    //* One concurrent reply generation per user chat to avoid double-writing
    //* the same AI message on a replay.
    concurrency: [{ key: "event.data.userChatId", limit: 1 }],
  },
  async ({ event, step }) => {
    const { userChatId, meetingId, reportId, userId } = event.data;

    const userChat = await step.run("load-chat", () =>
      prismadb.chat.findFirst({
        where: { id: userChatId, userId, type: "USER" },
        select: { id: true, content: true },
      })
    );

    if (!userChat) {
      //* Deleted or belongs to someone else. Retrying cannot fix this.
      throw new NonRetriableError("Chat message not found");
    }

    //* Find context for the reply.
    let transcript = "";
    if (meetingId) {
      const meeting = await prismadb.meeting.findUnique({
        where: { id: meetingId },
        select: { transcript: true, callTranscript: true, summary: true },
      });

      transcript = meeting?.transcript ?? meeting?.callTranscript ?? meeting?.summary ?? "";
    } else if (reportId) {
      const report = await prismadb.report.findUnique({
        where: { id: reportId },
        select: { summary: true, breakdown: true },
      });

      transcript = [report?.summary, report?.breakdown].filter(Boolean).join("\n\n");
    }

    //* Idempotency: if an AI message already exists for this user message
    //* (either via a previous run or via a replay), do not create a duplicate.
    const existingAi = await step.run("check-existing", () =>
      prismadb.chat.findFirst({
        where: { meetingId, reportId, userId, type: "AI" },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      })
    );

    if (existingAi) {
      return { skipped: true, chatId: existingAi.id };
    }

    const reply = await step.run("generate", () =>
      generateChatReply({
        userChatId,
        transcript,
        content: userChat.content,
      })
    );

    const aiChat = await step.run("persist", () =>
      prismadb.chat.create({
        data: {
          type: "AI",
          userId,
          meetingId,
          reportId,
          content: reply,
        },
        select: { id: true },
      })
    );

    return { skipped: false, chatId: aiChat.id };
  }
);