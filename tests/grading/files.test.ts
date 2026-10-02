import { describe, expect, it } from "vitest";
import {
  classifyFiles,
  classifyPath,
  getExtension,
  isSensitivePath,
  isTestPath,
  renderFileTree,
  scoreFileImportance,
  selectCoreFiles,
  shouldSkipPath,
} from "@/lib/grading/files";
import type { GitHubTreeEntryInfo } from "@/lib/github";

const entry = (
  path: string,
  size = 1_000,
  sha = "abc123"
): GitHubTreeEntryInfo => ({ path, sha, size });

describe("getExtension", () => {
  it("returns the lowercase extension", () => {
    expect(getExtension("src/App.tsx")).toBe("tsx");
    expect(getExtension("Makefile")).toBe("makefile");
  });

  it("uses the filename for dotfiles rather than returning an empty string", () => {
    expect(getExtension(".gitignore")).toBe(".gitignore");
  });

  it("falls back to the filename when there is no dot", () => {
    expect(getExtension("LICENSE")).toBe("license");
  });
});

describe("classifyPath", () => {
  it("classifies the well-known filenames first", () => {
    expect(classifyPath("README.md")).toBe("doc");
    expect(classifyPath("package.json")).toBe("manifest");
    expect(classifyPath("Dockerfile")).toBe("manifest");
    expect(classifyPath(".github/workflows/ci.yml")).toBe("ci");
  });

  it("classifies tests by convention, not just by extension", () => {
    expect(classifyPath("src/auth/login.spec.ts")).toBe("test");
    expect(classifyPath("src/__tests__/parser.ts")).toBe("test");
  });

  it("classifies ordinary source files as code", () => {
    expect(classifyPath("src/server.ts")).toBe("code");
  });

  it("does not treat a source file as a test just because it contains test", () => {
    expect(classifyPath("src/latest.ts")).toBe("code");
  });
});

describe("isSensitivePath", () => {
  it("flags the paths that hold credentials", () => {
    expect(isSensitivePath(".env")).toBe(true);
    expect(isSensitivePath(".env.local")).toBe(true);
    expect(isSensitivePath("config/secrets.yml")).toBe(true);
  });

  it("does not flag ordinary source", () => {
    expect(isSensitivePath("src/index.ts")).toBe(false);
  });
});

describe("isTestPath", () => {
  it("does not match paths that merely contain the substring", () => {
    expect(isTestPath("src/latest/index.ts")).toBe(false);
    expect(isTestPath("src/protester.ts")).toBe(false);
  });
});

describe("shouldSkipPath", () => {
  it("skips vendored and build directories anywhere in the path", () => {
    expect(shouldSkipPath("node_modules/react/index.js", 100)).toBe(true);
    expect(shouldSkipPath("packages/ui/node_modules/x/index.js", 100)).toBe(true);
    expect(shouldSkipPath("dist/bundle.js", 100)).toBe(true);
  });

  it("skips credentials, lockfiles, and binary assets", () => {
    expect(shouldSkipPath(".env", 10)).toBe(true);
    expect(shouldSkipPath("package-lock.json", 10_000)).toBe(true);
    expect(shouldSkipPath("assets/logo.png", 10_000)).toBe(true);
  });

  it("keeps real source", () => {
    expect(shouldSkipPath("src/index.ts", 500)).toBe(false);
  });

  it("does not skip large files outright - they are penalised during scoring", () => {
    // Generated bundles are handled by the importance penalty and by the
    // selection budget, so that a genuinely important large file (a big schema
    // or a long route module) is not silently dropped from the review.
    expect(shouldSkipPath("src/huge.ts", 900_000)).toBe(false);
  });
});

describe("scoreFileImportance size penalty", () => {
  it("penalises files large enough to be generated", () => {
    const normal = scoreFileImportance("src/module.ts", 2_000, "code");
    const generated = scoreFileImportance("src/module.ts", 90_000, "code");

    expect(generated).toBeLessThan(normal);
  });
});

describe("classifyFiles", () => {
  it("splits entries into included and skipped and reports the skipped count", () => {
    const result = classifyFiles([
      entry("src/index.ts"),
      entry("src/parser.ts"),
      entry("node_modules/foo/index.js"),
      entry(".env"),
    ]);

    expect(result.included.map((file) => file.path)).toEqual([
      "src/index.ts",
      "src/parser.ts",
    ]);
    expect(result.skippedCount).toBe(2);
  });

  it("assigns an importance score to every included file", () => {
    const result = classifyFiles([entry("src/index.ts"), entry("README.md")]);
    const index = result.included.find((f) => f.path === "src/index.ts");

    expect(index?.score).toBeGreaterThan(0);
    expect(index?.kind).toBe("code");
  });
});

describe("scoreFileImportance", () => {
  it("ranks entrypoints above incidental files", () => {
    const entrypoint = scoreFileImportance("src/index.ts", 500, "code");
    const incidental = scoreFileImportance("src/helpers/formatDate.ts", 500, "code");

    expect(entrypoint).toBeGreaterThan(incidental);
  });

  it("ranks manifests high because they describe the whole project", () => {
    const manifest = scoreFileImportance("package.json", 500, "manifest");
    const code = scoreFileImportance("src/util.ts", 500, "code");

    expect(manifest).toBeGreaterThan(code);
  });
});

describe("selectCoreFiles", () => {
  it("respects the maxFiles cap", () => {
    const candidates = classifyFiles(
      Array.from({ length: 120 }, (_, index) =>
        entry(`src/module${index}.ts`, 400)
      )
    ).included;

    const { selected } = selectCoreFiles(candidates, {
      maxFiles: 5,
      maxChars: 100_000,
      maxFileChars: 12_000,
    });

    expect(selected.length).toBeLessThanOrEqual(5);
  });

  it("keeps the total inside the character budget", () => {
    const candidates = classifyFiles(
      Array.from({ length: 40 }, (_, index) =>
        entry(`src/module${index}.ts`, 8_000)
      )
    ).included;

    const { totalChars } = selectCoreFiles(candidates, {
      maxFiles: 40,
      maxChars: 20_000,
      maxFileChars: 6_000,
    });

    expect(totalChars).toBeLessThanOrEqual(20_000);
  });

  it("gives every candidate a chance rather than dropping the tail", () => {
    // Twenty large files against a budget that fits a few: the later files must
    // still appear, otherwise a repo of similarly-shaped modules loses most of
    // its source to the character budget.
    const candidates = classifyFiles(
      Array.from({ length: 20 }, (_, index) =>
        entry(`src/module${index}.ts`, 9_000)
      )
    ).included;

    const { selected } = selectCoreFiles(candidates, {
      maxFiles: 20,
      maxChars: 60_000,
      maxFileChars: 5_000,
    });

    expect(selected.length).toBeGreaterThan(1);
    expect(new Set(selected.map((file) => file.path)).size).toBe(selected.length);
  });

  it("never returns duplicates", () => {
    const candidates = classifyFiles([entry("src/a.ts"), entry("src/b.ts")]).included;
    const { selected } = selectCoreFiles(candidates);

    expect(new Set(selected.map((file) => file.path)).size).toBe(selected.length);
  });

  it("drops empty files", () => {
    const candidates = classifyFiles([entry("src/empty.ts", 0)]).included;
    const { selected } = selectCoreFiles(candidates);

    expect(selected).toHaveLength(0);
  });
});

describe("renderFileTree", () => {
  it("lists every file when the tree is small", () => {
    const output = renderFileTree([
      { path: "src/a.ts", kind: "code", size: 10 },
      { path: "README.md", kind: "doc", size: 20 },
    ]);

    expect(output).toContain("src/a.ts");
    expect(output).toContain("README.md");
  });

  it("truncates and says so when the tree is large", () => {
    const files = Array.from({ length: 50 }, (_, index) => ({
      path: `src/module${index}.ts`,
      kind: "code" as const,
      size: 10,
    }));

    const output = renderFileTree(files, 10);

    expect(output).toContain("src/module0.ts");
    expect(output.length).toBeLessThan(
      files.map((f) => `${f.path} [code, 10b]`).join("\n").length
    );
  });
});
