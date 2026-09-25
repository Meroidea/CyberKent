import type { AnalyticsDataset, AnalyticsRow } from "@/lib/admin/types";

/**
 * The analytics engine behind the dashboards — pure functions over the
 * dataset the API sends, so every figure can be recomputed instantly as the
 * filters change and every chart agrees with every other.
 *
 * Times are read in Melbourne, which is where Hume's residents live their day.
 */

const TZ = "Australia/Melbourne";
const DAY = 86_400_000;

const weekdayFmt = new Intl.DateTimeFormat("en-AU", { timeZone: TZ, weekday: "short" });
const hourFmt = new Intl.DateTimeFormat("en-AU", { timeZone: TZ, hour: "numeric", hourCycle: "h23" });
const dayFmt = new Intl.DateTimeFormat("en-AU", { timeZone: TZ, day: "numeric", month: "short" });
const monthFmt = new Intl.DateTimeFormat("en-AU", { timeZone: TZ, month: "short", year: "2-digit" });

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const HOUR_BLOCKS = ["12–3am", "3–6am", "6–9am", "9–12pm", "12–3pm", "3–6pm", "6–9pm", "9–12am"];
export const CHANNEL_NAME: Record<string, string> = { SMS: "Text message", EMAIL: "Email", PHONE: "Phone call", WEBSITE: "Website", SOCIAL: "Social media", POST: "Post", OTHER: "Other" };
export const STATUS_NAME: Record<string, string> = { SUBMITTED: "New", UNDER_REVIEW: "In review", INFORMATION_REQUESTED: "Waiting on reporter", APPROVED: "Verified", REJECTED: "Closed", WITHDRAWN: "Withdrawn" };
export const SEVERITY_NAME: Record<string, string> = { HIGH: "High", MEDIUM: "Medium", LOW: "Low" };
export const LOSS_BANDS = ["No money lost", "Under $100", "$100–$999", "$1,000–$9,999", "$10,000+"];

export function weekday(iso: string): string {
  return weekdayFmt.format(new Date(iso));
}
export function hourBlock(iso: string): number {
  return Math.floor(Number(hourFmt.format(new Date(iso))) / 3) % 8;
}
export function lossBand(cents: number): string {
  const dollars = cents / 100;
  if (dollars <= 0) return LOSS_BANDS[0]!;
  if (dollars < 100) return LOSS_BANDS[1]!;
  if (dollars < 1_000) return LOSS_BANDS[2]!;
  if (dollars < 10_000) return LOSS_BANDS[3]!;
  return LOSS_BANDS[4]!;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export interface Filters {
  category: string;
  suburb: string;
  channel: string;
}

export function split(data: AnalyticsDataset, filters: Filters) {
  const start = new Date(data.periodStart).getTime();
  const keep = (row: AnalyticsRow) =>
    (!filters.category || row.c === filters.category) && (!filters.suburb || row.s === filters.suburb) && (!filters.channel || row.ch === filters.channel);
  const rows = data.rows.filter(keep);
  return {
    current: rows.filter((r) => new Date(r.t).getTime() >= start),
    previous: rows.filter((r) => new Date(r.t).getTime() < start),
  };
}

export interface Kpis {
  reports: number;
  lossCents: number;
  verifiedRate: number | null;
  medianHours: number | null;
  withLossRate: number | null;
  withArtefactRate: number | null;
}

export function kpis(rows: AnalyticsRow[]): Kpis {
  const decided = rows.filter((r) => r.st === "APPROVED" || r.st === "REJECTED");
  return {
    reports: rows.length,
    lossCents: rows.reduce((sum, r) => sum + r.l, 0),
    verifiedRate: decided.length ? decided.filter((r) => r.st === "APPROVED").length / decided.length : null,
    medianHours: median(rows.map((r) => r.d).filter((d): d is number => d !== null)),
    withLossRate: rows.length ? rows.filter((r) => r.l > 0).length / rows.length : null,
    withArtefactRate: rows.length ? rows.filter((r) => r.i > 0).length / rows.length : null,
  };
}

/** Day buckets for short periods, weeks beyond 90 days. */
export function buckets(data: AnalyticsDataset) {
  const start = new Date(data.periodStart).getTime();
  const size = data.days > 90 ? 7 * DAY : DAY;
  const count = Math.ceil((data.days * DAY) / size);
  return Array.from({ length: count }, (_, i) => {
    const from = start + i * size;
    return { from, to: from + size, label: dayFmt.format(new Date(from)), long: size === DAY ? dayFmt.format(new Date(from)) : `Week of ${dayFmt.format(new Date(from))}` };
  });
}

export function countSeries(rows: AnalyticsRow[], data: AnalyticsDataset, offsetMs = 0): number[] {
  return buckets(data).map((b) => rows.filter((r) => {
    const t = new Date(r.t).getTime() + offsetMs;
    return t >= b.from && t < b.to;
  }).length);
}

/* ── pivots ──────────────────────────────────────────────────────────── */

export type Dimension = "category" | "suburb" | "channel" | "status" | "severity" | "weekday" | "hour" | "month" | "loss";
export type Measure = "reports" | "loss" | "medianLoss" | "verified" | "hours" | "withLoss";

export const DIMENSIONS: { value: Dimension; label: string }[] = [
  { value: "category", label: "Scam type" },
  { value: "suburb", label: "Suburb" },
  { value: "channel", label: "Channel" },
  { value: "status", label: "Status" },
  { value: "severity", label: "Severity" },
  { value: "weekday", label: "Day of week" },
  { value: "hour", label: "Time of day" },
  { value: "month", label: "Month" },
  { value: "loss", label: "Amount lost" },
];

export const MEASURES: { value: Measure; label: string; additive: boolean }[] = [
  { value: "reports", label: "Reports", additive: true },
  { value: "loss", label: "Money lost", additive: true },
  { value: "medianLoss", label: "Median loss (where lost)", additive: false },
  { value: "withLoss", label: "Share with money lost", additive: false },
  { value: "verified", label: "Verified rate", additive: false },
  { value: "hours", label: "Median hours to decide", additive: false },
];

export function dimensionValue(row: AnalyticsRow, dimension: Dimension, categoryName: Record<string, string>): string {
  switch (dimension) {
    case "category": return row.c ? (categoryName[row.c] ?? row.c) : "Uncategorised";
    case "suburb": return row.s ?? "No suburb given";
    case "channel": return CHANNEL_NAME[row.ch] ?? row.ch;
    case "status": return STATUS_NAME[row.st] ?? row.st;
    case "severity": return row.sv ? (SEVERITY_NAME[row.sv] ?? row.sv) : "Not yet rated";
    case "weekday": return weekday(row.t);
    case "hour": return HOUR_BLOCKS[hourBlock(row.t)]!;
    case "month": return monthFmt.format(new Date(row.t));
    case "loss": return lossBand(row.l);
  }
}

/** Orders a dimension's values the way a reader expects: time in time order, bands in band order, the rest by size. */
export function orderValues(dimension: Dimension, entries: [string, number][]): [string, number][] {
  const fixed = dimension === "weekday" ? WEEKDAYS : dimension === "hour" ? HOUR_BLOCKS : dimension === "loss" ? LOSS_BANDS : null;
  if (fixed) return [...entries].sort((a, b) => fixed.indexOf(a[0]) - fixed.indexOf(b[0]));
  if (dimension === "month") return entries;
  return [...entries].sort((a, b) => b[1] - a[1]);
}

export function measure(rows: AnalyticsRow[], m: Measure): number {
  switch (m) {
    case "reports": return rows.length;
    case "loss": return rows.reduce((sum, r) => sum + r.l, 0) / 100;
    case "medianLoss": return (median(rows.filter((r) => r.l > 0).map((r) => r.l)) ?? 0) / 100;
    case "withLoss": return rows.length ? (rows.filter((r) => r.l > 0).length / rows.length) * 100 : 0;
    case "verified": {
      const decided = rows.filter((r) => r.st === "APPROVED" || r.st === "REJECTED");
      return decided.length ? (decided.filter((r) => r.st === "APPROVED").length / decided.length) * 100 : 0;
    }
    case "hours": return median(rows.map((r) => r.d).filter((d): d is number => d !== null)) ?? 0;
  }
}

export function group(rows: AnalyticsRow[], dimension: Dimension, categoryName: Record<string, string>): Map<string, AnalyticsRow[]> {
  const out = new Map<string, AnalyticsRow[]>();
  for (const row of rows) {
    const key = dimensionValue(row, dimension, categoryName);
    const list = out.get(key);
    if (list) list.push(row);
    else out.set(key, [row]);
  }
  return out;
}

/* ── insights: what changed, said in a sentence ─────────────────────── */

export interface Insight {
  id: string;
  tone: "up" | "down" | "info";
  title: string;
  detail: string;
  score: number;
  filter?: Partial<Filters>;
}

export function insights(current: AnalyticsRow[], previous: AnalyticsRow[], data: AnalyticsDataset, categoryName: Record<string, string>): Insight[] {
  const out: Insight[] = [];
  const period = `${data.days} days`;

  const compare = (dimension: "category" | "suburb" | "channel", noun: (v: string) => string, filterKey: keyof Filters, reverse?: Record<string, string>) => {
    const now = group(current, dimension, categoryName);
    const before = group(previous, dimension, categoryName);
    const keys = new Set([...now.keys(), ...before.keys()]);
    for (const key of keys) {
      const a = now.get(key)?.length ?? 0;
      const b = before.get(key)?.length ?? 0;
      /* Poisson-style surprise: how many "standard deviations" the change is. */
      const z = (a - b) / Math.sqrt(b + 1);
      if (a >= 3 && a >= b * 1.5 && z >= 1.5) {
        out.push({
          id: `${dimension}-up-${key}`,
          tone: "up",
          title: `${noun(key)} up ${b === 0 ? "from nothing" : `${Math.round(((a - b) / b) * 100)}%`}`,
          detail: `${a} reports in the last ${period}, against ${b} in the ${period} before.`,
          score: z,
          filter: { [filterKey]: reverse ? (reverse[key] ?? key) : key },
        });
      } else if (b >= 4 && a <= b * 0.5 && z <= -1.5) {
        out.push({
          id: `${dimension}-down-${key}`,
          tone: "down",
          title: `${noun(key)} down ${Math.round(((b - a) / b) * 100)}%`,
          detail: `${a} reports in the last ${period}, against ${b} before — possibly the effect of an alert, or a campaign moving on.`,
          score: Math.abs(z) * 0.7,
          filter: { [filterKey]: reverse ? (reverse[key] ?? key) : key },
        });
      }
    }
  };

  const slugByName = Object.fromEntries(Object.entries(categoryName).map(([slug, name]) => [name, slug]));
  const channelByName = Object.fromEntries(Object.entries(CHANNEL_NAME).map(([code, name]) => [name, code]));
  compare("category", (v) => `${v} reports`, "category", slugByName);
  compare("suburb", (v) => `Reports from ${v}`, "suburb");
  compare("channel", (v) => `Scams by ${v.toLowerCase()}`, "channel", channelByName);

  const loss = group(current.filter((r) => r.l > 0), "category", categoryName);
  const worst = [...loss.entries()].map(([k, rows]) => [k, rows.reduce((s, r) => s + r.l, 0)] as const).sort((a, b) => b[1] - a[1])[0];
  if (worst && worst[1] > 0) {
    const total = current.reduce((s, r) => s + r.l, 0);
    out.push({ id: "loss-leader", tone: "info", title: `${worst[0]} accounts for ${Math.round((worst[1] / total) * 100)}% of money lost`, detail: `$${Math.round(worst[1] / 100).toLocaleString("en-AU")} of $${Math.round(total / 100).toLocaleString("en-AU")} reported lost in the last ${period}.`, score: 2.2, filter: { category: slugByName[worst[0]] } });
  }

  const cells = new Map<string, number>();
  for (const r of current) {
    const key = `${weekday(r.t)} ${HOUR_BLOCKS[hourBlock(r.t)]}`;
    cells.set(key, (cells.get(key) ?? 0) + 1);
  }
  const peak = [...cells.entries()].sort((a, b) => b[1] - a[1])[0];
  if (peak && peak[1] >= 3) out.push({ id: "peak", tone: "info", title: `Busiest time to be targeted: ${peak[0]}`, detail: `${peak[1]} reports arrived in that window — a good slot for awareness posts and alerts.`, score: 1.4 });

  const hoursNow = median(current.map((r) => r.d).filter((d): d is number => d !== null));
  const hoursBefore = median(previous.map((r) => r.d).filter((d): d is number => d !== null));
  if (hoursNow !== null && hoursBefore !== null && Math.abs(hoursNow - hoursBefore) >= 6) {
    out.push({
      id: "speed",
      tone: hoursNow < hoursBefore ? "down" : "up",
      title: `Decisions are ${hoursNow < hoursBefore ? "faster" : "slower"}: ${Math.round(hoursNow)}h median`,
      detail: `Against ${Math.round(hoursBefore)}h in the ${period} before.${hoursNow > hoursBefore ? " Worth checking the queue and who is carrying it." : ""}`,
      score: 1.6,
    });
  }

  return out.sort((a, b) => b.score - a.score).slice(0, 8);
}

export function toCsv(columns: string[], rows: (string | number)[][]): string {
  const escape = (value: string | number) => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [columns, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}
