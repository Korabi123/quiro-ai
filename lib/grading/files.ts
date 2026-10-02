import type { GitHubTreeEntryInfo } from "@/lib/github";

/**
 * Pure helpers that decide which files from a repository are worth spending
 * LLM tokens on. Kept free of I/O so they can be unit tested directly.
 */

export const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  "vendor",
  "dist",
  "build",
  "out",
  "target",
  "coverage",
  ".next",
  ".nuxt",
  ".svelte-kit",
  ".turbo",
  ".cache",
  ".output",
  ".vercel",
  ".netlify",
  "__pycache__",
  ".pytest_cache",
  ".mypy_cache",
  ".tox",
  "venv",
  ".venv",
  "env",
  ".env",
  ".idea",
  ".vscode",
  ".gradle",
  "bin",
  "obj",
  "Pods",
  "DerivedData",
  "third_party",
  "bower_components",
  "jspm_packages",
]);

const IGNORED_FILENAMES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
  "bun.lock",
  "npm-shrinkwrap.json",
  "composer.lock",
  "gemfile.lock",
  "cargo.lock",
  "poetry.lock",
  "go.sum",
  "pipfile.lock",
  "flake.lock",
  "uv.lock",
]);

/** Generated / vendored artifacts that carry no signal about code quality. */
const IGNORED_PATTERNS: RegExp[] = [
  /\.min\.(js|css)$/i,
  /\.d\.ts$/i,
  /\.map$/i,
  /\.snap$/i,
  /\.snap\.new$/i,
  /\.generated\.[a-z]+$/i,
  /\.pb\.go$/i,
  /_pb2(_grpc)?\.py$/i,
  /\.g\.(cs|ts)$/i,
  /\.designer\.cs$/i,
  /^\.gitattributes$/i,
  /^\.gitmodules$/i,
  /^\.editorconfig$/i,
  /\.lock$/i,
];

/** Paths that hold credentials. Never read, never sent to a model. */
const SENSITIVE_PATTERNS: RegExp[] = [
  /(^|\/)\.env(\..+)?$/i,
  /(^|\/)\.netrc$/i,
  /(^|\/)id_(rsa|dsa|ecdsa|ed25519)$/i,
  /\.pem$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /\.key$/i,
  /(^|\/)secrets?\.(ya?ml|json|toml)$/i,
  /(^|\/)credentials(\.[a-z]+)?$/i,
  /(^|\/)\.npmrc$/i,
  /(^|\/)\.pypirc$/i,
  /(^|\/)\.aws\/credentials$/i,
  /(^|\/)service[-_]?account.*\.json$/i,
];

const BINARY_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "ico", "tiff",
  "pdf", "zip", "gz", "tar", "bz2", "xz", "7z", "rar",
  "mp3", "mp4", "wav", "ogg", "avi", "mov", "webm", "flac",
  "woff", "woff2", "ttf", "otf", "eot",
  "so", "dylib", "dll", "exe", "bin", "o", "a", "class", "jar", "wasm",
  "pyc", "pyo", "ipynb",
  "db", "sqlite", "sqlite3", "mdb",
  "psd", "ai", "sketch", "fig", "blend",
]);

export const CODE_EXTENSIONS = new Set([
  "ts", "tsx", "js", "jsx", "mjs", "cjs", "py", "go", "rs", "java", "kt",
  "kts", "swift", "rb", "php", "cs", "fs", "c", "h", "cc", "cpp", "hpp",
  "m", "mm", "scala", "dart", "ex", "exs", "erl", "clj", "lua", "sh", "bash",
  "zsh", "sql", "prisma", "graphql", "gql", "vue", "svelte", "astro",
]);

const CONFIG_EXTENSIONS = new Set([
  "json", "yaml", "yml", "toml", "ini", "cfg", "conf", "xml", "env",
  "dockerfile", "tf", "tfvars", "gradle", "properties", "editorconfig",
]);

const TEST_PATTERNS: RegExp[] = [
  /(^|\/)(tests?|__tests__|spec|e2e|cypress)\//i,
  /\.(test|spec)\.[a-z]+$/i,
  /(^|\/)test_[^/]+\.py$/i,
  /[^/]+_test\.[a-z]+$/i,
  /[^/]+\.test\.[a-z]+$/i,
];

const DOC_FILENAMES = new Set([
  "readme.md", "readme", "contributing.md", "architecture.md", "design.md",
  "changelog.md", "license", "license.md", "code_of_conduct.md",
  "docs", "adr", "api.md", "setup.md",
]);

const MANIFEST_FILENAMES = new Set([
  "package.json", "pyproject.toml", "cargo.toml", "go.mod", "pom.xml",
  "build.gradle", "requirements.txt", "setup.py", "composer.json",
  "gemfile", "dockerfile", "docker-compose.yml", "docker-compose.yaml",
  "makefile", "next.config.js", "next.config.ts", "vite.config.ts",
  "tsconfig.json", "tailwind.config.ts", "schema.prisma", "justfile",
]);

const CI_PATTERNS: RegExp[] = [
  /^\.github\/workflows\//i,
  /^\.gitlab-ci\.yml$/i,
  /^\.circleci\/config\.yml$/i,
  /^\.travis\.yml$/i,
  /^azure-pipelines\.yml$/i,
  /^\.pre-commit-config\.yaml$/i,
];

export type RepoFileKind = "code" | "test" | "config" | "doc" | "manifest" | "ci";

export type ClassifiedFile = {
  path: string;
  sha: string;
  size: number;
  extension: string;
  kind: RepoFileKind | "other";
  score: number;
};

export const getExtension = (path: string): string => {
  const filename = path.split("/").pop() ?? path;
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex <= 0) {
    return filename.toLowerCase();
  }
  return filename.slice(dotIndex + 1).toLowerCase();
};

export const getFilename = (path: string): string =>
  (path.split("/").pop() ?? path).toLowerCase();

export const isSensitivePath = (path: string): boolean =>
  SENSITIVE_PATTERNS.some((pattern) => pattern.test(path));

export const isTestPath = (path: string): boolean =>
  TEST_PATTERNS.some((pattern) => pattern.test(path));

export const isCiPath = (path: string): boolean =>
  CI_PATTERNS.some((pattern) => pattern.test(path));

export const classifyPath = (path: string): RepoFileKind | "other" => {
  const filename = getFilename(path);
  const extension = getExtension(path);

  if (isCiPath(path)) return "ci";
  if (filename === "readme.md" || DOC_FILENAMES.has(filename)) return "doc";
  if (MANIFEST_FILENAMES.has(filename) || filename.startsWith("dockerfile")) {
    return "manifest";
  }
  if (isTestPath(path)) return "test";
  if (CODE_EXTENSIONS.has(extension)) return "code";
  if (CONFIG_EXTENSIONS.has(extension)) return "config";
  return "other";
};

/**
 * Returns true when the path should be excluded from grading entirely.
 * Order matters: the cheapest and most decisive checks run first.
 */
export const shouldSkipPath = (path: string, size: number): boolean => {
  const segments = path.split("/");

  if (segments.some((segment) => IGNORED_DIRECTORIES.has(segment))) {
    return true;
  }

  const filename = getFilename(path);

  if (IGNORED_FILENAMES.has(filename)) {
    return true;
  }

  if (IGNORED_PATTERNS.some((pattern) => pattern.test(path))) {
    return true;
  }

  if (isSensitivePath(path)) {
    return true;
  }

  const extension = getExtension(path);

  if (BINARY_EXTENSIONS.has(extension)) {
    return true;
  }

  //* Files with no extension are usually binaries or vendored assets.
  if (extension === filename && !DOTLESS_TEXT_FILES.has(filename)) {
    return true;
  }

  if (size === 0) {
    return true;
  }

  return false;
};

const DOTLESS_TEXT_FILES = new Set([
  "readme",
  "license",
  "licence",
  "dockerfile",
  "makefile",
  "procfile",
  "justfile",
  "codeowners",
  "gemfile",
  "rakefile",
  "brewfile",
  "caddyfile",
]);

const HIGH_SIGNAL_DIRECTORIES = [
  "src", "lib", "app", "apps", "packages", "server", "client", "api",
  "core", "internal", "pkg", "cmd", "modules", "services", "components",
];

const ENTRYPOINT_FILENAMES = new Set([
  "index.ts", "index.tsx", "index.js", "index.jsx", "main.ts", "main.tsx",
  "main.py", "main.go", "main.rs", "app.ts", "app.py", "server.ts",
  "server.js", "cli.ts", "cli.py", "__main__.py", "mod.rs", "lib.rs",
]);

/**
 * Heuristic importance score. Higher means more likely to be architecturally
 * representative. Deliberately simple and deterministic — no LLM in the loop,
 * so the whole selection is reproducible and testable.
 */
export const scoreFileImportance = (
  path: string,
  size: number,
  kind: RepoFileKind | "other"
): number => {
  let score = 0;

  switch (kind) {
    case "manifest":
      score += 45;
      break;
    case "code":
      score += 30;
      break;
    case "test":
      score += 25;
      break;
    case "config":
      score += 18;
      break;
    case "ci":
      score += 18;
      break;
    case "doc":
      score += 12;
      break;
    default:
      score += 0;
  }

  const segments = path.split("/");
  const filename = getFilename(path);

  //* Shallower files are more likely to be entrypoints and orchestration.
  score += Math.max(0, 8 - segments.length * 2);

  if (segments.some((segment) => HIGH_SIGNAL_DIRECTORIES.includes(segment))) {
    score += 12;
  }

  if (ENTRYPOINT_FILENAMES.has(filename)) {
    score += 20;
  }

  //* Tests next to the code they cover matter more than isolated e2e suites.
  if (kind === "test" && segments.includes("src")) {
    score += 6;
  }

  //* Very large files are usually generated, bundled, or data dumps.
  if (size > 40_000) {
    score -= 25;
  } else if (size > 15_000) {
    score -= 8;
  }

  //* Tiny files rarely demonstrate architecture.
  if (size < 120) {
    score -= 6;
  }

  return score;
};

/** Applies ignore rules and tags each surviving file with a score. */
export const classifyFiles = (
  entries: GitHubTreeEntryInfo[]
): { included: ClassifiedFile[]; skippedCount: number } => {
  const included: ClassifiedFile[] = [];
  let skippedCount = 0;

  for (const entry of entries) {
    if (shouldSkipPath(entry.path, entry.size)) {
      skippedCount += 1;
      continue;
    }

    const kind = classifyPath(entry.path);
    const extension = getExtension(entry.path);

    //* "other" covers extensionless text and unrecognised types; keep a small
    //* amount of them so unusual stacks are not silently dropped.
    if (kind === "other" && extension !== "md" && extension !== "txt") {
      skippedCount += 1;
      continue;
    }

    included.push({
      path: entry.path,
      sha: entry.sha,
      size: entry.size,
      extension,
      kind,
      score: scoreFileImportance(entry.path, entry.size, kind),
    });
  }

  included.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    //* Stable tiebreak so selection is deterministic across runs.
    return a.path.localeCompare(b.path);
  });

  return { included, skippedCount };
};

export type SelectionBudget = {
  maxFiles: number;
  maxChars: number;
  maxFileChars: number;
};

export const DEFAULT_BUDGET: SelectionBudget = {
  maxFiles: 60,
  maxChars: 120_000,
  maxFileChars: 12_000,
};

export type SelectedFile = ClassifiedFile & {
  /** Estimated rendered size once headers and fences are added. */
  estimatedChars: number;
};

/**
 * Picks the highest-scoring files that fit inside the character budget.
 *
 * Every candidate gets a guaranteed minimum allocation, so a single enormous
 * file cannot starve the rest of the selection. Remaining budget is then spent
 * greedily on the next-best candidates.
 */
export const selectCoreFiles = (
  candidates: ClassifiedFile[],
  budget: SelectionBudget = DEFAULT_BUDGET
): { selected: SelectedFile[]; totalChars: number } => {
  const eligible = candidates
    .filter((file) => file.size > 0 && file.size <= budget.maxFileChars * 4)
    .slice(0, budget.maxFiles * 2);

  const perFileCap = Math.min(
    budget.maxFileChars,
    Math.floor(budget.maxChars / budget.maxFiles)
  );

  const selected: SelectedFile[] = [];
  let totalChars = 0;

  for (const file of eligible) {
    if (selected.length >= budget.maxFiles) break;
    if (totalChars >= budget.maxChars) break;

    const estimatedChars = Math.min(file.size, perFileCap);
    if (totalChars + estimatedChars > budget.maxChars) {
      continue;
    }

    selected.push({ ...file, estimatedChars });
    totalChars += estimatedChars;
  }

  return { selected, totalChars };
};

/** Renders selected files into a single delimited, LLM-ready document. */
export const renderFileBundle = (
  files: SelectedFile[],
  contents: Map<string, string>
): string => {
  const blocks: string[] = [];

  for (const file of files) {
    const raw = contents.get(file.path);
    if (!raw) continue;

    blocks.push(
      [
        `--- FILE: ${file.path} (${file.kind}, ${file.extension}) ---`,
        raw,
        `--- END FILE: ${file.path} ---`,
      ].join("\n")
    );
  }

  return blocks.join("\n\n");
};

/** Compact one-line-per-file listing, for the understand pass. */
export const renderFileTree = (
  files: Array<Pick<ClassifiedFile, "path" | "kind" | "size">>,
  maxEntries = 400
): string => {
  if (files.length <= maxEntries) {
    return files.map((f) => `${f.path} [${f.kind}, ${f.size}b]`).join("\n");
  }

  const head = files
    .slice(0, maxEntries)
    .map((f) => `${f.path} [${f.kind}, ${f.size}b]`);

  return [
    ...head,
    `... ${files.length - maxEntries} more files omitted from this listing`,
  ].join("\n");
};