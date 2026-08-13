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

  createVerificationToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.emailVerificationToken.create({ data: { userId, tokenHash, expiresAt } });
  },

  findUsableVerificationToken(tokenHash: string) {
    return prisma.emailVerificationToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
  },

  /**
   * FR2 — consume the token and verify the account together.
   *
   * A transaction because a token that is spent without verifying, or an
   * account verified by a token that stays live, are both wrong states and
   * both reachable if these are two independent writes.
   */
  consumeVerification(tokenId: string, userId: string) {
    return prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { id: tokenId },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({ where: { id: userId }, data: { emailVerified: new Date() } }),
    ]);
  },
};
