import type { NotificationKind, Prisma, ReportStatus, Severity } from "@prisma/client";
import { env } from "@/config/env";
import { audit } from "@/lib/audit";
import { AppError } from "@/lib/http";
import { mailTemplates, sendMail } from "@/lib/mailer";
import {
  councilRepository,
  DECIDED_STATUSES,
  OPEN_STATUSES,
  type CouncilDetailRow,
  type QueueRow,
} from "@/modules/council/council.repository";
import type { DecisionInput, QueueQuery, TriageInput } from "@/modules/council/council.schema";
import { councilSimilarity } from "@/modules/council/council.similarity";

const DAY = 24 * 60 * 60 * 1000;

/** Open-queue views are ranked in memory; beyond this many rows the queue says it was cut. */
const PRIORITISED_LIMIT = 1000;

export interface Actor {
  id: string;
  role: "OFFICER" | "ADMIN";
  ipAddress?: string;
}

/* What the reporter is told, per decision. Mirrors the wording the
   resident's own report screen uses, so the email and the screen agree. */
const REPORTER_UPDATE: Partial<Record<ReportStatus, { headline: string; detail: string }>> = {
  UNDER_REVIEW: {
    headline: "Your report is being reviewed",
    detail: "A CyberSafe officer is checking what you sent against other reports.",
  },
  APPROVED: {
    headline: "Council verified your report",
    detail: "Council confirmed this as a scam. It may be used, de-identified, to warn others. Thank you — reports like yours are how Hume gets warned.",
  },
  REJECTED: {
    headline: "Council closed your report",
    detail: "Council reviewed this and closed it without publishing an alert. That does not mean you were wrong to report it.",
  },
};

/**
 * FR37 — the queue's defined prioritisation.
 *
 * A score from 0 to 100 and, beside it, every reason that contributed — the
 * same rule the checker follows (ETH-3): an officer can see why a report sits
 * where it does and disagree with the ordering, rather than trusting a number.
 * Nothing in it looks at who reported: not their suburb's demographics, not
 * their role, not how they write.
 */
function prioritise(row: QueueRow, now: number) {
  const reasons: string[] = [];
  let score = 0;
  const submitted = (row.submittedAt ?? row.createdAt).getTime();
  const ageDays = Math.max(0, (now - submitted) / DAY);

  const outstanding = row.infoRequests.filter((request) => !request.respondedAt).length;
  const lastAnswer = Math.max(0, ...row.infoRequests.map((request) => request.respondedAt?.getTime() ?? 0));
  const lastReview = row.reviews[0]?.createdAt.getTime() ?? 0;
  const replyReceived = row.status === "UNDER_REVIEW" && outstanding === 0 && lastAnswer > lastReview;

  switch (row.severity) {
    case "HIGH":
      score += 40;
      reasons.push("High severity");
      break;
    case "MEDIUM":
      score += 22;
      reasons.push("Medium severity");
      break;
    case "LOW":
      score += 6;
      break;
    default:
      score += 16;
      reasons.push("Not yet triaged");
  }

  const lost = row.amountLostCents ?? 0;
  if (lost >= 100_000) {
    score += 28;
    reasons.push(`$${Math.round(lost / 100).toLocaleString("en-AU")} lost`);
  } else if (lost > 0) {
    score += 18;
    reasons.push("Money lost");
  }

  const mostReported = Math.max(0, ...row.indicators.map(({ indicator }) => indicator.reportCount));
  if (mostReported > 1) {
    score += Math.min(22, 10 + mostReported * 2);
    reasons.push(`Artefact seen in ${mostReported} reports`);
  }

  if (replyReceived) {
    score += 20;
    reasons.push("Reporter has replied");
  }

  if (ageDays >= 2) {
    score += Math.min(20, Math.round(ageDays * 1.5));
    reasons.push(`Waiting ${Math.floor(ageDays)} days`);
  }

  if (!row.reviewer && OPEN_STATUSES.includes(row.status)) {
    score += 4;
  }

  if (row.status === "INFORMATION_REQUESTED") {
    score = Math.round(score * 0.4);
    reasons.unshift("Waiting on the reporter");
  }

  if (!OPEN_STATUSES.includes(row.status)) {
    score = 0;
  }

  score = Math.min(100, score);
  const band = score >= 70 ? "urgent" : score >= 45 ? "high" : score >= 20 ? "normal" : "low";

  return { score, band, reasons, replyReceived, outstanding, ageDays };
}

function summarise(row: QueueRow, now: number) {
  const priority = prioritise(row, now);

  return {
    reference: row.reference,
    title: row.title,
    channel: row.channel,
    status: row.status,
    severity: row.severity,
    category: row.category,
    suburb: row.suburb,
    reviewer: row.reviewer,
    amountLost: row.amountLostCents === null ? null : row.amountLostCents / 100,
    indicatorCount: row.indicators.length,
    evidenceCount: row._count.evidence,
    anonymised: row.authorId === null,
    submittedAt: (row.submittedAt ?? row.createdAt).toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ageDays: Math.floor(priority.ageDays),
    replyReceived: priority.replyReceived,
    outstandingQuestions: priority.outstanding,
    priority: { score: priority.score, band: priority.band, reasons: priority.reasons },
  };
}

export type QueueItem = ReturnType<typeof summarise>;

function queueWhere(query: QueueQuery, userId: string): Prisma.ReportWhereInput {
  const and: Prisma.ReportWhereInput[] = [{ deletedAt: null, status: { not: "DRAFT" } }];

  switch (query.view) {
    case "open":
      and.push({ status: { in: ["SUBMITTED", "UNDER_REVIEW"] } });
      break;
    case "waiting":
      and.push({ status: "INFORMATION_REQUESTED" });
      break;
    case "mine":
      and.push({ status: { in: OPEN_STATUSES }, reviewerId: userId });
      break;
    case "unassigned":
      and.push({ status: { in: OPEN_STATUSES }, reviewerId: null });
      break;
    case "decided":
      and.push({ status: { in: DECIDED_STATUSES } });
      break;
    case "all":
      break;
  }

  if (query.status) and.push({ status: query.status });
  if (query.severity) and.push({ severity: query.severity === "UNSET" ? null : query.severity });
  if (query.categoryId) and.push({ categoryId: query.categoryId });
  if (query.suburbId) and.push({ suburbId: query.suburbId });
  if (query.olderThanDays) and.push({ submittedAt: { lte: new Date(Date.now() - query.olderThanDays * DAY) } });

  if (query.q) {
    const needle = query.q.trim();
    and.push({
      OR: [
        { reference: { equals: needle.toUpperCase() } },
        { title: { contains: needle, mode: "insensitive" } },
        /* Artefacts are stored normalised and lower-cased, so an officer can
           paste the number or domain they are chasing and find every report
           that names it. */
        { indicators: { some: { indicator: { value: { contains: needle.toLowerCase().replace(/\s+/g, "") } } } } },
      ],
    });
  }

  return { AND: and };
}

type Links = Awaited<ReturnType<typeof councilSimilarity.links>>;

function detail(row: CouncilDetailRow, related: Awaited<ReturnType<typeof councilRepository.related>>, fromCheck: unknown, actor: Actor, links: Links = []) {
  const author = row.author && !row.author.deletedAt ? row.author : null;
  const open = OPEN_STATUSES.includes(row.status);
  const now = Date.now();

  return {
    reference: row.reference,
    title: row.title,
    description: row.description,
    channel: row.channel,
    status: row.status,
    severity: row.severity,
    category: row.category,
    suburb: row.suburb,
    reviewer: row.reviewer,
    amountLost: row.amountLostCents === null ? null : row.amountLostCents / 100,
    occurredOn: row.occurredAt ? row.occurredAt.toISOString().slice(0, 10) : null,
    submittedAt: (row.submittedAt ?? row.createdAt).toISOString(),
    withdrawnAt: row.withdrawnAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
    ageDays: Math.floor((now - (row.submittedAt ?? row.createdAt).getTime()) / DAY),
    /* FR35 — the reporter's contact details, for the officer following up and
       nobody else. Absent once the account is erased: the report outlives the
       person's identity by design (FR12). */
    reporter: author
      ? {
          fullName: author.fullName,
          email: author.email,
          phone: author.phone,
          organisation: author.organisation,
          role: author.role,
          emailVerified: author.emailVerified !== null,
          memberSince: author.createdAt.toISOString(),
          reportCount: author._count.reports,
        }
      : null,
    fromCheck: fromCheck ?? null,
    indicators: row.indicators.map(({ indicator }) => ({
      id: indicator.id,
      type: indicator.type,
      value: indicator.value,
      reportCount: indicator.reportCount,
      verificationStatus: indicator.verificationStatus,
      firstSeenAt: indicator.firstSeenAt.toISOString(),
      lastSeenAt: indicator.lastSeenAt.toISOString(),
    })),
    related: related.map((other) => ({
      reference: other.reference,
      title: other.title,
      status: other.status,
      submittedAt: (other.submittedAt ?? other.createdAt).toISOString(),
      shared: other.indicators.map(({ indicator }) => indicator),
    })),
    /* FR48 — the links an officer has made, either way round. */
    links,
    evidence: row.evidence.map((file) => ({ ...file, createdAt: file.createdAt.toISOString() })),
    reviews: row.reviews.map((review) => ({
      id: review.id,
      decision: review.decision,
      severity: review.severity,
      notes: review.notes,
      reviewer: review.reviewer,
      createdAt: review.createdAt.toISOString(),
    })),
    infoRequests: row.infoRequests.map((request) => ({
      id: request.id,
      message: request.message,
      response: request.response,
      respondedAt: request.respondedAt?.toISOString() ?? null,
      requestedBy: request.requestedBy,
      createdAt: request.createdAt.toISOString(),
    })),
    actions: {
      start: row.status === "SUBMITTED",
      assign: open,
      triage: open,
      requestInfo: open && author !== null,
      decide: open,
      reopen: DECIDED_STATUSES.includes(row.status) && actor.role === "ADMIN",
    },
  };
}

export type CouncilReport = ReturnType<typeof detail>;

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

async function load(reference: string): Promise<CouncilDetailRow> {
  const row = await councilRepository.findByReference(reference);

  if (!row) {
    throw new AppError(404, "There is no report with that reference.");
  }

  return row;
}

/** Tells the reporter, in the dashboard always and by email where they asked for it. */
async function tellReporter(row: CouncilDetailRow, status: ReportStatus) {
  const update = REPORTER_UPDATE[status];

  if (!row.author || row.author.deletedAt || !update) return;

  const contact = await councilRepository.reporterContact(row.author.id);
  if (contact?.emailOnStatus) {
    await sendMail({
      to: contact.email,
      ...mailTemplates.reportStatusChanged(firstName(contact.fullName), row.reference, update.headline, update.detail, `${env.appUrl}/account/reports/${row.reference}`),
    });
  }
}

function reporterNotice(row: CouncilDetailRow, status: ReportStatus, kind: NotificationKind = "REPORT_STATUS_CHANGED") {
  const update = REPORTER_UPDATE[status];

  if (!row.author || row.author.deletedAt || !update) return undefined;

  return { userId: row.author.id, kind, title: `${update.headline} — ${row.reference}`, body: update.detail, linkPath: `/account/reports/${row.reference}` };
}

/* Said without guessing who moved it — often it is the same officer in a second tab. */
const MOVED_ON = "This report has moved on since you opened it. Reload it to see where it stands, then try again.";

export const councilService = {
  prioritise,

  /** FR37. */
  async queue(query: QueueQuery, actor: Actor) {
    const where = queueWhere(query, actor.id);
    const now = Date.now();
    const ranked = query.view !== "decided" && query.view !== "all";
    const skip = (query.page - 1) * query.pageSize;

    const [counts, page] = await Promise.all([
      councilRepository.queueCounts(actor.id),
      ranked
        ? councilRepository.queue(where, PRIORITISED_LIMIT + 1).then((rows) => {
            const truncated = rows.length > PRIORITISED_LIMIT;
            const items = rows
              .slice(0, PRIORITISED_LIMIT)
              .map((row) => summarise(row, now))
              .sort((a, b) => b.priority.score - a.priority.score || a.submittedAt.localeCompare(b.submittedAt));
            return { items: items.slice(skip, skip + query.pageSize), total: items.length, truncated };
          })
        : councilRepository.queuePage(where, skip, query.pageSize).then(([rows, total]) => ({
            items: rows.map((row) => summarise(row, now)),
            total,
            truncated: false,
          })),
    ]);

    return {
      view: query.view,
      counts,
      items: page.items,
      page: query.page,
      pageSize: query.pageSize,
      total: page.total,
      truncated: page.truncated,
      ordering: ranked ? "priority" : "recent",
    };
  },

  /**
   * One report, as the officer sees it.
   *
   * Reading it is logged (FR35, FR72): the description can hold a victim's
   * account of losing their savings, and who has read it is a question Council
   * must be able to answer.
   */
  async get(reference: string, actor: Actor, logView = true) {
    const row = await load(reference);
    const [related, submission, links] = await Promise.all([
      councilRepository.related(row.id, row.indicators.map(({ indicator }) => indicator.id)),
      councilRepository.submissionAudit(row.id),
      councilSimilarity.links(row.id),
    ]);

    if (logView) {
      await audit({ userId: actor.id, action: "report.viewed", entityType: "Report", entityId: row.id, ipAddress: actor.ipAddress });
    }

    const metadata = submission?.metadata as { fromCheck?: unknown } | null | undefined;
    return detail(row, related, metadata?.fromCheck, actor, links);
  },

  /** FR38. */
  async assign(reference: string, reviewerId: string | null, actor: Actor) {
    const row = await load(reference);

    if (reviewerId && !(await councilRepository.isActiveStaff(reviewerId))) {
      throw new AppError(422, "That person is not an active Council officer.", [{ field: "reviewerId", message: "Choose an officer from the list." }]);
    }

    if (!(await councilRepository.assign(row.id, reviewerId))) {
      throw new AppError(409, "A report can only be assigned while it is open.");
    }

    await audit({
      userId: actor.id,
      action: reviewerId ? "report.assigned" : "report.unassigned",
      entityType: "Report",
      entityId: row.id,
      ipAddress: actor.ipAddress,
      metadata: { from: row.reviewer?.id ?? null, to: reviewerId },
    });

    return this.get(reference, actor, false);
  },

  /** FR39, FR40 — the officer's classification, recorded with what it replaced. */
  async triage(reference: string, input: TriageInput, actor: Actor) {
    const row = await load(reference);

    if (!OPEN_STATUSES.includes(row.status)) {
      throw new AppError(409, "A decided report cannot be re-classified. An administrator can re-open it first.");
    }

    if (input.categoryId && !(await councilRepository.categoryIsLive(input.categoryId))) {
      throw new AppError(422, "Choose a category from the list.", [{ field: "categoryId", message: "That category is not in use." }]);
    }

    await councilRepository.triage(row.id, { categoryId: input.categoryId, severity: input.severity });

    await audit({
      userId: actor.id,
      action: "report.triaged",
      entityType: "Report",
      entityId: row.id,
      ipAddress: actor.ipAddress,
      metadata: {
        ...(input.categoryId !== undefined ? { category: { from: row.category?.id ?? null, to: input.categoryId } } : {}),
        ...(input.severity !== undefined ? { severity: { from: row.severity, to: input.severity } } : {}),
      },
    });

    return this.get(reference, actor, false);
  },

  /** Picks the report up: SUBMITTED → UNDER_REVIEW, and it becomes the officer's if nobody holds it. */
  async start(reference: string, actor: Actor) {
    const row = await load(reference);

    const changed = await councilRepository.changeStatus({
      reportId: row.id,
      from: ["SUBMITTED"],
      to: "UNDER_REVIEW",
      reviewerId: actor.id,
      claim: true,
      recordReview: true,
      notify: reporterNotice(row, "UNDER_REVIEW"),
    });

    if (!changed) throw new AppError(409, MOVED_ON);

    await tellReporter(row, "UNDER_REVIEW");
    await audit({ userId: actor.id, action: "report.review_started", entityType: "Report", entityId: row.id, ipAddress: actor.ipAddress });
    return this.get(reference, actor, false);
  },

  /** FR41, FR63. */
  async requestInformation(reference: string, message: string, actor: Actor) {
    const row = await load(reference);

    if (!row.author || row.author.deletedAt) {
      throw new AppError(409, "The reporter's account has been deleted, so there is nobody to ask.");
    }

    const changed = await councilRepository.changeStatus({
      reportId: row.id,
      from: OPEN_STATUSES,
      to: "INFORMATION_REQUESTED",
      reviewerId: actor.id,
      claim: true,
      recordReview: true,
      informationRequest: { message },
      notify: {
        userId: row.author.id,
        kind: "INFORMATION_REQUESTED",
        title: `Council has a question about ${row.reference}`,
        body: message.length > 180 ? `${message.slice(0, 177)}…` : message,
        linkPath: `/account/reports/${row.reference}`,
      },
    });

    if (!changed) throw new AppError(409, MOVED_ON);

    const contact = await councilRepository.reporterContact(row.author.id);
    if (contact?.emailOnRequest) {
      await sendMail({
        to: contact.email,
        ...mailTemplates.informationRequested(firstName(contact.fullName), row.reference, message, `${env.appUrl}/account/reports/${row.reference}`),
      });
    }

    await audit({ userId: actor.id, action: "report.information_requested", entityType: "Report", entityId: row.id, ipAddress: actor.ipAddress });
    return this.get(reference, actor, false);
  },

  /**
   * FR42 — approve or reject, always with a reason.
   *
   * A verified scam needs a severity (FR40): it is what the alert, the
   * statistics and the next officer all read first, so a report cannot be
   * approved without one — given now, or set earlier in triage.
   */
  async decide(reference: string, input: DecisionInput, actor: Actor) {
    const row = await load(reference);
    const severity: Severity | undefined = input.severity ?? row.severity ?? undefined;

    if (input.decision === "APPROVED" && !severity) {
      throw new AppError(422, "Set a severity before verifying this report.", [{ field: "severity", message: "Choose high, medium or low." }]);
    }

    if (input.categoryId && !(await councilRepository.categoryIsLive(input.categoryId))) {
      throw new AppError(422, "Choose a category from the list.", [{ field: "categoryId", message: "That category is not in use." }]);
    }

    const changed = await councilRepository.changeStatus({
      reportId: row.id,
      from: OPEN_STATUSES,
      to: input.decision,
      reviewerId: actor.id,
      claim: true,
      severity: input.decision === "APPROVED" ? severity : input.severity,
      categoryId: input.categoryId,
      notes: input.reason,
      recordReview: true,
      notify: reporterNotice(row, input.decision),
    });

    if (!changed) throw new AppError(409, MOVED_ON);

    await tellReporter(row, input.decision);
    await audit({
      userId: actor.id,
      action: input.decision === "APPROVED" ? "report.approved" : "report.rejected",
      entityType: "Report",
      entityId: row.id,
      ipAddress: actor.ipAddress,
      /* The reason itself is on the review record; the audit line says a
         reason was given without copying free text into a second table. */
      metadata: { from: row.status, severity: severity ?? null, category: input.categoryId ?? row.category?.id ?? null, reasonRecorded: true },
    });

    return this.get(reference, actor, false);
  },

  /** An administrator's correction of a decision. The earlier decision stays on the record. */
  async reopen(reference: string, reason: string, actor: Actor) {
    const row = await load(reference);

    const changed = await councilRepository.changeStatus({
      reportId: row.id,
      from: DECIDED_STATUSES,
      to: "UNDER_REVIEW",
      reviewerId: actor.id,
      notes: `Re-opened: ${reason}`,
      recordReview: true,
      notify: reporterNotice(row, "UNDER_REVIEW"),
    });

    if (!changed) throw new AppError(409, "Only a verified or closed report can be re-opened.");

    await tellReporter(row, "UNDER_REVIEW");
    await audit({ userId: actor.id, action: "report.reopened", entityType: "Report", entityId: row.id, ipAddress: actor.ipAddress, metadata: { from: row.status } });
    return this.get(reference, actor, false);
  },

  /** ER-13 — an artefact is never "confirmed" by volume, only by an officer. */
  async setIndicatorStatus(reference: string, indicatorId: string, status: "UNVERIFIED" | "VERIFIED" | "DISPUTED" | "REJECTED", actor: Actor) {
    const row = await load(reference);
    const before = row.indicators.find(({ indicator }) => indicator.id === indicatorId)?.indicator.verificationStatus;

    if (!before || !(await councilRepository.setIndicatorStatus(indicatorId, row.id, status))) {
      throw new AppError(404, "That detail is not on this report.");
    }

    await audit({ userId: actor.id, action: "indicator.status_changed", entityType: "Indicator", entityId: indicatorId, ipAddress: actor.ipAddress, metadata: { from: before, to: status, report: row.reference } });
    return this.get(reference, actor, false);
  },

  staff() {
    return councilRepository.staff();
  },
};
