/**
 * One-off backfill: encrypts OAuth tokens that were stored as plaintext before
 * `account.encryptOAuthTokens` was enabled.
 *
 * Why this exists: enabling encryption only affects tokens written afterwards.
 * Rows already in the database keep their plaintext value, and Better Auth's
 * decrypt path cannot read those, so affected users silently lose their GitHub
 * token until they unlink and relink. This rewrites them in place with the same
 * AES-256-GCM scheme and the same key Better Auth uses, so nobody has to relink.
 *
 * The key is `BETTER_AUTH_SECRET` - exactly what Better Auth derives
 * `ctx.secret` from. Run with the same environment as the app:
 *
 *   pnpm exec tsx scripts/encrypt-oauth-tokens.ts          # dry run, prints a summary
 *   pnpm exec tsx scripts/encrypt-oauth-tokens.ts --apply  # actually writes
 *
 * Safe to re-run: values that already decrypt cleanly are skipped.
 */
import { PrismaClient } from "@prisma/client";
import { symmetricDecrypt, symmetricEncrypt } from "better-auth/crypto";

const prisma = new PrismaClient();

const SECRET = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET;

const TOKEN_FIELDS = ["accessToken", "refreshToken", "idToken"] as const;

const shouldApply = process.argv.includes("--apply");

const main = async () => {
  if (!SECRET) {
    throw new Error(
      "BETTER_AUTH_SECRET is not set. This script must run with the same environment as the app, " +
        "otherwise it would encrypt tokens with a key Better Auth cannot read."
    );
  }

  const accounts = await prisma.account.findMany({
    where: {
      OR: TOKEN_FIELDS.map((field) => ({ [field]: { not: null } })),
    },
    select: {
      id: true,
      providerId: true,
      accessToken: true,
      refreshToken: true,
      idToken: true,
    },
  });

  console.log(`Found ${accounts.length} account(s) with tokens.`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const account of accounts) {
    const patch: Record<string, string> = {};
    let needsWrite = false;

    for (const field of TOKEN_FIELDS) {
      const value = account[field];

      if (!value) continue;

      //* Already encrypted? A successful decrypt proves it, and skipping means
      //* the script is safe to run twice.
      try {
        await symmetricDecrypt({ key: SECRET, data: value });
        continue;
      } catch {
        //* Plaintext - fall through and encrypt it.
      }

      try {
        patch[field] = await symmetricEncrypt({ key: SECRET, data: value });
        needsWrite = true;
      } catch (error) {
        failed += 1;
        console.error(
          `  ! account ${account.id} (${account.providerId}) field ${field}: ${
            error instanceof Error ? error.message : error
          }`
        );
      }
    }

    if (!needsWrite) {
      skipped += 1;
      continue;
    }

    if (shouldApply) {
      await prisma.account.update({
        where: { id: account.id },
        data: patch,
      });
    }

    updated += 1;
    console.log(
      `  ${shouldApply ? "encrypted" : "would encrypt"} account ${
        account.id
      } (${account.providerId}): ${Object.keys(patch).join(", ")}`
    );
  }

  console.log(
    `\n${shouldApply ? "Applied" : "Dry run"}: ${updated} to encrypt, ${skipped} already encrypted, ${failed} failed.`
  );

  if (!shouldApply && updated > 0) {
    console.log("Re-run with --apply to write these changes.");
  }

  if (failed > 0) {
    //* Non-zero exit so CI or a deploy step notices.
    process.exitCode = 1;
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
