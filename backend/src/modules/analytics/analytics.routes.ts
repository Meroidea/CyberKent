import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { sendOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parseQuery } from "@/middleware/validate";

/**
 * The data behind the analytics dashboards: one compact row per submitted
 * report over the chosen period and the one before it, for comparison.
 *
 * Rows carry what an analyst slices by — dates, category, suburb, channel,
 * status, severity, loss, time to decision — and nothing that identifies a
 * reporter: no names, contact details or narrative. Staff-only (mounted inside
 * the council routes). The browser does the slicing, which is what lets the
 * explorer answer any combination without a round trip.
 */
export const analyticsRoutes = Router();

const DAY = 24 * 60 * 60 * 1000;
const query = z.object({ days: z.coerce.number().int().refine((n) => [7, 30, 90, 180, 365].includes(n), "Choose 7, 30, 90, 180 or 365 days.").default(90) }).strict();

analyticsRoutes.get("/dataset", (req: Request, res: Response, next: NextFunction) => {
  const { days } = parseQuery(query, req);
  const now = Date.now();
  const since = new Date(now - 2 * days * DAY);

  Promise.all([
    prisma.report.findMany({
      where: { deletedAt: null, status: { not: "DRAFT" }, submittedAt: { gte: since } },
      select: {
        submittedAt: true,
        channel: true,
        status: true,
        severity: true,
        amountLostCents: true,
        category: { select: { slug: true } },
        suburb: { select: { name: true } },
        reviews: { where: { decision: { in: ["APPROVED", "REJECTED"] } }, select: { createdAt: true }, orderBy: { createdAt: "asc" }, take: 1 },
        _count: { select: { indicators: true } },
      },
      orderBy: { submittedAt: "asc" },
      take: 20_000,
    }),
    prisma.scamCategory.findMany({ select: { slug: true, name: true }, orderBy: { name: "asc" } }),
    prisma.suburb.findMany({ select: { name: true, postcode: true }, orderBy: { name: "asc" } }),
    prisma.alert.findMany({ where: { publishedAt: { gte: since } }, select: { publishedAt: true, category: { select: { slug: true } } } }),
    prisma.task.findMany({ where: { OR: [{ createdAt: { gte: since } }, { completedAt: { gte: since } }] }, select: { createdAt: true, completedAt: true } }),
  ])
    .then(([reports, categories, suburbs, alerts, tasks]) =>
      sendOk(res, {
        days,
        periodStart: new Date(now - days * DAY).toISOString(),
        previousStart: since.toISOString(),
        generatedAt: new Date(now).toISOString(),
        /* Short keys: a year of reports is a few thousand rows. */
        rows: reports.map((r) => ({
          t: r.submittedAt!.toISOString(),
          c: r.category?.slug ?? null,
          s: r.suburb?.name ?? null,
          ch: r.channel,
          st: r.status,
          sv: r.severity,
          l: r.amountLostCents ?? 0,
          d: r.reviews[0] ? Math.max(0, Math.round((r.reviews[0].createdAt.getTime() - r.submittedAt!.getTime()) / 3_600_000)) : null,
          i: r._count.indicators,
        })),
        categories,
        suburbs,
        alerts: alerts.map((a) => ({ t: a.publishedAt!.toISOString(), c: a.category?.slug ?? null })),
        tasks: tasks.map((t) => ({ created: t.createdAt.toISOString(), done: t.completedAt?.toISOString() ?? null })),
      }),
    )
    .catch(next);
});
