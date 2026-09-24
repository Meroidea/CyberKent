import { useState, type ReactNode } from "react";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * The console's charts, drawn in plain HTML.
 *
 * Every chart here is a single series of one measure — reports — so each takes
 * the accent alone, needs no legend (its heading names it), and writes its
 * values in text colours beside the mark rather than in the mark's colour.
 * Every value is also written as text or carried in an accessible name, so
 * nothing is known only from a bar's length.
 */

/** A headline number. Not a chart: one figure is better said than plotted. */
export function StatTile({
  label,
  value,
  detail,
  tone = "default",
  loading = false,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "default" | "attention" | "good";
  loading?: boolean;
}) {
  return (
    <div className="rounded-ui bg-ui-card px-4 py-3.5">
      <p className="text-[0.8125rem] leading-tight text-ui-label-2">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-[1.75rem] font-semibold leading-none tabular-nums tracking-tight",
          tone === "attention" ? "text-amber-600 dark:text-amber-300" : tone === "good" ? "text-emerald-600 dark:text-emerald-300" : "text-ui-label",
        )}
      >
        {loading ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-ui-fill" /> : value}
      </p>
      {detail ? <p className="mt-1.5 text-[0.75rem] leading-snug text-ui-label-3">{detail}</p> : null}
    </div>
  );
}

/**
 * Ranked magnitudes — categories, suburbs, channels. Horizontal, because the
 * labels are words and a word reads along a bar, not under it.
 */
export function BarList({
  rows,
  empty = "Nothing in this period.",
  max: maxRows = 8,
  onSelect,
}: {
  rows: { key: string; label: string; count: number; note?: string; rising?: boolean }[];
  empty?: string;
  max?: number;
  onSelect?: (key: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const top = Math.max(1, ...rows.map((row) => row.count));
  const shown = expanded ? rows : rows.slice(0, maxRows);

  if (rows.length === 0) {
    return <p className="px-4 py-5 text-center text-[0.875rem] text-ui-label-2">{empty}</p>;
  }

  return (
    <div className="px-4 py-3">
      <ul className="flex flex-col gap-2.5">
        {shown.map((row) => {
          const body = (
            <>
              <span className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-1.5 text-[0.875rem] text-ui-label">
                  <span className="truncate">{row.label}</span>
                  {row.rising ? (
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-px text-[0.6875rem] font-semibold text-amber-700 dark:text-amber-300">
                      <TrendingUp aria-hidden="true" className="h-3 w-3" />
                      Rising
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-[0.875rem] font-semibold tabular-nums text-ui-label">
                  {row.count}
                  {row.note ? <span className="ml-1.5 font-normal text-ui-label-3">{row.note}</span> : null}
                </span>
              </span>
              <span aria-hidden="true" className="mt-1 block h-1.5 overflow-hidden rounded-full bg-ui-fill">
                <span className="block h-full rounded-full bg-ui-tint transition-[width] duration-500" style={{ width: `${(row.count / top) * 100}%` }} />
              </span>
            </>
          );

          return (
            <li key={row.key}>
              {onSelect ? (
                <button type="button" onClick={() => onSelect(row.key)} className="-mx-2 block w-[calc(100%+1rem)] rounded-lg px-2 py-1 text-left transition-colors hover:bg-ui-fill">
                  {body}
                </button>
              ) : (
                <div className="py-1">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      {rows.length > maxRows ? (
        <button type="button" onClick={() => setExpanded((open) => !open)} className="mt-2 text-[0.8125rem] font-medium text-ui-tint hover:opacity-70">
          {expanded ? "Show fewer" : `Show all ${rows.length}`}
        </button>
      ) : null}
    </div>
  );
}

const DAY_LABEL = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" });

/**
 * Reports over time: one bar per day (or per week, over a year).
 *
 * Bars rather than a line, because these are counts of discrete reports in
 * discrete buckets — a line would draw a value between Tuesday and Wednesday
 * that does not exist. Every bar takes focus and shows its own count, and the
 * tallest is labelled so the scale is legible without a gridline per step.
 */
export function Timeline({ points, bucket }: { points: { date: string; count: number }[]; bucket: "day" | "week" }) {
  const [active, setActive] = useState<number | null>(null);
  const top = Math.max(1, ...points.map((point) => point.count));
  const peak = points.findIndex((point) => point.count === top);
  const shown = active ?? peak;
  const label = (date: string) => `${bucket === "week" ? "Week of " : ""}${DAY_LABEL.format(new Date(`${date}T00:00:00`))}`;

  return (
    <div className="px-4 pb-3 pt-4">
      <div className="flex items-baseline justify-between gap-3 pb-3">
        <p className="text-[0.8125rem] text-ui-label-2" aria-live="polite">
          {points[shown] ? (
            <>
              <span className="font-semibold tabular-nums text-ui-label">{points[shown].count}</span> report{points[shown].count === 1 ? "" : "s"} · {label(points[shown].date)}
              {active === null ? <span className="text-ui-label-3"> (busiest)</span> : null}
            </>
          ) : null}
        </p>
      </div>

      <div className="relative">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-ui-separator" />
        <span aria-hidden="true" className="absolute -top-2 right-0 bg-ui-card pl-1 text-[0.6875rem] tabular-nums text-ui-label-3">
          {top}
        </span>

        <div className="flex h-32 items-end gap-[2px]" onMouseLeave={() => setActive(null)} role="group" aria-label="Reports per period">
          {points.map((point, index) => (
            <button
              key={point.date}
              type="button"
              tabIndex={index === shown ? 0 : -1}
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  const next = Math.min(points.length - 1, Math.max(0, index + (event.key === "ArrowRight" ? 1 : -1)));
                  (event.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
                }
              }}
              aria-label={`${label(point.date)}: ${point.count} report${point.count === 1 ? "" : "s"}`}
              className="group flex h-full min-w-0 flex-1 items-end focus:outline-none"
            >
              <span
                className={cn(
                  "block w-full rounded-t-[4px] transition-colors duration-150",
                  point.count === 0 ? "h-[2px] bg-ui-fill-strong" : index === shown ? "bg-ui-tint" : "bg-ui-tint opacity-45 group-hover:opacity-100",
                  "group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-ui-tint",
                )}
                style={point.count === 0 ? undefined : { height: `${Math.max(4, (point.count / top) * 100)}%` }}
              />
            </button>
          ))}
        </div>
      </div>

      <div aria-hidden="true" className="mt-2 flex justify-between text-[0.6875rem] text-ui-label-3">
        <span>{points[0] ? label(points[0].date) : ""}</span>
        <span>{points.length > 2 ? label(points[Math.floor(points.length / 2)]!.date) : ""}</span>
        <span>{points.length > 1 ? label(points[points.length - 1]!.date) : ""}</span>
      </div>
    </div>
  );
}

/** Parts of a whole as one segmented bar, each segment labelled underneath. */
export function SplitBar({ parts }: { parts: { key: string; label: string; count: number; className: string }[] }) {
  const total = parts.reduce((sum, part) => sum + part.count, 0);

  if (total === 0) {
    return <p className="px-4 py-5 text-center text-[0.875rem] text-ui-label-2">Nothing in this period.</p>;
  }

  return (
    <div className="px-4 py-4">
      <div className="flex h-2.5 gap-[2px] overflow-hidden rounded-full" aria-hidden="true">
        {parts
          .filter((part) => part.count > 0)
          .map((part) => (
            <span key={part.key} className={cn("h-full first:rounded-l-full last:rounded-r-full", part.className)} style={{ width: `${(part.count / total) * 100}%` }} title={`${part.label}: ${part.count}`} />
          ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {parts.map((part) => (
          <li key={part.key} className="flex items-center gap-2 text-[0.8125rem] text-ui-label-2">
            <span aria-hidden="true" className={cn("h-2 w-2 shrink-0 rounded-full", part.className)} />
            <span className="min-w-0 truncate">{part.label}</span>
            <span className="ml-auto font-semibold tabular-nums text-ui-label">{part.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
