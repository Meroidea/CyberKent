import { Prisma, type ReportStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { councilRepository, OPEN_STATUSES } from "@/modules/council/council.repository";

/**
 * FR70 — statistics for the officer dashboard and for Council reporting; FR71 —
 * the de-identified export; FR90 (proposed) — the "rising" signal.
 *
 * Every figure is an aggregate computed in the database. Nothing here reads a
 * description, a name or an artefact value, so nothing here can leak one.
 */

const DAY = 24 * 60 * 60 * 1000;

/** ETH-4, FR71 — the smallest group an export may describe. */
export const K_ANONYMITY = 5;

/* Reports that reached Council. Drafts never did; deleted ones are not ours to count. */
const COUNTED = { deletedAt: null, status: { not: "DRAFT" as ReportStatus } } satisfies Prisma.ReportWhereInput;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle]!;
}

type GroupKey = "status" | "severity" | "channel" | "categoryId" | "suburbId";

/* Prisma's groupBy types cannot follow a key chosen at run time, so the result
   is narrowed here once, to the one shape every caller reads. */
async function grouped(key: GroupKey, where: Prisma.ReportWhereInput): Promise<{ key: string | null; count: number }[]> {
  const rows = (await prisma.report.groupBy({ by: [key], where, _count: { _all: true } } as never)) as unknown as (Record<GroupKey, string | null> & {
    _count: { _all: number };
  })[];
  return rows.map((row) => ({ key: row[key] ?? null, count: row._count._all }));
}

export const councilStats = {
  async summary(days: number) {
    const now = Date.now();
    const since = new Date(now - days * DAY);
    const previous = new Date(now - 2 * days * DAY);
    const inPeriod = { ...COUNTED, submittedAt: { gte: since } } satisfies Prisma.ReportWhereInput;
    const inPrevious = { ...COUNTED, submittedAt: { gte: previous, lt: since } } satisfies Prisma.ReportWhereInput;

    /* Days for short periods, weeks for a year — a 365-bar chart is a texture, not a chart. */
    const bucket = days > 90 ? "week" : "day";

    const [byStatus, bySeverity, byChannel, byCategory, bySuburb, previousByCategory] = await Promise.all([
      grouped("status", inPeriod),
      grouped("severity", inPeriod),
      grouped("channel", inPeriod),
      grouped("categoryId", inPeriod),
      grouped("suburbId", inPeriod),
      grouped("categoryId", inPrevious),
    ]);

    const [previousTotal, money, series, decisions, openAges, categories, suburbs, staff, checks] = await Promise.all([
      prisma.report.count({ where: inPrevious }),
      prisma.report.aggregate({ where: { ...inPeriod, status: { notIn: ["WITHDRAWN", "REJECTED"] } }, _sum: { amountLostCents: true }, _count: { amountLostCents: true } }),
      prisma.$queryRaw<{ bucket: Date; count: bigint }[]>`
        SELECT date_trunc(${bucket}, "submittedAt") AS bucket, COUNT(*)::bigint AS count
        FROM "Report"
        WHERE "deletedAt" IS NULL AND status <> 'DRAFT' AND "submittedAt" >= ${since}
        GROUP BY 1 ORDER BY 1`,
      /* First review and final decision per report decided in the period, in hours. */
      prisma.$queryRaw<{ firstTouch: number | null; decision: number | null }[]>`
        SELECT
          EXTRACT(EPOCH FROM (MIN(rv."createdAt") - r."submittedAt")) / 3600 AS "firstTouch",
          EXTRACT(EPOCH FROM (MAX(rv."createdAt") FILTER (WHERE rv.decision IN ('APPROVED', 'REJECTED')) - r."submittedAt")) / 3600 AS decision
        FROM "Report" r
        JOIN "ReportReview" rv ON rv."reportId" = r.id
        WHERE r."deletedAt" IS NULL AND r."submittedAt" >= ${since}
        GROUP BY r.id, r."submittedAt"`,
      prisma.report.findMany({ where: { deletedAt: null, status: { in: OPEN_STATUSES } }, select: { submittedAt: true, createdAt: true, reviewerId: true, severity: true, status: true } }),
      prisma.scamCategory.findMany({ select: { id: true, name: true } }),
      prisma.suburb.findMany({ select: { id: true, name: true, postcode: true } }),
      councilRepository.staff(),
      prisma.scamCheck.count({ where: { createdAt: { gte: since } } }),
    ]);

    const categoryName = new Map(categories.map((row) => [row.id, row.name]));
    const suburbMeta = new Map(suburbs.map((row) => [row.id, row]));
    const previousCategory = new Map(previousByCategory.map((row) => [row.key, row.count]));
    const total = byStatus.reduce((sum, row) => sum + row.count, 0);
    const statusCount = (...statuses: string[]) => byStatus.filter((row) => statuses.includes(row.key ?? "")).reduce((s, r) => s + r.count, 0);

    /*
     * FR90 — "rising": at least three reports this period and at least double
     * the last. Both halves matter: doubling from one to two is noise, and
     * thirty a month that was thirty last month is a baseline, not a signal.
     */
    const rising = (current: number, before: number) => current >= 3 && current >= 2 * Math.max(before, 1);

    const hours = decisions.map((row) => ({ first: row.firstTouch === null ? null : Number(row.firstTouch), decision: row.decision === null ? null : Number(row.decision) }));

    const ageDays = openAges.map((row) => (now - (row.submittedAt ?? row.createdAt).getTime()) / DAY);

    /* Every bucket, including the empty ones — a series with gaps drawn as a
       line would join Monday to Thursday and hide the quiet days between. */
    const bucketMs = bucket === "week" ? 7 * DAY : DAY;
    const counts = new Map(series.map((row) => [row.bucket.getTime(), Number(row.count)]));
    const start = new Date(since);
    start.setUTCHours(0, 0, 0, 0);
    if (bucket === "week") {
      /* date_trunc('week') starts on Monday. */
      start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    }
    const timeline: { date: string; count: number }[] = [];
    for (let at = start.getTime(); at <= now; at += bucketMs) {
      timeline.push({ date: new Date(at).toISOString().slice(0, 10), count: counts.get(at) ?? 0 });
    }

    return {
      period: { days, since: since.toISOString(), bucket },
      totals: {
        reports: total,
        previousReports: previousTotal,
        open: statusCount(...OPEN_STATUSES),
        approved: statusCount("APPROVED"),
        rejected: statusCount("REJECTED"),
        withdrawn: statusCount("WITHDRAWN"),
        checks,
        moneyLost: (money._sum.amountLostCents ?? 0) / 100,
        reportsWithLoss: money._count.amountLostCents,
      },
      timing: {
        medianHoursToFirstReview: median(hours.map((h) => h.first).filter((v): v is number => v !== null)),
        medianHoursToDecision: median(hours.map((h) => h.decision).filter((v): v is number => v !== null)),
      },
      backlog: {
        open: openAges.length,
        unassigned: openAges.filter((row) => !row.reviewerId).length,
        untriaged: openAges.filter((row) => !row.severity).length,
        waitingOnReporter: openAges.filter((row) => row.status === "INFORMATION_REQUESTED").length,
        ages: [
          { label: "Under 2 days", count: ageDays.filter((d) => d < 2).length },
          { label: "2–7 days", count: ageDays.filter((d) => d >= 2 && d < 7).length },
          { label: "7–14 days", count: ageDays.filter((d) => d >= 7 && d < 14).length },
          { label: "Over 14 days", count: ageDays.filter((d) => d >= 14).length },
        ],
        oldestDays: ageDays.length ? Math.floor(Math.max(...ageDays)) : null,
      },
      timeline,
      byStatus: byStatus.map((row) => ({ status: row.key, count: row.count })).sort((a, b) => b.count - a.count),
      bySeverity: bySeverity.map((row) => ({ severity: row.key, count: row.count })),
      byChannel: byChannel.map((row) => ({ channel: row.key, count: row.count })).sort((a, b) => b.count - a.count),
      byCategory: byCategory
        .map((row) => {
          const before = previousCategory.get(row.key) ?? 0;
          return {
            id: row.key,
            name: row.key ? (categoryName.get(row.key) ?? "Unknown") : "Not classified",
            count: row.count,
            previous: before,
            rising: row.key !== null && rising(row.count, before),
          };
        })
        .sort((a, b) => b.count - a.count),
      bySuburb: bySuburb
        .map((row) => {
          const meta = row.key ? suburbMeta.get(row.key) : undefined;
          return { id: row.key, name: meta?.name ?? "Not given", postcode: meta?.postcode ?? null, count: row.count };
        })
        .sort((a, b) => b.count - a.count),
      workload: staff.map((person) => ({ id: person.id, fullName: person.fullName, role: person.role, openReports: person.openReports })),
    };
  },

  /**
   * FR71 — a de-identified, aggregate export.
   *
   * One row per month × category × suburb × channel, counts only; no reference,
   * no free text, no artefact, no person. A group smaller than k is not
   * published as itself: it is folded into a coarser row first — suburb
   * generalised to "Other suburbs", then channel to "All channels", then
   * category to "Other categories". Folding rather than blanking is what makes
   * complementary suppression unnecessary: every report is still counted
   * exactly once, so no published total can be subtracted from another to
   * recover a suppressed cell. A residual row that is still under k after all
   * three generalisations is published with its count withheld.
   */
  async exportRows(days: number) {
    const since = new Date(Date.now() - days * DAY);

    const rows = await prisma.$queryRaw<
      { month: string; category: string | null; suburb: string | null; channel: string; reports: bigint; approved: bigint; lossCents: bigint | null }[]
    >`
      SELECT
        to_char(date_trunc('month', r."submittedAt"), 'YYYY-MM') AS month,
        c.name AS category,
        s.name AS suburb,
        r.channel::text AS channel,
        COUNT(*)::bigint AS reports,
        COUNT(*) FILTER (WHERE r.status = 'APPROVED')::bigint AS approved,
        SUM(r."amountLostCents") FILTER (WHERE r.status <> 'WITHDRAWN')::bigint AS "lossCents"
      FROM "Report" r
      LEFT JOIN "ScamCategory" c ON c.id = r."categoryId"
      LEFT JOIN "Suburb" s ON s.id = r."suburbId"
      WHERE r."deletedAt" IS NULL AND r.status <> 'DRAFT' AND r."submittedAt" >= ${since}
      GROUP BY 1, 2, 3, 4`;

    type Cell = { month: string; category: string; suburb: string; channel: string; reports: number; approved: number; lossCents: number };

    let cells: Cell[] = rows.map((row) => ({
      month: row.month,
      category: row.category ?? "Not classified",
      suburb: row.suburb ?? "Not given",
      channel: row.channel,
      reports: Number(row.reports),
      approved: Number(row.approved),
      lossCents: Number(row.lossCents ?? 0),
    }));

    const generalise: ((cell: Cell) => Cell)[] = [
      (cell) => ({ ...cell, suburb: "Other suburbs" }),
      (cell) => ({ ...cell, channel: "All channels" }),
      (cell) => ({ ...cell, category: "Other categories" }),
    ];

    const merge = (list: Cell[]) => {
      const byKey = new Map<string, Cell>();
      for (const cell of list) {
        const key = [cell.month, cell.category, cell.suburb, cell.channel].join("\u0000");
        const existing = byKey.get(key);
        if (existing) {
          existing.reports += cell.reports;
          existing.approved += cell.approved;
          existing.lossCents += cell.lossCents;
        } else {
          byKey.set(key, { ...cell });
        }
      }
      return [...byKey.values()];
    };

    let generalised = 0;
    for (const step of generalise) {
      const small = cells.filter((cell) => cell.reports < K_ANONYMITY);
      if (small.length === 0) break;
      generalised += small.length;
      cells = merge([...cells.filter((cell) => cell.reports >= K_ANONYMITY), ...small.map(step)]);
    }

    const published = cells
      .sort((a, b) => a.month.localeCompare(b.month) || b.reports - a.reports)
      .map((cell) => {
        const suppressed = cell.reports < K_ANONYMITY;
        return {
          month: cell.month,
          category: cell.category,
          suburb: cell.suburb,
          channel: cell.channel,
          reports: suppressed ? `<${K_ANONYMITY}` : String(cell.reports),
          approved: suppressed ? "" : String(cell.approved),
          amountLostAud: suppressed ? "" : (cell.lossCents / 100).toFixed(2),
        };
      });

    return { rows: published, generalisedCells: generalised, suppressedRows: published.filter((row) => row.reports.startsWith("<")).length };
  },
};
