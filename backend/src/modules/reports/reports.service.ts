import crypto from "node:crypto";
import type { ReportStatus } from "@prisma/client";
import { env } from "@/config/env";
import { audit } from "@/lib/audit";
import { AppError } from "@/lib/http";
import { emailDeliveryAvailable, mailTemplates, sendMail } from "@/lib/mailer";
import { authRepository } from "@/modules/auth/auth.repository";
import { normaliseIndicator } from "@/modules/reports/reports.normalise";
import { reportsRepository, type ReportDetailRow, type ReportListRow } from "@/modules/reports/reports.repository";
import type { CreateReportInput } from "@/modules/reports/reports.schema";

/** FR30 — the states a reporter may still withdraw from. After a decision, the report is Council's record. */
const WITHDRAWABLE: ReportStatus[] = ["SUBMITTED", "UNDER_REVIEW", "INFORMATION_REQUESTED"];

/**
 * FR28 — a reference someone can read out over the phone: `HCC-2609-4817`.
 *
 * Year-month keeps it meaningful to an officer at a glance; four random digits
 * rather than a sequence, so a reference says nothing about how many reports
 * Council received that month and cannot be walked to find someone else's.
 */
async function newReference(): Promise<string> {
  const now = new Date();
  const period = `${String(now.getUTCFullYear()).slice(2)}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const reference = `HCC-${period}-${crypto.randomInt(1000, 10_000)}`;
    if (!(await reportsRepository.referenceTaken(reference))) {
      return reference;
    }
  }

  /* Nine thousand references a month before this is reachable; widen rather than fail. */
  return `HCC-${period}-${crypto.randomInt(10_000, 1_000_000)}`;
}

function summarise(row: ReportListRow) {
  return {
    reference: row.reference,
    title: row.title,
    channel: row.channel,
    status: row.status,
    category: row.category?.name ?? null,
    indicatorCount: row._count.indicators,
    awaitingYou: row.infoRequests.length > 0 && row.status === "INFORMATION_REQUESTED",
    submittedAt: (row.submittedAt ?? row.createdAt).toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function detail(row: ReportDetailRow) {
  return {
    reference: row.reference,
    title: row.title,
    description: row.description,
    channel: row.channel,
    status: row.status,
    category: row.category,
    suburb: row.suburb,
    amountLost: row.amountLostCents === null ? null : row.amountLostCents / 100,
    occurredOn: row.occurredAt ? row.occurredAt.toISOString().slice(0, 10) : null,
    submittedAt: (row.submittedAt ?? row.createdAt).toISOString(),
    withdrawnAt: row.withdrawnAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
    indicators: row.indicators.map(({ indicator }) => indicator),
    /* A question is shown as the question itself (below); its status record
       would only say the same thing twice in the reporter's history. */
    reviews: row.reviews
      .filter((review) => review.decision !== "INFORMATION_REQUESTED")
      .map((review) => ({ id: review.id, decision: review.decision, createdAt: review.createdAt.toISOString() })),
    infoRequests: row.infoRequests.map((request) => ({
      id: request.id,
      message: request.message,
      response: request.response,
      respondedAt: request.respondedAt?.toISOString() ?? null,
      createdAt: request.createdAt.toISOString(),
    })),
    canWithdraw: WITHDRAWABLE.includes(row.status),
  };
}

export type ReportSummary = ReturnType<typeof summarise>;

export const reportsService = {
  summarise,

  /** FR25–FR28. */
  async create(userId: string, input: CreateReportInput, ipAddress?: string) {
    const user = await authRepository.findById(userId);

    if (!user) {
      throw new AppError(401, "Sign in to continue.");
    }

    /*
     * The account exists so Council can come back to the person who reported.
     * An unconfirmed address is one they may not be able to reach, so the
     * report waits for the six-digit code — the form keeps everything typed.
     *
     * Only where a code can actually arrive. A deployment with no mail
     * transport cannot confirm anybody's address, so this gate would not be a
     * step on the way to reporting — it would be a closed door in front of the
     * one thing the service exists to do (P2, PO-2), and a closed door that no
     * resident could ever open. The account, its rate limit and the address on
     * it are all still there; the audit entry below records that the address
     * was unconfirmed, so an officer picking the report up knows how much the
     * contact details are worth.
     */
    if (!user.emailVerified && emailDeliveryAvailable()) {
      throw new AppError(403, "Confirm your email address to send this report.", [
        { field: "emailVerified", message: "Enter the code we emailed you. Your report is kept while you do." },
      ]);
    }

    const problems: { field: string; message: string }[] = [];

    if (input.categoryId && !(await reportsRepository.categoryExists(input.categoryId))) {
      problems.push({ field: "categoryId", message: "Choose a type from the list." });
    }
    if (input.suburbId && !(await reportsRepository.suburbExists(input.suburbId))) {
      problems.push({ field: "suburbId", message: "Choose a suburb from the list." });
    }

    const seen = new Set<string>();
    const indicators: { type: (typeof input.indicators)[number]["type"]; value: string }[] = [];

    input.indicators.forEach((artefact, index) => {
      const normalised = normaliseIndicator(artefact.type, artefact.value);

      if (!normalised) {
        problems.push({ field: `indicators.${index}.value`, message: `That does not look like a valid ${artefact.type.toLowerCase().replace("_", " ")}.` });
        return;
      }

      for (const entry of normalised) {
        const key = `${entry.type}:${entry.value}`;
        if (!seen.has(key)) {
          seen.add(key);
          indicators.push(entry);
        }
      }
    });

    if (problems.length > 0) {
      throw new AppError(422, "Some details need another look.", problems);
    }

    const reference = await newReference();
    const linkPath = `/account/reports/${reference}`;

    const report = await reportsRepository.create({
      reference,
      authorId: userId,
      channel: input.channel,
      categoryId: input.categoryId,
      suburbId: input.suburbId,
      title: input.title,
      description: input.description,
      amountLostCents: input.amountLost === undefined ? undefined : Math.round(input.amountLost * 100),
      occurredAt: input.occurredOn ? new Date(`${input.occurredOn}T00:00:00Z`) : undefined,
      indicators,
      notification: {
        title: `Report ${reference} received`,
        body: "A CyberSafe officer will review it. We will let you know when its status changes.",
        linkPath,
      },
    });

    await sendMail({
      to: user.email,
      ...mailTemplates.reportReceived(user.fullName.split(/\s+/)[0] ?? user.fullName, reference, `${env.appUrl}${linkPath}`),
    });

    /* How the report was made, never what it says (Rule 6.7). */
    await audit({
      userId,
      action: "report.submitted",
      entityType: "Report",
      entityId: report.id,
      ipAddress,
      metadata: {
        indicators: indicators.length,
        fromCheck: input.fromCheck ? { score: input.fromCheck.score, band: input.fromCheck.band } : null,
        /* Whether Council's contact address for this report has been proved. */
        emailVerified: user.emailVerified !== null,
      },
    });

    return { reference, status: "SUBMITTED" as const, linkPath };
  },

  async list(userId: string) {
    return (await reportsRepository.listForAuthor(userId)).map(summarise);
  },

  async get(userId: string, reference: string) {
    const row = await reportsRepository.findForAuthor(userId, reference);

    if (!row) {
      throw new AppError(404, "We could not find a report with that reference on your account.");
    }

    return detail(row);
  },

  /** FR30. */
  async withdraw(userId: string, reference: string, ipAddress?: string) {
    const row = await reportsRepository.findForAuthor(userId, reference);

    if (!row) {
      throw new AppError(404, "We could not find a report with that reference on your account.");
    }

    const withdrawn = await reportsRepository.withdraw(row.id, WITHDRAWABLE, userId, {
      title: `Report ${reference} withdrawn`,
      body: "You withdrew this report. Council keeps a record of it but will take no further action.",
      linkPath: `/account/reports/${reference}`,
    });

    if (!withdrawn) {
      throw new AppError(
        409,
        row.status === "WITHDRAWN"
          ? "This report has already been withdrawn."
          : "This report can no longer be withdrawn — Council has already made a decision on it.",
      );
    }

    await audit({ userId, action: "report.withdrawn", entityType: "Report", entityId: row.id, ipAddress });
    return this.get(userId, reference);
  },

  /** FR41. */
  async respond(userId: string, reference: string, requestId: string, response: string) {
    const row = await reportsRepository.findForAuthor(userId, reference);

    if (!row) {
      throw new AppError(404, "We could not find a report with that reference on your account.");
    }

    if (row.status === "WITHDRAWN") {
      throw new AppError(409, "This report has been withdrawn.");
    }

    if (!WITHDRAWABLE.includes(row.status)) {
      throw new AppError(409, "Council has already made a decision on this report, so it is no longer taking answers.");
    }

    const answered = await reportsRepository.respond(row.id, requestId, response);

    if (!answered) {
      throw new AppError(409, "That question has already been answered.");
    }

    await audit({ userId, action: "report.information_provided", entityType: "Report", entityId: row.id });
    return this.get(userId, reference);
  },
};
