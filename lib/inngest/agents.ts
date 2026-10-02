import { NonRetriableError } from "inngest";
import { inngest } from "@/lib/inngest/client";
import { generateAgentInstructions } from "@/lib/agents/generate-instructions";

/**
 * Generates agent interviewer instructions from a LinkedIn URL.
 *
 * The original route fetched job info from an external service and called the
 * model inline. This is now durable: transient network/model failures are retried
 * and there is a clear failure path.
 */
export const generateAgentInstructionsJob = inngest.createFunction(
  {
    id: "agents-instructions",
    triggers: [{ event: "agents/instructions" }],
    retries: 2,
    timeouts: { start: "2m", finish: "10m" },
    //* Prevent duplicate generation for the same request.
    concurrency: [{ key: "event.data.requestId", limit: 1 }],
  },
  async ({ event, step }) => {
    const { requestId, linkedInUrl } = event.data;

    if (!linkedInUrl) {
      throw new NonRetriableError("linkedInUrl required");
    }

    const jobInfo = await step.run("fetch-job-info", async () => {
      const res = await fetch(
        `https://extract-quiro.netlify.app/.netlify/functions/worker?url=${linkedInUrl}`
      );

      if (!res.ok) {
        throw new Error(`Failed to extract job info: ${res.status}`);
      }

      return res.json();
    });

    const instructions = await step.run("generate", () => generateAgentInstructions(jobInfo));

    return { requestId, instructions };
  }
);