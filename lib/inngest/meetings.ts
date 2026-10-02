import { NonRetriableError } from "inngest";
import prismadb from "@/lib/prismadb";
import { inngest } from "@/lib/inngest/client";
import { updateStreak } from "@/lib/streak";
import { VapiClient } from "@vapi-ai/server-sdk";
import { markJobRunning, type JobFields } from "@/lib/inngest/jobs";

const MEETING_JOB_FIELDS: JobFields = {
  status: "jobStatus",
  stage: "jobStage",
  error: "jobError",
};

/**
 * Fetches completed meeting artifacts from Vapi.
 *
 * The original route did a single lookup and wrote immediately. If the call had
 * not finished producing a transcript yet, it would either write nulls or the
 * client would have to retry. This is now a durable job so it can back off or
 * be retried until Vapi has finished processing.
 */
export const fetchMeetingDetails = inngest.createFunction(
  {
    id: "meetings-details",
    triggers: [{ event: "meetings/details" }],
    retries: 3,
    timeouts: { start: "5m", finish: "20m" },
    //* One concurrent fetch per meeting.
    concurrency: [{ key: "event.data.meetingId", limit: 1 }],
  },
  async ({ event, step }) => {
    const { meetingId, userId, vapiAgent } = event.data;

    const meeting = await step.run("load-meeting", () =>
      prismadb.meeting.findFirst({
        where: { id: meetingId, userId },
        select: { id: true, jobStatus: true },
      })
    );

    if (!meeting) {
      throw new NonRetriableError("Meeting not found");
    }

    if (meeting.jobStatus === "COMPLETED") {
      return { skipped: true };
    }

    await step.run("mark-running", () =>
      markJobRunning(prismadb.meeting, meetingId, "fetching call details", MEETING_JOB_FIELDS)
    );

    const vapiMeeting = await step.run("fetch-vapi-call", async () => {
      const vapi = new VapiClient({ token: process.env.VAPI_TOKEN! });
      const calls = await vapi.calls.list({ assistantId: vapiAgent, limit: 1 });
      const call = calls[0];

      if (!call) {
        throw new Error("Call not found in Vapi");
      }

      return call;
    });

    await step.run("persist", () =>
      prismadb.meeting.update({
        where: { id: meetingId },
        data: {
          callTranscript: vapiMeeting.artifact?.transcript,
          transcript: vapiMeeting.artifact?.transcript,
          summary: vapiMeeting.analysis?.summary,
          status: "COMPLETED",
          recordingURL: vapiMeeting.artifact?.stereoRecordingUrl,
          jobStatus: "COMPLETED",
          jobStage: null,
          jobError: null,
        },
      })
    );

    await step.run("streak", () => updateStreak(userId));

    return { skipped: false };
  }
);