import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Table2 } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * The admin panel's charts, drawn in plain SVG and HTML.
 *
 * Built to the data-viz rules the console follows: categorical colours come
 * from `--viz-1…6` in a fixed order (validated against the card surface in
 * light and dark), magnitude uses the one-hue `--viz-seq-*` ramp, marks are
 * thin with a 2px surface gap between neighbours, and every mark answers a
 * hover or keyboard focus with a tooltip. Text never wears a series colour —
 * the swatch beside it carries identity — and every chart can be read as a
 * table, which also covers the three light-mode hues below 3:1 contrast.
 */

export const SERIES = ["var(--viz-1)", "var(--viz-2)", "var(--viz-3)", "var(--viz-4)", "var(--viz-5)", "var(--viz-6)"] as const;
export const MUTED = "var(--viz-muted)";
export const SEQ = ["var(--viz-seq-0)", "var(--viz-seq-1)", "var(--viz-seq-2)", "var(--viz-seq-3)", "var(--viz-seq-4)", "var(--viz-seq-5)", "var(--viz-seq-6)", "var(--viz-seq-7)"] as const;

export interface SeriesDef {
  key: string;
  label: string;
  color: string;
}

/* ── tooltip ──────────────────────────────────────────────────────────── */

interface TipState {
  x: number;
  y: number;
  content: ReactNode;
}

/** One floating tooltip per chart, positioned inside the chart's own box. */
function useTip() {
  const box = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TipState | null>(null);

  const at = (event: { clientX: number; clientY: number } | { currentTarget: Element }, content: ReactNode) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    if ("clientX" in event) {
      setTip({ x: event.clientX - rect.left, y: event.clientY - rect.top, content });
    } else {
      const mark = event.currentTarget.getBoundingClientRect();
      setTip({ x: mark.left - rect.left + mark.width / 2, y: mark.top - rect.top, content });
    }
  };

  const layer = tip ? (
    <div
      role="status"
      className="pointer-events-none absolute z-20 max-w-[16rem] -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-lg bg-ui-card px-3 py-2 text-[0.75rem] leading-snug text-ui-label shadow-lg ring-1 ring-ui-separator"
      style={{ left: Math.max(60, Math.min(tip.x, (box.current?.clientWidth ?? 0) - 60)), top: tip.y }}
    >
      {tip.content}
    </div>
  ) : null;

  return { box, at, clear: () => setTip(null), layer };
}

export function TipRow({ color, label, value }: { color?: string; label: ReactNode; value: ReactNode }) {
  return (
    <span className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-ui-label-2">
        {color ? <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-sm" style={{ background: color }} /> : null}
        {label}
      </span>
      <span className="font-semibold tabular-nums text-ui-label">{value}</span>
    </span>
  );
}

/* ── frame: title, legend, table toggle ───────────────────────────────── */

export function ChartFrame({
  title,
  subtitle,
  legend,
  table,
  children,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  legend?: SeriesDef[];
  table?: { columns: string[]; rows: (string | number)[][] };
  children: ReactNode;
  action?: ReactNode;
}) {
  const [asTable, setAsTable] = useState(false);
  const id = useId();

  return (
    <figure className="flex flex-col gap-3 rounded-ui bg-ui-card p-4" aria-labelledby={id}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <figcaption id={id} className="text-[0.9375rem] font-semibold text-ui-label">{title}</figcaption>
          {subtitle ? <p className="mt-0.5 text-[0.8125rem] text-ui-label-2">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {action}
          {table ? (
            <button
              type="button"
              onClick={() => setAsTable((v) => !v)}
              aria-pressed={asTable}
              className="inline-flex items-center gap-1.5 rounded-full bg-ui-fill px-2.5 py-1 text-[0.75rem] font-medium text-ui-label-2 hover:text-ui-label"
            >
              <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
              {asTable ? "Chart" : "Table"}
            </button>
          ) : null}
        </div>
      </div>
      {legend && legend.length > 1 && !asTable ? <Legend items={legend} /> : null}
      {asTable && table ? <DataTable columns={table.columns} rows={table.rows} /> : children}
    </figure>
  );
}

export function Legend({ items }: { items: SeriesDef[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Legend">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5 text-[0.75rem] text-ui-label-2">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function DataTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  return (
    <div className="max-h-[22rem] overflow-auto rounded-lg ring-1 ring-ui-separator">
      <table className="w-full text-left text-[0.8125rem]">
        <thead className="sticky top-0 bg-ui-card">
          <tr>
            {columns.map((column, i) => (
              <th key={column} scope="col" className={cn("border-b border-ui-separator px-3 py-2 font-semibold text-ui-label-2", i > 0 && "text-right")}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="odd:bg-ui-fill/40">
              {row.map((cell, i) => (
                <td key={i} className={cn("px-3 py-1.5 text-ui-label", i > 0 && "text-right tabular-nums")}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── sparkline: one series, no axes — a shape, not a reading ─────────── */

export function Sparkline({ values, label, className }: { values: number[]; label: string; className?: string }) {
  const max = Math.max(1, ...values);
  const w = 120;
  const h = 32;
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const points = values.map((v, i) => `${(i * step).toFixed(1)},${(h - 3 - (v / max) * (h - 6)).toFixed(1)}`).join(" ");
  const last = values[values.length - 1] ?? 0;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-8 w-[7.5rem]", className)} role="img" aria-label={`${label}: ${values.join(", ")} per day`} preserveAspectRatio="none">
      <polyline points={`0,${h} ${points} ${w},${h}`} fill="var(--viz-1)" fillOpacity={0.12} stroke="none" />
      <polyline points={points} fill="none" stroke="var(--viz-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={(values.length - 1) * step} cy={h - 3 - (last / max) * (h - 6)} r={2.5} fill="var(--viz-1)" />
    </svg>
  );
}

/* ── stacked columns over time ───────────────────────────────────────── */

export function StackedColumns({
  buckets,
  series,
  format = (n) => String(n),
  height = 200,
}: {
  buckets: { label: string; long?: string; values: Record<string, number> }[];
  series: SeriesDef[];
  format?: (n: number) => string;
  height?: number;
}) {
  const { box, at, clear, layer } = useTip();
  const totals = buckets.map((b) => series.reduce((sum, s) => sum + (b.values[s.key] ?? 0), 0));
  const max = Math.max(1, ...totals);
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1]!;
  const labelEvery = Math.ceil(buckets.length / 8);

  return (
    <div ref={box} className="relative" onMouseLeave={clear}>
      <div className="flex gap-2">
        <div className="flex flex-col justify-between pb-5 text-right text-[0.6875rem] tabular-nums text-ui-label-3" style={{ height }}>
          {[...ticks].reverse().map((t) => <span key={t} className="leading-none">{format(t)}</span>)}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: height - 20 }} aria-hidden="true">
            {ticks.map((t) => <div key={t} className="border-t border-ui-separator/60" />)}
          </div>
          <div className="relative flex items-end gap-[2px]" style={{ height: height - 20 }}>
            {buckets.map((bucket, b) => (
              <button
                key={bucket.label + b}
                type="button"
                className="group flex h-full flex-1 flex-col-reverse items-stretch gap-[2px] focus:outline-none"
                aria-label={`${bucket.long ?? bucket.label}: ${series.map((s) => `${s.label} ${format(bucket.values[s.key] ?? 0)}`).join(", ")}`}
                onMouseMove={(event) =>
                  at(event, (
                    <span className="flex min-w-[9rem] flex-col gap-1">
                      <span className="font-semibold">{bucket.long ?? bucket.label}</span>
                      {series.filter((s) => (bucket.values[s.key] ?? 0) > 0).map((s) => <TipRow key={s.key} color={s.color} label={s.label} value={format(bucket.values[s.key] ?? 0)} />)}
                      <TipRow label="Total" value={format(totals[b]!)} />
                    </span>
                  ))
                }
                onFocus={(event) => at(event, <TipRow label={bucket.long ?? bucket.label} value={format(totals[b]!)} />)}
                onBlur={clear}
              >
                {series.map((s, i) => {
                  const value = bucket.values[s.key] ?? 0;
                  if (value <= 0) return null;
                  const last = series.slice(i + 1).every((later) => (bucket.values[later.key] ?? 0) <= 0);
                  return (
                    <span
                      key={s.key}
                      className={cn("block w-full transition-opacity group-hover:opacity-90 group-focus-visible:ring-2 group-focus-visible:ring-ui-tint", last && "rounded-t-[4px]")}
                      style={{ height: `${(value / top) * 100}%`, background: s.color, minHeight: 2 }}
                    />
                  );
                })}
              </button>
            ))}
          </div>
          <div className="mt-1 flex gap-[2px] text-[0.6875rem] text-ui-label-3" aria-hidden="true">
            {buckets.map((bucket, b) => <span key={b} className="flex-1 truncate text-center">{b % labelEvery === 0 ? bucket.label : ""}</span>)}
          </div>
        </div>
      </div>
      {layer}
    </div>
  );
}

/* ── two lines on one axis: this period against the one before ───────── */

export function CompareLines({
  current,
  previous,
  labels,
  currentLabel = "This period",
  previousLabel = "Previous period",
  height = 180,
}: {
  current: number[];
  previous: number[];
  labels: string[];
  currentLabel?: string;
  previousLabel?: string;
  height?: number;
}) {
  const { box, at, clear, layer } = useTip();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...current, ...previous);
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1]!;
  const w = 600;
  const h = height;
  const n = Math.max(current.length, 2);
  const x = (i: number) => (i / (n - 1)) * w;
  const y = (v: number) => h - (v / top) * (h - 8) - 4;
  const path = (values: number[]) => values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  return (
    <div ref={box} className="relative">
      <div className="flex gap-2">
        <div className="flex flex-col justify-between text-right text-[0.6875rem] tabular-nums text-ui-label-3" style={{ height: h }}>
          {[...ticks].reverse().map((t) => <span key={t} className="leading-none">{t}</span>)}
        </div>
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          className="h-auto w-full flex-1 overflow-visible"
          style={{ height: h }}
          role="img"
          aria-label={`${currentLabel}: ${current.reduce((a, b) => a + b, 0)} in total; ${previousLabel}: ${previous.reduce((a, b) => a + b, 0)}`}
          onMouseLeave={() => { setHover(null); clear(); }}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const i = Math.round(((event.clientX - rect.left) / rect.width) * (n - 1));
            const index = Math.max(0, Math.min(n - 1, i));
            setHover(index);
            at(event, (
              <span className="flex min-w-[9rem] flex-col gap-1">
                <span className="font-semibold">{labels[index]}</span>
                <TipRow color="var(--viz-1)" label={currentLabel} value={current[index] ?? 0} />
                <TipRow color={MUTED} label={previousLabel} value={previous[index] ?? 0} />
              </span>
            ));
          }}
        >
          {ticks.map((t) => <line key={t} x1={0} x2={w} y1={y(t)} y2={y(t)} stroke="var(--ui-separator)" strokeWidth={1} vectorEffect="non-scaling-stroke" />)}
          <path d={path(previous)} fill="none" stroke={MUTED} strokeWidth={2} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
          <path d={path(current)} fill="none" stroke="var(--viz-1)" strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {hover !== null ? (
            <>
              <line x1={x(hover)} x2={x(hover)} y1={0} y2={h} stroke="var(--ui-label-3)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
              <circle cx={x(hover)} cy={y(current[hover] ?? 0)} r={4} fill="var(--viz-1)" stroke="var(--ui-card)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            </>
          ) : null}
        </svg>
      </div>
      {layer}
    </div>
  );
}

/* ── ranked horizontal bars: one measure, words as labels ─────────────── */

export function HBars({
  rows,
  format = (n) => String(n),
  color = "var(--viz-1)",
  onSelect,
  selected,
  max: cap = 10,
}: {
  rows: { key: string; label: string; value: number; note?: string }[];
  format?: (n: number) => string;
  color?: string;
  onSelect?: (key: string) => void;
  selected?: string | null;
  max?: number;
}) {
  const { box, at, clear, layer } = useTip();
  const shown = rows.slice(0, cap);
  const max = Math.max(1, ...shown.map((r) => r.value));
  if (shown.length === 0) return <p className="py-6 text-center text-[0.875rem] text-ui-label-2">Nothing in this selection.</p>;

  return (
    <div ref={box} className="relative" onMouseLeave={clear}>
      <ul className="flex flex-col gap-1.5">
        {shown.map((row) => (
          <li key={row.key}>
            <button
              type="button"
              disabled={!onSelect}
              onClick={() => onSelect?.(row.key)}
              onMouseMove={(event) => at(event, <TipRow color={color} label={row.label} value={format(row.value)} />)}
              onFocus={(event) => at(event, <TipRow color={color} label={row.label} value={format(row.value)} />)}
              onBlur={clear}
              className={cn("grid w-full grid-cols-[minmax(6rem,11rem)_1fr_auto] items-center gap-3 rounded-md px-1 py-0.5 text-left", onSelect && "hover:bg-ui-fill", selected === row.key && "bg-ui-fill ring-1 ring-ui-tint")}
            >
              <span className="truncate text-[0.8125rem] text-ui-label">{row.label}</span>
              <span className="h-3 rounded-r-[4px] bg-ui-fill">
                <span className="block h-3 rounded-r-[4px]" style={{ width: `${Math.max(1.5, (row.value / max) * 100)}%`, background: color }} />
              </span>
              <span className="min-w-[3.5rem] text-right text-[0.8125rem] tabular-nums text-ui-label-2">
                {format(row.value)}
                {row.note ? <span className="ml-1 text-ui-label-3">{row.note}</span> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {layer}
    </div>
  );
}

/* ── heatmap: two dimensions, one magnitude, one hue ─────────────────── */

export function Heatmap({
  rows,
  columns,
  values,
  format = (n) => String(n),
  cell = "1.75rem",
}: {
  rows: string[];
  columns: string[];
  values: number[][];
  format?: (n: number) => string;
  cell?: string;
}) {
  const { box, at, clear, layer } = useTip();
  const max = Math.max(1, ...values.flat());
  const shade = (v: number) => (v <= 0 ? SEQ[0] : SEQ[Math.min(7, 1 + Math.floor((v / max) * 6.999))]);

  return (
    <div ref={box} className="relative overflow-x-auto" onMouseLeave={clear}>
      <table className="border-separate border-spacing-[2px] text-[0.6875rem]">
        <thead>
          <tr>
            <th />
            {columns.map((c) => <th key={c} scope="col" className="px-0.5 font-normal text-ui-label-3">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={row}>
              <th scope="row" className="whitespace-nowrap pr-2 text-right font-normal text-ui-label-2">{row}</th>
              {columns.map((column, c) => {
                const v = values[r]?.[c] ?? 0;
                return (
                  <td key={column} className="p-0">
                    <button
                      type="button"
                      aria-label={`${row}, ${column}: ${format(v)}`}
                      onMouseMove={(event) => at(event, <TipRow color={shade(v)} label={`${row} · ${column}`} value={format(v)} />)}
                      onFocus={(event) => at(event, <TipRow color={shade(v)} label={`${row} · ${column}`} value={format(v)} />)}
                      onBlur={clear}
                      className="block rounded-[3px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-tint"
                      style={{ width: cell, height: cell, background: shade(v) }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex items-center gap-1.5 text-[0.6875rem] text-ui-label-3" aria-hidden="true">
        <span>Fewer</span>
        {SEQ.map((c) => <span key={c} className="h-2.5 w-4 rounded-sm" style={{ background: c }} />)}
        <span>More</span>
      </div>
      {layer}
    </div>
  );
}

/* ── helpers ──────────────────────────────────────────────────────────── */

/** Four to six round axis ticks from zero. */
export function niceTicks(max: number): number[] {
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let t = 0; t <= max + step * 0.001 || ticks.length < 2; t += step) ticks.push(Math.round(t * 100) / 100);
  if (ticks[ticks.length - 1]! < max) ticks.push(ticks[ticks.length - 1]! + step);
  return ticks;
}

export function useSeries(keys: string[], labels: Record<string, string>, otherLabel = "Other"): SeriesDef[] {
  return useMemo(
    () => keys.map((key, i) => ({ key, label: key === "__other" ? otherLabel : (labels[key] ?? key), color: key === "__other" ? MUTED : SERIES[i % SERIES.length]! })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keys.join("|"), otherLabel],
  );
}
