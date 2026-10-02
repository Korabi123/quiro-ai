import { z } from "zod";

/**
 * Pure schemas, constants and JSON-parsing helpers for the project-grading
 * pipeline.
 *
 * Deliberately contains no SDK imports so client components can share these
 * types without pulling `openai` into the browser bundle.
 */

/* ------------------------------------------------------------------ */
/* JSON extraction                                                     */
/* ------------------------------------------------------------------ */

export class LLMParseError extends Error {
  readonly raw: string;

  constructor(message: string, raw: string) {
    super(message);
    this.name = "LLMParseError";
    this.raw = raw.slice(0, 2000);
  }
}

/**
 * Extracts a JSON object from a model response.
 *
 * Handles bare JSON, ```json fenced blocks, untagged ``` blocks, and JSON
 * surrounded by prose. Scans for the balanced brace range rather than taking
 * the first `{` to the last `}`, so trailing prose containing braces does not
 * corrupt the parse.
 */
export const extractJson = (raw: string): string => {
  const trimmed = raw.trim();

  const fenced = trimmed.match(/```(?:json|jsonc)?\s*\n([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const start = trimmed.indexOf("{");
  if (start === -1) {
    throw new LLMParseError("No JSON object found in response", raw);
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") depth++;
    if (char === "}") {
      depth--;
      if (depth === 0) {
        return trimmed.slice(start, i + 1);
      }
    }
  }

  throw new LLMParseError("Unbalanced JSON object in response", raw);
};

/**
 * Strips trailing commas before a closing brace or bracket.
 *
 * Models frequently emit JSONC-style trailing commas, and rejecting an
 * otherwise complete review over one is a bad trade. Only commas immediately
 * before a closer are removed, so commas inside string values survive.
 */
const stripTrailingCommas = (json: string): string =>
  json.replace(/,\s*([}\]])/g, "$1");

/** Parses and validates a model response. Throws LLMParseError on any failure. */
export const parseJsonResponse = <T>(
  raw: string | null | undefined,
  schema: z.ZodType<T>
): T => {
  if (!raw || raw.trim().length === 0) {
    throw new LLMParseError("Empty model response", raw ?? "");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(stripTrailingCommas(extractJson(raw)));
  } catch (error) {
    if (error instanceof LLMParseError) {
      throw error;
    }
    throw new LLMParseError(
      `JSON parse failed: ${(error as Error).message}`,
      raw
    );
  }

  const result = schema.safeParse(parsed);

  if (!result.success) {
    throw new LLMParseError(
      `Schema validation failed: ${result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
      raw
    );
  }

  return result.data;
};

/* ------------------------------------------------------------------ */
/* Coercion helpers                                                    */
/* ------------------------------------------------------------------ */

/** Coerces a model-supplied score to an integer in 0-100. */
export const clampScore = (value: unknown, fallback = 50): number => {
  //* Only real numbers and numeric strings count. `Number(null)` is 0 and
  //* `Number("")` is 0, so a model that omits a score would otherwise be
  //* recorded as a hard zero instead of falling back to a neutral score.
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
};

/**
 * Scores arrive as numbers, numeric strings, or occasionally missing entirely.
 * `.catch()` after the transform supplies the fallback for the failure case.
 */
const SCORE = z
  .unknown()
  .transform((value) => clampScore(value))
  .catch(50);

/**
 * List of model strings. Empty, missing, or non-array values collapse to `[]`
 * rather than failing the whole response, because a missing list is not a
 * reason to throw away an otherwise good grade.
 *
 * `.catch()` is placed before `.transform()` deliberately: in Zod 4 a
 * `.default()`/`.catch()` applied after `.transform()` has to satisfy the
 * transform's input type, which turns these into type errors.
 */
const stringList = (max: number, maxItemLength = 400) =>
  z
    .array(z.string().trim().max(maxItemLength))
    .max(max * 2)
    .optional()
    .catch([])
    .transform((items) =>
      (items ?? []).filter((item) => item.length > 0).slice(0, max)
    );

/** Free-text field that degrades to an empty string when absent. */
const text = (max: number, fallback = "") =>
  z.string().trim().max(max).optional().catch(undefined).transform((value) => value ?? fallback);

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export const CATEGORIES = [
  "code_quality",
  "architecture",
  "testing",
  "documentation",
  "maintainability",
] as const;

export type GradingCategory = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<GradingCategory, string> = {
  code_quality: "Code Quality",
  architecture: "Architecture",
  testing: "Testing",
  documentation: "Documentation",
  maintainability: "Maintainability & DevOps",
};

export const DEFAULT_WEIGHTS: Record<GradingCategory, number> = {
  code_quality: 0.25,
  architecture: 0.25,
  testing: 0.2,
  documentation: 0.15,
  maintainability: 0.15,
};

/**
 * Score to letter-grade bands.
 *
 * Applied as a function of the final score rather than trusted from the model:
 * asking a model to also emit the letter invites it to contradict its own score
 * (an "A" on a 41), and that inconsistency is stored and shown to the user next
 * to the score it supposedly describes.
 */
const LETTER_GRADE_BANDS: ReadonlyArray<{ min: number; grade: string }> = [
  { min: 90, grade: "A" },
  { min: 85, grade: "A-" },
  { min: 80, grade: "B+" },
  { min: 75, grade: "B" },
  { min: 70, grade: "B-" },
  { min: 65, grade: "C+" },
  { min: 60, grade: "C" },
  { min: 55, grade: "C-" },
  { min: 50, grade: "D+" },
  { min: 45, grade: "D" },
  { min: 0, grade: "F" },
];

export const scoreToLetterGrade = (score: number): string => {
  const normalized = Number.isFinite(score)
    ? Math.max(0, Math.min(100, score))
    : 0;

  const band = LETTER_GRADE_BANDS.find((entry) => normalized >= entry.min);

  return band?.grade ?? "F";
};

/* ------------------------------------------------------------------ */
/* Schemas                                                             */
/* ------------------------------------------------------------------ */

export const SEVERITIES = ["INFO", "LOW", "MEDIUM", "HIGH"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const normalizeSeverity = (value: unknown): Severity => {
  const normalized = String(value ?? "").toUpperCase();
  return (SEVERITIES as readonly string[]).includes(normalized)
    ? (normalized as Severity)
    : "MEDIUM";
};

export const FindingSchema = z.object({
  //* `.catch()` on both enums: a finding with a missing or malformed category or
  //* severity keeps its title and detail rather than failing the whole review.
  category: z
    .union([z.enum(CATEGORIES), z.string()])
    .catch("code_quality")
    .transform((value) =>
      (CATEGORIES as readonly string[]).includes(value)
        ? (value as GradingCategory)
        : "code_quality"
    ),
  severity: z
    .union([z.enum(SEVERITIES), z.string()])
    .catch("MEDIUM")
    .transform(normalizeSeverity),
  title: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .optional()
    .catch(undefined)
    .transform((value) => value ?? "Untitled finding"),
  detail: z.string().trim().max(2000).nullish().catch(null),
  fix: z.string().trim().max(2000).nullish().catch(null),
  path: z.string().trim().max(400).nullish().catch(null),
  line: z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((value) => {
      const numeric = typeof value === "string" ? Number(value) : value;
      return typeof numeric === "number" &&
        Number.isFinite(numeric) &&
        numeric > 0
        ? Math.min(Math.round(numeric), 1_000_000)
        : null;
    })
    .catch(null),
});

export type Finding = z.infer<typeof FindingSchema>;

export const CategoryGradeSchema = z.object({
  score: SCORE,
  rationale: text(4000),
  findings: z
    .array(FindingSchema)
    .max(60)
    .optional()
    .catch([])
    .transform((items) => items ?? []),
  strengths: stringList(10),
  improvements: stringList(10),
});

export type CategoryGrade = z.infer<typeof CategoryGradeSchema>;

export const UnderstandingSchema = z.object({
  projectType: text(120, "Unknown"),
  techStack: stringList(20, 80),
  summary: text(4000),
  architectureNotes: text(4000),
  coreFilePaths: stringList(30, 300),
  maturityNotes: text(2000),
});

export type Understanding = z.infer<typeof UnderstandingSchema>;

const normalizeDifficulty = (value: unknown): "easy" | "medium" | "hard" => {
  const normalized = String(value ?? "").toLowerCase();
  return normalized === "easy" || normalized === "hard" ? normalized : "medium";
};

export const InterviewQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .optional()
    .catch(undefined)
    .transform((value) => value ?? ""),
  hint: text(1500),
  relatedPaths: stringList(10, 300),
  difficulty: z
    .unknown()
    .transform(normalizeDifficulty)
    .catch("medium" as const),
});

export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;

export const SynthesisSchema = z.object({
  overallScore: SCORE,
  //* Deliberately not part of the model's contract. The synthesis prompt omits
  //* it and `runSynthesisPass` derives it via `scoreToLetterGrade`, so it stays
  //* optional here — a strict requirement would fail every parse now that the
  //* model is no longer asked for it.
  letterGrade: z
    .string()
    .trim()
    .max(4)
    .optional()
    .catch(undefined),
  headline: text(300),
  executiveSummary: text(6000),
  topStrengths: stringList(6),
  topPriorities: z
    .array(
      z.object({
        title: text(300, "Untitled priority"),
        why: text(2000),
        effort: text(40),
        impact: text(40),
      })
    )
    .max(20)
    .optional()
    .catch([])
    .transform((items) => items ?? []),
  interviewQuestions: z
    .array(InterviewQuestionSchema)
    .max(20)
    .optional()
    .catch([])
    .transform((items) => items ?? []),
  skillTags: stringList(20, 60),
});

export type Synthesis = z.infer<typeof SynthesisSchema>;

/* ------------------------------------------------------------------ */
/* Serialisable payload stored on GradeRun.grade                       */
/* ------------------------------------------------------------------ */

export type GradePayload = {
  version: 1;
  categories: Array<{
    key: GradingCategory;
    label: string;
    score: number;
    weight: number;
    rationale: string;
    strengths: string[];
    improvements: string[];
  }>;
  understanding: {
    projectType: string;
    techStack: string[];
    summary: string;
    architectureNotes: string;
    maturityNotes: string;
    coreFilePaths: string[];
  };
  synthesis: Synthesis;
  stats: {
    filesAnalyzed: number;
    skippedFiles: number;
    treeTruncated: boolean;
    llmCalls: number;
    secretsRedacted: number;
    injectionHits: number;
  };
};

export const buildGradePayload = (input: {
  categories: Record<GradingCategory, CategoryGrade>;
  understanding: Understanding;
  synthesis: Synthesis;
  stats: Omit<GradePayload["stats"], "secretsRedacted" | "injectionHits"> & {
    secretsRedacted: number;
    injectionHits: number;
  };
}): GradePayload => ({
  version: 1,
  categories: CATEGORIES.map((key) => ({
    key,
    label: CATEGORY_LABELS[key],
    score: input.categories[key]?.score ?? 0,
    weight: DEFAULT_WEIGHTS[key],
    rationale: input.categories[key]?.rationale ?? "",
    strengths: input.categories[key]?.strengths ?? [],
    improvements: input.categories[key]?.improvements ?? [],
  })),
  understanding: {
    projectType: input.understanding.projectType,
    techStack: input.understanding.techStack,
    summary: input.understanding.summary,
    architectureNotes: input.understanding.architectureNotes,
    maturityNotes: input.understanding.maturityNotes,
    coreFilePaths: input.understanding.coreFilePaths,
  },
  //* Derived, not taken from the model, so the grade always agrees with the
  //* score printed beside it.
  synthesis: {
    ...input.synthesis,
    overallScore: input.synthesis.overallScore,
    letterGrade: scoreToLetterGrade(input.synthesis.overallScore),
  },
  stats: input.stats,
});