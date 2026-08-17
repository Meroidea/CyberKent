import { type ReactElement } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Ban, Check, CheckCircle2, ShieldCheck, TriangleAlert } from "lucide-react";
import {
  BASELINE,
  BUILD,
  CONFORMANCE,
  COVER,
  DECISIONS,
  DECK_META,
  ENHANCED,
  ETHICS,
  POSITION,
  PROBLEM,
  SERVICE,
} from "@/content/presentation";
import {
  Donut,
  DotGrid,
  Footline,
  Glyph,
  Headline,
  Label,
  Panel,
  Slide,
  Stat,
  Tag,
  Tile,
  TONE,
  rise,
  type Tone,
} from "@/components/present/primitives";
import { DECK_OUTLINE, type SlideEntry } from "@/components/present/manifest";
import { cn } from "@/lib/cn";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ── 1 ────────────────────────────────────────────────────────────────────── */

/**
 * The cover.
 *
 * The emblem is the scanner's globe reduced to two dimensions: concentric rings
 * with one sweeping arm and four contacts on them, so the mark reads as a thing
 * that *looks* rather than a badge that certifies — the distinction ETH-1 spends
 * the rest of the document defending.
 */
function CoverSlide() {
  return (
    <Slide>
      <div className="my-auto grid grid-cols-[1fr_340px] items-center gap-10">
        <motion.div variants={rise}>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-indigo-600 dark:text-cyan-400">
            {COVER.eyebrow}
          </p>

          <h1 className="mt-3 font-display text-[92px] font-bold leading-[0.92] tracking-[-0.05em]">
            <Headline
              lead={COVER.headline.lead}
              accent={COVER.headline.accent}
              className="display-depth"
            />
          </h1>

          <p className="mt-1 font-display text-[23px] font-bold leading-tight tracking-[-0.02em] text-slate-700 dark:text-slate-200">
            {DECK_META.subtitle}
          </p>

          <div className="mt-6 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {COVER.meta.map((item, index) => (
              <span key={item} className="flex items-center gap-2">
                {index > 0 ? <span className="h-1 w-1 rounded-full bg-indigo-400 dark:bg-cyan-400" /> : null}
                {item}
              </span>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-7">
            <div>
              <Label>{COVER.group}</Label>
              <div className="mt-2 flex items-center gap-2">
                {COVER.team.map((member) => (
                  <span
                    key={member.initials}
                    title={`${member.name} — ${member.role}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-500/25 bg-indigo-500/10 font-mono text-[11px] font-bold text-indigo-700 dark:border-cyan-400/25 dark:bg-cyan-400/10 dark:text-cyan-300"
                  >
                    {member.initials}
                  </span>
                ))}
              </div>
            </div>

            <div className="h-14 w-px bg-slate-900/10 dark:bg-white/10" />

            <div className="flex gap-8">
              {COVER.spine.map((item) => (
                <Stat key={item.label} value={item.value} label={item.label} />
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={rise} aria-hidden="true">
          <svg viewBox="0 0 300 300" className="w-full">
            <defs>
              <linearGradient id="deck-emblem" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            {[142, 116, 90, 64].map((r, index) => (
              <circle
                key={r}
                cx="150"
                cy="150"
                r={r}
                fill="none"
                stroke="url(#deck-emblem)"
                strokeWidth={index === 0 ? 1 : 0.75}
                strokeOpacity={0.18 + index * 0.1}
                strokeDasharray={index % 2 === 0 ? "2 7" : undefined}
              />
            ))}
            <circle
              cx="150"
              cy="150"
              r="142"
              fill="none"
              stroke="url(#deck-emblem)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="150 743"
              className="origin-center motion-safe:animate-[hud-spin_9s_linear_infinite]"
            />
            <circle
              cx="150"
              cy="150"
              r="104"
              fill="none"
              stroke="url(#deck-emblem)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="60 594"
              className="origin-center motion-safe:animate-[hud-spin-reverse_14s_linear_infinite]"
            />
            <circle cx="150" cy="150" r="46" fill="url(#deck-emblem)" fillOpacity="0.12" />
            <g transform="translate(150 150)">
              <ShieldCheck
                x="-28"
                y="-28"
                width="56"
                height="56"
                className="text-indigo-600 dark:text-cyan-400"
                strokeWidth={1.3}
              />
            </g>
            {/* Contacts on the rings, as if something had been found. */}
            {[
              [246, 108],
              [96, 62],
              [66, 196],
              [214, 234],
            ].map(([x, y], index) => (
              <motion.circle
                key={`${x}-${y}`}
                cx={x}
                cy={y}
                r="4"
                className="fill-cyan-500"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0.45, 1], scale: 1 }}
                transition={{ duration: 2.4, delay: 0.5 + index * 0.3, repeat: Infinity, repeatDelay: 1.4 }}
              />
            ))}
          </svg>
          <p className="text-center font-mono text-[9.5px] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
            {DECK_META.reference} · v{DECK_META.version} · {DECK_META.issued} · {COVER.status}
          </p>
        </motion.div>
      </div>
    </Slide>
  );
}

/* ── 2 ────────────────────────────────────────────────────────────────────── */

function ProblemSlide() {
  return (
    <Slide eyebrow={PROBLEM.eyebrow} title={PROBLEM.title}>
      <div className="grid min-h-0 flex-1 grid-cols-[360px_1fr] gap-8">
        <motion.div variants={rise} className="flex flex-col gap-3">
          <Panel className="flex items-end justify-between gap-2">
            {PROBLEM.place.map((item, index) => (
              <Stat
                key={item.label}
                value={item.value}
                label={item.label}
                size="sm"
                tone={index === 2 ? "bad" : "accent"}
              />
            ))}
          </Panel>

          <Label>Why Hume</Label>
          {PROBLEM.whyHume.map((item) => (
            <Panel key={item.title} className="flex flex-1 items-center gap-3">
              <Glyph icon={item.icon} size={30} />
              <span>
                <span className="block font-display text-[15px] font-bold leading-tight text-slate-900 dark:text-white">
                  {item.title}
                </span>
                <span className="mt-0.5 block font-mono text-[9.5px] uppercase tracking-[0.12em] text-indigo-600 dark:text-cyan-400">
                  {item.note}
                </span>
              </span>
            </Panel>
          ))}
        </motion.div>

        <motion.div variants={rise} className="flex min-h-0 flex-col">
          <Label>Six problems → the requirements that answer them</Label>
          <ul className="mt-2.5 flex flex-1 flex-col gap-2">
            {PROBLEM.problems.map((problem) => (
              <li
                key={problem.id}
                className="flex flex-1 items-center gap-3 rounded-xl border border-slate-900/[0.07] bg-white/55 px-4 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 font-mono text-[11px] font-bold text-rose-600 dark:text-rose-400">
                  {problem.id}
                </span>
                <span className="flex-1 text-[14px] font-semibold text-slate-800 dark:text-slate-100">
                  {problem.text}
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" aria-hidden="true" />
                <Tag>{problem.maps}</Tag>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <motion.div variants={rise} className="mt-5 flex shrink-0 items-center gap-3">
        <Label className="shrink-0">The result today</Label>
        {PROBLEM.consequence.map((item) => (
          <span
            key={item}
            className="flex-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center text-[12px] font-bold text-rose-600 dark:text-rose-400"
          >
            {item}
          </span>
        ))}
      </motion.div>
    </Slide>
  );
}

/* ── 3 ────────────────────────────────────────────────────────────────────── */

function ServiceSlide() {
  return (
    <Slide eyebrow={SERVICE.eyebrow} title={SERVICE.title}>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-8">
        <motion.div variants={rise} className="flex min-h-0 flex-col">
          <Label className="mb-2.5">For the community · no account</Label>
          <div className="grid flex-1 grid-cols-2 gap-2.5">
            {SERVICE.community.map((item) => (
              <Tile key={item.verb} icon={item.icon} title={item.verb} meta={item.maps} />
            ))}
          </div>
        </motion.div>

        <motion.div variants={rise} className="flex min-h-0 flex-col">
          <Label className="mb-2.5">For Council · the same platform</Label>
          <div className="grid flex-1 grid-cols-2 gap-2.5">
            {SERVICE.council.map((item) => (
              <Tile key={item.verb} icon={item.icon} title={item.verb} meta={item.maps} />
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div variants={rise} className="mt-5 grid shrink-0 grid-cols-[1fr_300px] gap-5">
        <Panel>
          <div className="flex items-center gap-3">
            <div className="flex flex-wrap gap-1.5">
              {SERVICE.existing.map((item) => (
                <span
                  key={item}
                  className="rounded-md border border-slate-900/10 px-2 py-1 text-[11px] text-slate-500 dark:border-white/10 dark:text-slate-400"
                >
                  {item}
                </span>
              ))}
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-indigo-500 dark:text-cyan-400" aria-hidden="true" />
            <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-[12.5px] font-bold text-indigo-700 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-300">
              {SERVICE.fills}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <Label className="shrink-0">Roles</Label>
            {SERVICE.roles.map((role) => (
              <span key={role} className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                {role}
              </span>
            ))}
          </div>
        </Panel>

        <Panel tone="bad">
          <Label>Out of scope</Label>
          <ul className="mt-1.5 grid grid-cols-2 gap-x-3">
            {SERVICE.outOfScope.map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-300">
                <Ban className="h-2.5 w-2.5 shrink-0 text-rose-500" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </Panel>
      </motion.div>
    </Slide>
  );
}

/* ── 4 ────────────────────────────────────────────────────────────────────── */

const ETH_TONE: Record<string, Tone> = {
  met: "good",
  partial: "warn",
  open: "bad",
  team: "accent",
};

function EthicsSlide() {
  return (
    <Slide eyebrow={ETHICS.eyebrow} title={ETHICS.title}>
      <motion.div variants={rise} className="grid shrink-0 grid-cols-3 gap-3">
        {ETHICS.commitments.map((item) => (
          <Panel key={item.title} className="flex items-center gap-3">
            <Glyph icon={item.icon} size={34} />
            <p className="font-display text-[19px] font-bold leading-tight text-slate-900 dark:text-white">
              {item.title}
            </p>
          </Panel>
        ))}
      </motion.div>

      <div className="mt-4 grid min-h-0 flex-1 grid-cols-[1fr_360px] gap-5">
        <motion.div variants={rise} className="flex min-h-0 flex-col gap-3">
          <ul className="grid grid-cols-3 gap-1.5">
            {ETHICS.register.map((item) => {
              const tone = ETH_TONE[item.state]!;
              return (
                <li key={item.id} className={cn("rounded-lg border px-2 py-1.5", TONE[tone].soft)}>
                  <span className={cn("font-mono text-[10px] font-bold", TONE[tone].text)}>{item.id}</span>
                  <span className="mt-0.5 block text-[10.5px] leading-snug text-slate-600 dark:text-slate-300">
                    {item.text}
                  </span>
                </li>
              );
            })}
          </ul>

          <Panel className="border-l-[3px] border-l-indigo-500 dark:border-l-cyan-400">
            <Label>{ETHICS.arithmetic.label}</Label>
            <p className="mt-1.5 font-mono text-[16px] font-bold text-slate-900 dark:text-white">
              {ETHICS.arithmetic.formula}
            </p>
            <p className="mt-1 text-[12px] font-semibold text-indigo-600 dark:text-cyan-400">
              {ETHICS.arithmetic.detail}
            </p>
          </Panel>
        </motion.div>

        <motion.div variants={rise}>
          <Panel className="h-full">
            <Label>{ETHICS.audit.label}</Label>
            <div className="mt-2.5">
              <Donut segments={[...ETHICS.audit.segments]} size={132} caption="risks" />
            </div>
            <p className="mt-2.5 rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-[10.5px] font-bold leading-snug text-rose-600 dark:text-rose-400">
              {ETHICS.audit.critical}
            </p>
          </Panel>
        </motion.div>
      </div>

      <motion.div variants={rise} className="mt-4 grid shrink-0 grid-cols-[1fr_300px] items-center gap-4">
        <p className="rounded-xl border-l-[3px] border-l-indigo-500 bg-indigo-500/[0.07] px-4 py-2.5 text-[12.5px] leading-snug text-slate-700 dark:border-l-cyan-400 dark:bg-cyan-400/[0.07] dark:text-slate-200">
          {ETHICS.asymmetry}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ETHICS.guards.map((guard) => (
            <span
              key={guard}
              className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400"
            >
              <Check className="h-2.5 w-2.5" aria-hidden="true" />
              {guard}
            </span>
          ))}
        </div>
      </motion.div>
    </Slide>
  );
}

/* ── 5 ────────────────────────────────────────────────────────────────────── */

function ConformanceSlide() {
  return (
    <Slide eyebrow={CONFORMANCE.eyebrow} title={CONFORMANCE.title}>
      <div className="grid min-h-0 flex-1 grid-cols-[320px_1fr] gap-6">
        <motion.div variants={rise} className="flex flex-col gap-3">
          <Panel tone="good" className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[54px] font-bold leading-none tracking-[-0.04em] text-emerald-600 dark:text-emerald-400">
                72
              </span>
              <span className="font-display text-[22px] font-bold text-slate-400 dark:text-slate-500">/ 72</span>
            </div>
            <p className="mt-2 text-[12px] font-semibold leading-snug text-slate-700 dark:text-slate-200">
              {CONFORMANCE.match.label}
            </p>
            <div className="mt-3.5">
              <DotGrid count={CONFORMANCE.match.total} columns={12} />
            </div>
          </Panel>

          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 px-4 py-3 text-white">
            <p className="font-display text-[30px] font-bold leading-none tracking-[-0.03em]">
              {CONFORMANCE.verdict.headline}
            </p>
            <p className="text-[11px] font-semibold leading-tight text-white/85">
              {CONFORMANCE.verdict.qualifier}
            </p>
          </div>
        </motion.div>

        <motion.div variants={rise} className="flex min-h-0 flex-col">
          <Label>Four requirements that could not be built as written</Label>
          <ul className="mt-2.5 flex flex-1 flex-col gap-2">
            {CONFORMANCE.defects.map((defect) => (
              <li
                key={defect.id}
                className="grid flex-1 grid-cols-[38px_1fr_18px_1fr] items-center gap-3 rounded-xl border border-slate-900/[0.07] bg-white/55 px-3.5 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <Tag tone={defect.severity === "high" ? "bad" : "warn"}>{defect.id}</Tag>
                <span className="text-[12.5px] leading-snug text-slate-400 line-through dark:text-slate-500">
                  {defect.was}
                </span>
                <ArrowRight className="h-4 w-4 text-indigo-500 dark:text-cyan-400" aria-hidden="true" />
                <span className="text-[12.5px] font-bold leading-snug text-slate-800 dark:text-slate-100">
                  {defect.now}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 grid shrink-0 grid-cols-4 gap-2">
            {CONFORMANCE.findings.map((finding) => (
              <Panel key={finding.title} className="flex items-center gap-2.5">
                <Glyph icon={finding.icon} size={28} />
                <span>
                  <span className="block font-display text-[22px] font-bold leading-none text-slate-900 dark:text-white">
                    {finding.count}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-semibold leading-tight text-slate-500 dark:text-slate-400">
                    {finding.title}
                  </span>
                </span>
              </Panel>
            ))}
          </div>
        </motion.div>
      </div>

      <Footline className="mt-4">{CONFORMANCE.line}</Footline>
    </Slide>
  );
}

/* ── 6 ────────────────────────────────────────────────────────────────────── */

function BaselineSlide() {
  return (
    <Slide eyebrow={BASELINE.eyebrow} title={BASELINE.title}>
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_340px] gap-6">
        <motion.div variants={rise} className="flex min-h-0 flex-col">
          <div className="grid flex-1 grid-cols-4 gap-2">
            {BASELINE.modules.map((module) => (
              <div
                key={module.n}
                className="flex flex-col justify-between rounded-xl border border-slate-900/[0.07] bg-white/55 p-2.5 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-display text-[19px] font-bold leading-none text-indigo-600 dark:text-cyan-400">
                    {String(module.n).padStart(2, "0")}
                  </span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider",
                      module.priority === "Must"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                    )}
                  >
                    {module.priority}
                  </span>
                </div>
                <p className="mt-2 text-[12px] font-bold leading-tight text-slate-800 dark:text-slate-100">
                  {module.name}
                </p>
                <p className="mt-1 font-mono text-[9.5px] text-slate-400 dark:text-slate-500">{module.range}</p>
              </div>
            ))}
          </div>

          <Panel className="mt-3 grid shrink-0 grid-cols-6 gap-3">
            {BASELINE.scaffold.map((item) => (
              <Stat key={item.label} value={item.value} label={item.label} size="sm" tone="idle" />
            ))}
          </Panel>
        </motion.div>

        <motion.div variants={rise} className="flex min-h-0 flex-col gap-3">
          <Panel>
            <Label>Non-functional, reconciled</Label>
            <div className="mt-2.5 flex items-center gap-3">
              <Stat value={String(BASELINE.nfr.client)} label="in the brief" size="sm" tone="idle" />
              <span className="font-display text-[20px] font-bold text-slate-300 dark:text-slate-600">+</span>
              <Stat value={String(BASELINE.nfr.added)} label="team-added" size="sm" tone="warn" />
              <span className="font-display text-[20px] font-bold text-slate-300 dark:text-slate-600">=</span>
              <Stat value={String(BASELINE.nfr.total)} label="specified" size="sm" />
            </div>
          </Panel>

          <ul className="flex min-h-0 flex-1 flex-col gap-1.5">
            {BASELINE.nfr.additions.map((item) => (
              <li
                key={item.id}
                className="flex flex-1 items-center gap-2 rounded-lg border border-slate-900/[0.07] bg-white/55 px-2.5 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <Tag tone="warn">{item.id}</Tag>
                <span className="text-[11.5px] font-semibold text-slate-800 dark:text-slate-100">{item.text}</span>
              </li>
            ))}
          </ul>

          <p className="shrink-0 font-mono text-[9.5px] uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
            {BASELINE.nfr.note}
          </p>
        </motion.div>
      </div>

      <Footline className="mt-4">{BASELINE.moscow}</Footline>
    </Slide>
  );
}

/* ── 7 ────────────────────────────────────────────────────────────────────── */

function EnhancedSlide() {
  return (
    <Slide eyebrow={ENHANCED.eyebrow} title={ENHANCED.title}>
      <motion.div
        variants={rise}
        className="flex shrink-0 items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2"
      >
        <TriangleAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-400">
          {ENHANCED.approval}
        </p>
      </motion.div>

      <div className="mt-4 grid min-h-0 flex-1 grid-cols-[1fr_330px] gap-6">
        <motion.div variants={rise} className="flex min-h-0 flex-col">
          <Panel className="flex shrink-0 items-end justify-between gap-2">
            {ENHANCED.counts.map((item) => (
              <Stat key={item.label} value={item.value} label={item.label} size="sm" tone={item.tone} />
            ))}
          </Panel>

          <ul className="mt-3 grid flex-1 grid-cols-4 gap-1.5">
            {ENHANCED.items.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "flex flex-col justify-center gap-0.5 rounded-lg border px-2 py-1",
                  item.done
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-slate-900/[0.07] bg-white/55 dark:border-white/10 dark:bg-white/[0.04]",
                )}
              >
                <span className="flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      "font-mono text-[11px] font-bold",
                      item.done ? "text-emerald-700 dark:text-emerald-400" : "text-indigo-600 dark:text-cyan-400",
                    )}
                  >
                    {item.id}
                  </span>
                  {item.done ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  ) : (
                    <span
                      className={cn(
                        "font-mono text-[8px] font-bold uppercase tracking-wider",
                        item.pri === "Must"
                          ? "text-rose-500"
                          : item.pri === "Should"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-slate-400",
                      )}
                    >
                      {item.pri}
                    </span>
                  )}
                </span>
                <span className="text-[10px] leading-tight text-slate-600 dark:text-slate-300">{item.text}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div variants={rise} className="flex min-h-0 flex-col">
          <Label>The four that carry the argument</Label>
          <ul className="mt-2 flex flex-1 flex-col gap-2">
            {ENHANCED.headline.map((item) => (
              <li key={item.id} className="flex-1">
                <Panel className="h-full border-l-[3px] border-l-indigo-500 dark:border-l-cyan-400">
                  <span className="flex items-center gap-2">
                    <Tag>{item.id}</Tag>
                    <span className="font-display text-[15px] font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </span>
                  </span>
                  <p className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400">{item.why}</p>
                </Panel>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <Footline tone="warn" className="mt-4">
        {ENHANCED.reduction}
      </Footline>
    </Slide>
  );
}

/* ── 8 ────────────────────────────────────────────────────────────────────── */

function BuildSlide() {
  const reduced = useReducedMotion();
  const peak = Math.max(...BUILD.engine.cases.map((item) => item.score), 100);

  return (
    <Slide eyebrow={BUILD.eyebrow} title={BUILD.title}>
      <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr] gap-5">
        {/* The ramp of hue down the stack is the depth: the nine steps a request
            passes through, in the order it meets them. */}
        <motion.div variants={rise} className="flex min-h-0 flex-col">
          <Label>Nine layers, none skippable</Label>
          <ol className="mt-2 flex flex-1 flex-col gap-[3px]">
            {BUILD.layers.map((layer, index) => (
              <motion.li
                key={layer.name}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: reduced ? 0 : 0.35, delay: reduced ? 0 : 0.2 + index * 0.05, ease: EASE }}
                className="flex min-h-0 flex-1 flex-col justify-center rounded-md border-l-[3px] px-2.5"
                style={{
                  borderLeftColor: `hsl(${243 - index * 7} 70% ${58 + index * 1.5}%)`,
                  background: `hsl(${243 - index * 7} 70% 58% / 0.07)`,
                }}
              >
                <span className="block text-[11.5px] font-bold leading-tight text-slate-800 dark:text-slate-100">
                  {layer.name}
                </span>
                <span className="block text-[9px] leading-tight text-slate-500 dark:text-slate-400">
                  {layer.detail}
                </span>
              </motion.li>
            ))}
          </ol>
        </motion.div>

        <motion.div variants={rise} className="flex min-h-0 flex-col gap-2.5">
          <div className="grid shrink-0 grid-cols-[minmax(0,330px)_1fr] gap-2.5">
            <Panel>
              <div className="flex items-baseline justify-between gap-2">
                <Label>Data model</Label>
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  <TriangleAlert className="h-2.5 w-2.5" aria-hidden="true" />
                  {BUILD.dataNote}
                </span>
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                {BUILD.data.map((item) => (
                  <Stat key={item.label} value={item.value} label={item.label} size="sm" />
                ))}
              </div>
            </Panel>

            <Panel>
              <Label>Defence in depth</Label>
              <ul className="mt-2 flex flex-wrap gap-1">
                {BUILD.securityLayers.map((item) => (
                  <li
                    key={item}
                    className="rounded border border-slate-900/10 px-1.5 py-0.5 font-mono text-[9px] text-slate-500 dark:border-white/10 dark:text-slate-400"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-baseline justify-between gap-4">
              <Label>{BUILD.engine.label}</Label>
              <p className="font-mono text-[9px] text-slate-400 dark:text-slate-500">{BUILD.engine.rules}</p>
            </div>

            <div className="mt-2 grid min-h-0 flex-1 grid-cols-[270px_1fr] gap-3">
              <div className="flex flex-col gap-2">
                <Panel className="border-l-[3px] border-l-indigo-500 dark:border-l-cyan-400">
                  <p className="font-mono text-[12px] font-bold text-slate-900 dark:text-white">
                    {BUILD.engine.formula}
                  </p>
                  <p className="mt-1.5 font-mono text-[9.5px] text-slate-500 dark:text-slate-400">
                    {BUILD.engine.weights}
                  </p>
                  <p className="font-mono text-[9.5px] text-slate-500 dark:text-slate-400">{BUILD.engine.bands}</p>
                </Panel>

                <p className="mt-auto rounded-lg bg-emerald-500/10 px-2.5 py-2 text-[12px] font-bold leading-snug text-emerald-700 dark:text-emerald-400">
                  {BUILD.engine.result}
                </p>
              </div>

              {/* Seven cases, seven bars. The two that should read zero, do —
                  which is the half of the result easiest to overlook. */}
              <div className="flex min-h-0 items-end gap-2">
                {BUILD.engine.cases.map((item) => {
                  const tone: Tone = item.expected === "HIGH" ? "bad" : item.expected === "LOW" ? "good" : "idle";
                  return (
                    <div key={item.n} className="flex h-full flex-1 flex-col justify-end gap-1">
                      <span className={cn("text-center font-mono text-[11px] font-bold tabular-nums", TONE[tone].text)}>
                        {item.score}
                      </span>
                      <div className="relative min-h-0 flex-1 overflow-hidden rounded-md bg-slate-900/[0.05] dark:bg-white/[0.06]">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max((item.score / peak) * 100, 2.5)}%` }}
                          transition={{
                            duration: reduced ? 0 : 0.7,
                            delay: reduced ? 0 : 0.4 + item.n * 0.07,
                            ease: EASE,
                          }}
                          className={cn("absolute bottom-0 w-full rounded-md", TONE[tone].bg)}
                        />
                      </div>
                      <span className="text-center font-mono text-[8px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {item.expected}
                      </span>
                      <span className="h-6 text-center text-[8.5px] leading-tight text-slate-500 dark:text-slate-400">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* The hardware and software recommendation the brief left to the team. */}
      <motion.div
        variants={rise}
        className="mt-3 flex shrink-0 items-center gap-3 rounded-xl border border-slate-900/[0.07] bg-white/55 px-3.5 py-1.5 dark:border-white/10 dark:bg-white/[0.04]"
      >
        <Label className="shrink-0">{BUILD.hosting.label}</Label>
        <ul className="flex flex-1 flex-wrap gap-1.5">
          {BUILD.hosting.items.map((item) => (
            <li
              key={item}
              className="rounded border border-slate-900/10 px-1.5 py-0.5 font-mono text-[9px] text-slate-500 dark:border-white/10 dark:text-slate-400"
            >
              {item}
            </li>
          ))}
        </ul>
        <p className="shrink-0 font-mono text-[10px] font-bold text-indigo-600 dark:text-cyan-400">
          {BUILD.hosting.cost}
        </p>
      </motion.div>

      <Footline className="mt-2.5">{BUILD.engine.insight}</Footline>
    </Slide>
  );
}

/* ── 9 ────────────────────────────────────────────────────────────────────── */

const MILESTONE_TONE: Record<string, Tone> = {
  done: "good",
  early: "accent",
  active: "warn",
  blocked: "bad",
  planned: "idle",
};

function PositionSlide() {
  const reduced = useReducedMotion();

  return (
    <Slide eyebrow={POSITION.eyebrow} title={POSITION.title}>
      <div className="grid min-h-0 flex-1 grid-cols-[320px_1fr] gap-6">
        <motion.div variants={rise} className="flex flex-col gap-3">
          <Panel>
            <Label>72 requirements, audited at 83a4c62</Label>
            <div className="mt-3">
              <Donut segments={[...POSITION.donut]} size={140} caption="FRs" />
            </div>
          </Panel>

          <Panel className="flex flex-1 flex-col justify-between gap-2">
            {POSITION.money.map((item) => (
              <div key={item.label} className="flex items-baseline justify-between gap-2">
                <span className="font-display text-[19px] font-bold tabular-nums text-slate-900 dark:text-white">
                  {item.value}
                </span>
                <span className="text-right text-[10px] text-slate-500 dark:text-slate-400">{item.label}</span>
              </div>
            ))}
          </Panel>
        </motion.div>

        <motion.div variants={rise} className="flex min-h-0 flex-col gap-3">
          <div className="grid grid-cols-3 gap-2.5">
            {POSITION.complete.map((item) => (
              <Panel key={item.title} tone="good" className="flex items-center gap-2.5">
                <Glyph icon={item.icon} size={28} />
                <span>
                  <span className="block text-[12px] font-bold leading-tight text-slate-900 dark:text-white">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                    {item.detail}
                  </span>
                </span>
              </Panel>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {POSITION.missing.map((item) => (
              <Panel key={item.id} tone="bad" className="flex flex-col gap-1">
                <Tag tone="bad">{item.id}</Tag>
                <span className="text-[12px] font-bold leading-tight text-slate-900 dark:text-white">
                  {item.title}
                </span>
                <span className="text-[10px] leading-tight text-slate-500 dark:text-slate-400">{item.detail}</span>
              </Panel>
            ))}
          </div>

          <div className="mt-auto">
            <div className="flex items-baseline justify-between gap-3">
              <Label>Milestones · {POSITION.schedule}</Label>
              <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500">{POSITION.gapsNote}</span>
            </div>
            <div className="mt-2 flex items-center gap-1">
              {POSITION.milestones.map((milestone, index) => (
                <div key={milestone.id} className="flex flex-1 flex-col items-center gap-1">
                  <motion.span
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{
                      duration: reduced ? 0 : 0.3,
                      delay: reduced ? 0 : 0.3 + index * 0.03,
                      ease: EASE,
                    }}
                    className={cn(
                      "h-3 w-full origin-bottom rounded-sm",
                      TONE[MILESTONE_TONE[milestone.state]!].bg,
                      milestone.state === "planned" && "opacity-45",
                    )}
                  />
                  <span className="font-mono text-[8.5px] text-slate-400 dark:text-slate-500">{milestone.id}</span>
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-3">
              {POSITION.milestoneLegend.map((item) => (
                <span key={item.state} className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">
                  <span className={cn("h-2 w-2 rounded-sm", TONE[MILESTONE_TONE[item.state]!].bg)} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-4 gap-2">
            {POSITION.risks.materialised.map((risk) => (
              <Panel key={risk.id} tone="bad" className="p-2">
                <span className="block font-mono text-[10px] font-bold text-rose-600 dark:text-rose-400">
                  {risk.id}
                </span>
                <span className="mt-0.5 block text-[10px] leading-tight text-slate-600 dark:text-slate-300">
                  {risk.text}
                </span>
              </Panel>
            ))}
          </div>
        </motion.div>
      </div>

      <Footline tone="warn" className="mt-4">
        {POSITION.risks.total} risks tracked · four past their trigger. {POSITION.risks.line}
      </Footline>
    </Slide>
  );
}

/* ── 10 ───────────────────────────────────────────────────────────────────── */

function DecisionsSlide() {
  return (
    <Slide eyebrow={DECISIONS.eyebrow} title={DECISIONS.title}>
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_340px] gap-6">
        <motion.div variants={rise} className="flex min-h-0 flex-col">
          <Label>Blocking</Label>
          <ul className="mt-2 flex flex-col gap-2">
            {DECISIONS.blocking.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5"
              >
                <span className="flex h-6 shrink-0 items-center rounded-md bg-rose-500/20 px-1.5 font-mono text-[11px] font-bold text-rose-600 dark:text-rose-400">
                  {item.id}
                </span>
                <span className="flex-1 text-[14px] font-semibold leading-snug text-slate-800 dark:text-slate-100">
                  {item.text}
                </span>
                <span className="shrink-0 text-right font-mono text-[9px] uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                  {item.from}
                </span>
              </li>
            ))}
          </ul>

          <Label className="mt-4">Seven further decisions requested</Label>
          <ul className="mt-2 grid flex-1 grid-cols-2 content-start gap-1.5">
            {DECISIONS.others.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 rounded-lg border border-slate-900/[0.07] bg-white/55 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <Tag tone="idle">{item.id}</Tag>
                <span className="text-[11.5px] text-slate-600 dark:text-slate-300">{item.text}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div variants={rise} className="flex min-h-0 flex-col gap-3">
          <Panel>
            <Label>Feasibility</Label>
            <ul className="mt-2 flex flex-col gap-1.5">
              {DECISIONS.feasibility.map((item) => (
                <li key={item.dimension} className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", TONE[item.tone].bg)} aria-hidden="true" />
                  <span className="w-[80px] shrink-0 text-[11.5px] font-bold text-slate-800 dark:text-slate-100">
                    {item.dimension}
                  </span>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400">{item.verdict}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 px-4 py-4 text-white">
            <p className="font-display text-[62px] font-bold leading-none tracking-[-0.04em]">
              {DECISIONS.verdict.headline}
            </p>
            <p className="mt-2 text-[12px] font-semibold text-white/85">{DECISIONS.verdict.qualifier}</p>
          </div>

          <p className="shrink-0 rounded-xl border-l-[3px] border-l-indigo-500 bg-indigo-500/[0.07] px-3.5 py-2.5 text-[12.5px] font-semibold italic leading-snug text-slate-700 dark:border-l-cyan-400 dark:bg-cyan-400/[0.07] dark:text-slate-200">
            {DECISIONS.closing}
          </p>
        </motion.div>
      </div>

      <Footline className="mt-4">{DECISIONS.next}</Footline>
    </Slide>
  );
}

/* ── The deck ─────────────────────────────────────────────────────────────── */

/**
 * Compositions keyed by the outline's slide ids.
 *
 * The running order lives in `manifest.ts`, which the document page can read
 * without loading any of this. A missing key would mean an outline entry with
 * nothing to draw, so the pairing below fails loudly at module load rather than
 * rendering a blank slide mid-presentation.
 */
const RENDERERS: Record<string, () => ReactElement> = {
  cover: CoverSlide,
  problem: ProblemSlide,
  service: ServiceSlide,
  ethics: EthicsSlide,
  conformance: ConformanceSlide,
  baseline: BaselineSlide,
  enhanced: EnhancedSlide,
  build: BuildSlide,
  position: PositionSlide,
  decisions: DecisionsSlide,
};

export interface DeckSlide extends SlideEntry {
  render: () => ReactElement;
}

export const SRS_SLIDES: DeckSlide[] = DECK_OUTLINE.map((entry) => {
  const render = RENDERERS[entry.id];

  if (!render) {
    throw new Error(`Deck outline names a slide with no composition: ${entry.id}`);
  }

  return { ...entry, render };
});
