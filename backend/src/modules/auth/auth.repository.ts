import type { Prisma, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Every database access for identity lives here (Rule 2.4).
 *
 * Services call these; nothing else touches `prisma` for users. That is what
 * keeps the "exclude soft-deleted rows" condition in one place instead of
 * scattered across call sites where one omission silently resurrects a deleted
 * account.
 */
export const authRepository = {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
    });
  },

  findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { id, deletedAt: null } });
  },

  create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  },

  markSignedIn(id: string): Promise<User> {
    return prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  },

  /**
   * FR2 — issue a fresh link and code, retiring any still outstanding.
   *
   * Asking for a new code is the moment the old one should stop working: it is
   * the one the person has decided not to use, and leaving it live doubles the
   * number of guesses an attacker has against the account.
   */
  replaceVerification(
    userId: string,
    link: { hash: string; expiresAt: Date },
    code: { hash: string; expiresAt: Date },
  ) {
    return prisma.$transaction([
      prisma.emailVerificationToken.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.emailVerificationToken.create({ data: { userId, tokenHash: link.hash, expiresAt: link.expiresAt } }),
      prisma.emailVerificationToken.create({ data: { userId, tokenHash: code.hash, expiresAt: code.expiresAt } }),
    ]);
  },

  findUsableVerificationToken(tokenHash: string) {
    return prisma.emailVerificationToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
  },

  /**
   * FR2 — spend every outstanding token and verify the account together.
   *
   * A transaction because a token that is spent without verifying, or an
   * account verified by a token that stays live, are both wrong states and
   * both reachable if these are independent writes. All of the account's
   * tokens go at once: the link and the code were one invitation.
   */
  consumeVerification(userId: string) {
    return prisma.$transaction([
      prisma.emailVerificationToken.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({ where: { id: userId }, data: { emailVerified: new Date() } }),
    ]);
  },

  /** FR6 — one live reset link per account. */
  replacePasswordReset(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.$transaction([
      prisma.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } }),
      prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } }),
    ]);
  },

  findUsablePasswordReset(tokenHash: string) {
    return prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
  },

  /**
   * FR6 — set the new password and spend the link in one step.
   *
   * Following a reset link proves control of the inbox just as a verification
   * link does, so an unverified account is verified by it too — asking for a
   * second email immediately after the first would be friction for nothing.
   *
   * The token is spent with a conditional update and the count checked, so two
   * requests racing on one link cannot both set a password: the second finds
   * nothing left to spend. Resolves false in that case.
   */
  consumePasswordReset(tokenId: string, userId: string, passwordHash: string, verify: boolean): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const now = new Date();
      const spent = await tx.passwordResetToken.updateMany({
        where: { id: tokenId, usedAt: null },
        data: { usedAt: now },
      });

      if (spent.count !== 1) {
        return false;
      }

      await tx.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: now } });
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash, ...(verify ? { emailVerified: now } : {}) },
      });

      return true;
    });
  },
};
