import type { AlertStatus, Prisma } from "@prisma/client";
import { audit } from "@/lib/audit";
import { deidentify, defang } from "@/lib/deidentify";
import { AppError } from "@/lib/http";
import { alertsRepository, type PublicAlertRow, type StaffAlertRow } from "@/modules/alerts/alerts.repository";
import type { CreateAlertInput, UpdateAlertInput } from "@/modules/alerts/alerts.schema";
import type { Actor } from "@/modules/council/council.service";

/**
 * Module 9 — community alerts (FR49–FR54).
 *
 * An alert is written by one officer and published by another (FR51): the
 * second pair of eyes is the control on what goes out under Council's name,
 * and on whether anything identifying has survived de-identification (FR50).
 * The link back to the source report exists while the alert is being written
 * and is cut at publication — the database refuses a published alert that
 * still holds one (ER-2).
 */

/* Hooks run after an alert is published: subscriptions register one. Kept as
   a list rather than an import so this module does not depend on the modules
   that react to it. */
type PublishHook = (alert: PublicAlertRow) => Promise<void>;
const publishHooks: PublishHook[] = [];

export function onAlertPublished(hook: PublishHook) {
  publishHooks.push(hook);
}

function toPublic(row: PublicAlertRow) {
  return {
    reference: row.reference,
    headline: row.headline,
    summary: row.summary,
    specimen: row.specimen,
    channel: row.channel,
    severity: row.severity,
    archived: row.status === "ARCHIVED",
    publishedAt: row.publishedAt?.toISOString() ?? null,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    category: row.category,
    suburb: row.suburb,
  };
}

export type PublicAlert = ReturnType<typeof toPublic>;

function toStaff(row: StaffAlertRow, actor: Actor, returnNote?: { note: string; by: string | null; at: string } | null) {
  const own = row.author?.id === actor.id;

  return {
    ...toPublic(row),
    id: row.id,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    author: row.author,
    approvedBy: row.approvedBy,
    sourceReport: row.sourceReport ? { reference: row.sourceReport.reference, title: row.sourceReport.title } : null,
    returnNote: row.status === "DRAFT" ? (returnNote ?? null) : null,
    actions: {
      edit: row.status === "DRAFT" || row.status === "PENDING_APPROVAL",
      submit: row.status === "DRAFT",
      /* FR51 — never the author's own. */
      approve: row.status === "PENDING_APPROVAL" && !own,
      return: row.status === "PENDING_APPROVAL" && !own,
      archive: row.status === "PUBLISHED",
      restore: row.status === "ARCHIVED",
    },
  };
}

export type StaffAlert = ReturnType<typeof toStaff>;

/** A summary a resident can act on, drafted from the category the officer confirmed. */
function suggestedSummary(category: { name: string; description: string | null } | null, channel: string) {
  const how = { SMS: "text messages", EMAIL: "emails", PHONE: "phone calls", WEBSITE: "websites", SOCIAL: "social media messages", POST: "letters", OTHER: "messages" }[channel] ?? "messages";
  const what = category?.description ? `${category.description.replace(/\.$/, "")}.` : "A scam has been reported to Council and verified by a CyberSafe officer.";
  return `Council has verified reports of ${how} like the one below. ${what} Do not reply, tap links or call numbers in the message. If you have paid or shared details, contact your bank on the number on your card, then report it to Council.`;
}

async function checkReferences(input: { categoryId?: string | null; suburbId?: string | null }) {
  if (input.categoryId && !(await alertsRepository.categoryIsLive(input.categoryId))) {
    throw new AppError(422, "Choose a category from the list.", [{ field: "categoryId", message: "That category is not in use." }]);
  }
  if (input.suburbId && !(await alertsRepository.suburbExists(input.suburbId))) {
    throw new AppError(422, "Choose a suburb from the list.", [{ field: "suburbId", message: "That suburb is not in Hume." }]);
  }
}

async function load(id: string) {
  const row = await alertsRepository.staffById(id);
  if (!row) throw new AppError(404, "There is no alert with that id.");
  return row;
}

const MOVED_ON = "This alert has moved on since you opened it. Reload it to see where it stands.";

export const alertsService = {
  /** FR52, FR53 — the public feed. */
  async publicList(query: { q?: string; categoryId?: string; suburbId?: string; severity?: "HIGH" | "MEDIUM" | "LOW"; archived?: "include" | "only"; page: number; pageSize: number }) {
    const statuses: AlertStatus[] = query.archived === "only" ? ["ARCHIVED"] : query.archived === "include" ? ["PUBLISHED", "ARCHIVED"] : ["PUBLISHED"];
    const where: Prisma.AlertWhereInput = {
      status: { in: statuses },
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.suburbId ? { suburbId: query.suburbId } : {}),
      ...(query.severity ? { severity: query.severity } : {}),
      ...(query.q
        ? {
            OR: [
              { headline: { contains: query.q, mode: "insensitive" } },
              { summary: { contains: query.q, mode: "insensitive" } },
              /* People search for the domain they were sent; specimens hold it defanged. */
              { specimen: { contains: defang(query.q), mode: "insensitive" } },
              { reference: { equals: query.q.toUpperCase() } },
            ],
          }
        : {}),
    };

    const [rows, total] = await alertsRepository.publicList(where, (query.page - 1) * query.pageSize, query.pageSize);
    return { alerts: rows.map(toPublic), total, page: query.page, pageSize: query.pageSize };
  },

  async publicGet(reference: string) {
    const row = await alertsRepository.publicByReference(reference);
    if (!row) throw new AppError(404, "There is no published alert with that reference.");
    return toPublic(row);
  },

  async staffList(status: AlertStatus | undefined, page: number, actor: Actor) {
    const [[rows, total], counts] = await Promise.all([alertsRepository.staffList(status, (page - 1) * 25, 25), alertsRepository.statusCounts()]);
    return {
      alerts: rows.map((row) => toStaff(row, actor)),
      total,
      page,
      pageSize: 25,
      counts: Object.fromEntries(counts.map((row) => [row.status, row._count._all])) as Partial<Record<AlertStatus, number>>,
    };
  },

  async staffGet(id: string, actor: Actor) {
    const row = await load(id);
    const note = row.status === "DRAFT" ? await alertsRepository.lastReturnNote(id) : null;
    const metadata = note?.metadata as { note?: string } | null | undefined;
    return toStaff(row, actor, metadata?.note ? { note: metadata.note, by: note?.user?.fullName ?? null, at: note!.createdAt.toISOString() } : null);
  },

  /**
   * FR49, FR50 — what an alert from this report would say, before anyone
   * writes a word. Only a verified report can become an alert: an alert is
   * Council vouching for a scam, and it can only vouch for one it verified.
   */
  async suggest(reference: string) {
    const report = await alertsRepository.sourceReport(reference);
    if (!report) throw new AppError(404, "There is no report with that reference.");
    if (report.status !== "APPROVED") throw new AppError(409, "Only a verified report can become an alert. Verify it first.");

    const names = [report.author?.fullName ?? "", report.author?.email.split("@")[0] ?? ""].filter(Boolean);
    const specimen = deidentify(report.description.slice(0, 1_500), { names });
    const headline = deidentify(report.title, { names });

    return {
      sourceReference: report.reference,
      headline: headline.text.slice(0, 140),
      summary: suggestedSummary(report.category, report.channel),
      specimen: specimen.text,
      categoryId: report.categoryId,
      suburbId: report.suburbId,
      channel: report.channel,
      severity: report.severity ?? "MEDIUM",
      redactions: [...specimen.redactions, ...headline.redactions],
    };
  },

  /** FR49. */
  async create(input: CreateAlertInput, actor: Actor) {
    await checkReferences(input);

    let sourceReportId: string | null = null;
    if (input.sourceReference) {
      const report = await alertsRepository.sourceReport(input.sourceReference);
      if (!report || report.status !== "APPROVED") throw new AppError(409, "Only a verified report can become an alert.");
      sourceReportId = report.id;
    }

    const created = await alertsRepository.create({
      reference: await alertsRepository.newReference(),
      sourceReportId,
      authorId: actor.id,
      status: "DRAFT",
      headline: input.headline,
      summary: input.summary,
      specimen: input.specimen || null,
      categoryId: input.categoryId ?? null,
      suburbId: input.suburbId ?? null,
      channel: input.channel,
      severity: input.severity,
    });

    await audit({ userId: actor.id, action: "alert.drafted", entityType: "Alert", entityId: created.id, ipAddress: actor.ipAddress, metadata: { fromReport: input.sourceReference ?? null } });
    return this.staffGet(created.id, actor);
  },

  async update(id: string, input: UpdateAlertInput, actor: Actor) {
    await load(id);
    await checkReferences(input);

    const data: Prisma.AlertUncheckedUpdateManyInput = { ...input, ...(input.specimen !== undefined ? { specimen: input.specimen || null } : {}) };
    if (!(await alertsRepository.update(id, data))) throw new AppError(409, "A published or archived alert cannot be edited.");

    await audit({ userId: actor.id, action: "alert.edited", entityType: "Alert", entityId: id, ipAddress: actor.ipAddress, metadata: { fields: Object.keys(input) } });
    return this.staffGet(id, actor);
  },

  /** DRAFT → PENDING_APPROVAL. */
  async submit(id: string, actor: Actor) {
    await load(id);
    if (!(await alertsRepository.transition(id, "DRAFT", { status: "PENDING_APPROVAL" }))) throw new AppError(409, MOVED_ON);
    await audit({ userId: actor.id, action: "alert.submitted", entityType: "Alert", entityId: id, ipAddress: actor.ipAddress });
    return this.staffGet(id, actor);
  },

  /** An approver sends it back with a note. */
  async sendBack(id: string, note: string, actor: Actor) {
    const row = await load(id);
    if (row.author?.id === actor.id) throw new AppError(403, "Another officer reviews your alerts. Withdraw it by editing instead.");
    if (!(await alertsRepository.transition(id, "PENDING_APPROVAL", { status: "DRAFT" }))) throw new AppError(409, MOVED_ON);
    await audit({ userId: actor.id, action: "alert.returned", entityType: "Alert", entityId: id, ipAddress: actor.ipAddress, metadata: { note } });
    return this.staffGet(id, actor);
  },

  /**
   * FR51, FR52 — the second officer publishes.
   *
   * De-identification runs once more, against the source report's reporter,
   * before anything is published. If it would still remove something, the
   * alert is refused rather than silently altered: the approver should see
   * exactly what is going out, and fix it themselves.
   */
  async approve(id: string, actor: Actor) {
    const row = await load(id);

    if (row.author?.id === actor.id) {
      throw new AppError(403, "An alert is published by a second officer, not the one who wrote it.");
    }

    const names: string[] = [];
    if (row.sourceReport) {
      const source = await alertsRepository.reporterNames(row.sourceReport.id);
      if (source?.author) names.push(source.author.fullName, ...(source.author.organisation ? [source.author.organisation] : []));
    }

    const leftovers = [row.headline, row.summary, row.specimen ?? ""].flatMap((text) => deidentify(text, { names }).redactions.filter((r) => r.kind !== "greeting"));
    if (leftovers.length > 0) {
      const kinds = [...new Set(leftovers.map((r) => r.kind))].join(", ");
      throw new AppError(422, `This alert still contains something identifying (${kinds}). Edit it out before publishing.`);
    }

    const published = await alertsRepository.transition(id, "PENDING_APPROVAL", {
      status: "PUBLISHED",
      approvedById: actor.id,
      publishedAt: new Date(),
      /* ER-2 — cut here; the CHECK constraint enforces it regardless. */
      sourceReportId: null,
    });
    if (!published) throw new AppError(409, MOVED_ON);

    await audit({ userId: actor.id, action: "alert.published", entityType: "Alert", entityId: id, ipAddress: actor.ipAddress, metadata: { reference: row.reference, sourceReportSevered: true } });

    const fresh = await load(id);
    for (const hook of publishHooks) {
      /* A failed notification never un-publishes the alert. */
      await hook(fresh).catch((error: unknown) => console.error("[alerts] publish hook failed:", error instanceof Error ? error.message : error));
    }

    return this.staffGet(id, actor);
  },

  /** FR54 — off the feed, still findable, never deleted. */
  async archive(id: string, actor: Actor) {
    await load(id);
    if (!(await alertsRepository.transition(id, "PUBLISHED", { status: "ARCHIVED", archivedAt: new Date() }))) throw new AppError(409, MOVED_ON);
    await audit({ userId: actor.id, action: "alert.archived", entityType: "Alert", entityId: id, ipAddress: actor.ipAddress });
    return this.staffGet(id, actor);
  },

  async restore(id: string, actor: Actor) {
    await load(id);
    if (!(await alertsRepository.transition(id, "ARCHIVED", { status: "PUBLISHED", archivedAt: null }))) throw new AppError(409, MOVED_ON);
    await audit({ userId: actor.id, action: "alert.restored", entityType: "Alert", entityId: id, ipAddress: actor.ipAddress });
    return this.staffGet(id, actor);
  },
};
