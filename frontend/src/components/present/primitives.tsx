import { useCallback, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { DECK_ICONS } from "@/components/present/icons";
import { DecryptedText } from "@/components/ui/DecryptedText";
import { GradientText } from "@/components/ui/GradientText";
import { StrokeFillText } from "@/components/ui/StrokeFillText";

/**
 * The deck's shared vocabulary.
 *
 * Sizes here are absolute rather than drawn from the site's fluid type scale.
 * The scale is built on `clamp()` with `vw` terms, which resolve against the
 * viewport — and a slide is not laid out against the viewport. It is laid out
 * inside a fixed 1280×720 stage that `PresentationDeck` then scales as a whole,
 * so a `vw`-derived size would grow while the box around it did not. Fixed
 * lengths inside the stage are what keep every slide composed at every size.
 */

export const STAGE_WIDTH = 1280;
export const STAGE_HEIGHT = 720;

/** Tone names used across the slides, mapped once so a colour never drifts. */
export const TONE = {
  good: {
    text: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-500",
    soft: "bg-emerald-500/10 border-emerald-500/30",
  },
  warn: {
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-500",
    soft: "bg-amber-500/10 border-amber-500/30",
  },
  bad: {
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500",
    soft: "bg-rose-500/10 border-rose-500/30",
  },
  accent: {
    text: "text-indigo-600 dark:text-cyan-400",
    bg: "bg-indigo-500 dark:bg-cyan-400",
    soft: "bg-indigo-500/10 border-indigo-500/30 dark:bg-cyan-400/10 dark:border-cyan-400/30",
  },
  idle: {
    text: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-300 dark:bg-slate-600",
    soft: "bg-slate-500/10 border-slate-400/30",
  },
} as const;

export type Tone = keyof typeof TONE;

const EASE = [0.22, 1, 0.36, 1] as const;

/** Staggered entrance for a slide's own contents, once the slide is in place. */
const body = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

export const rise = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

/** Clauses a deck headline is made of, and therefore settles to wait for. */
const HEADLINE_CLAUSES = 2;

/**
 * A slide headline, animated exactly as the landing page's are.
 *
 * Two effects in order: the line resolves out of its cipher as an outline, and
 * is inked in once both clauses have stopped changing. Settles are counted
 * rather than flagged — the clauses are separate reveals of unequal length, and
 * the shorter one finishing is not the headline finishing.
 */
export function Headline({
  lead,
  accent,
  className,
}: {
  lead: string;
  accent: string;
  className?: string;
}) {
  const [settled, setSettled] = useState(0);
  const noteSettled = useCallback(() => setSettled((count) => count + 1), []);

  return (
    <StrokeFillText start={settled >= HEADLINE_CLAUSES} className={className}>
      <DecryptedText text={lead} onSettle={noteSettled} />{" "}
      <GradientText>
        <DecryptedText text={accent} delay={200} onSettle={noteSettled} />
      </GradientText>
    </StrokeFillText>
  );
}

/** One slide. Every slide is this frame plus a composition inside it. */
export function Slide({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow?: string;
  title?: { lead: string; accent: string };
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      variants={body}
      initial="hidden"
      animate="visible"
      className={cn("flex h-full w-full flex-col px-14 py-11", className)}
    >
      {eyebrow || title ? (
        <motion.header variants={rise} className="mb-6 shrink-0">
          {eyebrow ? (
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-indigo-600 dark:text-cyan-400">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h2 className="mt-1.5 font-display text-[40px] font-bold leading-[1.06] tracking-[-0.025em]">
              <Headline lead={title.lead} accent={title.accent} className="display-depth" />
            </h2>
          ) : null}
        </motion.header>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </motion.section>
  );
}

/** A panel. The deck's only container, so panels cannot drift apart. */
export function Panel({
  children,
  className,
  tone,
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        tone
          ? TONE[tone].soft
          : "border-slate-900/[0.07] bg-white/55 dark:border-white/10 dark:bg-white/[0.04]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A small all-caps label above a block. */
export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "font-mono text-[9.5px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** A figure and what it counts. The deck's workhorse. */
export function Stat({
  value,
  label,
  tone = "accent",
  size = "md",
}: {
  value: string;
  label: string;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
}) {
  const scale = { sm: "text-[24px]", md: "text-[34px]", lg: "text-[58px]" }[size];

  return (
    <div>
      <p
        className={cn(
          "font-display font-bold leading-none tracking-[-0.03em] tabular-nums",
          scale,
          TONE[tone].text,
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[10.5px] leading-snug text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

/** An identifier pill — FR73, ER-2, OI-4. */
export function Tag({
  children,
  tone = "accent",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide",
        TONE[tone].soft,
        TONE[tone].text,
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * An icon on a gradient chip. The one decorative element repeated across slides,
 * so a set of things always reads as a set.
 */
export function Glyph({ icon, size = 32 }: { icon: string; size?: number }) {
  const Icon = DECK_ICONS[icon];

  return (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500 text-white dark:from-indigo-500 dark:to-cyan-400 dark:text-slate-950"
    >
      {Icon ? <Icon style={{ width: size * 0.5, height: size * 0.5 }} aria-hidden="true" /> : null}
    </span>
  );
}

/** Icon, one word, one code. A set member with nothing to read. */
export function Tile({
  icon,
  title,
  meta,
  className,
}: {
  icon: string;
  title: string;
  meta?: string;
  className?: string;
}) {
  return (
    <Panel className={cn("flex flex-col items-start gap-2", className)}>
      <Glyph icon={icon} />
      <p className="font-display text-[16px] font-bold leading-tight text-slate-900 dark:text-white">
        {title}
      </p>
      {meta ? (
        <p className="mt-auto font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-cyan-400">
          {meta}
        </p>
      ) : null}
    </Panel>
  );
}

/**
 * A proportional ring that draws itself.
 *
 * One circle per segment with `stroke-dasharray` shares of the circumference —
 * a dash offset expresses "a share of a whole" directly. Each arc sweeps in on
 * arrival, so the proportion is watched being formed rather than presented
 * already settled; under reduced motion it is simply there.
 */
export function Donut({
  segments,
  size = 150,
  caption,
}: {
  segments: { label: string; value: number; tone: Tone }[];
  size?: number;
  caption?: string;
}) {
  const reduced = useReducedMotion();
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const stroke = size * 0.14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${caption ?? "Total"} ${total}: ${segments.map((s) => `${s.value} ${s.label}`).join(", ")}`}
      >
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {segments.map((segment, index) => {
            const length = (segment.value / total) * circumference;
            const start = offset;
            offset += length;

            return (
              <motion.circle
                key={segment.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={stroke}
                strokeDashoffset={-start}
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray: `${length} ${circumference - length}` }}
                transition={{
                  duration: reduced ? 0 : 0.8,
                  delay: reduced ? 0 : 0.3 + index * 0.14,
                  ease: EASE,
                }}
                className={cn("[stroke:currentColor]", TONE[segment.tone].text)}
              />
            );
          })}
        </g>
        <text
          x="50%"
          y="47%"
          textAnchor="middle"
          className="fill-slate-900 font-display text-[30px] font-bold dark:fill-white"
        >
          {total}
        </text>
        <text
          x="50%"
          y="61%"
          textAnchor="middle"
          className="fill-slate-400 font-mono text-[8.5px] font-bold uppercase tracking-[0.18em] dark:fill-slate-500"
        >
          {caption ?? "total"}
        </text>
      </svg>

      <ul className="flex flex-col gap-2">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-start gap-2">
            <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-sm", TONE[segment.tone].bg)} />
            <span>
              <span className={cn("font-display text-[17px] font-bold tabular-nums", TONE[segment.tone].text)}>
                {segment.value}
              </span>
              <span className="ml-1.5 text-[10.5px] text-slate-500 dark:text-slate-400">{segment.label}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A count, drawn as that many marks.
 *
 * The claim on the conformance slide is that nothing was dropped, and a number
 * asserts that while a field of seventy-two lit cells shows it. They arrive in a
 * sweep so the eye is carried across the whole field rather than taking in a
 * finished block.
 */
export function DotGrid({
  count,
  columns,
  tone = "good",
}: {
  count: number;
  columns: number;
  tone?: Tone;
}) {
  const reduced = useReducedMotion();

  return (
    <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {Array.from({ length: count }, (_, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: reduced ? 0 : 0.3,
            delay: reduced ? 0 : 0.25 + index * 0.008,
            ease: EASE,
          }}
          className={cn("h-2.5 rounded-[2px]", TONE[tone].bg, "opacity-80")}
        />
      ))}
    </div>
  );
}

/** A closing line across the foot of a slide. */
export function Footline({
  children,
  tone,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <motion.p
      variants={rise}
      className={cn(
        "shrink-0 rounded-xl border-l-[3px] px-4 py-2.5 text-[12.5px] leading-snug",
        tone
          ? cn(TONE[tone].soft, "text-slate-700 dark:text-slate-200")
          : "border-l-indigo-500 bg-indigo-500/[0.07] text-slate-700 dark:border-l-cyan-400 dark:bg-cyan-400/[0.07] dark:text-slate-200",
        className,
      )}
    >
      {children}
    </motion.p>
  );
}
