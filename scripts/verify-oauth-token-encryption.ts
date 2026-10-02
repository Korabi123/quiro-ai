/**
 * Verifies that `Account.accessToken` values are ciphertext, not plaintext.
 *
 * Run after `scripts/encrypt-oauth-tokens.ts --apply`:
 *   pnpm exec tsx scripts/verify-oauth-token-encryption.ts
 *
 * The authoritative check is simply whether the value decrypts: a successful
 * `symmetricDecrypt` means it was encrypted with BETTER_AUTH_SECRET, and a
 * throw means the column still holds a raw plaintext token. Shape cannot be
 * used to tell them apart - ciphertext is base64url, and a correctly decrypted
 * Google access token is *supposed* to look like a `ya29.` token.
 *
 * Exit code is non-zero if any token is still plaintext or unreadable, so this
 * can gate a deploy.
 */
import { PrismaClient } from "@prisma/client";
import { symmetricDecrypt } from "better-auth/crypto";

const prisma = new PrismaClient();

const SECRET = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET;

const TOKEN_FIELDS = ["accessToken", "idToken", "refreshToken"] as const;

type AccountRow = {
  id: string;
  providerId: string;
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
};

const main = async () => {
  if (!SECRET) {
    throw new Error(
      "BETTER_AUTH_SECRET is not set. Run this with the app's environment."
    );
  }

  const accounts: AccountRow[] = await prisma.account.findMany({
    where: {
      OR: TOKEN_FIELDS.map((field) => ({ [field]: { not: null } })),
    },
    select: {
      id: true,
      providerId: true,
      accessToken: true,
      idToken: true,
      refreshToken: true,
    },
  });

  if (accounts.length === 0) {
    console.log("No accounts with tokens. Nothing to verify.");
    return;
  }

  let verified = 0;
  const problems: string[] = [];

  for (const account of accounts) {
    for (const field of TOKEN_FIELDS) {
      const value = account[field];
      if (!value) continue;

      try {
        const decrypted = await symmetricDecrypt({ key: SECRET, data: value });

        console.log(
          `  ok ${account.id} (${account.providerId}).${field}: encrypted, decrypts to ${decrypted.length} chars`
        );
        verified += 1;
      } catch {
        problems.push(
          `${account.id} (${account.providerId}).${field}: still plaintext (or encrypted with a different secret)`
        );
      }
    }
  }

  console.log(
    `\nChecked ${accounts.length} account(s): ${verified} token(s) verified encrypted, ${problems.length} problem(s).`
  );

  for (const problem of problems) {
    console.error(`  ! ${problem}`);
  }

  if (problems.length > 0) {
    console.error(
      "\nRun `pnpm exec tsx scripts/encrypt-oauth-tokens.ts --apply` to backfill."
    );
    process.exitCode = 1;
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
