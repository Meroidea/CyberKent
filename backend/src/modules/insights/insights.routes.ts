import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { sendOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parseQuery } from "@/middleware/validate";
import { K_ANONYMITY } from "@/modules/council/council.stats";

/**
 * FR70, declared Module 9 — the public picture of scam activity in Hume.
 *
 * Aggregated to suburb and no finer (data rule D5), and every published
 * number is a count of at least k reports: a suburb with three reports this
 * month is shown as "fewer than five", never as three, because in a small
 * suburb three can be a street. Categories within a suburb are only named
 * where they, too, reach k. Withdrawn reports and drafts are not counted.
 */
export const insightsRoutes = Router();

const querySchema = z
  .object({ days: z.coerce.number().int().refine((n) => [30, 90, 365].includes(n), "Choose 30, 90 or 365 days.").default(90) })
  .strict();

const handle = (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res).catch(next);
};

/** A count as it may be published: itself if at least k, otherwise withheld. */
const publish = (count: number) => (count >= K_ANONYMITY ? count : null);

insightsRoutes.get("/map", handle(async (req, res) => {
  const { days } = parseQuery(querySchema, req);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const where = { deletedAt: null, status: { notIn: ["DRAFT" as const, "WITHDRAWN" as const] }, submittedAt: { gte: since } };

  const [suburbs, categories, bySuburb, bySuburbCategory, byCategory, verified, total] = await Promise.all([
    prisma.suburb.findMany({ select: { id: true, name: true, postcode: true }, orderBy: { name: "asc" } }),
    prisma.scamCategory.findMany({ select: { id: true, name: true, slug: true } }),
    prisma.report.groupBy({ by: ["suburbId"], where, _count: { _all: true } }),
    prisma.report.groupBy({ by: ["suburbId", "categoryId"], where: { ...where, suburbId: { not: null }, categoryId: { not: null } }, _count: { _all: true } }),
    prisma.report.groupBy({ by: ["categoryId"], where: { ...where, categoryId: { not: null } }, _count: { _all: true } }),
    prisma.report.count({ where: { ...where, status: "APPROVED" } }),
    prisma.report.count({ where }),
  ]);

  const categoryMeta = new Map(categories.map((row) => [row.id, row]));
  const suburbCount = new Map(bySuburb.map((row) => [row.suburbId, row._count._all]));

  const areas = suburbs.map((suburb) => {
    const count = suburbCount.get(suburb.id) ?? 0;
    const top = bySuburbCategory
      .filter((row) => row.suburbId === suburb.id && row._count._all >= K_ANONYMITY)
      .sort((a, b) => b._count._all - a._count._all)
      .slice(0, 3)
      .map((row) => ({ name: categoryMeta.get(row.categoryId!)?.name ?? "Other", count: row._count._all }));

    return {
      id: suburb.id,
      name: suburb.name,
      postcode: suburb.postcode,
      /* null = between 1 and k−1; 0 is published as 0, since none reveals nobody. */
      reports: count === 0 ? 0 : publish(count),
      suppressed: count > 0 && count < K_ANONYMITY,
      topCategories: top,
    };
  });

  /*
   * Complementary suppression. The total is published, so a single withheld
   * cell could be recovered by subtracting every published cell from it. When
   * exactly one cell is withheld, the next smallest is withheld with it.
   */
  const unplacedCount = suburbCount.get(null) ?? 0;
  const cells = [...areas.map((area) => ({ area, count: suburbCount.get(area.id) ?? 0 })), { area: null, count: unplacedCount }];
  let unplacedPublished = publish(unplacedCount);
  if (cells.filter((cell) => cell.count > 0 && cell.count < K_ANONYMITY).length === 1) {
    const partner = cells.filter((cell) => cell.count >= K_ANONYMITY).sort((a, b) => a.count - b.count)[0];
    if (partner?.area) {
      partner.area.reports = null;
      partner.area.suppressed = true;
    } else if (partner) {
      unplacedPublished = null;
    }
  }

  const types = byCategory
    .map((row) => ({ name: categoryMeta.get(row.categoryId!)?.name ?? "Other", slug: categoryMeta.get(row.categoryId!)?.slug ?? null, reports: publish(row._count._all) }))
    .filter((row) => row.reports !== null)
    .sort((a, b) => (b.reports ?? 0) - (a.reports ?? 0));

  res.setHeader("Cache-Control", "public, max-age=900");
  sendOk(res, {
    period: { days, since: since.toISOString() },
    k: K_ANONYMITY,
    totals: { reports: publish(total), verified: publish(verified), unplaced: unplacedPublished },
    areas,
    types,
  });
}));
