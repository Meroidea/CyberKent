import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion, useInView } from "framer-motion";
import { cn } from "@/lib/cn";

export type Accent = "indigo" | "cyan" | "emerald" | "amber" | "rose" | "violet";

/** Status colours are fixed site-wide: emerald safe, amber caution, rose threat. */
export const ACCENT_TEXT: Record<Accent, string> = {
  indigo: "text-indigo-500",
  cyan: "text-cyan-500",
  emerald: "text-emerald-500",
  amber: "text-amber-500",
  rose: "text-rose-500",
  violet: "text-violet-500",
};

export const ACCENT_BG: Record<Accent, string> = {
  indigo: "bg-indigo-500",
  cyan: "bg-cyan-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
};

export const ACCENT_GRADIENT: Record<Accent, string> = {
  indigo: "from-indigo-500 to-indigo-400",
  cyan: "from-cyan-500 to-sky-400",
  emerald: "from-emerald-500 to-teal-400",
  amber: "from-amber-500 to-orange-400",
  rose: "from-rose-500 to-pink-400",
  violet: "from-violet-500 to-fuchsia-400",
};

interface PanelProps {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Console sub-surface: uppercase tracked header, optional meta slot, body. */
export function Panel({ title, meta, children, className }: PanelProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.03]",
        className,
      )}
    >
      <header className="mb-2.5 flex items-center justify-between gap-2">
        <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {title}
        </h4>
        {meta ? <div className="text-[10px] font-medium text-slate-400">{meta}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function LiveDot({ accent = "emerald" }: { accent?: Accent }) {
  return (
    <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
      <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-70", ACCENT_BG[accent])} />
      <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", ACCENT_BG[accent])} />
    </span>
  );
}

export function Chip({
  children,
  accent = "indigo",
}: {
  children: ReactNode;
  accent?: Accent;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium dark:border-white/10",
        ACCENT_TEXT[accent],
      )}
    >
      {children}
    </span>
  );
}

interface AnimatedNumberProps {
  value: number;
  /** Decimal places to display. */
  precision?: number;
  suffix?: string;
}

/** Counts up once the console scrolls into view. */
export function AnimatedNumber({ value, precision = 0, suffix = "" }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) {
      return;
    }

    const controls = animate(0, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(latest),
    });

    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref} className="font-mono tabular-nums">
      {display.toFixed(precision)}
      {suffix}
    </span>
  );
}

/** Deterministic pseudo-random series so the sparkline is stable across renders. */
export function seededSeries(seed: number, length: number): number[] {
  let state = seed;

  return Array.from({ length }, () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  });
}

export function Sparkline({ seed, accent = "indigo" }: { seed: number; accent?: Accent }) {
  const points = seededSeries(seed, 16);
  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 26 - point * 22;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-7 w-full" aria-hidden="true">
      <motion.path
        d={path}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("stroke-current", ACCENT_TEXT[accent])}
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
    </svg>
  );
}

interface MetricProps {
  label: string;
  value: number;
  precision?: number;
  suffix?: string;
  accent?: Accent;
  seed: number;
}

export function Metric({ label, value, precision, suffix, accent = "indigo", seed }: MetricProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
        <AnimatedNumber value={value} precision={precision} suffix={suffix} />
      </p>
      <Sparkline seed={seed} accent={accent} />
    </div>
  );
}

interface RingGaugeProps {
  label: string;
  value: number;
  accent?: Accent;
}

export function RingGauge({ label, value, accent = "emerald" }: RingGaugeProps) {
  const circumference = 2 * Math.PI * 26;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            strokeWidth={5}
            className="stroke-slate-200 dark:stroke-white/10"
          />
          <motion.circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            className={cn("stroke-current", ACCENT_TEXT[accent])}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: circumference * (1 - value / 100) }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-semibold text-slate-900 dark:text-white">
          <AnimatedNumber value={value} />
        </span>
      </div>
      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}
