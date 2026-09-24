import { z } from "zod";

const id = z.string().trim().min(1).max(40);
const severity = z.enum(["HIGH", "MEDIUM", "LOW"]);

/** FR37 — the queue's filters. Every one optional; the default is the open queue. */
export const queueQuerySchema = z
  .object({
    view: z.enum(["open", "mine", "unassigned", "waiting", "decided", "all"]).default("open"),
    status: z.enum(["SUBMITTED", "UNDER_REVIEW", "INFORMATION_REQUESTED", "APPROVED", "REJECTED", "WITHDRAWN"]).optional(),
    severity: z.enum(["HIGH", "MEDIUM", "LOW", "UNSET"]).optional(),
    categoryId: id.optional(),
    suburbId: id.optional(),
    /* Reports at least this many days old — the "what has been sitting" filter. */
    olderThanDays: z.coerce.number().int().min(1).max(365).optional(),
    q: z.string().trim().max(120).optional(),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    pageSize: z.coerce.number().int().min(5).max(100).default(25),
  })
  .strict();

/** FR38 — `null` hands the report back to the queue. */
export const assignSchema = z.object({ reviewerId: id.nullable() }).strict();

/** FR39, FR40 — either or both; `null` clears. */
export const triageSchema = z
  .object({
    categoryId: id.nullable().optional(),
    severity: severity.nullable().optional(),
  })
  .strict()
  .refine((value) => value.categoryId !== undefined || value.severity !== undefined, "Change the category or the severity.");

/** FR41. */
export const requestInfoSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(10, "Ask a question the reporter can answer — a sentence is enough.")
      .max(2_000, "Keep the question under 2,000 characters."),
  })
  .strict();

/** FR42 — a decision always carries its reason. */
export const decisionSchema = z
  .object({
    decision: z.enum(["APPROVED", "REJECTED"]),
    reason: z
      .string()
      .trim()
      .min(10, "Record why — a colleague reading this later needs the reasoning, not just the outcome.")
      .max(4_000),
    severity: severity.optional(),
    categoryId: id.optional(),
  })
  .strict();

/** Re-opening a decided report is an administrator's correction, and says why. */
export const reopenSchema = z.object({ reason: z.string().trim().min(10, "Record why the decision is being re-opened.").max(2_000) }).strict();

/** ER-13 — an officer's judgement on an artefact, separate from how often it was reported. */
export const indicatorStatusSchema = z
  .object({ status: z.enum(["UNVERIFIED", "VERIFIED", "DISPUTED", "REJECTED"]) })
  .strict();

/** FR70 — the period statistics cover. */
export const statsQuerySchema = z
  .object({ days: z.coerce.number().int().refine((n) => [7, 30, 90, 365].includes(n), "Choose 7, 30, 90 or 365 days.").default(30) })
  .strict();

export type QueueQuery = z.infer<typeof queueQuerySchema>;
export type DecisionInput = z.infer<typeof decisionSchema>;
export type TriageInput = z.infer<typeof triageSchema>;
