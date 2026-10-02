import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { inngestFunctions } from "@/lib/inngest/functions";

/**
 * Endpoint Inngest calls to execute functions.
 *
 * Point the Inngest dashboard at `https://<your-domain>/api/inngest`. Local
 * development works by running `npx inngest-cli@latest dev -u http://localhost:3000/api/inngest`.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: inngestFunctions,
});