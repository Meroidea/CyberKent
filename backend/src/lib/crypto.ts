import crypto from "node:crypto";

/**
 * Secrets that travel by email — verification links, codes, reset links — are
 * stored only as digests, so a leaked table yields nothing that can be used.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** A link token: 256 bits, URL-safe. */
export function randomToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * A six-digit code for typing rather than clicking.
 *
 * Six digits is a small space, which is safe only because a code is bound to
 * one signed-in account, expires quickly, and is tried under a per-account
 * limit (auth.routes). `randomInt` rather than `Math.random`, which is not a
 * cryptographic source.
 */
export function randomCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * The digest a code is stored under.
 *
 * Salted with the account id: the token column is unique, and two people
 * issued the same six digits at once would otherwise collide on it.
 */
export function hashCode(userId: string, code: string): string {
  return hashToken(`code:${userId}:${code}`);
}
