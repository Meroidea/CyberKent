import bcrypt from "bcryptjs";
import type { Prisma, Role } from "@prisma/client";
import { env } from "@/config/env";
import { audit } from "@/lib/audit";
import { hashToken, randomToken } from "@/lib/crypto";
import { AppError } from "@/lib/http";
import { emailDeliveryAvailable, mailTemplates, sendMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES, STAFF_ROLES, isAdminRole } from "@/lib/roles";
import { OPEN_STATUSES } from "@/modules/council/council.repository";
import type { Actor } from "@/modules/council/council.service";

/**
 * People management for Council staff: the team directory with each person's
 * workload, inviting a new council member, and keeping profiles current.
 *
 * A new member never receives a password from anyone. The account is created
 * with a random, unusable digest and a one-time link — valid seven days — to
 * choose their own; until then they show as "invited".
 */

const DAY = 24 * 60 * 60 * 1000;
const INVITE_TTL_MS = 7 * DAY;

export const ROLE_LABEL: Record<Role, string> = {
  RESIDENT: "a resident",
  BUSINESS: "a business member",
  OFFICER: "a CyberSafe officer",
  ADMIN: "an administrator",
  SUPER_ADMIN: "a super administrator",
};

const staffSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  jobTitle: true,
  department: true,
  role: true,
  lastLoginAt: true,
  createdAt: true,
  deletedAt: true,
  passwordResets: { where: { usedAt: null, expiresAt: { gt: new Date(0) } }, select: { expiresAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
  _count: {
    select: {
      assignedReports: { where: { status: { in: OPEN_STATUSES }, deletedAt: null } },
    },
  },
} satisfies Prisma.UserSelect;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Only a super admin appoints, removes or suspends an administrator. */
export function assertMayManage(actorRole: Role, targetRole: Role, newRole?: Role) {
  if ((isAdminRole(targetRole) || (newRole && isAdminRole(newRole))) && actorRole !== "SUPER_ADMIN") {
    throw new AppError(403, "Only a super administrator can appoint, remove or suspend administrators.");
  }
}

/** The last active super admin can neither step down nor be suspended. */
export async function keepASuperAdmin(target: { id: string; role: Role; deletedAt: Date | null }, newRole?: Role) {
  if (target.role !== "SUPER_ADMIN" || target.deletedAt || newRole === "SUPER_ADMIN") return;
  const others = await prisma.user.count({ where: { role: "SUPER_ADMIN", deletedAt: null, id: { not: target.id } } });
  if (others === 0) throw new AppError(409, "This is the only super administrator. Appoint another before changing this account.");
}

async function issueInvite(user: { id: string; email: string; fullName: string; role: Role }, inviter: string) {
  const token = randomToken();
  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + INVITE_TTL_MS) } }),
  ]);

  const link = `${env.appUrl}/reset-password?token=${encodeURIComponent(token)}&invite=1`;
  const first = user.fullName.split(/\s+/)[0] || user.fullName;
  const emailSent = emailDeliveryAvailable() && (await sendMail({ to: user.email, ...mailTemplates.staffInvite(first, inviter, ROLE_LABEL[user.role], link) }));

  /* The link goes back to the administrator only when email could not carry
     it — so a new member can still be onboarded while email is down, and in
     every other case the link exists in exactly one inbox. */
  return { emailSent, inviteLink: emailSent ? null : link };
}

export const teamService = {
  async directory() {
    const since = new Date(Date.now() - 30 * DAY);
    const now = new Date();

    const staff = await prisma.user.findMany({
      where: { role: { in: STAFF_ROLES }, OR: [{ deletedAt: null }, { deletedAt: { not: null }, deletionRequest: { is: null } }] },
      select: staffSelect,
      orderBy: [{ deletedAt: { sort: "asc", nulls: "first" } }, { role: "desc" }, { fullName: "asc" }],
    });
    const ids = staff.map((person) => person.id);

    const [decisions, openTasks, overdueTasks, doneTasks, lastSeen] = await Promise.all([
      prisma.reportReview.findMany({
        where: { reviewerId: { in: ids }, decision: { in: ["APPROVED", "REJECTED"] }, createdAt: { gte: since } },
        select: { reviewerId: true, createdAt: true, report: { select: { submittedAt: true } } },
      }),
      prisma.task.groupBy({ by: ["assigneeId"], where: { assigneeId: { in: ids }, status: { not: "DONE" } }, _count: { _all: true } }),
      prisma.task.groupBy({ by: ["assigneeId"], where: { assigneeId: { in: ids }, status: { not: "DONE" }, dueAt: { lt: now } }, _count: { _all: true } }),
      prisma.task.groupBy({ by: ["assigneeId"], where: { assigneeId: { in: ids }, status: "DONE", completedAt: { gte: since } }, _count: { _all: true } }),
      prisma.auditLog.groupBy({ by: ["userId"], where: { userId: { in: ids } }, _max: { createdAt: true } }),
    ]);

    const count = (rows: { assigneeId: string | null; _count: { _all: number } }[]) => new Map(rows.map((row) => [row.assigneeId, row._count._all]));
    const open = count(openTasks);
    const overdue = count(overdueTasks);
    const done = count(doneTasks);
    const seen = new Map(lastSeen.map((row) => [row.userId, row._max.createdAt]));

    return {
      members: staff.map((person) => {
        const mine = decisions.filter((row) => row.reviewerId === person.id);
        const hours = mine
          .filter((row) => row.report.submittedAt)
          .map((row) => (row.createdAt.getTime() - row.report.submittedAt!.getTime()) / 3_600_000)
          .filter((value) => value >= 0);
        const invite = person.passwordResets[0];
        const invited = person.lastLoginAt === null && invite !== undefined && invite.expiresAt > now;

        return {
          id: person.id,
          email: person.email,
          fullName: person.fullName,
          phone: person.phone,
          jobTitle: person.jobTitle,
          department: person.department,
          role: person.role,
          status: person.deletedAt ? "suspended" : invited ? "invited" : person.lastLoginAt ? "active" : "never-signed-in",
          lastLoginAt: person.lastLoginAt?.toISOString() ?? null,
          lastActiveAt: seen.get(person.id)?.toISOString() ?? null,
          createdAt: person.createdAt.toISOString(),
          workload: {
            openReports: person._count.assignedReports,
            decided30: mine.length,
            medianDecisionHours: median(hours),
            openTasks: open.get(person.id) ?? 0,
            overdueTasks: overdue.get(person.id) ?? 0,
            tasksDone30: done.get(person.id) ?? 0,
          },
        };
      }),
    };
  },

  async invite(
    input: { fullName: string; email: string; role: Role; jobTitle?: string; department?: string; phone?: string },
    actor: Actor & { name: string },
  ) {
    if (!STAFF_ROLES.includes(input.role)) throw new AppError(422, "Choose officer, administrator or super administrator.");
    assertMayManage(actor.role as Role, input.role);

    const email = input.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true, deletedAt: true } });
    if (existing) {
      throw new AppError(
        409,
        STAFF_ROLES.includes(existing.role)
          ? "That person is already on the team."
          : "That address already has a resident account. Change its role under People instead, so their history stays with them.",
        [{ field: "email", message: "This email is already registered." }],
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        fullName: input.fullName,
        role: input.role,
        jobTitle: input.jobTitle || null,
        department: input.department || null,
        phone: input.phone || null,
        organisation: "Hume City Council",
        /* Unusable until the member chooses their own through the invite. */
        passwordHash: await bcrypt.hash(randomToken(), 12),
        /* The address is Council's own, entered by an administrator. */
        emailVerified: new Date(),
      },
      select: { id: true, email: true, fullName: true, role: true },
    });

    const delivery = await issueInvite(user, actor.name);
    await audit({ userId: actor.id, action: "user.invited", entityType: "User", entityId: user.id, ipAddress: actor.ipAddress, metadata: { role: user.role, emailSent: delivery.emailSent } });

    return { member: user, ...delivery };
  },

  async resendInvite(id: string, actor: Actor & { name: string }) {
    const user = await prisma.user.findFirst({ where: { id, deletedAt: null, role: { in: STAFF_ROLES } }, select: { id: true, email: true, fullName: true, role: true, lastLoginAt: true } });
    if (!user) throw new AppError(404, "There is no active team member with that id.");
    if (user.lastLoginAt) throw new AppError(409, "This person has already signed in. They can use “Forgot password” if they need a new one.");
    assertMayManage(actor.role as Role, user.role);

    const delivery = await issueInvite(user, actor.name);
    await audit({ userId: actor.id, action: "user.invite_resent", entityType: "User", entityId: id, ipAddress: actor.ipAddress });
    return delivery;
  },

  async updateProfile(id: string, input: { fullName?: string; jobTitle?: string | null; department?: string | null; phone?: string | null }, actor: Actor) {
    const target = await prisma.user.findFirst({ where: { id, role: { in: STAFF_ROLES } }, select: { id: true, role: true } });
    if (!target) throw new AppError(404, "There is no team member with that id.");
    if (id !== actor.id && ADMIN_ROLES.includes(target.role)) assertMayManage(actor.role as Role, target.role);

    const data: Prisma.UserUpdateInput = {};
    if (input.fullName !== undefined) data.fullName = input.fullName;
    if (input.jobTitle !== undefined) data.jobTitle = input.jobTitle || null;
    if (input.department !== undefined) data.department = input.department || null;
    if (input.phone !== undefined) data.phone = input.phone || null;

    await prisma.user.update({ where: { id }, data });
    await audit({ userId: actor.id, action: "user.profile_updated", entityType: "User", entityId: id, ipAddress: actor.ipAddress, metadata: { fields: Object.keys(data) } });
    return (await teamService.directory()).members.find((member) => member.id === id)!;
  },
};
