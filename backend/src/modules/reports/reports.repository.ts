import type { Channel, IndicatorType, Prisma, ReportStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Persistence for a resident's own reports (Rule 2.4).
 *
 * Every read here is scoped to an author. There is no function in this file
 * that returns a report without being told whose it must be, which is what
 * makes "someone else's reference number" answer as not found rather than as
 * someone else's report.
 */

const listSelect = {
  id: true,
  reference: true,
  title: true,
  channel: true,
  status: true,
  submittedAt: true,
  updatedAt: true,
  createdAt: true,
  category: { select: { name: true } },
  _count: { select: { indicators: true } },
  infoRequests: { where: { respondedAt: null }, select: { id: true } },
} satisfies Prisma.ReportSelect;

const detailSelect = {
  id: true,
  reference: true,
  title: true,
  description: true,
  channel: true,
  status: true,
  amountLostCents: true,
  occurredAt: true,
  submittedAt: true,
  withdrawnAt: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true } },
  suburb: { select: { id: true, name: true, postcode: true } },
  indicators: { select: { indicator: { select: { type: true, value: true } } } },
  /* Decisions and when, not the reviewer's working notes — those are an
     officer's, and are written for colleagues rather than for the reporter. */
  reviews: { select: { id: true, decision: true, createdAt: true }, orderBy: { createdAt: "asc" } },
  infoRequests: {
    select: { id: true, message: true, response: true, respondedAt: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.ReportSelect;

export type ReportListRow = Prisma.ReportGetPayload<{ select: typeof listSelect }>;
export type ReportDetailRow = Prisma.ReportGetPayload<{ select: typeof detailSelect }>;

export interface NewReport {
  reference: string;
  authorId: string;
  channel: Channel;
  categoryId?: string;
  suburbId?: string;
  title: string;
  description: string;
  amountLostCents?: number;
  occurredAt?: Date;
  indicators: { type: IndicatorType; value: string }[];
  notification: { title: string; body: string; linkPath: string };
}

export const reportsRepository = {
  categoryExists(id: string) {
    return prisma.scamCategory.count({ where: { id, archivedAt: null } }).then((n) => n > 0);
  },

  suburbExists(id: string) {
    return prisma.suburb.count({ where: { id } }).then((n) => n > 0);
  },

  /**
   * FR25, FR28, FR21 — the report, its artefacts and the receipt notification,
   * in one transaction.
   *
   * A report that exists without its indicators is one FR24 matching cannot
   * see, and a notification for a report that failed to save is a receipt for
   * nothing; so all of it lands or none of it does.
   */
  create(input: NewReport) {
    return prisma.$transaction(async (tx) => {
      const now = new Date();
      const report = await tx.report.create({
        data: {
          reference: input.reference,
          authorId: input.authorId,
          channel: input.channel,
          categoryId: input.categoryId ?? null,
          suburbId: input.suburbId ?? null,
          title: input.title,
          description: input.description,
          amountLostCents: input.amountLostCents ?? null,
          occurredAt: input.occurredAt ?? null,
          status: "SUBMITTED",
          submittedAt: now,
        },
        select: { id: true, reference: true },
      });

      for (const artefact of input.indicators) {
        const indicator = await tx.indicator.upsert({
          where: { type_value: { type: artefact.type, value: artefact.value } },
          create: { type: artefact.type, value: artefact.value, reportCount: 1 },
          update: { reportCount: { increment: 1 }, lastSeenAt: now },
          select: { id: true },
        });

        await tx.reportIndicator.create({ data: { reportId: report.id, indicatorId: indicator.id } });
      }

      await tx.notification.create({
        data: { userId: input.authorId, kind: "REPORT_SUBMITTED", ...input.notification },
      });

      return report;
    }, { timeout: 20_000 });
    /* One round trip per artefact to a database in another region adds up;
       the default five-second window is too tight for a report listing a
       couple of dozen of them. */
  },

  referenceTaken(reference: string) {
    return prisma.report.count({ where: { reference } }).then((n) => n > 0);
  },

  listForAuthor(authorId: string): Promise<ReportListRow[]> {
    return prisma.report.findMany({
      where: { authorId, deletedAt: null, status: { not: "DRAFT" } },
      select: listSelect,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  },

  findForAuthor(authorId: string, reference: string): Promise<ReportDetailRow | null> {
    return prisma.report.findFirst({
      where: { authorId, reference, deletedAt: null },
      select: detailSelect,
    });
  },

  /**
   * FR30 — a conditional update, so a report an officer moved on in the
   * meantime is not withdrawn from a state the reporter never saw.
   */
  withdraw(id: string, from: ReportStatus[], authorId: string, notification: { title: string; body: string; linkPath: string }) {
    return prisma.$transaction(async (tx) => {
      const changed = await tx.report.updateMany({
        where: { id, authorId, status: { in: from } },
        data: { status: "WITHDRAWN", withdrawnAt: new Date() },
      });

      if (changed.count === 1) {
        await tx.notification.create({ data: { userId: authorId, kind: "REPORT_STATUS_CHANGED", ...notification } });
      }

      return changed.count === 1;
    });
  },

  /** FR41 — answering puts the report back in the reviewer's queue. */
  respond(reportId: string, requestId: string, response: string) {
    return prisma.$transaction(async (tx) => {
      const answered = await tx.informationRequest.updateMany({
        where: { id: requestId, reportId, respondedAt: null },
        data: { response, respondedAt: new Date() },
      });

      if (answered.count !== 1) {
        return false;
      }

      const outstanding = await tx.informationRequest.count({ where: { reportId, respondedAt: null } });

      if (outstanding === 0) {
        await tx.report.updateMany({
          where: { id: reportId, status: "INFORMATION_REQUESTED" },
          data: { status: "UNDER_REVIEW" },
        });
      }

      return true;
    });
  },
};
