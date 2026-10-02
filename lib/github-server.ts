import prismadb from "@/lib/prismadb";
import { GitHubClient } from "@/lib/github";
import { auth } from "@/auth";

/**
 * Builds a GitHubClient for a user using the access token Better Auth stored
 * when they linked a GitHub account.
 *
 * Public repositories work without a token, but the unauthenticated REST limit
 * is 60/hr, which a handful of grading runs would exhaust. A token lifts that to
 * 5000/hr, so this degrades gracefully rather than hard-failing when the token
 * is absent or unreadable.
 *
 * The token MUST come from `auth.api.getAccessToken` rather than a direct
 * `Account.accessToken` read: `auth.ts` sets `account.encryptOAuthTokens`, so
 * the column holds AES-256-GCM ciphertext and only Better Auth knows how to
 * decrypt it. Reading the column directly would hand GitHub a garbage bearer
 * token and fail every request with a 401.
 */
export const getGitHubClientForUser = async (
  userId: string
): Promise<GitHubClient> => {
  try {
    const { accessToken } = await auth.api.getAccessToken({
      body: { providerId: "github", userId },
    });

    return new GitHubClient(accessToken ?? null);
  } catch (error) {
    //* Expected for users with no linked GitHub account, and for accounts whose
    //* token is still plaintext from before encryption was enabled. Either way
    //* public repos still work unauthenticated.
    console.log(
      `GITHUB_TOKEN_UNAVAILABLE: falling back to unauthenticated access for user ${userId}`,
      error instanceof Error ? error.message : error
    );

    return new GitHubClient(null);
  }
};

export const hasGitHubConnection = async (
  userId: string
): Promise<boolean> => {
  const count = await prismadb.account.count({
    where: { userId, providerId: "github" },
  });
  return count > 0;
};
