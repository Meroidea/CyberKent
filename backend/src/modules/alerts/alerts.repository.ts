import crypto from "node:crypto";
import type { AlertStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Persistence for community alerts (Rule 2.4).
 *
 * Two selects, deliberately separate. `publicSelect` is everything a visitor
 * may see — no author, no approver, no source report — and it is the only
 * select the public routes use, so an alert cannot leak who wrote it or which
 * resident's report it came from by a field being added to the wrong list.
 */
const publicSelect = {
  reference: true,
  headline: true,
  summary: true,
  specimen: true,
  channel: true,
  severity: true,
  status: true,
  publishedAt: true,
  archivedAt: true,
  category: { select: { id: true, slug: true, name: true } },
  suburb: { select: { id: true, name: true, postcode: true } },
} satisfies Prisma.AlertSelect;

const staffSelect = {
  ...publicSelect,
  id: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, fullName: true } },
  approvedBy: { select: { id: true, fullName: true } },
  sourceReport: { select: { id: true, reference: true, title: true, authorId: true } },
} satisfies Prisma.AlertSelect;

export type PublicAlertRow = Prisma.AlertGetPayload<{ select: typeof publicSelect }>;
export type StaffAlertRow = Prisma.AlertGetPayload<{ select: typeof staffSelect }>;

export const alertsRepository = {
  publicList(where: Prisma.AlertWhereInput, skip: number, take: number): Promise<[PublicAlertRow[], number]> {
    return prisma.$transaction([
      prisma.alert.findMany({ where, select: publicSelect, orderBy: { publishedAt: "desc" }, skip, take }),
      prisma.alert.count({ where }),
    ]);
  },

  publicByReference(reference: string) {
    return prisma.alert.findFirst({ where: { reference, status: { in: ["PUBLISHED", "ARCHIVED"] } }, select: publicSelect });
  },

  staffList(status: AlertStatus | undefined, skip: number, take: number): Promise<[StaffAlertRow[], number]> {
    const where = status ? { status } : {};
    return prisma.$transaction([
      prisma.alert.findMany({ where, select: staffSelect, orderBy: { updatedAt: "desc" }, skip, take }),
      prisma.alert.count({ where }),
    ]);
  },

  statusCounts() {
    return prisma.alert.groupBy({ by: ["status"], _count: { _all: true } });
  },

  staffById(id: string): Promise<StaffAlertRow | null> {
    return prisma.alert.findUnique({ where: { id }, select: staffSelect });
  },

  /** The last note an approver left when sending the alert back, from the audit trail. */
  lastReturnNote(id: string) {
    return prisma.auditLog.findFirst({
      where: { entityType: "Alert", entityId: id, action: "alert.returned" },
      select: { metadata: true, createdAt: true, user: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  sourceReport(reference: string) {
    return prisma.report.findFirst({
      where: { reference, deletedAt: null },
      select: {
        id: true,
        reference: true,
        title: true,
        description: true,
        status: true,
        channel: true,
        severity: true,
        categoryId: true,
        suburbId: true,
        author: { select: { fullName: true, email: true } },
        category: { select: { name: true, description: true } },
        suburb: { select: { name: true } },
      },
    });
  },

  reporterNames(reportId: string) {
    return prisma.report.findUnique({ where: { id: reportId }, select: { author: { select: { fullName: true, organisation: true } } } });
  },

  async newReference(): Promise<string> {
    const now = new Date();
    const period = `${String(now.getUTCFullYear()).slice(2)}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const reference = `HCA-${period}-${crypto.randomInt(1000, 10_000)}`;
      if ((await prisma.alert.count({ where: { reference } })) === 0) return reference;
    }
    return `HCA-${period}-${crypto.randomInt(10_000, 1_000_000)}`;
  },

  create(data: Prisma.AlertUncheckedCreateInput) {
    return prisma.alert.create({ data, select: { id: true } });
  },

  /** Edits only while the alert is still being written or checked. */
  update(id: string, data: Prisma.AlertUncheckedUpdateManyInput) {
    return prisma.alert
      .updateMany({ where: { id, status: { in: ["DRAFT", "PENDING_APPROVAL"] } }, data })
      .then((result) => result.count === 1);
  },

  /** Every status move is conditional on the state the officer saw. */
  transition(id: string, from: AlertStatus, data: Prisma.AlertUncheckedUpdateManyInput) {
    return prisma.alert.updateMany({ where: { id, status: from }, data }).then((result) => result.count === 1);
  },

  categoryIsLive(id: string) {
    return prisma.scamCategory.count({ where: { id, archivedAt: null } }).then((n) => n > 0);
  },

  suburbExists(id: string) {
    return prisma.suburb.count({ where: { id } }).then((n) => n > 0);
  },
};
