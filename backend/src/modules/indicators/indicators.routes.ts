import { Router, type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { sendOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { validateBody } from "@/middleware/validate";
import { normaliseIndicator } from "@/modules/reports/reports.normalise";

/**
 * FR24 — has this link, number or address been reported to Council before?
 *
 * The checker runs on the resident's device and sends nothing by default. This
 * endpoint is what it calls only when the resident asks it to, and it receives
 * only the artefacts — never the message. It answers with counts and
 * Council's verification status, never with who reported them or what their
 * reports said, and the artefacts themselves are not written to any log.
 *
 * ER-13: a count is not a verdict. A number can be reported fifty times
 * because it was spoofed from an innocent person, so the status an officer set
 * travels with every count, and the interface says what each one means.
 */
export const indicatorRoutes = Router();

const lookupSchema = z
  .object({
    items: z
      .array(z.object({ type: z.enum(["URL", "DOMAIN", "PHONE", "EMAIL"]), value: z.string().trim().min(3).max(500) }).strict())
      .min(1)
      .max(20),
  })
  .strict();

/* Enough for a person checking messages; too few to enumerate the registry. */
const lookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many look-ups in a short time. Try again in a few minutes.", data: null, errors: [] },
});

const handle = (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res).catch(next);
};

indicatorRoutes.post("/lookup", lookupLimiter, validateBody(lookupSchema), handle(async (req, res) => {
  const { items } = req.body as z.infer<typeof lookupSchema>;

  /* Each input keeps a link to the canonical forms it produced, so a URL is
     answered by its own row and by its domain's. */
  const forms = items.map((item) => ({ input: item, keys: normaliseIndicator(item.type, item.value) ?? [] }));
  const wanted = forms.flatMap((form) => form.keys);

  const rows = wanted.length
    ? await prisma.indicator.findMany({
        where: { OR: wanted.map((key) => ({ type: key.type, value: key.value })), reportCount: { gt: 0 } },
        select: { type: true, value: true, reportCount: true, verificationStatus: true, lastSeenAt: true },
      })
    : [];

  const byKey = new Map(rows.map((row) => [`${row.type}:${row.value}`, row]));

  const results = forms.map(({ input, keys }) => {
    const matches = keys.map((key) => byKey.get(`${key.type}:${key.value}`)).filter((row): row is NonNullable<typeof row> => Boolean(row));
    /* The strongest single match speaks for the input: a verified domain
       outranks an unverified exact URL. */
    const rank = { VERIFIED: 3, UNVERIFIED: 2, DISPUTED: 1, REJECTED: 0 } as const;
    const best = matches.sort((a, b) => rank[b.verificationStatus] - rank[a.verificationStatus] || b.reportCount - a.reportCount)[0];

    return {
      type: input.type,
      value: input.value,
      matchedOn: best ? (best.type === input.type ? "exact" : "domain") : null,
      reportCount: best?.reportCount ?? 0,
      status: best?.verificationStatus ?? null,
      lastReportedAt: best?.lastSeenAt.toISOString() ?? null,
    };
  });

  sendOk(res, { results });
}));
