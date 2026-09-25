import type { Channel, IndicatorStatus, IndicatorType } from "@prisma/client";
import { deidentify } from "@/lib/deidentify";
import { prisma } from "@/lib/prisma";

/**
 * The scam radar — what is circulating in Hume right now.
 *
 * Reports from the window are grouped into campaigns, strongest signal first:
 *
 * 1. A shared artefact (the same phone number, link, domain or sender) is the
 *    surest sign that separate residents received the same scam.
 * 2. Whatever is left is grouped by scam type and channel — "toll scams by
 *    text" — which is how the public talks about a wave even when every
 *    message uses a fresh link.
 *
 * Each campaign is compared with the window before it, so the radar shows
 * direction as well as size: surging, rising, steady or fading. The sample
 * message is de-identified and defanged before it leaves this module; nothing
 * here carries a reporter's name, address or contact detail.
 */

const DAY = 24 * 60 * 60 * 1000;

export type Threat = "surging" | "rising" | "steady" | "fading";

interface ReportRow {
  id: string;
  reference: string;
  title: string;
  description: string;
  channel: Channel;
  status: string;
  submittedAt: Date;
  amountLostCents: number | null;
  category: { id: string; slug: string; name: string } | null;
  suburb: { name: string } | null;
  indicators: { indicator: { id: string; type: IndicatorType; value: string; verificationStatus: IndicatorStatus } }[];
}

const CHANNEL_LABEL: Record<Channel, string> = {
  SMS: "text message",
  EMAIL: "email",
  PHONE: "phone call",
  WEBSITE: "website",
  SOCIAL: "social media",
  POST: "post",
  OTHER: "other channels",
};

function threatOf(current: number, previous: number): Threat {
  if (current >= 3 && current >= previous * 2) return "surging";
  if (current > previous) return "rising";
  if (current < previous) return "fading";
  return "steady";
}

function velocityLabel(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "new this period" : "no change";
  const change = Math.round(((current - previous) / previous) * 100);
  return change === 0 ? "no change" : `${change > 0 ? "+" : ""}${change}% on the previous period`;
}

function specimen(report: ReportRow): string {
  const { text } = deidentify(report.description);
  return text.length > 240 ? `${text.slice(0, 237).trimEnd()}…` : text;
}

export const radarService = {
  async campaigns(days: number) {
    const now = Date.now();
    const start = new Date(now - days * DAY);
    const previousStart = new Date(now - 2 * days * DAY);

    const [rows, alerts] = await Promise.all([
      prisma.report.findMany({
        where: { deletedAt: null, status: { notIn: ["DRAFT", "WITHDRAWN"] }, submittedAt: { gte: previousStart } },
        select: {
          id: true,
          reference: true,
          title: true,
          description: true,
          channel: true,
          status: true,
          submittedAt: true,
          amountLostCents: true,
          category: { select: { id: true, slug: true, name: true } },
          suburb: { select: { name: true } },
          indicators: { select: { indicator: { select: { id: true, type: true, value: true, verificationStatus: true } } } },
        },
        orderBy: { submittedAt: "desc" },
      }) as Promise<ReportRow[]>,
      prisma.alert.findMany({
        where: { status: "PUBLISHED", publishedAt: { gte: previousStart } },
        select: { reference: true, headline: true, categoryId: true, channel: true, publishedAt: true },
      }),
    ]);

    /* Group: artefact first, then category × channel for everything else. */
    const groups = new Map<string, { kind: "artefact" | "pattern"; label: string; detail: string; indicator?: ReportRow["indicators"][number]["indicator"]; categoryId?: string | null; channel?: Channel; reports: ReportRow[] }>();
    const artefactCount = new Map<string, number>();
    for (const row of rows) for (const { indicator } of row.indicators) artefactCount.set(indicator.id, (artefactCount.get(indicator.id) ?? 0) + 1);

    for (const row of rows) {
      const shared = row.indicators
        .map((link) => link.indicator)
        .filter((indicator) => (artefactCount.get(indicator.id) ?? 0) >= 2)
        .sort((a, b) => (artefactCount.get(b.id) ?? 0) - (artefactCount.get(a.id) ?? 0))[0];

      if (shared) {
        const key = `artefact:${shared.id}`;
        const kind = shared.type === "PHONE" ? "phone number" : shared.type === "EMAIL" ? "sender address" : shared.type === "BANK_ACCOUNT" ? "bank account" : "link";
        const group = groups.get(key) ?? {
          kind: "artefact" as const,
          label: row.category ? `${row.category.name} using one ${kind}` : `Scam using one ${kind}`,
          detail: shared.value.replace(/\./g, "[.]"),
          indicator: shared,
          categoryId: row.category?.id ?? null,
          channel: row.channel,
          reports: [],
        };
        group.reports.push(row);
        groups.set(key, group);
        continue;
      }

      const key = `pattern:${row.category?.slug ?? "uncategorised"}:${row.channel}`;
      const group = groups.get(key) ?? {
        kind: "pattern" as const,
        label: `${row.category?.name ?? "Uncategorised"} by ${CHANNEL_LABEL[row.channel]}`,
        detail: "Different links and numbers, same pattern",
        categoryId: row.category?.id ?? null,
        channel: row.channel,
        reports: [],
      };
      group.reports.push(row);
      groups.set(key, group);
    }

    const campaigns = [...groups.entries()]
      .map(([key, group]) => {
        const inWindow = group.reports.filter((r) => r.submittedAt >= start);
        const previous = group.reports.length - inWindow.length;
        const current = inWindow.length;
        if (current === 0) return null;

        const series = Array.from({ length: days }, (_, i) => {
          const dayStart = start.getTime() + i * DAY;
          return inWindow.filter((r) => r.submittedAt.getTime() >= dayStart && r.submittedAt.getTime() < dayStart + DAY).length;
        });
        const suburbs = new Map<string, number>();
        for (const r of inWindow) if (r.suburb) suburbs.set(r.suburb.name, (suburbs.get(r.suburb.name) ?? 0) + 1);
        const losses = inWindow.reduce((sum, r) => sum + (r.amountLostCents ?? 0), 0);
        const verified = inWindow.filter((r) => r.status === "APPROVED").length;
        const latest = inWindow[0]!;
        const threat = threatOf(current, previous);
        const alert = alerts.find((a) => a.categoryId && a.categoryId === group.categoryId && (group.kind === "artefact" || a.channel === group.channel));

        /* Size, direction, harm and confirmation — in that order of weight. */
        const heat = Math.round(current * 10 * (threat === "surging" ? 2 : threat === "rising" ? 1.4 : threat === "fading" ? 0.7 : 1) + Math.min(losses / 100_000, 40) + verified * 3 + (group.kind === "artefact" ? 8 : 0));

        return {
          key,
          kind: group.kind,
          label: group.label,
          detail: group.detail,
          category: inWindow[0]!.category?.name ?? null,
          channel: group.channel ?? null,
          indicator: group.indicator ? { type: group.indicator.type, value: group.indicator.value.replace(/\./g, "[.]"), status: group.indicator.verificationStatus } : null,
          current,
          previous,
          threat,
          velocityLabel: velocityLabel(current, previous),
          heat,
          series,
          firstSeen: inWindow[inWindow.length - 1]!.submittedAt.toISOString(),
          lastSeen: latest.submittedAt.toISOString(),
          suburbs: [...suburbs.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
          lossCents: losses,
          verified,
          specimen: specimen(latest),
          latestReference: latest.reference,
          references: inWindow.slice(0, 8).map((r) => r.reference),
          alert: alert ? { reference: alert.reference, headline: alert.headline } : null,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => b.heat - a.heat);

    const inWindow = rows.filter((r) => r.submittedAt >= start);

    return {
      days,
      generatedAt: new Date(now).toISOString(),
      totals: {
        reports: inWindow.length,
        previousReports: rows.length - inWindow.length,
        campaigns: campaigns.length,
        surging: campaigns.filter((c) => c.threat === "surging").length,
        uncovered: campaigns.filter((c) => (c.threat === "surging" || c.threat === "rising") && !c.alert).length,
        lossCents: inWindow.reduce((sum, r) => sum + (r.amountLostCents ?? 0), 0),
      },
      campaigns: campaigns.slice(0, 40),
      /* The newest messages, as residents received them, de-identified. */
      ticker: inWindow.slice(0, 12).map((r) => ({
        reference: r.reference,
        category: r.category?.name ?? null,
        channel: r.channel,
        suburb: r.suburb?.name ?? null,
        submittedAt: r.submittedAt.toISOString(),
        excerpt: specimen(r).slice(0, 140),
      })),
    };
  },
};
