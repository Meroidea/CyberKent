import { z } from "zod";

const id = z.string().trim().min(1).max(40);

export const indicatorInputSchema = z
  .object({
    type: z.enum(["URL", "DOMAIN", "PHONE", "EMAIL", "BANK_ACCOUNT"]),
    value: z.string().trim().min(3, "Too short to be useful.").max(500),
  })
  .strict();

/** FR25–FR27. */
export const createReportSchema = z
  .object({
    channel: z.enum(["SMS", "EMAIL", "PHONE", "WEBSITE", "SOCIAL", "POST", "OTHER"]),
    categoryId: id.optional(),
    suburbId: id.optional(),
    title: z.string().trim().min(4, "Give the report a short title.").max(140),
    description: z
      .string()
      .trim()
      .min(20, "Tell us a little more — a sentence or two is enough.")
      .max(20_000, "That is longer than we can accept. Keep the key details."),
    /* Dollars as the person typed them; stored as cents. */
    amountLost: z.number().nonnegative().max(100_000_000).optional(),
    occurredOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date.")
      .refine((value) => new Date(`${value}T00:00:00Z`).getTime() <= Date.now() + 24 * 60 * 60 * 1000, "That date is in the future.")
      .optional(),
    indicators: z.array(indicatorInputSchema).max(25, "List up to 25 details.").default([]),
    /* The checker's verdict, where the report started from one. Kept for
       triage only; an officer reaches their own conclusion. */
    fromCheck: z
      .object({
        score: z.number().int().min(0).max(100),
        band: z.enum(["high", "medium", "low", "unclear"]),
      })
      .strict()
      .optional(),
  })
  .strict();

/** FR41 — the reporter's answer to a reviewer's question. */
export const respondSchema = z
  .object({ response: z.string().trim().min(2, "Write your answer.").max(5_000) })
  .strict();

export type CreateReportInput = z.infer<typeof createReportSchema>;
