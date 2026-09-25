import type { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import { env } from "@/config/env";
import { audit } from "@/lib/audit";
import { AppError } from "@/lib/http";
import { emailDeliveryAvailable, mailTemplates, sendMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { STAFF_ROLES, isAdminRole } from "@/lib/roles";
import type { Actor } from "@/modules/council/council.service";
import { radarService } from "@/modules/radar/radar.service";

/**
 * The console's task tracker.
 *
 * Tasks belong to Council staff only: an assignee must hold a staff role, and
 * a task tied to a report carries the report's reference, never its content.
 * Every change is on the audit trail, and assigning someone is a notification
 * in their console and — when email is up — a message in their inbox.
 */

const DAY = 24 * 60 * 60 * 1000;
const PRIORITY_RANK: Record<TaskPriority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const person = { select: { id: true, fullName: true, role: true } } as const;
const taskInclude = {
  assignee: person,
  createdBy: person,
  report: { select: { reference: true, status: true, title: true } },
  _count: { select: { comments: true } },
} satisfies Prisma.TaskInclude;

type TaskRow = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

function toTask(row: TaskRow) {
  return {
    id: row.id,
    reference: row.reference,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueAt: row.dueAt?.toISOString() ?? null,
    overdue: row.status !== "DONE" && row.dueAt !== null && row.dueAt.getTime() < Date.now(),
    labels: row.labels,
    position: row.position,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    assignee: row.assignee,
    createdBy: row.createdBy,
    report: row.report,
    commentCount: row._count.comments,
  };
}

async function nextReference(): Promise<string> {
  const latest = await prisma.task.findFirst({ orderBy: { createdAt: "desc" }, select: { reference: true } });
  const n = latest ? Number(latest.reference.replace(/\D/g, "")) + 1 : 1;
  return `TASK-${String(n).padStart(4, "0")}`;
}

async function staffMember(id: string) {
  const member = await prisma.user.findFirst({ where: { id, deletedAt: null, role: { in: STAFF_ROLES } }, select: { id: true, fullName: true, email: true } });
  if (!member) throw new AppError(422, "Tasks can only be assigned to active Council staff.", [{ field: "assigneeId", message: "Choose someone on the team." }]);
  return member;
}

async function reportId(reference: string | null | undefined): Promise<string | null | undefined> {
  if (reference === undefined) return undefined;
  if (reference === null) return null;
  const report = await prisma.report.findFirst({ where: { reference, deletedAt: null, status: { not: "DRAFT" } }, select: { id: true } });
  if (!report) throw new AppError(422, "There is no submitted report with that reference.", [{ field: "reportReference", message: "Check the reference." }]);
  return report.id;
}

async function notifyAssignee(task: TaskRow, actor: Actor) {
  if (!task.assigneeId || task.assigneeId === actor.id) return;
  const member = await prisma.user.findUnique({ where: { id: task.assigneeId }, select: { fullName: true, email: true } });
  if (!member) return;

  const link = `/council/tasks?task=${task.reference}`;
  await prisma.notification.create({
    data: { userId: task.assigneeId, kind: "TASK_ASSIGNED", title: `${task.reference} assigned to you`, body: task.title, linkPath: link },
  });

  if (emailDeliveryAvailable()) {
    const first = member.fullName.split(/\s+/)[0] || member.fullName;
    await sendMail({ to: member.email, ...mailTemplates.taskAssigned(first, task.reference, task.title, `${env.appUrl}${link}`) });
  }
}

async function load(reference: string) {
  const row = await prisma.task.findUnique({ where: { reference }, include: taskInclude });
  if (!row) throw new AppError(404, "There is no task with that reference.");
  return row;
}

export const tasksService = {
  async list(filter: { view: string; status?: TaskStatus; priority?: TaskPriority; assigneeId?: string; q?: string; includeDone: string }, actor: Actor) {
    const now = new Date();
    const and: Prisma.TaskWhereInput[] = [];
    if (filter.view === "mine") and.push({ assigneeId: actor.id });
    if (filter.view === "unassigned") and.push({ assigneeId: null });
    if (filter.view === "created") and.push({ createdById: actor.id });
    if (filter.view === "overdue") and.push({ status: { not: "DONE" }, dueAt: { lt: now } });
    if (filter.status) and.push({ status: filter.status });
    if (filter.priority) and.push({ priority: filter.priority });
    if (filter.assigneeId) and.push({ assigneeId: filter.assigneeId });
    if (filter.includeDone === "false") and.push({ status: { not: "DONE" } });
    /* Finished work stays on the board for a fortnight, then lives in search. */
    if (!filter.q && !filter.status) and.push({ OR: [{ status: { not: "DONE" } }, { completedAt: { gte: new Date(Date.now() - 14 * DAY) } }] });
    if (filter.q) {
      and.push({
        OR: [
          { title: { contains: filter.q, mode: "insensitive" } },
          { description: { contains: filter.q, mode: "insensitive" } },
          { reference: { contains: filter.q, mode: "insensitive" } },
          { labels: { has: filter.q.toLowerCase() } },
          { report: { reference: { contains: filter.q, mode: "insensitive" } } },
        ],
      });
    }

    const open = { status: { not: "DONE" as const } };
    const [rows, all, mine, unassigned, overdue, dueSoon, staff] = await Promise.all([
      prisma.task.findMany({ where: { AND: and }, include: taskInclude, orderBy: [{ position: "asc" }, { createdAt: "desc" }], take: 400 }),
      prisma.task.count({ where: open }),
      prisma.task.count({ where: { ...open, assigneeId: actor.id } }),
      prisma.task.count({ where: { ...open, assigneeId: null } }),
      prisma.task.count({ where: { ...open, dueAt: { lt: now } } }),
      prisma.task.count({ where: { ...open, dueAt: { gte: now, lt: new Date(now.getTime() + 2 * DAY) } } }),
      prisma.user.findMany({ where: { deletedAt: null, role: { in: STAFF_ROLES } }, select: { id: true, fullName: true, role: true }, orderBy: { fullName: "asc" } }),
    ]);

    return {
      tasks: rows
        .map(toTask)
        .sort((a, b) => (a.status === b.status ? a.position - b.position || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] : 0)),
      counts: { open: all, mine, unassigned, overdue, dueSoon },
      staff,
    };
  },

  async get(reference: string) {
    const row = await load(reference);
    const [comments, activity] = await Promise.all([
      prisma.taskComment.findMany({ where: { taskId: row.id }, include: { author: person }, orderBy: { createdAt: "asc" } }),
      prisma.auditLog.findMany({
        where: { entityType: "Task", entityId: row.id },
        select: { id: true, action: true, metadata: true, createdAt: true, user: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: "asc" },
        take: 100,
      }),
    ]);
    return {
      task: toTask(row),
      comments: comments.map((c) => ({ id: c.id, body: c.body, createdAt: c.createdAt.toISOString(), author: c.author })),
      activity: activity.map((a) => ({ id: a.id, action: a.action, metadata: a.metadata, createdAt: a.createdAt.toISOString(), actor: a.user })),
    };
  },

  async create(input: {
    title: string; description?: string; status?: TaskStatus; priority: TaskPriority; dueAt?: Date; assigneeId?: string; labels: string[]; reportReference?: string;
  }, actor: Actor) {
    if (input.assigneeId) await staffMember(input.assigneeId);
    const linked = await reportId(input.reportReference);
    const status = input.status ?? "TODO";
    const first = await prisma.task.findFirst({ where: { status }, orderBy: { position: "asc" }, select: { position: true } });

    let row: TaskRow | null = null;
    for (let attempt = 0; attempt < 3 && !row; attempt += 1) {
      try {
        row = await prisma.task.create({
          data: {
            reference: await nextReference(),
            title: input.title,
            description: input.description || null,
            status,
            priority: input.priority,
            dueAt: input.dueAt ?? null,
            labels: [...new Set(input.labels.map((label) => label.toLowerCase()))],
            position: (first?.position ?? 1000) - 1,
            completedAt: status === "DONE" ? new Date() : null,
            assigneeId: input.assigneeId ?? null,
            createdById: actor.id,
            reportId: linked ?? null,
          },
          include: taskInclude,
        });
      } catch (error) {
        /* Two tasks created in the same instant may draw the same number. */
        if ((error as { code?: string }).code !== "P2002" || attempt === 2) throw error;
      }
    }

    await audit({ userId: actor.id, action: "task.created", entityType: "Task", entityId: row!.id, ipAddress: actor.ipAddress, metadata: { reference: row!.reference, assigneeId: row!.assigneeId } });
    await notifyAssignee(row!, actor);
    return toTask(row!);
  },

  async update(reference: string, input: {
    title?: string; description?: string | null; status?: TaskStatus; priority?: TaskPriority; dueAt?: Date | null; assigneeId?: string | null; labels?: string[]; reportReference?: string | null; position?: number;
  }, actor: Actor) {
    const before = await load(reference);
    if (input.assigneeId) await staffMember(input.assigneeId);
    const linked = await reportId(input.reportReference);

    const data: Prisma.TaskUncheckedUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description || null;
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.dueAt !== undefined) data.dueAt = input.dueAt;
    if (input.assigneeId !== undefined) data.assigneeId = input.assigneeId;
    if (input.labels !== undefined) data.labels = [...new Set(input.labels.map((label) => label.toLowerCase()))];
    if (linked !== undefined) data.reportId = linked;
    if (input.position !== undefined) data.position = input.position;
    if (input.status !== undefined && input.status !== before.status) {
      data.status = input.status;
      data.completedAt = input.status === "DONE" ? new Date() : null;
    }

    const row = await prisma.task.update({ where: { id: before.id }, data, include: taskInclude });

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    if (data.status !== undefined) changes.status = { from: before.status, to: row.status };
    if (data.priority !== undefined && before.priority !== row.priority) changes.priority = { from: before.priority, to: row.priority };
    if (data.assigneeId !== undefined && before.assigneeId !== row.assigneeId) changes.assignee = { from: before.assignee?.fullName ?? null, to: row.assignee?.fullName ?? null };
    if (data.dueAt !== undefined && before.dueAt?.getTime() !== row.dueAt?.getTime()) changes.due = { from: before.dueAt?.toISOString() ?? null, to: row.dueAt?.toISOString() ?? null };
    if (data.title !== undefined && before.title !== row.title) changes.title = { from: before.title, to: row.title };

    /* A drag within a column is not worth an audit line; anything else is. */
    if (Object.keys(changes).length > 0 || data.description !== undefined || data.labels !== undefined || data.reportId !== undefined) {
      await audit({ userId: actor.id, action: "task.updated", entityType: "Task", entityId: row.id, ipAddress: actor.ipAddress, metadata: { reference, changes } as Prisma.InputJsonValue });
    }
    if (changes.assignee) await notifyAssignee(row, actor);
    return toTask(row);
  },

  async remove(reference: string, actor: Actor) {
    const row = await load(reference);
    if (row.createdById !== actor.id && !isAdminRole(actor.role)) {
      throw new AppError(403, "Only the person who created a task, or an administrator, can delete it.");
    }
    await prisma.task.delete({ where: { id: row.id } });
    await audit({ userId: actor.id, action: "task.deleted", entityType: "Task", entityId: row.id, ipAddress: actor.ipAddress, metadata: { reference, title: row.title } });
  },

  async comment(reference: string, body: string, actor: Actor) {
    const row = await load(reference);
    const comment = await prisma.taskComment.create({ data: { taskId: row.id, authorId: actor.id, body }, include: { author: person } });
    await prisma.task.update({ where: { id: row.id }, data: { updatedAt: new Date() } });
    return { id: comment.id, body: comment.body, createdAt: comment.createdAt.toISOString(), author: comment.author };
  },

  /**
   * Work the system can see is waiting, offered as tasks one click from the
   * board. Nothing is created until someone accepts a suggestion; anything
   * already tracked by an open task is left out.
   */
  async suggestions() {
    const now = Date.now();
    const tracked = await prisma.task.findMany({ where: { status: { not: "DONE" } }, select: { reportId: true, labels: true, title: true } });
    const trackedReports = new Set(tracked.map((t) => t.reportId).filter(Boolean));
    const trackedTitles = new Set(tracked.map((t) => t.title));

    const [stale, waiting, pendingAlerts, indicators, radar] = await Promise.all([
      prisma.report.findMany({
        where: { deletedAt: null, status: "SUBMITTED", reviewerId: null, submittedAt: { lt: new Date(now - 2 * DAY) } },
        select: { id: true, reference: true, title: true, submittedAt: true, amountLostCents: true },
        orderBy: { submittedAt: "asc" },
        take: 12,
      }),
      prisma.report.findMany({
        where: { deletedAt: null, status: "INFORMATION_REQUESTED", updatedAt: { lt: new Date(now - 7 * DAY) } },
        select: { id: true, reference: true, title: true, updatedAt: true },
        orderBy: { updatedAt: "asc" },
        take: 6,
      }),
      prisma.alert.findMany({ where: { status: "PENDING_APPROVAL" }, select: { reference: true, headline: true, updatedAt: true }, take: 6 }),
      prisma.indicator.findMany({
        where: { verificationStatus: "UNVERIFIED", reportCount: { gte: 5 } },
        select: { type: true, value: true, reportCount: true },
        orderBy: { reportCount: "desc" },
        take: 4,
      }),
      radarService.campaigns(14).catch(() => null),
    ]);

    type Suggestion = { key: string; title: string; description: string; priority: TaskPriority; reportReference?: string; labels: string[]; dueInDays: number; reason: string };
    const out: Suggestion[] = [];

    for (const report of stale) {
      if (trackedReports.has(report.id)) continue;
      const days = Math.floor((now - report.submittedAt!.getTime()) / DAY);
      const lost = (report.amountLostCents ?? 0) >= 100_000;
      out.push({
        key: `triage:${report.reference}`,
        title: `Triage ${report.reference}: ${report.title}`.slice(0, 140),
        description: `Submitted ${days} days ago and nobody has picked it up yet.${lost ? " Money was lost — the reporter may still be able to recover some of it if the bank hears soon." : ""}`,
        priority: lost || days >= 5 ? "HIGH" : "MEDIUM",
        reportReference: report.reference,
        labels: ["triage"],
        dueInDays: 1,
        reason: `Unassigned for ${days} days`,
      });
    }

    for (const report of waiting) {
      if (trackedReports.has(report.id)) continue;
      const days = Math.floor((now - report.updatedAt.getTime()) / DAY);
      out.push({
        key: `followup:${report.reference}`,
        title: `Follow up ${report.reference} — no reply for ${days} days`,
        description: "The reporter has not answered Council's question. Decide on what is known, or try another way to reach them.",
        priority: "MEDIUM",
        reportReference: report.reference,
        labels: ["follow-up"],
        dueInDays: 3,
        reason: `Waiting on the reporter for ${days} days`,
      });
    }

    for (const alert of pendingAlerts) {
      const title = `Review alert ${alert.reference} for publication`;
      if (trackedTitles.has(title)) continue;
      out.push({ key: `alert:${alert.reference}`, title, description: `"${alert.headline}" is waiting for a second officer to approve it.`, priority: "HIGH", labels: ["alert"], dueInDays: 1, reason: "Awaiting approval" });
    }

    for (const indicator of indicators) {
      const title = `Verify ${indicator.type.toLowerCase().replace("_", " ")} seen in ${indicator.reportCount} reports`;
      if (trackedTitles.has(title)) continue;
      out.push({
        key: `indicator:${indicator.type}:${indicator.value}`,
        title,
        description: `${indicator.value.replace(/\./g, "[.]")} appears in ${indicator.reportCount} reports but is still unverified. Confirming it lets the checker warn residents who paste it.`,
        priority: "MEDIUM",
        labels: ["indicator"],
        dueInDays: 3,
        reason: `${indicator.reportCount} reports`,
      });
    }

    for (const campaign of radar?.campaigns.filter((c) => c.threat === "surging" && !c.alert).slice(0, 3) ?? []) {
      const title = `Consider a community alert: ${campaign.label}`.slice(0, 140);
      if (trackedTitles.has(title)) continue;
      out.push({
        key: `radar:${campaign.key}`,
        title,
        description: `${campaign.current} reports in the last ${radar!.days} days (${campaign.velocityLabel}), with no published alert covering it.`,
        priority: "HIGH",
        reportReference: campaign.latestReference ?? undefined,
        labels: ["radar", "alert"],
        dueInDays: 1,
        reason: "Surging on the scam radar",
      });
    }

    const rank: Record<TaskPriority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return { suggestions: out.sort((a, b) => rank[a.priority] - rank[b.priority]).slice(0, 10) };
  },
};
