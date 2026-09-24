import crypto from "node:crypto";
import type { ReportStatus } from "@prisma/client";
import { audit } from "@/lib/audit";
import { EVIDENCE_LIMITS, extensionOf, safeName, sniff, stripMetadata } from "@/lib/files";
import { AppError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";

/**
 * Module 6 — evidence (FR31–FR36).
 *
 * FR35: a file is readable by the resident who attached it and by Council
 * staff, and by nobody else — there is no public URL for any of it. FR36:
 * every read, by anyone, is written to the append-only access log with who,
 * what and from where.
 */

/* Evidence can be added while the report is still with Council. */
const OPEN: ReportStatus[] = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "INFORMATION_REQUESTED"];

const select = { id: true, originalName: true, mimeType: true, sizeBytes: true, description: true, metadataStrippedAt: true, createdAt: true } as const;

function view(row: { id: string; originalName: string; mimeType: string; sizeBytes: number; description: string | null; metadataStrippedAt: Date | null; createdAt: Date }) {
  return { ...row, metadataStripped: row.metadataStrippedAt !== null, metadataStrippedAt: undefined, createdAt: row.createdAt.toISOString() };
}

export type EvidenceView = ReturnType<typeof view>;

async function reportFor(reference: string, authorId?: string) {
  const report = await prisma.report.findFirst({
    where: { reference, deletedAt: null, ...(authorId ? { authorId } : {}) },
    select: { id: true, reference: true, status: true, _count: { select: { evidence: { where: { deletedAt: null } } } } },
  });
  if (!report) throw new AppError(404, authorId ? "We could not find a report with that reference on your account." : "There is no report with that reference.");
  return report;
}

export const evidenceService = {
  limits() {
    return {
      available: storage.available(),
      maxBytes: EVIDENCE_LIMITS.maxBytes,
      maxFiles: EVIDENCE_LIMITS.maxFilesPerReport,
      accepted: EVIDENCE_LIMITS.accepted.map((kind) => ({ mime: kind.mime, extensions: kind.extensions, label: kind.label })),
    };
  },

  async list(reference: string, authorId?: string) {
    const report = await reportFor(reference, authorId);
    const rows = await prisma.evidence.findMany({ where: { reportId: report.id, deletedAt: null }, select, orderBy: { createdAt: "asc" } });
    return rows.map(view);
  },

  /** FR31–FR34. */
  async upload(input: { reference: string; authorId: string; name: string; description?: string; bytes: Buffer; ipAddress?: string }) {
    if (!storage.available()) {
      throw new AppError(503, "Attaching files is not switched on for this site yet. Describe the evidence in your report, and keep the original safe.");
    }

    const report = await reportFor(input.reference, input.authorId);
    if (!OPEN.includes(report.status)) throw new AppError(409, "Council has already decided this report, so no more files can be added.");
    if (report._count.evidence >= EVIDENCE_LIMITS.maxFilesPerReport) throw new AppError(409, `A report can have up to ${EVIDENCE_LIMITS.maxFilesPerReport} files.`);

    /* FR33. */
    if (input.bytes.length === 0) throw new AppError(422, "That file is empty.");
    if (input.bytes.length > EVIDENCE_LIMITS.maxBytes) throw new AppError(413, `Files can be up to ${Math.round(EVIDENCE_LIMITS.maxBytes / 1024 / 1024)} MB.`);

    /* FR32 — the bytes decide the type; the extension must agree with them. */
    const kind = sniff(input.bytes);
    const name = safeName(input.name);
    const extension = extensionOf(name);
    if (!kind) throw new AppError(415, "That kind of file cannot be attached. Use a photo or screenshot (JPEG, PNG, HEIC, WebP, GIF), a PDF, or a text file.");
    if (extension && !kind.extensions.includes(extension)) {
      throw new AppError(415, `That file is named .${extension} but is really a ${kind.label}. Rename it or attach the original.`);
    }

    const cleaned = stripMetadata(kind, input.bytes);
    const id = crypto.randomUUID();
    const storageKey = `evidence/${report.id}/${id}`;

    /* Original and served copy, both encrypted; only the copy is ever read back. */
    await storage.put(`${storageKey}.original`, input.bytes);
    await storage.put(storageKey, cleaned.bytes);

    const row = await prisma.evidence.create({
      data: {
        reportId: report.id,
        originalName: name,
        mimeType: kind.mime,
        sizeBytes: input.bytes.length,
        sha256: crypto.createHash("sha256").update(input.bytes).digest("hex"),
        storageKey,
        description: input.description?.trim().slice(0, 500) || null,
        metadataStrippedAt: cleaned.stripped ? new Date() : null,
      },
      select,
    });

    await prisma.evidenceAccessLog.create({ data: { evidenceId: row.id, userId: input.authorId, action: "uploaded", ipAddress: input.ipAddress ?? null } });
    await audit({ userId: input.authorId, action: "evidence.uploaded", entityType: "Evidence", entityId: row.id, ipAddress: input.ipAddress, metadata: { report: report.reference, mime: kind.mime, bytes: input.bytes.length, metadataStripped: cleaned.stripped } });

    return view(row);
  },

  /** FR35, FR36 — the served copy, and a line in the access log for reading it. */
  async open(input: { reference: string; evidenceId: string; userId: string; asStaff: boolean; ipAddress?: string }) {
    const report = await reportFor(input.reference, input.asStaff ? undefined : input.userId);
    const row = await prisma.evidence.findFirst({ where: { id: input.evidenceId, reportId: report.id, deletedAt: null }, select: { ...select, storageKey: true } });
    if (!row) throw new AppError(404, "That file is not on this report.");

    const bytes = await storage.get(row.storageKey);
    if (!bytes) throw new AppError(410, "That file could not be retrieved from storage.");

    await prisma.evidenceAccessLog.create({ data: { evidenceId: row.id, userId: input.userId, action: input.asStaff ? "viewed_by_staff" : "viewed_by_reporter", ipAddress: input.ipAddress ?? null } });

    return { bytes, mimeType: row.mimeType, name: row.originalName };
  },

  /** A reporter can take a file back before Council has looked at the report. */
  async remove(reference: string, evidenceId: string, authorId: string, ipAddress?: string) {
    const report = await reportFor(reference, authorId);
    if (!["DRAFT", "SUBMITTED"].includes(report.status)) {
      throw new AppError(409, "An officer is already reviewing this report, so its files are part of the record. Contact the CyberSafe team if a file should not be there.");
    }

    const removed = await prisma.evidence.updateMany({ where: { id: evidenceId, reportId: report.id, deletedAt: null }, data: { deletedAt: new Date() } });
    if (removed.count !== 1) throw new AppError(404, "That file is not on this report.");

    await prisma.evidenceAccessLog.create({ data: { evidenceId, userId: authorId, action: "removed_by_reporter", ipAddress: ipAddress ?? null } });
    return this.list(reference, authorId);
  },

  /** FR36, for officers — who has opened each file. */
  async accessLog(reference: string, evidenceId: string) {
    const report = await reportFor(reference);
    const rows = await prisma.evidenceAccessLog.findMany({
      where: { evidenceId, evidence: { reportId: report.id } },
      select: { action: true, ipAddress: true, createdAt: true, user: { select: { fullName: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return rows.map((row) => ({ action: row.action, at: row.createdAt.toISOString(), by: row.user?.fullName ?? "Removed account", role: row.user?.role ?? null, ipAddress: row.ipAddress }));
  },
};
