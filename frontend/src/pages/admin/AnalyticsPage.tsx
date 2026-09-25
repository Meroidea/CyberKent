import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, BarChart3, Download, Info, Sparkles } from "lucide-react";
import { StatTile } from "@/components/council/Charts";
import { FilterSelect } from "@/components/council/Filters";
import { useLoad } from "@/components/council/useLoad";
import { ChartFrame, CompareLines, HBars, Heatmap, SERIES, MUTED, StackedColumns, type SeriesDef } from "@/components/admin/viz";
import { FormAlert } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SegmentedControl } from "@/components/settings/SegmentedControl";
import { ROUTES } from "@/config/site";
import { analyticsApi } from "@/lib/admin/api";
import {
  CHANNEL_NAME,
  DIMENSIONS,
  HOUR_BLOCKS,
  LOSS_BANDS,
  MEASURES,
  WEEKDAYS,
  buckets,
  countSeries,
  dimensionValue,
  group,
  hourBlock,
  insights as findInsights,
  kpis,
  lossBand,
  measure,
  orderValues,
  split,
  toCsv,
  weekday,
  type Dimension,
  type Filters,
  type Kpis,
  type Measure,
} from "@/lib/admin/analytics";
import type { AnalyticsDataset } from "@/lib/admin/types";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/council/labels";
import { formatRelative } from "@/lib/report/labels";

const PERIODS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "180", label: "6 months" },
  { value: "365", label: "Year" },
] as const;

const TABS = [
  { value: "visualise", label: "Visualise" },
  { value: "explore", label: "Explore" },
  { value: "insights", label: "Insights" },
] as const;

const EMPTY: Filters = { category: "", suburb: "", channel: "" };
const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);
const money = (cents: number) => formatMoney(cents / 100, true);

function delta(now: number | null, before: number | null, { invert = false, unit = "" }: { invert?: boolean; unit?: string } = {}) {
  if (now === null || before === null) return undefined;
  const diff = now - before;
  if (Math.abs(diff) < 1e-9) return "No change on the period before";
  const better = invert ? diff < 0 : diff > 0;
  const Icon = diff > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5", better ? "text-emerald-600 dark:text-emerald-300" : "text-amber-600 dark:text-amber-300")}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {unit === "%" ? `${diff > 0 ? "+" : ""}${Math.round(diff * 100)} pts` : before === 0 ? "new" : `${diff > 0 ? "+" : ""}${Math.round((diff / Math.abs(before)) * 100)}%`} on the period before
    </span>
  );
}

/**
 * Council's data analyser and visualiser.
 *
 * One dataset, three ways in: dashboards that answer the standing questions,
 * an explorer that answers any other by pivoting two dimensions against a
 * measure, and insights the page finds for itself — what is up, what is down,
 * where the money went. Every chart reads as a table too, and anything shown
 * can be downloaded.
 */
export function AnalyticsPage() {
  const [days, setDays] = useState<(typeof PERIODS)[number]["value"]>("90");
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("visualise");
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const { data, error, loading } = useLoad((signal) => analyticsApi.dataset(Number(days), signal), days);

  const categoryName = useMemo(() => Object.fromEntries((data?.categories ?? []).map((c) => [c.slug, c.name])), [data]);
  const view = useMemo(() => (data ? split(data, filters) : null), [data, filters]);
  const now = useMemo(() => (view ? kpis(view.current) : null), [view]);
  const before = useMemo(() => (view ? kpis(view.previous) : null), [view]);
  const alertsNow = data ? data.alerts.filter((a) => new Date(a.t) >= new Date(data.periodStart) && (!filters.category || a.c === filters.category)).length : 0;
  const alertsBefore = data ? data.alerts.filter((a) => new Date(a.t) < new Date(data.periodStart) && (!filters.category || a.c === filters.category)).length : 0;
  const filtered = Boolean(filters.category || filters.suburb || filters.channel);

  return (
    <ConsoleLayout title="Analytics" subtitle="Where scams hit Hume, how much they cost, and how Council is keeping up." wide>
      <ConsoleHero icon={BarChart3} tint="bg-gradient-to-br from-sky-500 to-indigo-600">
        <p>Everything here compares the chosen period with the one before it. Figures are counts of reports, never of people, and no screen here shows a reporter's details.</p>
      </ConsoleHero>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedControl label="Period" segments={PERIODS} value={days} onChange={setDays} className="lg:max-w-[28rem]" />
        {data ? <p className="text-[0.75rem] text-ui-label-3">{data.rows.length.toLocaleString("en-AU")} reports loaded · {formatRelative(data.generatedAt)}</p> : null}
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-ui bg-ui-card p-3">
        <FilterSelect label="Scam type" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
          <option value="">All scam types</option>
          {(data?.categories ?? []).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </FilterSelect>
        <FilterSelect label="Suburb" value={filters.suburb} onChange={(e) => setFilters((f) => ({ ...f, suburb: e.target.value }))}>
          <option value="">All suburbs</option>
          {(data?.suburbs ?? []).map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
        </FilterSelect>
        <FilterSelect label="Channel" value={filters.channel} onChange={(e) => setFilters((f) => ({ ...f, channel: e.target.value }))}>
          <option value="">All channels</option>
          {Object.entries(CHANNEL_NAME).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
        </FilterSelect>
        {filtered ? <button type="button" onClick={() => setFilters(EMPTY)} className="rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold text-ui-tint hover:bg-ui-fill">Clear filters</button> : null}
      </div>

      {error ? <FormAlert tone="error">{error.message}</FormAlert> : null}

      <section aria-label="Headline figures" className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatTile label="Reports" value={now?.reports ?? 0} loading={!now} detail={delta(now?.reports ?? null, before?.reports ?? null, { invert: true })} />
        <StatTile label="Money lost" value={now ? money(now.lossCents) : "—"} loading={!now} detail={delta(now?.lossCents ?? null, before?.lossCents ?? null, { invert: true })} />
        <StatTile label="Verified rate" value={pct(now?.verifiedRate ?? null)} loading={!now} detail={delta(now?.verifiedRate ?? null, before?.verifiedRate ?? null, { unit: "%" })} />
        <StatTile label="Median time to decide" value={now?.medianHours != null ? `${Math.round(now.medianHours)}h` : "—"} loading={!now} detail={delta(now?.medianHours ?? null, before?.medianHours ?? null, { invert: true })} />
        <StatTile label="With money lost" value={pct(now?.withLossRate ?? null)} loading={!now} detail={delta(now?.withLossRate ?? null, before?.withLossRate ?? null, { invert: true, unit: "%" })} />
        <StatTile label="Alerts published" value={alertsNow} loading={!data} detail={data ? delta(alertsNow, alertsBefore) : undefined} />
      </section>

      <SegmentedControl label="View" segments={TABS} value={tab} onChange={setTab} className="sm:max-w-[26rem]" />

      {loading && !data ? (
        <div className="grid gap-3 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-64 animate-pulse rounded-ui bg-ui-card" />)}</div>
      ) : data && view && now ? (
        tab === "visualise" ? (
          <Visualise data={data} current={view.current} previous={view.previous} categoryName={categoryName} now={now} onFilter={(f) => setFilters((current) => ({ ...current, ...f }))} filters={filters} />
        ) : tab === "explore" ? (
          <Explore current={view.current} categoryName={categoryName} days={Number(days)} />
        ) : (
          <InsightList data={data} current={view.current} previous={view.previous} categoryName={categoryName} onFilter={(f) => { setFilters((current) => ({ ...current, ...f })); setTab("visualise"); }} />
        )
      ) : null}
    </ConsoleLayout>
  );
}

/* ── Visualise: the standing questions ───────────────────────────────── */

function Visualise({
  data,
  current,
  previous,
  categoryName,
  now,
  onFilter,
  filters,
}: {
  data: AnalyticsDataset;
  current: AnalyticsDataset["rows"];
  previous: AnalyticsDataset["rows"];
  categoryName: Record<string, string>;
  now: Kpis;
  onFilter: (f: Partial<Filters>) => void;
  filters: Filters;
}) {
  const bucketList = buckets(data);
  const currentSeries = countSeries(current, data);
  const previousSeries = countSeries(previous, data, data.days * 86_400_000);

  /* Top five scam types by volume keep their colour; the rest fold into Other. */
  const byCategory = [...group(current, "category", categoryName).entries()].sort((a, b) => b[1].length - a[1].length);
  const top = byCategory.slice(0, 5).map(([name]) => name);
  const series: SeriesDef[] = [...top.map((name, i) => ({ key: name, label: name, color: SERIES[i]! })), ...(byCategory.length > 5 ? [{ key: "__other", label: "Other", color: MUTED }] : [])];
  const stacked = bucketList.map((b) => {
    const values: Record<string, number> = {};
    for (const row of current) {
      const t = new Date(row.t).getTime();
      if (t < b.from || t >= b.to) continue;
      const name = dimensionValue(row, "category", categoryName);
      const key = top.includes(name) ? name : "__other";
      values[key] = (values[key] ?? 0) + 1;
    }
    return { label: b.label, long: b.long, values };
  });

  const suburbs = [...group(current, "suburb", categoryName).entries()].map(([name, rows]) => ({ key: name, label: name, value: rows.length })).sort((a, b) => b.value - a.value);
  const channels = [...group(current, "channel", categoryName).entries()].map(([name, rows]) => ({ key: name, label: name, value: rows.length })).sort((a, b) => b.value - a.value);
  const lossByCategory = byCategory.map(([name, rows]) => ({ key: name, label: name, value: rows.reduce((s, r) => s + r.l, 0) / 100 })).filter((r) => r.value > 0).sort((a, b) => b.value - a.value);

  const heat = WEEKDAYS.map((day) => HOUR_BLOCKS.map((_, block) => current.filter((r) => weekday(r.t) === day && hourBlock(r.t) === block).length));
  const bands = LOSS_BANDS.map((band) => ({ key: band, label: band, value: current.filter((r) => lossBand(r.l) === band).length }));

  const decided = current.filter((r) => r.st === "APPROVED" || r.st === "REJECTED").length;
  const verified = current.filter((r) => r.st === "APPROVED").length;
  const withdrawn = current.filter((r) => r.st === "WITHDRAWN").length;
  const pipeline = [
    { key: "received", label: "Received", value: current.length - withdrawn },
    { key: "picked", label: "Picked up by an officer", value: current.filter((r) => r.st !== "SUBMITTED" && r.st !== "WITHDRAWN").length },
    { key: "decided", label: "Decided", value: decided },
    { key: "verified", label: "Verified as a scam", value: verified },
  ];
  const categorySlug = Object.fromEntries(Object.entries(categoryName).map(([slug, name]) => [name, slug]));

  return (
    <div className="flex flex-col gap-3">
      <ChartFrame
        title="Reports over time"
        subtitle={`${now.reports} in this period, against ${previous.length} in the one before (dashed)`}
        legend={[{ key: "now", label: "This period", color: "var(--viz-1)" }, { key: "before", label: "Previous period", color: MUTED }]}
        table={{ columns: ["Period", "This period", "Previous"], rows: bucketList.map((b, i) => [b.long, currentSeries[i] ?? 0, previousSeries[i] ?? 0]) }}
      >
        <CompareLines current={currentSeries} previous={previousSeries} labels={bucketList.map((b) => b.long)} />
      </ChartFrame>

      <ChartFrame
        title="What kind of scam"
        subtitle="The five most reported types keep their colour; the rest are grouped as Other"
        legend={series}
        table={{ columns: ["Period", ...series.map((s) => s.label)], rows: stacked.map((b) => [b.long ?? b.label, ...series.map((s) => b.values[s.key] ?? 0)]) }}
      >
        <StackedColumns buckets={stacked} series={series} />
      </ChartFrame>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartFrame title="Where in Hume" subtitle="Select a suburb to filter everything by it" table={{ columns: ["Suburb", "Reports"], rows: suburbs.map((r) => [r.label, r.value]) }}>
          <HBars rows={suburbs} selected={filters.suburb || null} onSelect={(name) => onFilter({ suburb: filters.suburb === name || name === "No suburb given" ? "" : name })} />
        </ChartFrame>
        <ChartFrame title="How it reached them" table={{ columns: ["Channel", "Reports"], rows: channels.map((r) => [r.label, r.value]) }}>
          <HBars rows={channels} color="var(--viz-2)" />
        </ChartFrame>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartFrame title="When scams arrive" subtitle="Day and time of reports, Melbourne time" table={{ columns: ["Day", ...HOUR_BLOCKS], rows: WEEKDAYS.map((d, i) => [d, ...heat[i]!]) }}>
          <Heatmap rows={WEEKDAYS} columns={HOUR_BLOCKS.map((b) => b.replace("–", "-"))} values={heat} format={(n) => `${n} report${n === 1 ? "" : "s"}`} />
        </ChartFrame>
        <ChartFrame title="How much people lost" subtitle={`${pct(now.withLossRate)} of reports involved a loss`} table={{ columns: ["Amount", "Reports"], rows: bands.map((b) => [b.label, b.value]) }}>
          <HBars rows={bands} color="var(--viz-5)" max={5} />
        </ChartFrame>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartFrame title="Money lost by scam type" subtitle="Select a type to filter everything by it" table={{ columns: ["Scam type", "Lost (AUD)"], rows: lossByCategory.map((r) => [r.label, Math.round(r.value)]) }}>
          <HBars rows={lossByCategory} color="var(--viz-3)" format={(n) => formatMoney(n, true)} onSelect={(name) => onFilter({ category: filters.category === categorySlug[name] ? "" : (categorySlug[name] ?? "") })} selected={filters.category ? categoryName[filters.category] : null} />
        </ChartFrame>
        <ChartFrame title="Council's pipeline" subtitle="How far this period's reports have travelled" table={{ columns: ["Stage", "Reports"], rows: pipeline.map((r) => [r.label, r.value]) }}>
          <HBars rows={pipeline} color="var(--viz-1)" format={(n) => `${n}`} />
          <p className="flex items-start gap-1.5 text-[0.75rem] text-ui-label-3">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {pipeline[0]!.value - pipeline[1]!.value} still waiting to be picked up. <Link to={`${ROUTES.councilQueue}`} className="font-semibold text-ui-tint hover:underline">Open the queue</Link>
          </p>
        </ChartFrame>
      </div>
    </div>
  );
}

/* ── Explore: any question, pivoted ──────────────────────────────────── */

function Explore({ current, categoryName, days }: { current: AnalyticsDataset["rows"]; categoryName: Record<string, string>; days: number }) {
  const [rowsBy, setRowsBy] = useState<Dimension>("category");
  const [splitBy, setSplitBy] = useState<Dimension | "">("");
  const [metric, setMetric] = useState<Measure>("reports");
  const def = MEASURES.find((m) => m.value === metric)!;
  const format = (n: number) => (metric === "loss" || metric === "medianLoss" ? formatMoney(n, true) : metric === "verified" || metric === "withLoss" ? `${Math.round(n)}%` : metric === "hours" ? `${Math.round(n)}h` : String(Math.round(n)));

  const primary = orderValues(rowsBy, [...group(current, rowsBy, categoryName).entries()].map(([k, rows]) => [k, rows.length] as [string, number]));
  const groups = group(current, rowsBy, categoryName);
  const secondKeys = splitBy ? orderValues(splitBy, [...group(current, splitBy, categoryName).entries()].map(([k, rows]) => [k, rows.length] as [string, number])).map(([k]) => k) : [];
  const shownKeys = secondKeys.slice(0, 5);
  const folded = secondKeys.length > 5;
  const series: SeriesDef[] = [...shownKeys.map((k, i) => ({ key: k, label: k, color: SERIES[i]! })), ...(folded ? [{ key: "__other", label: "Other", color: MUTED }] : [])];

  const table = primary.map(([key]) => {
    const rows = groups.get(key) ?? [];
    if (!splitBy) return { key, total: measure(rows, metric), cells: {} as Record<string, number> };
    const inner = group(rows, splitBy, categoryName);
    const cells: Record<string, number> = {};
    for (const k of shownKeys) cells[k] = measure(inner.get(k) ?? [], metric);
    if (folded) cells.__other = measure(secondKeys.slice(5).flatMap((k) => inner.get(k) ?? []), metric);
    return { key, total: measure(rows, metric), cells };
  });

  const columns = [DIMENSIONS.find((d) => d.value === rowsBy)!.label, ...series.map((s) => s.label), splitBy ? "All" : def.label];
  const tableRows = table.map((row) => [row.key, ...series.map((s) => format(row.cells[s.key] ?? 0)), format(row.total)]);

  const download = () => {
    const csv = toCsv(columns, table.map((row) => [row.key, ...series.map((s) => Math.round((row.cells[s.key] ?? 0) * 100) / 100), Math.round(row.total * 100) / 100]));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `cyberkent-${metric}-by-${rowsBy}${splitBy ? `-and-${splitBy}` : ""}-${days}d.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2 rounded-ui bg-ui-card p-3">
        <FilterSelect label="Measure" value={metric} onChange={(e) => setMetric(e.target.value as Measure)}>
          {MEASURES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </FilterSelect>
        <FilterSelect label="By" value={rowsBy} onChange={(e) => setRowsBy(e.target.value as Dimension)}>
          {DIMENSIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </FilterSelect>
        <FilterSelect label="Split by" value={splitBy} onChange={(e) => setSplitBy(e.target.value as Dimension | "")}>
          <option value="">Nothing</option>
          {DIMENSIONS.filter((d) => d.value !== rowsBy).map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </FilterSelect>
        <button type="button" onClick={download} className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-ui-fill px-3 py-1.5 text-[0.8125rem] font-semibold text-ui-tint hover:bg-ui-fill-strong">
          <Download className="h-4 w-4" aria-hidden="true" />Download CSV
        </button>
      </div>

      <ChartFrame
        title={`${def.label} by ${DIMENSIONS.find((d) => d.value === rowsBy)!.label.toLowerCase()}${splitBy ? ` and ${DIMENSIONS.find((d) => d.value === splitBy)!.label.toLowerCase()}` : ""}`}
        subtitle={splitBy && !def.additive ? "This measure does not add up across a split, so it is shown as a table." : `${current.length} reports in the period`}
        legend={splitBy && def.additive ? series : undefined}
        table={{ columns, rows: tableRows }}
      >
        {splitBy && def.additive ? (
          <StackedColumns buckets={table.map((row) => ({ label: row.key.length > 12 ? `${row.key.slice(0, 11)}…` : row.key, long: row.key, values: row.cells }))} series={series} format={format} height={240} />
        ) : splitBy ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[0.8125rem]">
              <thead><tr>{columns.map((c, i) => <th key={c} scope="col" className={cn("border-b border-ui-separator px-3 py-2 font-semibold text-ui-label-2", i > 0 && "text-right")}>{c}</th>)}</tr></thead>
              <tbody>{tableRows.map((row) => <tr key={row[0]} className="odd:bg-ui-fill/40">{row.map((cell, i) => <td key={i} className={cn("px-3 py-1.5", i > 0 && "text-right tabular-nums")}>{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
        ) : (
          <HBars rows={table.map((row) => ({ key: row.key, label: row.key, value: row.total }))} format={format} max={25} />
        )}
      </ChartFrame>
    </div>
  );
}

/* ── Insights: what the data says without being asked ───────────────── */

function InsightList({ data, current, previous, categoryName, onFilter }: { data: AnalyticsDataset; current: AnalyticsDataset["rows"]; previous: AnalyticsDataset["rows"]; categoryName: Record<string, string>; onFilter: (f: Partial<Filters>) => void }) {
  const found = findInsights(current, previous, data, categoryName);
  if (found.length === 0) {
    return <p className="rounded-ui bg-ui-card px-4 py-10 text-center text-[0.9375rem] text-ui-label-2">Nothing stands out against the period before — steady is good news.</p>;
  }
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {found.map((insight) => {
        const Icon = insight.tone === "up" ? ArrowUpRight : insight.tone === "down" ? ArrowDownRight : Sparkles;
        return (
          <li key={insight.id} className="flex flex-col gap-2 rounded-ui bg-ui-card p-4">
            <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", insight.tone === "up" ? "bg-rose-500/12 text-rose-600 dark:text-rose-300" : insight.tone === "down" ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300" : "bg-sky-500/12 text-sky-600 dark:text-sky-300")}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="text-[1rem] font-semibold leading-snug text-ui-label">{insight.title}</p>
            <p className="text-[0.875rem] text-ui-label-2">{insight.detail}</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-1">
              {insight.filter ? <button type="button" onClick={() => onFilter(insight.filter!)} className="rounded-full bg-ui-fill px-3 py-1 text-[0.8125rem] font-semibold text-ui-tint hover:bg-ui-fill-strong">Show me</button> : null}
              <Link
                to={`${ROUTES.councilTasks}?${new URLSearchParams({ new: "1", title: `Follow up: ${insight.title}`.slice(0, 140), description: insight.detail, labels: "insight" }).toString()}`}
                className="rounded-full bg-ui-fill px-3 py-1 text-[0.8125rem] font-semibold text-ui-label-2 hover:bg-ui-fill-strong"
              >
                Make it a task
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
