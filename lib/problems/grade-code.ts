import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const DEFAULT_MODEL = "deepseek-ai/DeepSeek-V3-0324";

const SYSTEM_PROMPT = `Act as a professional code reviewer and technical interviewer.

You will be provided with:
1. The user's code solution
2. The programming language
3. The problem description
4. The actual output vs expected output

Your task is to evaluate the code and provide:
- correctnessScore (0-100): How correct is the solution
- efficiencyScore (0-100): Time/space complexity analysis
- codeQualityScore (0-100): Code style, readability, best practices
- bestPracticeScore (0-100): Use of proper patterns, error handling, tests
- A brief summary of strengths
- A list of specific improvements

Rules for Grading:
- Be objective and specific in feedback
- For correctness: Check if output matches expected, handle edge cases
- For efficiency: Analyze time and space complexity
- For code quality: Check naming, comments, formatting, SOLID principles
- For best practices: Check error handling, tests, documentation
- Provide actionable, specific feedback

Output Format (JSON only):
{
  "correctnessScore": 85,
  "efficiencyScore": 90,
  "codeQualityScore": 75,
  "bestPracticeScore": 70,
  "totalScore": 80,
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(n)",
  "summary": "Clear high-level summary of the solution quality",
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement 1 - be specific", "Improvement 2"]
}`;

/**
 * Extract JSON from model output that sometimes wraps it in code fences.
 */
const extractJson = (raw: string | null): string => {
  if (!raw) return "{}";

  let clean = raw.trim();

  const fence = clean.match(/```json\n([\s\S]*?)\n```/);
  if (fence) {
    return fence[1];
  }

  const brace = clean.match(/\{[\s\S]*\}/);
  if (brace) {
    return brace[0];
  }

  return clean;
};

export type CodeGradePayload = {
  correctnessScore: number;
  efficiencyScore: number;
  codeQualityScore: number;
  bestPracticeScore: number;
  totalScore: number;
  timeComplexity: string | null;
  spaceComplexity: string | null;
  summary: string;
  strengths: string[];
  improvements: string[];
};

export const gradeCode = async (args: {
  problemSlug: string;
  code: string;
  language: string;
  output?: string | null;
  expectedOutput?: string | null;
}): Promise<CodeGradePayload> => {
  const ai = new OpenAI({
    apiKey: process.env.AI_SECRET!,
    baseURL: "https://router.huggingface.co/v1",
  });

  const response = await ai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Problem: ${args.problemSlug}
Language: ${args.language}

User's Code:
${args.code}

Actual Output: ${args.output ?? "none"}
Expected Output: ${args.expectedOutput ?? "none"}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? null;
  const clean = extractJson(content);

  try {
    return JSON.parse(clean) as CodeGradePayload;
  } catch (error) {
    console.log("CODE_GRADING_JSON_PARSE_ERROR:", error);
    //* Do NOT fabricate scores. Returning a partial object here is expensive to
    //* distinguish downstream, so we throw: the caller marks the job FAILED and
    //* can retry, rather than silently recording 50s as if they were real.
    throw new Error("Failed to parse model response as JSON");
  }
};