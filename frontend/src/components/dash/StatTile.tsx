import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { CountUp } from "@/components/dash/CountUp";
import { cn } from "@/lib/cn";

/**
 * One headline figure: what it is, how many, and which way it is moving.
 *
 * `delta` compares with the previous period. Whether up is good depends on the
 * figure — more verified scams caught is good, more overdue tasks is not — so
 * the caller says which, and the badge is coloured by meaning, not direction.
 */
export function StatTile({
  icon: Icon,
  label,
  value,
  tint,
  delta,
  hint,
  to,
  emphasis,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | undefined;
  tint: string;
  delta?: { change: number; upIsGood: boolean; against: string };
  hint?: ReactNode;
  to?: string;
  /** Tints the figure itself, for a number that is asking for action. */
  emphasis?: string;
}) {
  const body = (
    <>
      <span aria-hidden="true" className={cn("pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-[0.12] blur-2xl", tint)} />
      <span className="flex items-center gap-2.5">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110", tint)}>
          <Icon className="h-[1.125rem] w-[1.125rem]" />
        </span>
        <span className="text-[0.8125rem] font-medium leading-tight text-ui-label-2">{label}</span>
      </span>
      <span className={cn("mt-4 block text-[2rem] font-semibold leading-none tracking-[-0.02em] text-ui-label", emphasis)}>
        {value === undefined ? <span className="inline-block h-8 w-12 animate-pulse rounded-lg bg-ui-fill align-middle" /> : <CountUp value={value} />}
      </span>
      <span className="mt-3 flex min-h-[1.25rem] items-center gap-2 text-[0.75rem] text-ui-label-2">
        {delta && Number.isFinite(delta.change) ? <DeltaBadge {...delta} /> : null}
        {hint}
      </span>
    </>
  );

  const shell = "ck-card group relative block overflow-hidden rounded-2xl bg-ui-card p-4";
  return to ? (
    <Link to={to} className={cn(shell, "ck-lift")}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}

function DeltaBadge({ change, upIsGood, against }: { change: number; upIsGood: boolean; against: string }) {
  const up = change >= 0;
  const good = up === upIsGood;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[0.6875rem] font-semibold",
        change === 0 ? "bg-ui-fill text-ui-label-2" : good ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 text-rose-700 dark:text-rose-300",
      )}
      title={`Compared with ${against}`}
    >
      <Arrow className="h-3 w-3" aria-hidden="true" />
      {Math.abs(Math.round(change))}%
      <span className="sr-only"> {up ? "up" : "down"} compared with {against}</span>
    </span>
  );
}
