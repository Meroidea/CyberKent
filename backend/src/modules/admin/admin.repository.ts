import type { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { OPEN_STATUSES } from "@/modules/council/council.repository";

/**
 * Persistence for administration (Rule 2.4).
 *
 * Two kinds of deleted account share `deletedAt` and must never be confused:
 *
 * - **Suspended** — an administrator's reversible act. The row is intact and
 *   `deletedAt` is the moment of suspension. It cannot sign in.
 * - **Erased** — the person's own FR12 request, already carried out. The
 *   name and address have been overwritten and a processed
 *   `AccountDeletionRequest` sits beside it. There is nobody left to manage.
 *
 * `SUSPENDED` below is how every query tells them apart; erased accounts are
 * never listed, never reactivated, never re-roled.
 */
const SUSPENDED: Prisma.UserWhereInput = {
  deletedAt: { not: null },
  OR: [{ deletionRequest: { is: null } }, { deletionRequest: { is: { processedAt: null } } }],
};

const userSelect = {
  id: true,
  email: true,
  fullName: true,
  organisation: true,
  role: true,
  emailVerified: true,
  lastLoginAt: true,
  createdAt: true,
  deletedAt: true,
  _count: { select: { reports: true, assignedReports: { where: { status: { in: OPEN_STATUSES }, deletedAt: null } } } },
} satisfies Prisma.UserSelect;

export type AdminUserRow = Prisma.UserGetPayload<{ select: typeof userSelect }>;

export const adminRepository = {
  users(filter: { q?: string; role?: Role; status: "active" | "suspended" | "all" }, skip: number, take: number): Promise<[AdminUserRow[], number]> {
    const and: Prisma.UserWhereInput[] = [];

    if (filter.status === "active") and.push({ deletedAt: null });
    else if (filter.status === "suspended") and.push(SUSPENDED);
    else and.push({ OR: [{ deletedAt: null }, SUSPENDED] });

    if (filter.role) and.push({ role: filter.role });
    if (filter.q) {
      and.push({
        OR: [
          { email: { contains: filter.q, mode: "insensitive" } },
          { fullName: { contains: filter.q, mode: "insensitive" } },
          { organisation: { contains: filter.q, mode: "insensitive" } },
        ],
      });
    }

    const where = { AND: and };

    return prisma.$transaction([
      prisma.user.findMany({ where, select: userSelect, orderBy: [{ role: "desc" }, { createdAt: "desc" }], skip, take }),
      prisma.user.count({ where }),
    ]);
  },

  roleCounts() {
    return prisma.user.groupBy({ by: ["role"], where: { deletedAt: null }, _count: { _all: true } });
  },

  /** An account an administrator may act on: active or suspended, never erased. */
  manageable(id: string) {
    return prisma.user.findFirst({ where: { id, OR: [{ deletedAt: null }, SUSPENDED] }, select: userSelect });
  },

  activeAdmins() {
    return prisma.user.count({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, deletedAt: null } });
  },

  /**
   * FR68. Leaving the staff roles also hands back any open reports the person
   * held — they can no longer open them, so they must not sit in their name.
   */
  setRole(id: string, role: Role, releaseReports: boolean) {
    return prisma.$transaction(async (tx) => {
      const released = releaseReports
        ? (await tx.report.updateMany({ where: { reviewerId: id, status: { in: OPEN_STATUSES } }, data: { reviewerId: null } })).count
        : 0;
      const user = await tx.user.update({ where: { id }, data: { role }, select: userSelect });
      return { user, released };
    });
  },

  /**
   * Suspends the account and hands its open reports back to the queue in one
   * transaction — a suspended officer's reports must not sit assigned to
   * someone who can no longer open them.
   */
  suspend(id: string) {
    return prisma.$transaction(async (tx) => {
      const released = await tx.report.updateMany({ where: { reviewerId: id, status: { in: OPEN_STATUSES } }, data: { reviewerId: null } });
      await tx.user.update({ where: { id }, data: { deletedAt: new Date() } });
      return released.count;
    });
  },

  reactivate(id: string) {
    return prisma.user.updateMany({ where: { id, ...SUSPENDED }, data: { deletedAt: null } }).then((r) => r.count === 1);
  },

  categories() {
    return prisma.scamCategory.findMany({
      select: { id: true, slug: true, name: true, description: true, archivedAt: true, createdAt: true, _count: { select: { reports: true, alerts: true } } },
      orderBy: [{ archivedAt: { sort: "asc", nulls: "first" } }, { name: "asc" }],
    });
  },

  findCategory(id: string) {
    return prisma.scamCategory.findUnique({ where: { id } });
  },

  categoryNameTaken(name: string, exceptId?: string) {
    return prisma.scamCategory
      .count({ where: { name: { equals: name, mode: "insensitive" }, ...(exceptId ? { id: { not: exceptId } } : {}) } })
      .then((n) => n > 0);
  },

  slugTaken(slug: string) {
    return prisma.scamCategory.count({ where: { slug } }).then((n) => n > 0);
  },

  createCategory(data: { slug: string; name: string; description: string | null }) {
    return prisma.scamCategory.create({ data });
  },

  updateCategory(id: string, data: Prisma.ScamCategoryUpdateInput) {
    return prisma.scamCategory.update({ where: { id }, data });
  },

  audit(filter: { action?: string; entityType?: string; userId?: string; since: Date }, skip: number, take: number) {
    const where: Prisma.AuditLogWhereInput = {
      createdAt: { gte: filter.since },
      ...(filter.action ? { action: { startsWith: filter.action } } : {}),
      ...(filter.entityType ? { entityType: filter.entityType } : {}),
      ...(filter.userId ? { userId: filter.userId } : {}),
    };

    return prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          metadata: true,
          ipAddress: true,
          createdAt: true,
          user: { select: { id: true, fullName: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.auditLog.count({ where }),
    ]);
  },

  /** The actions present in the log, for the filter picker. */
  auditActions() {
    return prisma.auditLog.groupBy({ by: ["action"], _count: { _all: true }, orderBy: { action: "asc" } });
  },

  referencesFor(reportIds: string[]) {
    return prisma.report.findMany({ where: { id: { in: reportIds } }, select: { id: true, reference: true } });
  },
};
