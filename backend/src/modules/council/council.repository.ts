import type { IndicatorStatus, NotificationKind, Prisma, ReportStatus, Severity } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { STAFF_ROLES } from "@/middleware/staff";

/**
 * Persistence for the officer's side of a report (Rule 2.4).
 *
 * The mirror of `reportsRepository`: that one never returns a report without
 * being told whose it must be; this one is only reachable behind
 * `requireStaff`, and returns reports whoever wrote them. Keeping the two in
 * separate files is what stops a resident-facing query from quietly picking
 * up the officer's unscoped `where`.
 */

/** A report still with Council — the queue proper. */
export const OPEN_STATUSES: ReportStatus[] = ["SUBMITTED", "UNDER_REVIEW", "INFORMATION_REQUESTED"];
export const DECIDED_STATUSES: ReportStatus[] = ["APPROVED", "REJECTED"];

const queueSelect = {
  id: true,
  reference: true,
  title: true,
  channel: true,
  status: true,
  severity: true,
  amountLostCents: true,
  submittedAt: true,
  createdAt: true,
  updatedAt: true,
  authorId: true,
  reviewer: { select: { id: true, fullName: true } },
  category: { select: { id: true, name: true } },
  suburb: { select: { id: true, name: true } },
  indicators: { select: { indicator: { select: { reportCount: true } } } },
  infoRequests: { select: { respondedAt: true, createdAt: true } },
  reviews: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
  _count: { select: { evidence: true } },
} satisfies Prisma.ReportSelect;

const detailSelect = {
  id: true,
  reference: true,
  title: true,
  description: true,
  channel: true,
  status: true,
  severity: true,
  amountLostCents: true,
  occurredAt: true,
  submittedAt: true,
  withdrawnAt: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      organisation: true,
      role: true,
      emailVerified: true,
      deletedAt: true,
      createdAt: true,
      _count: { select: { reports: true } },
    },
  },
  reviewer: { select: { id: true, fullName: true, email: true } },
  category: { select: { id: true, name: true } },
  suburb: { select: { id: true, name: true, postcode: true } },
  indicators: {
    select: {
      indicator: {
        select: { id: true, type: true, value: true, reportCount: true, verificationStatus: true, firstSeenAt: true, lastSeenAt: true },
      },
    },
  },
  evidence: {
    where: { deletedAt: null },
    select: { id: true, originalName: true, mimeType: true, sizeBytes: true, description: true, createdAt: true },
  },
  reviews: {
    select: { id: true, decision: true, severity: true, notes: true, createdAt: true, reviewer: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "asc" },
  },
  infoRequests: {
    select: {
      id: true,
      message: true,
      response: true,
      respondedAt: true,
      createdAt: true,
      requestedBy: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.ReportSelect;

export type QueueRow = Prisma.ReportGetPayload<{ select: typeof queueSelect }>;
export type CouncilDetailRow = Prisma.ReportGetPayload<{ select: typeof detailSelect }>;

export interface StatusChange {
  reportId: string;
  from: ReportStatus[];
  to: ReportStatus;
  reviewerId: string;
  /** Written to the report as well as the review record. */
  severity?: Severity;
  categoryId?: string;
  /** Moves responsibility to the acting officer where nobody holds it. */
  claim?: boolean;
  notes?: string;
  /** Recorded as a review — a decision the reporter's history shows. */
  recordReview: boolean;
  notify?: { userId: string; kind: NotificationKind; title: string; body: string; linkPath: string };
  informationRequest?: { message: string };
}

export const councilRepository = {
  queueSelect,

  queue(where: Prisma.ReportWhereInput, take: number): Promise<QueueRow[]> {
    return prisma.report.findMany({ where, select: queueSelect, orderBy: { submittedAt: "asc" }, take });
  },

  queuePage(where: Prisma.ReportWhereInput, skip: number, take: number): Promise<[QueueRow[], number]> {
    return prisma.$transaction([
      prisma.report.findMany({ where, select: queueSelect, orderBy: { updatedAt: "desc" }, skip, take }),
      prisma.report.count({ where }),
    ]);
  },

  /** The queue's tab counters, in two grouped queries rather than one per tab. */
  async queueCounts(userId: string) {
    const [byStatus, mine, unassigned] = await Promise.all([
      prisma.report.groupBy({ by: ["status"], where: { deletedAt: null, status: { not: "DRAFT" } }, _count: { _all: true } }),
      prisma.report.count({ where: { deletedAt: null, status: { in: OPEN_STATUSES }, reviewerId: userId } }),
      prisma.report.count({ where: { deletedAt: null, status: { in: OPEN_STATUSES }, reviewerId: null } }),
    ]);

    const count = (statuses: ReportStatus[]) =>
      byStatus.filter((row) => statuses.includes(row.status)).reduce((sum, row) => sum + row._count._all, 0);

    return {
      open: count(["SUBMITTED", "UNDER_REVIEW"]),
      waiting: count(["INFORMATION_REQUESTED"]),
      mine,
      unassigned,
      decided: count(DECIDED_STATUSES),
      all: count(["SUBMITTED", "UNDER_REVIEW", "INFORMATION_REQUESTED", "APPROVED", "REJECTED", "WITHDRAWN"]),
    };
  },

  findByReference(reference: string): Promise<CouncilDetailRow | null> {
    return prisma.report.findFirst({ where: { reference, deletedAt: null }, select: detailSelect });
  },

  /** How the report was made — the checker verdict it started from, if any — as recorded at submission. */
  submissionAudit(reportId: string) {
    return prisma.auditLog.findFirst({
      where: { entityType: "Report", entityId: reportId, action: "report.submitted" },
      select: { metadata: true },
    });
  },

  /**
   * FR45–FR47 — other reports naming any of the same artefacts.
   *
   * An exact match on the normalised value, through the join table, so it is
   * an index lookup rather than a text scan. Similarity matching (FR44) is a
   * separate, fuzzier question and lives with duplicate detection.
   */
  related(reportId: string, indicatorIds: string[]) {
    if (indicatorIds.length === 0) {
      return Promise.resolve([]);
    }

    return prisma.report.findMany({
      where: { id: { not: reportId }, deletedAt: null, status: { not: "DRAFT" }, indicators: { some: { indicatorId: { in: indicatorIds } } } },
      select: {
        reference: true,
        title: true,
        status: true,
        submittedAt: true,
        createdAt: true,
        indicators: { where: { indicatorId: { in: indicatorIds } }, select: { indicator: { select: { type: true, value: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  },

  /** Council staff who can hold a report (FR38), with what each is holding. */
  async staff() {
    const [people, load] = await Promise.all([
      prisma.user.findMany({
        where: { deletedAt: null, role: { in: STAFF_ROLES } },
        select: { id: true, fullName: true, email: true, role: true },
        orderBy: { fullName: "asc" },
      }),
      prisma.report.groupBy({
        by: ["reviewerId"],
        where: { deletedAt: null, status: { in: OPEN_STATUSES }, reviewerId: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const openByReviewer = new Map(load.map((row) => [row.reviewerId, row._count._all]));
    return people.map((person) => ({ ...person, openReports: openByReviewer.get(person.id) ?? 0 }));
  },

  isActiveStaff(userId: string) {
    return prisma.user.count({ where: { id: userId, deletedAt: null, role: { in: STAFF_ROLES } } }).then((n) => n > 0);
  },

  categoryIsLive(id: string) {
    return prisma.scamCategory.count({ where: { id, archivedAt: null } }).then((n) => n > 0);
  },

  /** FR38. Conditional on the report still being open, so a decided report cannot be re-assigned. */
  assign(reportId: string, reviewerId: string | null) {
    return prisma.report
      .updateMany({ where: { id: reportId, status: { in: OPEN_STATUSES } }, data: { reviewerId } })
      .then((result) => result.count === 1);
  },

  /** FR39, FR40. */
  triage(reportId: string, data: { categoryId?: string | null; severity?: Severity | null }) {
    return prisma.report.update({ where: { id: reportId }, data, select: { id: true } });
  },

  /**
   * Every status transition an officer makes, as one transaction.
   *
   * The update is conditional on the status the officer saw (`from`), so two
   * officers acting on one report at once cannot both succeed — the second
   * finds nothing to update and is told the report has moved on. The review
   * record, the reporter's notification and any question all land with the
   * status change or not at all.
   */
  changeStatus(change: StatusChange) {
    return prisma.$transaction(async (tx) => {
      const data: Prisma.ReportUncheckedUpdateManyInput = { status: change.to };

      if (change.severity) data.severity = change.severity;
      if (change.categoryId) data.categoryId = change.categoryId;

      const updated = await tx.report.updateMany({
        where: { id: change.reportId, status: { in: change.from } },
        data,
      });

      if (updated.count !== 1) {
        return false;
      }

      if (change.claim) {
        await tx.report.updateMany({ where: { id: change.reportId, reviewerId: null }, data: { reviewerId: change.reviewerId } });
      }

      if (change.recordReview) {
        await tx.reportReview.create({
          data: {
            reportId: change.reportId,
            reviewerId: change.reviewerId,
            decision: change.to,
            severity: change.severity ?? null,
            notes: change.notes ?? null,
          },
        });
      }

      if (change.informationRequest) {
        await tx.informationRequest.create({
          data: { reportId: change.reportId, requestedById: change.reviewerId, message: change.informationRequest.message },
        });
      }

      if (change.notify) {
        await tx.notification.create({ data: change.notify });
      }

      return true;
    });
  },

  /** FR62/FR63 — whether the reporter wants this by email as well as in the dashboard. */
  async reporterContact(userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { email: true, fullName: true, notificationPrefs: { select: { emailOnStatus: true, emailOnRequest: true } } },
    });

    if (!user) return null;

    return {
      email: user.email,
      fullName: user.fullName,
      emailOnStatus: user.notificationPrefs?.emailOnStatus ?? true,
      emailOnRequest: user.notificationPrefs?.emailOnRequest ?? true,
    };
  },

  /** ER-13 — the artefact's status, only where the artefact is on a report Council can see. */
  setIndicatorStatus(indicatorId: string, reportId: string, status: IndicatorStatus) {
    return prisma.indicator
      .updateMany({ where: { id: indicatorId, reports: { some: { reportId } } }, data: { verificationStatus: status } })
      .then((result) => result.count === 1);
  },
};
