import { describe, expect, it } from "vitest";
import {
  CategoryGradeSchema,
  FindingSchema,
  SynthesisSchema,
  UnderstandingSchema,
  buildGradePayload,
  clampScore,
  extractJson,
  normalizeSeverity,
  parseJsonResponse,
  scoreToLetterGrade,
  type CategoryGrade,
  type GradingCategory,
} from "@/lib/grading/schema";

describe("extractJson", () => {
  it("strips a markdown code fence", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("strips a fence with no language tag", () => {
    expect(extractJson('```\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("leaves bare JSON alone", () => {
    expect(extractJson('{"a":1}')).toBe('{"a":1}');
  });
});

describe("parseJsonResponse", () => {
  it("parses a fenced JSON payload", () => {
    const parsed = parseJsonResponse(
      '```json\n{"projectType":"api"}\n```',
      UnderstandingSchema
    );

    expect(parsed.projectType).toBe("api");
  });

  it("recovers a payload wrapped in prose around the object", () => {
    const parsed = parseJsonResponse(
      'Here is my analysis:\n{"projectType":"cli"}\nHope that helps!',
      UnderstandingSchema
    );

    expect(parsed.projectType).toBe("cli");
  });

  it("tolerates trailing commas from a model that is nearly right", () => {
    const parsed = parseJsonResponse(
      '{"projectType":"web","techStack":["next"],"summary":"ok",}',
      UnderstandingSchema
    );

    expect(parsed.projectType).toBe("web");
  });

  it("throws rather than returning a half-parsed object", () => {
    expect(() =>
      parseJsonResponse("this is not json at all", UnderstandingSchema)
    ).toThrow();
  });

  it("falls back to defaults instead of failing when a required field is malformed", () => {
    // Models drift. A single bad field should not throw away a whole review.
    const parsed = parseJsonResponse(
      JSON.stringify({
        score: "not a number",
        headline: 12345,
        overallScore: "eighty",
      }),
      SynthesisSchema
    );

    expect(Number.isFinite(parsed.overallScore)).toBe(true);
    expect(typeof parsed.headline).toBe("string");
  });
});

describe("clampScore", () => {
  it("clamps above the range", () => {
    expect(clampScore(140)).toBe(100);
  });

  it("clamps below the range", () => {
    expect(clampScore(-20)).toBe(0);
  });

  it("rounds fractional scores", () => {
    expect(clampScore(72.6)).toBe(73);
  });

  it("uses the fallback for values that are not numbers", () => {
    expect(clampScore("abc", 42)).toBe(42);
    expect(clampScore(undefined, 42)).toBe(42);
  });

  it("does not coerce null or an empty string into a score of zero", () => {
    // Number(null) and Number("") are both 0, which would record a repo with a
    // missing score as a hard zero instead of a neutral fallback.
    expect(clampScore(null, 42)).toBe(42);
    expect(clampScore("", 42)).toBe(42);
    expect(clampScore("   ", 42)).toBe(42);
  });

  it("still parses a numeric string", () => {
    expect(clampScore("82", 42)).toBe(82);
    expect(clampScore(0, 42)).toBe(0);
  });
});

describe("normalizeSeverity", () => {
  it("maps model vocabulary onto the four known levels", () => {
    expect(normalizeSeverity("high")).toBe("HIGH");
    expect(normalizeSeverity("MEDIUM")).toBe("MEDIUM");
  });

  it("falls back to MEDIUM for anything unrecognised", () => {
    // MEDIUM rather than INFO: an unclassifiable severity is far more likely to
    // be a real problem the model failed to rank than praise, and INFO findings
    // read as observations.
    expect(normalizeSeverity("catastrophic")).toBe("MEDIUM");
    expect(normalizeSeverity(undefined)).toBe("MEDIUM");
  });
});

describe("FindingSchema", () => {
  it("drops a severity the model invented instead of failing the finding", () => {
    const finding = FindingSchema.parse({
      category: "code_quality",
      severity: "APOCALYPTIC",
      title: "Hardcoded secret",
    });

    expect(finding.severity).toBe("MEDIUM");
    expect(finding.title).toBe("Hardcoded secret");
  });

  it("keeps a valid finding intact", () => {
    const finding = FindingSchema.parse({
      category: "code_quality",
      severity: "HIGH",
      title: "Unhandled promise rejection",
      detail: "src/a.ts:12 awaits without a catch",
      fix: "Add a catch or a finally block",
      path: "src/a.ts",
      line: 12,
    });

    expect(finding.severity).toBe("HIGH");
    expect(finding.path).toBe("src/a.ts");
  });

  it("survives a finding that omits category and severity entirely", () => {
    const finding = FindingSchema.parse({ title: "Mystery issue" });

    expect(finding.title).toBe("Mystery issue");
    expect(finding.severity).toBe("MEDIUM");
    expect(finding.category).toBe("code_quality");
  });

  it("substitutes a title when the model omits it", () => {
    const finding = FindingSchema.parse({ category: "testing" });

    expect(typeof finding.title).toBe("string");
    expect(finding.title.length).toBeGreaterThan(0);
  });
});

describe("CategoryGradeSchema", () => {
  it("returns empty arrays rather than undefined for missing collections", () => {
    const grade = CategoryGradeSchema.parse({ score: 70, rationale: "ok" });

    expect(grade.findings).toEqual([]);
    expect(grade.strengths).toEqual([]);
    expect(grade.improvements).toEqual([]);
  });

  it("caps an oversized findings array", () => {
    const findings = Array.from({ length: 200 }, () => ({
      category: "testing",
      title: "finding",
    }));

    const grade = CategoryGradeSchema.parse({ score: 70, findings });

    expect(grade.findings.length).toBeLessThanOrEqual(60);
  });
});

describe("SynthesisSchema", () => {
  it("returns empty arrays for the optional collections", () => {
    const synthesis = SynthesisSchema.parse({ overallScore: 80 });

    expect(synthesis.topStrengths).toEqual([]);
    expect(synthesis.topPriorities).toEqual([]);
    expect(synthesis.interviewQuestions).toEqual([]);
  });

  it("normalises interview question difficulty", () => {
    const synthesis = SynthesisSchema.parse({
      overallScore: 80,
      interviewQuestions: [
        { question: "Why is the cache invalidated here?", difficulty: "HARD" },
        { question: "What does this module export?", difficulty: "wat" },
      ],
    });

    expect(synthesis.interviewQuestions[0].difficulty).toBe("hard");
    expect(synthesis.interviewQuestions[1].difficulty).toBe("medium");
  });

  it("drops an interview question with no text", () => {
    const synthesis = SynthesisSchema.parse({
      overallScore: 80,
      interviewQuestions: [{ difficulty: "easy" }],
    });

    expect(synthesis.interviewQuestions[0].question).toBe("");
  });
});

describe("scoreToLetterGrade", () => {
  it.each([
    [100, "A"],
    [95, "A"],
    [90, "A"],
    [89.9, "A-"],
    [85, "A-"],
    [84, "B+"],
    [80, "B+"],
    [79, "B"],
    [75, "B"],
    [74, "B-"],
    [70, "B-"],
    [69, "C+"],
    [65, "C+"],
    [64, "C"],
    [60, "C"],
    [59, "C-"],
    [55, "C-"],
    [54, "D+"],
    [50, "D+"],
    [49, "D"],
    [45, "D"],
    [44.9, "F"],
    [0, "F"],
  ])("maps %s to %s", (score, grade) => {
    expect(scoreToLetterGrade(score)).toBe(grade);
  });

  it("clamps scores outside 0-100 instead of producing a nonsense band", () => {
    expect(scoreToLetterGrade(140)).toBe("A");
    expect(scoreToLetterGrade(-20)).toBe("F");
  });

  it("returns F for non-finite input", () => {
    expect(scoreToLetterGrade(Number.NaN)).toBe("F");
  });

  it("is monotonic — a higher score never grades worse", () => {
    for (let score = 1; score < 100; score += 0.5) {
      const index = ["F", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A"].indexOf(
        scoreToLetterGrade(score)
      );
      expect(index).toBeGreaterThanOrEqual(
        ["F", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A"].indexOf(
          scoreToLetterGrade(score - 0.5)
        )
      );
    }
  });
});

describe("buildGradePayload", () => {
  const categories = {
    code_quality: {
      score: 80,
      rationale: "Readable and consistent.",
      findings: [],
      strengths: [],
      improvements: [],
    },
    architecture: {
      score: 60,
      rationale: "Some coupling.",
      findings: [],
      strengths: [],
      improvements: [],
    },
    testing: {
      score: 40,
      rationale: "Sparse coverage.",
      findings: [],
      strengths: [],
      improvements: [],
    },
    documentation: {
      score: 70,
      rationale: "Adequate README.",
      findings: [],
      strengths: [],
      improvements: [],
    },
    maintainability: {
      score: 70,
      rationale: "Low churn.",
      findings: [],
      strengths: [],
      improvements: [],
    },
  } satisfies Record<GradingCategory, CategoryGrade>;

  const synthesis = SynthesisSchema.parse({
    overallScore: 64,
    letterGrade: "C",
    headline: "Solid core, thin tests",
    executiveSummary: "The project works but needs tests.",
  });

  const payload = buildGradePayload({
    categories,
    understanding: {
      projectType: "web app",
      techStack: ["typescript"],
      summary: "A web app.",
      architectureNotes: "Layered.",
      maturityNotes: "Prototype.",
      coreFilePaths: ["src/index.ts"],
    },
    synthesis,
    stats: {
      filesAnalyzed: 12,
      skippedFiles: 3,
      treeTruncated: false,
      llmCalls: 7,
      secretsRedacted: 0,
      injectionHits: 0,
    },
  });

  it("emits one entry per category with its label and weight", () => {
    expect(payload.categories).toHaveLength(5);
    expect(payload.categories.map((category) => category.key).sort()).toEqual([
      "architecture",
      "code_quality",
      "documentation",
      "maintainability",
      "testing",
    ]);
  });

  it("keeps the weights summing to 1", () => {
    const total = payload.categories.reduce((sum, c) => sum + c.weight, 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it("stamps the payload version so stored grades can be migrated later", () => {
    expect(payload.version).toBe(1);
  });

  it("passes the synthesis through", () => {
    expect(payload.synthesis.letterGrade).toBe("C");
    expect(payload.stats.filesAnalyzed).toBe(12);
  });

  it("derives the letter grade from the score, ignoring any model-supplied value", () => {
    const bogus = buildGradePayload({
      categories,
      understanding: {
        projectType: "web app",
        techStack: ["typescript"],
        summary: "A web app.",
        architectureNotes: "Layered.",
        maturityNotes: "Prototype.",
        coreFilePaths: ["src/index.ts"],
      },
      //* A model claiming an "A" on a 41 is exactly the inconsistency the
      //* derivation exists to prevent.
      synthesis: SynthesisSchema.parse({
        overallScore: 41,
        letterGrade: "A",
        headline: "h",
        executiveSummary: "s",
      }),
      stats: {
        filesAnalyzed: 1,
        skippedFiles: 0,
        treeTruncated: false,
        llmCalls: 1,
        secretsRedacted: 0,
        injectionHits: 0,
      },
    });

    expect(bogus.synthesis.letterGrade).toBe("F");
  });

  it("parses a synthesis that omits letterGrade entirely", () => {
    const parsed = SynthesisSchema.parse({
      overallScore: 88,
      headline: "h",
      executiveSummary: "s",
    });

    expect(parsed.letterGrade).toBeUndefined();
    expect(scoreToLetterGrade(parsed.overallScore)).toBe("A-");
  });
});
