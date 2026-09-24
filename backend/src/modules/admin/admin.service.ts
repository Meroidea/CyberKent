import type { Role } from "@prisma/client";
import { audit } from "@/lib/audit";
import { toCsv } from "@/lib/csv";
import { AppError } from "@/lib/http";
import { STAFF_ROLES } from "@/middleware/staff";
import { adminRepository, type AdminUserRow } from "@/modules/admin/admin.repository";
import { councilStats, K_ANONYMITY } from "@/modules/council/council.stats";
import type { Actor } from "@/modules/council/council.service";

const DAY = 24 * 60 * 60 * 1000;

/** FR67 — what an administrator sees about an account. Never a digest, never a token. */
function toAdminUser(row: AdminUserRow) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    organisation: row.organisation,
    role: row.role,
    emailVerified: row.emailVerified !== null,
    lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    suspendedAt: row.deletedAt?.toISOString() ?? null,
    reportCount: row._count.reports,
    openAssigned: row._count.assignedReports,
  };
}

function slugify(name: string) {
  return (
    name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "category"
  );
}

async function manageable(id: string, actor: Actor) {
  if (id === actor.id) {
    /* Changing your own role or suspending yourself is how the last
       administrator locks everyone out; it is always someone else's job. */
    throw new AppError(409, "You cannot change your own account here. Ask another administrator.");
  }

  const row = await adminRepository.manageable(id);
  if (!row) throw new AppError(404, "There is no account with that id.");
  return row;
}

/** A change that would leave Council with no active administrator is refused, whoever asks. */
async function keepAnAdministrator(row: AdminUserRow) {
  if (row.role === "ADMIN" && !row.deletedAt && (await adminRepository.activeAdmins()) <= 1) {
    throw new AppError(409, "This is the only active administrator. Make someone else an administrator first.");
  }
}

export const adminService = {
  /** FR67. */
  async users(filter: { q?: string; role?: Role; status: "active" | "suspended" | "all"; page: number; pageSize: number }) {
    const [[rows, total], roles] = await Promise.all([
      adminRepository.users(filter, (filter.page - 1) * filter.pageSize, filter.pageSize),
      adminRepository.roleCounts(),
    ]);

    return {
      users: rows.map(toAdminUser),
      total,
      page: filter.page,
      pageSize: filter.pageSize,
      roles: Object.fromEntries(roles.map((row) => [row.role, row._count._all])) as Partial<Record<Role, number>>,
    };
  },

  /** FR68 — every change written with actor, before and after. */
  async setRole(id: string, role: Role, actor: Actor) {
    const row = await manageable(id, actor);

    if (row.role === role) return toAdminUser(row);
    if (role !== "ADMIN") await keepAnAdministrator(row);

    const leavesStaff = STAFF_ROLES.includes(row.role) && !STAFF_ROLES.includes(role);
    const { user, released } = await adminRepository.setRole(id, role, leavesStaff);
    await audit({
      userId: actor.id,
      action: "user.role_changed",
      entityType: "User",
      entityId: id,
      ipAddress: actor.ipAddress,
      metadata: { from: row.role, to: role, ...(released ? { releasedReports: released } : {}) },
    });
    return toAdminUser(user);
  },

  /** FR67 — reversible soft deletion. Takes effect on the next request, not at token expiry. */
  async suspend(id: string, reason: string, actor: Actor) {
    const row = await manageable(id, actor);

    if (row.deletedAt) throw new AppError(409, "This account is already suspended.");
    await keepAnAdministrator(row);

    const released = await adminRepository.suspend(id);
    /* The reason is an administrator's, about an account rather than about
       anyone's submission, so it belongs on the audit line itself. */
    await audit({ userId: actor.id, action: "user.suspended", entityType: "User", entityId: id, ipAddress: actor.ipAddress, metadata: { reason, releasedReports: released } });

    return { user: toAdminUser((await adminRepository.manageable(id))!), releasedReports: released };
  },

  async reactivate(id: string, actor: Actor) {
    await manageable(id, actor);

    if (!(await adminRepository.reactivate(id))) throw new AppError(409, "This account is not suspended.");

    await audit({ userId: actor.id, action: "user.reactivated", entityType: "User", entityId: id, ipAddress: actor.ipAddress });
    return toAdminUser((await adminRepository.manageable(id))!);
  },

  /** FR69. */
  async categories() {
    return (await adminRepository.categories()).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      archivedAt: row.archivedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      reportCount: row._count.reports,
      alertCount: row._count.alerts,
    }));
  },

  async createCategory(input: { name: string; description?: string }, actor: Actor) {
    if (await adminRepository.categoryNameTaken(input.name)) {
      throw new AppError(409, "There is already a category with that name.", [{ field: "name", message: "Choose a different name." }]);
    }

    /* The slug is permanent — it is what alert subscriptions and links carry —
       so a clash gets a suffix rather than taking over the existing one. */
    const base = slugify(input.name);
    let slug = base;
    for (let n = 2; await adminRepository.slugTaken(slug); n += 1) slug = `${base}-${n}`;

    const created = await adminRepository.createCategory({ slug, name: input.name, description: input.description || null });
    await audit({ userId: actor.id, action: "category.created", entityType: "ScamCategory", entityId: created.id, ipAddress: actor.ipAddress, metadata: { name: created.name, slug } });
    return created;
  },

  /**
   * Rename, redescribe, archive or restore. Never delete: a category is a row
   * reports point at, and archiving it keeps their history while taking it
   * out of every picker (FR69).
   */
  async updateCategory(id: string, input: { name?: string; description?: string | null; archived?: boolean }, actor: Actor) {
    const existing = await adminRepository.findCategory(id);
    if (!existing) throw new AppError(404, "There is no category with that id.");

    if (input.name && (await adminRepository.categoryNameTaken(input.name, id))) {
      throw new AppError(409, "There is already a category with that name.", [{ field: "name", message: "Choose a different name." }]);
    }

    const updated = await adminRepository.updateCategory(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.archived !== undefined ? { archivedAt: input.archived ? (existing.archivedAt ?? new Date()) : null } : {}),
    });

    await audit({
      userId: actor.id,
      action: input.archived === true ? "category.archived" : input.archived === false ? "category.restored" : "category.updated",
      entityType: "ScamCategory",
      entityId: id,
      ipAddress: actor.ipAddress,
      metadata: { category: existing.name, ...(input.name && input.name !== existing.name ? { renamed: { from: existing.name, to: input.name } } : {}) },
    });

    return updated;
  },

  /** FR72 — read-only. There is no route anywhere that edits or deletes an audit line. */
  async audit(filter: { action?: string; entityType?: string; userId?: string; days: number; page: number; pageSize: number }) {
    const since = new Date(Date.now() - filter.days * DAY);
    const [[rows, total], actions] = await Promise.all([
      adminRepository.audit({ ...filter, since }, (filter.page - 1) * filter.pageSize, filter.pageSize),
      adminRepository.auditActions(),
    ]);

    const reportIds = rows.filter((row) => row.entityType === "Report" && row.entityId).map((row) => row.entityId!);
    const references = new Map((await adminRepository.referencesFor(reportIds)).map((row) => [row.id, row.reference]));

    return {
      entries: rows.map((row) => ({
        id: row.id,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        reference: row.entityId ? (references.get(row.entityId) ?? null) : null,
        metadata: row.metadata,
        ipAddress: row.ipAddress,
        createdAt: row.createdAt.toISOString(),
        actor: row.user,
      })),
      total,
      page: filter.page,
      pageSize: filter.pageSize,
      actions: actions.map((row) => ({ action: row.action, count: row._count._all })),
    };
  },

  /** FR71 — the export itself is an auditable act, whoever runs it. */
  async exportCsv(days: number, actor: Actor) {
    const result = await councilStats.exportRows(days);

    const csv = toCsv(
      [
        { key: "month", header: "Month" },
        { key: "category", header: "Category" },
        { key: "suburb", header: "Suburb" },
        { key: "channel", header: "Channel" },
        { key: "reports", header: "Reports" },
        { key: "approved", header: "Verified" },
        { key: "amountLostAud", header: "Amount lost (AUD)" },
      ],
      result.rows,
    );

    await audit({
      userId: actor.id,
      action: "data.exported",
      entityType: "Report",
      ipAddress: actor.ipAddress,
      metadata: { days, rows: result.rows.length, k: K_ANONYMITY, generalisedCells: result.generalisedCells, suppressedRows: result.suppressedRows },
    });

    return { csv, ...result };
  },
};
