import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * FR72, Rule 17 — append-only record of consequential actions.
 *
 * Writing an audit line never fails the action it describes: the action has
 * already happened, and answering the caller with an error would misreport it.
 * A failure is logged instead, without the metadata (Rule 6.7).
 *
 * Metadata must never contain credentials, tokens or submitted content.
 */
export async function audit(entry: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        metadata: entry.metadata,
        ipAddress: entry.ipAddress ?? null,
      },
    });
  } catch {
    console.error(`[audit] could not record ${entry.action} on ${entry.entityType}.`);
  }
}
