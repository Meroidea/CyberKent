import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Statuses in which a report is still with Council. */
const OPEN = ["SUBMITTED", "UNDER_REVIEW", "INFORMATION_REQUESTED"] as const;

export const accountRepository = {
  updateProfile(userId: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id: userId }, data });
  },

  setPassword(userId: string, passwordHash: string) {
    return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  },

  /** Created on registration, but an account that predates that gets one on first read. */
  preferences(userId: string) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { emailOnStatus: true, emailOnAlerts: true, emailOnRequest: true },
    });
  },

  setPreferences(userId: string, data: { emailOnStatus: boolean; emailOnAlerts: boolean; emailOnRequest: boolean }) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
      select: { emailOnStatus: true, emailOnAlerts: true, emailOnRequest: true },
    });
  },

  notifications(userId: string, take: number) {
    return prisma.notification.findMany({
      where: { userId },
      select: { id: true, kind: true, title: true, body: true, linkPath: true, readAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take,
    });
  },

  unreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, readAt: null } });
  },

  markRead(userId: string, ids?: string[]) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null, ...(ids ? { id: { in: ids } } : {}) },
      data: { readAt: new Date() },
    });
  },

  /** The dashboard's counters, in one grouped query rather than one per status. */
  reportCounts(userId: string) {
    return prisma.report.groupBy({
      by: ["status"],
      where: { authorId: userId, deletedAt: null, status: { not: "DRAFT" } },
      _count: { _all: true },
    });
  },

  openStatuses: OPEN,

  /**
   * FR12, Compliance 29 — erase the person, keep the record.
   *
   * Reports stay, because Council has acted on them and an alert may rest on
   * one, but nothing left on the account row identifies anyone: the address,
   * name and phone are overwritten, the password is replaced with a hash of
   * nothing, and the personal side tables are dropped. The deletion request
   * itself is written with both timestamps, so the obligation and its
   * discharge are evidenced together.
   */
  eraseAccount(userId: string, reason: string | undefined) {
    const now = new Date();

    return prisma.$transaction([
      prisma.accountDeletionRequest.upsert({
        where: { userId },
        create: { userId, reason: reason ?? null, requestedAt: now, processedAt: now },
        update: { reason: reason ?? null, processedAt: now },
      }),
      prisma.subscription.deleteMany({ where: { userId } }),
      prisma.notification.deleteMany({ where: { userId } }),
      prisma.recoveryProgress.deleteMany({ where: { userId } }),
      prisma.notificationPreference.deleteMany({ where: { userId } }),
      prisma.emailVerificationToken.deleteMany({ where: { userId } }),
      prisma.passwordResetToken.deleteMany({ where: { userId } }),
      prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${userId}@deleted.invalid`,
          fullName: "Deleted account",
          phone: null,
          organisation: null,
          passwordHash: crypto.randomBytes(32).toString("hex"),
          deletedAt: now,
        },
      }),
    ]);
  },
};
