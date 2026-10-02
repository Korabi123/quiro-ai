import OpenAI from "openai";

/**
 * LLM transport for the project-grading pipeline. All schemas and types live in
 * `@/lib/grading/schema` so that module stays free of SDK imports and can be
 * consumed by client components.
 */

export const GRADING_MODEL =
  process.env.GRADING_MODEL ?? "deepseek-ai/DeepSeek-V3-0324";
export const FAST_MODEL = process.env.GRADING_FAST_MODEL ?? GRADING_MODEL;
export const SYNTHESIS_MODEL =
  process.env.GRADING_SYNTHESIS_MODEL ?? GRADING_MODEL;

let client: OpenAI | null = null;

const getClient = (): OpenAI => {
  if (!client) {
    const apiKey = process.env.AI_SECRET;
    if (!apiKey) {
      throw new Error("AI_SECRET is not configured");
    }
    client = new OpenAI({
      apiKey,
      baseURL: process.env.AI_BASE_URL ?? "https://router.huggingface.co/v1",
      maxRetries: 3,
      timeout: 120_000,
    });
  }
  return client;
};

export type LlmCallOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  retries?: number;
};

/**
 * Makes a chat completion and returns the raw assistant message content.
 * Does not parse; callers use `parseJsonResponse` with their own schema.
 */
export const complete = async (
  system: string,
  user: string,
  options: LlmCallOptions = {}
): Promise<string> => {
  const {
    model = GRADING_MODEL,
    temperature = 0.2,
    maxTokens = 4096,
    retries = 2,
  } = options;

  const ai = getClient();
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await ai.chat.completions.create({
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error("Model returned empty content");
      }

      return content;
    } catch (error) {
      lastError = error;
      //* Exponential backoff, skipped on the final attempt.
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1_000 * 2 ** attempt));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("LLM call failed");
};

/** Runs `fn`, returning `fallback` instead of throwing. For optional steps. */
export const attempt = async <T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    console.log("GRADING_NON_FATAL_ERROR: ", error);
    return fallback;
  }
};