import { z } from "zod";

/**
 * Minimal GitHub REST client for the project-grading pipeline.
 *
 * Only public repositories are supported, so every endpoint here is one that
 * works unauthenticated. A token is still used when one is available purely to
 * lift the rate limit ceiling from 60/hr to 5000/hr.
 */

const GITHUB_API = "https://api.github.com";
const GITHUB_RAW = "https://raw.githubusercontent.com";

export const FULL_NAME_PATTERN = /^[\w.-]+\/[\w.-]+$/;

export class GitHubError extends Error {
  readonly status: number;
  readonly rateLimited: boolean;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GitHubError";
    this.status = status;
    this.rateLimited = status === 403 || status === 429;
  }
}

export type GitHubRateLimit = {
  limit: number;
  remaining: number;
  reset: number;
};

export type GitHubUser = {
  id: number;
  login: string;
  name: string | null;
  avatarUrl: string | null;
  publicRepoCount: number;
};

export type GitHubRepoSummary = {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  description: string | null;
  language: string | null;
  isFork: boolean;
  stars: number;
  defaultBranch: string;
  pushedAt: Date | null;
  topics: string[];
  archived: boolean;
  sizeKb: number;
};

export type GitHubRepoSnapshot = {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  description: string | null;
  defaultBranch: string;
  commitSha: string;
  topics: string[];
  languages: Record<string, number>;
  readme: string | null;
};

export type GitHubTreeEntryInfo = {
  path: string;
  sha: string;
  size: number;
};

const USER_SCHEMA = z.object({
  login: z.string(),
  name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  public_repos: z.number(),
});

const REPO_SCHEMA = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  owner: z.object({ login: z.string() }),
  description: z.string().nullable(),
  language: z.string().nullable(),
  fork: z.boolean(),
  private: z.boolean(),
  stargazers_count: z.number(),
  default_branch: z.string(),
  pushed_at: z.string().nullable(),
  topics: z.array(z.string()).optional(),
  archived: z.boolean(),
  size: z.number(),
});

const TREE_SCHEMA = z.object({
  sha: z.string(),
  truncated: z.boolean().optional(),
  tree: z.array(
    z.object({
      path: z.string(),
      mode: z.string(),
      type: z.enum(["blob", "tree", "commit"]),
      sha: z.string(),
      size: z.number().optional(),
    })
  ),
});

const assertFullName = (fullName: string): string => {
  if (!FULL_NAME_PATTERN.test(fullName)) {
    throw new GitHubError(`Invalid repository name: ${fullName}`, 400);
  }
  //* Guards against path traversal in the owner/name segments, which would
  //* otherwise let a crafted name escape the /repos/ prefix.
  if (fullName.includes("..") || fullName.includes("//")) {
    throw new GitHubError(`Invalid repository name: ${fullName}`, 400);
  }
  return fullName;
};

const parseRateLimit = (res: Response): GitHubRateLimit => ({
  limit: Number(res.headers.get("x-ratelimit-limit") ?? 0),
  remaining: Number(res.headers.get("x-ratelimit-remaining") ?? 0),
  reset: Number(res.headers.get("x-ratelimit-reset") ?? 0) * 1000,
});

export class GitHubClient {
  private readonly token: string | null;
  private lastRateLimit: GitHubRateLimit = {
    limit: 0,
    remaining: 0,
    reset: 0,
  };

  constructor(token?: string | null) {
    this.token = token && token.length > 0 ? token : null;
  }

  get rateLimit(): GitHubRateLimit {
    return this.lastRateLimit;
  }

  private async request<T>(
    path: string,
    schema: z.ZodType<T>,
    init?: RequestInit
  ): Promise<T> {
    const res = await fetch(`${GITHUB_API}${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "quiro-ai-project-grading",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...init?.headers,
      },
      cache: "no-store",
    });

    this.lastRateLimit = parseRateLimit(res);

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = await res.json();
        if (body && typeof body.message === "string") {
          detail = body.message;
        }
      } catch {
        //* Body was not JSON; the status text is the best we have.
      }
      throw new GitHubError(`GitHub API ${res.status}: ${detail}`, res.status);
    }

    return schema.parse(await res.json());
  }

  async getViewer(): Promise<GitHubUser> {
    const raw = await this.request(
      "/user",
      USER_SCHEMA.extend({
        id: z.number(),
        avatar_url: z.string().nullable(),
      })
    );

    return {
      id: raw.id,
      login: raw.login,
      name: raw.name,
      avatarUrl: raw.avatar_url,
      publicRepoCount: raw.public_repos,
    };
  }

  /**
   * Lists the viewer's own public repositories, non-archived first, paginated
   * up to `maxPages` x 100.
   */
  async listRepos(maxPages = 3): Promise<GitHubRepoSummary[]> {
    const collected: GitHubRepoSummary[] = [];

    for (let page = 1; page <= maxPages; page++) {
      const batch = await this.request(
        `/user/repos?per_page=100&page=${page}&sort=pushed&affiliation=owner,collaborator,organization_member&visibility=public`,
        z.array(REPO_SCHEMA)
      );

      if (batch.length === 0) {
        break;
      }

      collected.push(
        ...batch
          //* Private repos are out of scope for v1 even if the token can see them.
          .filter((repo) => !repo.private && !repo.archived)
          .map((repo) => toRepoSummary(repo))
      );

      if (batch.length < 100) {
        break;
      }
    }

    return collected;
  }

  /** Lists public repositories owned by a user or org, by login. */
  async listReposForOwner(
    login: string,
    maxPages = 2
  ): Promise<GitHubRepoSummary[]> {
    if (!/^[\w.-]+$/.test(login)) {
      throw new GitHubError(`Invalid owner login: ${login}`, 400);
    }

    const collected: GitHubRepoSummary[] = [];

    for (let page = 1; page <= maxPages; page++) {
      const batch = await this.request(
        `/users/${login}/repos?per_page=100&page=${page}&type=owner&sort=pushed`,
        z.array(REPO_SCHEMA)
      );

      if (batch.length === 0) {
        break;
      }

      collected.push(
        ...batch
          .filter((repo) => !repo.private && !repo.archived)
          .map((repo) => toRepoSummary(repo))
      );

      if (batch.length < 100) {
        break;
      }
    }

    return collected;
  }

  async getRepo(fullName: string): Promise<GitHubRepoSummary> {
    assertFullName(fullName);
    const raw = await this.request(
      `/repos/${fullName}`,
      REPO_SCHEMA.extend({
        default_branch: z.string(),
        pushed_at: z.string().nullable(),
      })
    );

    if (raw.private) {
      throw new GitHubError(
        "Only public repositories can be graded.",
        403
      );
    }

    return toRepoSummary(raw);
  }

  /** Byte breakdown by language. Returns {} when the API returns 404 (empty repo). */
  async getLanguages(fullName: string): Promise<Record<string, number>> {
    assertFullName(fullName);
    try {
      return await this.request(
        `/repos/${fullName}/languages`,
        z.record(z.string(), z.number())
      );
    } catch (error) {
      if (error instanceof GitHubError && error.status === 404) {
        return {};
      }
      throw error;
    }
  }

  /** Resolves the current HEAD sha of a branch. */
  async getHeadSha(fullName: string, branch: string): Promise<string> {
    assertFullName(fullName);
    const ref = await this.request(
      `/repos/${fullName}/commits/${encodeURIComponent(branch)}`,
      z.object({ sha: z.string() })
    );
    return ref.sha;
  }

  /** Flattened recursive file listing for a commit. */
  async getTree(
    fullName: string,
    commitSha: string
  ): Promise<{ sha: string; entries: GitHubTreeEntryInfo[]; truncated: boolean }> {
    assertFullName(fullName);
    const raw = await this.request(
      `/repos/${fullName}/git/trees/${encodeURIComponent(commitSha)}?recursive=1`,
      TREE_SCHEMA
    );

    return {
      sha: raw.sha,
      truncated: raw.truncated ?? false,
      entries: raw.tree
        //* Directories arrive as type "tree"; submodules as "commit".
        .filter((entry) => entry.type === "blob")
        .map((entry) => ({
          path: entry.path,
          sha: entry.sha,
          size: entry.size ?? 0,
        })),
    };
  }

  /**
   * Fetches raw text for a single path. Public repos are served straight from
   * raw.githubusercontent.com, which is not subject to the REST rate limit.
   */
  async getFileContent(
    fullName: string,
    branch: string,
    path: string
  ): Promise<string | null> {
    assertFullName(fullName);

    const segments = path.split("/").map(encodeURIComponent);
    const url = `${GITHUB_RAW}/${fullName}/${encodeURIComponent(branch)}/${segments.join("/")}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "quiro-ai-project-grading",
        ...(this.token
          ? { Authorization: `Bearer ${this.token}` }
          : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    return res.text();
  }

  /** Reads a single well-known file at the repo root. Returns null if absent. */
  async getRootFile(
    fullName: string,
    branch: string,
    filename: string
  ): Promise<string | null> {
    return this.getFileContent(fullName, branch, filename);
  }

  /** Assembles everything pass A needs, in as few API calls as possible. */
  async getSnapshot(fullName: string): Promise<GitHubRepoSnapshot> {
    const repo = await this.getRepo(fullName);

    const [commitSha, languages, readme] = await Promise.all([
      this.getHeadSha(fullName, repo.defaultBranch),
      this.getLanguages(fullName),
      this.getRootFile(fullName, repo.defaultBranch, "README.md"),
    ]);

    return {
      id: repo.id,
      fullName: repo.fullName,
      name: repo.name,
      owner: repo.owner,
      description: repo.description,
      defaultBranch: repo.defaultBranch,
      commitSha,
      topics: repo.topics,
      languages,
      readme: readme ? truncate(readme, 12_000) : null,
    };
  }
}

const toRepoSummary = (repo: {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string };
  description: string | null;
  language: string | null;
  fork: boolean;
  stargazers_count: number;
  default_branch: string;
  pushed_at: string | null;
  topics?: string[];
  size: number;
}): GitHubRepoSummary => ({
  id: repo.id,
  fullName: repo.full_name,
  name: repo.name,
  owner: repo.owner.login,
  description: repo.description,
  language: repo.language,
  isFork: repo.fork,
  stars: repo.stargazers_count,
  defaultBranch: repo.default_branch,
  pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
  topics: repo.topics ?? [],
  archived: false,
  sizeKb: repo.size,
});

const truncate = (value: string, max: number): string =>
  value.length <= max ? value : `${value.slice(0, max)}\n... [truncated]`;
