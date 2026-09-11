import bcrypt from "bcryptjs";
import { env } from "@/config/env";
import { audit } from "@/lib/audit";
import { AppError } from "@/lib/http";
import { mailTemplates, sendMail } from "@/lib/mailer";
import { accountRepository } from "@/modules/account/account.repository";
import { authRepository } from "@/modules/auth/auth.repository";
import { BCRYPT_ROUNDS, issueAccessToken, toPublicUser } from "@/modules/auth/auth.service";
import { reportsRepository } from "@/modules/reports/reports.repository";
import { reportsService } from "@/modules/reports/reports.service";

async function mustFind(userId: string) {
  const user = await authRepository.findById(userId);
  if (!user) {
    throw new AppError(401, "That account no longer exists. Sign in again.");
  }
  return user;
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export const accountService = {
  /**
   * The dashboard in one request.
   *
   * Everything the first screen after sign-in shows — who you are, whether
   * anything needs you, where your reports stand, what changed — so the page
   * paints complete rather than assembling itself from five spinners.
   */
  async overview(userId: string) {
    const user = await mustFind(userId);

    const [counts, reports, notifications, unread] = await Promise.all([
      accountRepository.reportCounts(userId),
      reportsRepository.listForAuthor(userId),
      accountRepository.notifications(userId, 5),
      accountRepository.unreadCount(userId),
    ]);

    const byStatus = Object.fromEntries(counts.map((row) => [row.status, row._count._all])) as Record<string, number>;
    const count = (...statuses: string[]) => statuses.reduce((sum, status) => sum + (byStatus[status] ?? 0), 0);
    const summaries = reports.map(reportsService.summarise);

    return {
      user: toPublicUser(user),
      stats: {
        total: count("SUBMITTED", "UNDER_REVIEW", "INFORMATION_REQUESTED", "APPROVED", "REJECTED", "WITHDRAWN"),
        open: count(...accountRepository.openStatuses),
        needsYou: summaries.filter((report) => report.awaitingYou).length,
        verified: count("APPROVED"),
        closed: count("REJECTED", "WITHDRAWN"),
      },
      recentReports: summaries.slice(0, 5),
      notifications,
      unreadNotifications: unread,
    };
  },

  async updateProfile(userId: string, input: { fullName?: string; phone?: string | null; organisation?: string | null }) {
    await mustFind(userId);
    const user = await accountRepository.updateProfile(userId, input);
    return toPublicUser(user);
  },

  /**
   * Requires the current password even though the caller is signed in: a
   * session left open on a library computer should not be enough to lock the
   * owner out of their own account.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string, ipAddress?: string) {
    const user = await mustFind(userId);

    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new AppError(400, "Your current password is not correct.", [
        { field: "currentPassword", message: "That is not your current password." },
      ]);
    }

    const updated = await accountRepository.setPassword(userId, await bcrypt.hash(newPassword, BCRYPT_ROUNDS));
    await audit({ userId, action: "account.password_changed", entityType: "User", entityId: userId, ipAddress });
    await sendMail({ to: user.email, ...mailTemplates.passwordChanged(firstName(user.fullName), `${env.appUrl}/forgot-password`) });

    return { user: toPublicUser(updated), token: issueAccessToken(updated) };
  },

  preferences(userId: string) {
    return accountRepository.preferences(userId);
  },

  setPreferences(userId: string, input: { emailOnStatus: boolean; emailOnAlerts: boolean; emailOnRequest: boolean }) {
    return accountRepository.setPreferences(userId, input);
  },

  async notifications(userId: string) {
    const [items, unread] = await Promise.all([
      accountRepository.notifications(userId, 50),
      accountRepository.unreadCount(userId),
    ]);
    return { notifications: items, unread };
  },

  async markRead(userId: string, ids?: string[]) {
    await accountRepository.markRead(userId, ids);
    return { unread: await accountRepository.unreadCount(userId) };
  },

  /** FR12. */
  async deleteAccount(userId: string, password: string, reason: string | undefined, ipAddress?: string) {
    const user = await mustFind(userId);

    if (!(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError(400, "That password is not correct.", [
        { field: "password", message: "Enter the password you sign in with." },
      ]);
    }

    /* Addressed before the address is erased — afterwards there is nowhere to send it. */
    const { email, fullName } = user;

    await accountRepository.eraseAccount(userId, reason);
    await audit({ userId, action: "account.deleted", entityType: "User", entityId: userId, ipAddress });
    await sendMail({ to: email, ...mailTemplates.accountDeleted(firstName(fullName)) });
  },
};
