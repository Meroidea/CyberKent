import { z } from "zod";

const id = z.string().trim().min(1).max(40);

/** FR53 — public search. */
export const publicAlertsQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    categoryId: id.optional(),
    suburbId: id.optional(),
    severity: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
    /* FR54 — archived alerts stay findable, but only when asked for. */
    archived: z.enum(["include", "only"]).optional(),
    page: z.coerce.number().int().min(1).max(500).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(12),
  })
  .strict();

export const staffAlertsQuerySchema = z
  .object({
    status: z.enum(["DRAFT", "PENDING_APPROVAL", "PUBLISHED", "ARCHIVED"]).optional(),
    page: z.coerce.number().int().min(1).max(500).default(1),
  })
  .strict();

const fields = {
  headline: z.string().trim().min(10, "Write a headline a resident will recognise.").max(140),
  summary: z.string().trim().min(40, "Say what the scam is and what to do — a few sentences.").max(2_000),
  specimen: z.string().trim().max(1_500).nullable().optional(),
  categoryId: id.nullable().optional(),
  suburbId: id.nullable().optional(),
  channel: z.enum(["SMS", "EMAIL", "PHONE", "WEBSITE", "SOCIAL", "POST", "OTHER"]),
  severity: z.enum(["HIGH", "MEDIUM", "LOW"]),
};

/** FR49 — a new alert, optionally drafted from a verified report. */
export const createAlertSchema = z
  .object({ ...fields, sourceReference: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{4,32}$/).optional() })
  .strict();

export const updateAlertSchema = z
  .object({
    headline: fields.headline.optional(),
    summary: fields.summary.optional(),
    specimen: fields.specimen,
    categoryId: fields.categoryId,
    suburbId: fields.suburbId,
    channel: fields.channel.optional(),
    severity: fields.severity.optional(),
  })
  .strict();

/** Sending an alert back to its author always says what to change. */
export const returnAlertSchema = z.object({ note: z.string().trim().min(5, "Say what needs changing.").max(1_000) }).strict();

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;
