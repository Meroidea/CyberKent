import { type ReactElement } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Ban, Check, CheckCircle2, TriangleAlert } from "lucide-react";
import { MarkBody } from "@/components/brand/MarkBody";
import { MARK_HEIGHT, MARK_WIDTH } from "@/components/brand/markGeometry";
import {
  ARCHITECTURE,
  BUDGET,
  CLOSE,
  COVER,
  DECK_META,
  ENHANCED,
  GOVERNANCE,
  OBJECTIVES,
  PROBLEM,
  REQUIREMENTS,
  SCOPE,
  STORYBOARD,
  TEAM,
  TESTING,
} from "@/content/presentation";
import { USE_CASE } from "@/content/diagrams";
import {
  Footline,
  Glyph,
  Headline,
  Label,
  Panel,
  Slide,
  StateRow,
  Stat,
  Tag,
  TONE,
  rise,
  toneFor,
  type Tone,
} from "@/components/present/primitives";
import {
  DataFlowDiagram,
  EntityDiagram,
  GanttDiagram,
  UseCaseDiagram,
  WbsDiagram,
} from "@/components/present/diagrams";
import { DECK_OUTLINE, type SlideEntry } from "@/components/present/manifest";
import { cn } from "@/lib/cn";

const EASE = [0.22, 1, 0.36, 1] as const;

/** The mark's height inside the cover emblem, as a multiple of its own box. */
const DECK_MARK_SCALE = 0.62;

/* ── 1 · Cover ────────────────────────────────────────────────────────────── */

/**
 * The emblem is the scanner's globe reduced to two dimensions: concentric rings
 * with one sweeping arm and four contacts on them, so it reads as a thing that
 * *looks* rather than a badge that certifies — the distinction ETH-1 spends the
 * rest of the document defending. The brand mark sits at its centre, which is
 * what makes the drawing this project's rather than any scanner's.
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
            {/* The mark at the centre of the rings — the thing the scanner is
                looking on behalf of. It replaced a generic shield: a badge that
                certifies is exactly the claim ETH-1 spends the document
                refusing to make. Shaded rather than flat, because the slide is
                the one place the mark is seen large enough for the modelling to
                be the point. Scaled to 62 units tall in a 92-unit well. */}
            <g transform={`translate(${150 - (MARK_WIDTH * DECK_MARK_SCALE) / 2} ${150 - (MARK_HEIGHT * DECK_MARK_SCALE) / 2}) scale(${DECK_MARK_SCALE})`}>
              <MarkBody uid="deck-mark" />
            </g>
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

/* ── 2 · Background and problem ───────────────────────────────────────────── */

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

/* ── 3 · Objectives and purpose ───────────────────────────────────────────── */

function ObjectiveColumn({
  label,
  items,
}: {
  label: string;
  items: readonly { id: string; text: string; state: string }[];
}) {
  return (
    <div className="flex min-h-0 flex-col">
      <Label>{label}</Label>
      <ul className="mt-2 flex flex-1 flex-col gap-1">
        {items.map((item) => (
          <StateRow key={item.id} id={item.id} text={item.text} state={item.state} className="flex-1" />
        ))}
      </ul>
    </div>
  );
}

function ObjectivesSlide() {
  return (
    <Slide eyebrow={OBJECTIVES.eyebrow} title={OBJECTIVES.title}>
      <motion.div variants={rise} className="shrink-0">
        <Panel className="border-l-[3px] border-l-indigo-500 dark:border-l-cyan-400">
          <Label>Purpose of the project</Label>
          <p className="mt-1.5 text-[12.5px] font-semibold leading-snug text-slate-800 dark:text-slate-100">
            {OBJECTIVES.purpose}
          </p>
        </Panel>
      </motion.div>

      <motion.div variants={rise} className="mt-3 grid min-h-0 flex-1 grid-cols-4 gap-3">
        <ObjectiveColumn label="Product · PO" items={OBJECTIVES.product} />
        <ObjectiveColumn label="Quality · QO" items={OBJECTIVES.quality} />
        <ObjectiveColumn label="Ethical · EO" items={OBJECTIVES.ethical} />
        <ObjectiveColumn label="Delivery · DO" items={OBJECTIVES.delivery} />
      </motion.div>

      {/* Scope shares this slide: the objectives say what the project is for,
          and the scope is the line drawn around them. */}
      <motion.div variants={rise} className="mt-3 grid shrink-0 grid-cols-[1fr_300px] gap-4">
        <div>
          <Label>Scope — four verbs for the community, four for Council</Label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {[...SCOPE.community, ...SCOPE.council].map((item) => (
              <span
                key={item.verb}
                className="flex items-center gap-1.5 rounded-lg border border-slate-900/[0.07] bg-white/55 px-2 py-1 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{item.verb}</span>
                <span className="font-mono text-[8.5px] text-indigo-600 dark:text-cyan-400">{item.maps}</span>
              </span>
            ))}
          </div>
        </div>

        <Panel tone="bad">
          <Label>Out of scope</Label>
          <ul className="mt-1 grid grid-cols-2 gap-x-2">
            {SCOPE.outOfScope.map((item) => (
              <li key={item} className="flex items-center gap-1 text-[9px] text-slate-600 dark:text-slate-300">
                <Ban className="h-2 w-2 shrink-0 text-rose-500" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </Panel>
      </motion.div>
    </Slide>
  );
}

/* ── 4 · Team, performance and deliverables ───────────────────────────────── */

function TeamSlide() {
  return (
    <Slide eyebrow={TEAM.eyebrow} title={TEAM.title}>
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_260px_260px] gap-4">
        <motion.div variants={rise} className="flex min-h-0 flex-col">
          <Label>Capability · primary → backup · what it has delivered</Label>
          <ul className="mt-2 flex flex-1 flex-col gap-1.5">
            {TEAM.capabilities.map((row) => (
              <li
                key={row.capability}
                className="flex flex-1 flex-col justify-center rounded-xl border border-slate-900/[0.07] bg-white/55 px-3 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{row.capability}</span>
                  <span className="font-mono text-[9px] text-indigo-600 dark:text-cyan-400">{row.delivered}</span>
                </span>
                <span className="flex items-center gap-1.5 text-[9.5px] text-slate-500 dark:text-slate-400">
                  {row.primary}
                  <ArrowRight className="h-2.5 w-2.5 shrink-0 text-slate-300 dark:text-slate-600" aria-hidden="true" />
                  {row.backup}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div variants={rise} className="flex min-h-0 flex-col">
          <Label>Skills, assessed honestly</Label>
          <ul className="mt-2 flex flex-1 flex-col gap-1">
            {TEAM.skills.map((row) => (
              <StateRow key={row.skill} text={row.skill} state={row.state} trailing={row.level} className="flex-1" />
            ))}
          </ul>
        </motion.div>

        <motion.div variants={rise} className="flex min-h-0 flex-col">
          <Label>Twelve deliverables, D1–D12</Label>
          <ul className="mt-2 flex flex-1 flex-col gap-1">
            {SCOPE.deliverables.map((item) => (
              <StateRow
                key={item.id}
                id={item.id}
                text={item.text}
                state={item.state}
                trailing={item.milestone}
                className="flex-1"
              />
            ))}
          </ul>
        </motion.div>
      </div>

      <motion.div variants={rise} className="mt-3 grid shrink-0 grid-cols-2 gap-4">
        <p className="rounded-xl border-l-[3px] border-l-slate-400 bg-slate-500/[0.07] px-4 py-2 text-[11px] leading-snug text-slate-600 dark:text-slate-300">
          {TEAM.note}
        </p>
        <p className="rounded-xl border-l-[3px] border-l-indigo-500 bg-indigo-500/[0.07] px-4 py-2 text-[11px] leading-snug text-slate-700 dark:border-l-cyan-400 dark:bg-cyan-400/[0.07] dark:text-slate-200">
          {TEAM.transfer}
        </p>
      </motion.div>
    </Slide>
  );
}

/* ── 5 · Work breakdown structure ─────────────────────────────────────────── */

/**
 * The WBS gets the whole slide.
 *
 * It is a five-branch tree three levels deep; at half a slide the level-3 tasks
 * fall under six point type and the decomposition — which is the entire content
 * of a WBS — stops being legible. The same applies to the four diagrams that
 * follow, which is why each has a slide of its own.
 */
function WbsSlide() {
  return (
    <Slide eyebrow="Criterion 4 · Work breakdown structure" title={{ lead: "Five packages,", accent: "three levels deep." }}>
      <motion.div variants={rise} className="min-h-0 flex-1">
        <WbsDiagram />
      </motion.div>
    </Slide>
  );
}

/* ── 6 · Gantt and delivery position ──────────────────────────────────────── */

function GanttSlide() {
  return (
    <Slide eyebrow="Criterion 4 · Schedule & Gantt" title={{ lead: "Eight sprints,", accent: "six milestone releases." }}>
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_236px] gap-4">
        <motion.div variants={rise} className="min-h-0">
          <GanttDiagram />
        </motion.div>

        {/* Where the schedule has actually reached. Monochrome like the chart
            beside it: one slide should not teach two colour codes. */}
        <motion.div variants={rise} className="flex min-h-0 flex-col gap-2">
          <div className="rounded border border-slate-900/40 p-2.5 dark:border-white/35">
            <Label>72 requirements, audited</Label>
            <div className="mt-2 flex h-5 overflow-hidden rounded-[3px] border border-slate-900/60 dark:border-white/50">
              {CLOSE.donut.map((segment, index) => (
                <span
                  key={segment.label}
                  style={{ width: `${(segment.value / 72) * 100}%` }}
                  className={cn(
                    index === 0 && "bg-slate-900 dark:bg-white",
                    index === 1 &&
                      "bg-[repeating-linear-gradient(45deg,currentColor_0_2px,transparent_2px_5px)] text-slate-900 dark:text-white",
                    index === 2 && "bg-transparent",
                    index > 0 && "border-l border-slate-900/60 dark:border-white/50",
                  )}
                />
              ))}
            </div>
            <ul className="mt-2 flex flex-col gap-1">
              {CLOSE.donut.map((segment, index) => (
                <li key={segment.label} className="flex items-center gap-1.5 text-[9.5px]">
                  <span
                    className={cn(
                      "h-2.5 w-4 shrink-0 rounded-[2px] border border-slate-900/60 dark:border-white/50",
                      index === 0 && "bg-slate-900 dark:bg-white",
                      index === 1 &&
                        "bg-[repeating-linear-gradient(45deg,currentColor_0_2px,transparent_2px_5px)] text-slate-900 dark:text-white",
                    )}
                  />
                  <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {segment.value}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">{segment.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <ul className="flex min-h-0 flex-1 flex-col gap-1">
            {CLOSE.complete.map((item) => (
              <li
                key={item.title}
                className="flex flex-1 flex-col justify-center rounded border border-slate-900/40 px-2 dark:border-white/35"
              >
                <span className="text-[10px] font-bold text-slate-900 dark:text-slate-100">{item.title}</span>
                <span className="text-[8.5px] text-slate-500 dark:text-slate-400">{item.detail}</span>
              </li>
            ))}
            {CLOSE.missing.map((item) => (
              <li
                key={item.id}
                className="flex flex-1 items-center gap-1.5 rounded border border-dashed border-slate-900/45 px-2 dark:border-white/40"
              >
                <span className="font-mono text-[9px] font-bold text-slate-900 dark:text-slate-100">{item.id}</span>
                <span className="min-w-0 flex-1 text-[9px] leading-tight text-slate-600 dark:text-slate-300">
                  {item.title}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <Footline className="mt-3">{"A milestone is a gate, not an activity: a verifiable state that must be reached before the next phase begins."}</Footline>
    </Slide>
  );
}

/* ── 7 · Use-case diagram ─────────────────────────────────────────────────── */

function UseCasesSlide() {
  return (
    <Slide
      eyebrow="Criterion 5 · Requirement analysis"
      title={{ lead: "Two actors,", accent: "one boundary, four includes." }}
    >
      <motion.div variants={rise} className="min-h-0 flex-1">
        <UseCaseDiagram />
      </motion.div>

      <motion.ul variants={rise} className="mt-2 flex shrink-0 flex-wrap gap-x-4 gap-y-1">
        {USE_CASE.includes.map((entry: (typeof USE_CASE.includes)[number]) => (
          <li key={entry.to} className="text-[10px] text-slate-600 dark:text-slate-300">
            <span className="font-mono text-[8.5px] uppercase tracking-wider text-indigo-600 dark:text-cyan-400">
              &#171;include&#187;
            </span>{" "}
            {entry.from} → <span className="font-semibold">{entry.to}</span>
            {entry.note ? <span className="text-slate-400 dark:text-slate-500"> ({entry.note})</span> : null}
          </li>
        ))}
      </motion.ul>
    </Slide>
  );
}

/* ── 8 · Requirements ─────────────────────────────────────────────────────── */

function RequirementsSlide() {
  return (
    <Slide eyebrow={REQUIREMENTS.eyebrow} title={REQUIREMENTS.title}>
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_330px] gap-5">
        <motion.div variants={rise} className="flex min-h-0 flex-col">
          <Label>Functional — twelve modules, FR1–FR72, each with an acceptance criterion</Label>
          <div className="mt-2 grid flex-1 grid-cols-4 gap-2">
            {REQUIREMENTS.modules.map((module) => (
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

          <Panel className="mt-2.5 shrink-0">
            <Label>Ethical requirements — binding constraints, not advice</Label>
            <ul className="mt-1.5 flex flex-wrap gap-1">
              {REQUIREMENTS.ethics.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-1 rounded border border-slate-900/10 px-1.5 py-0.5 dark:border-white/10"
                >
                  <span className="font-mono text-[8.5px] font-bold text-indigo-600 dark:text-cyan-400">
                    {item.id}
                  </span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400">{item.text}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </motion.div>

        <motion.div variants={rise} className="flex min-h-0 flex-col">
          <Label>Non-functional — eight attributes</Label>
          <ul className="mt-2 flex flex-1 flex-col gap-1">
            {REQUIREMENTS.nfr.map((row) => (
              <li
                key={row.attribute}
                className="flex flex-1 flex-col justify-center rounded-lg border border-slate-900/[0.07] bg-white/55 px-2.5 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{row.attribute}</span>
                  <span className="font-mono text-[8.5px] text-indigo-600 dark:text-cyan-400">{row.ids}</span>
                </span>
                <span className="text-[9px] leading-tight text-slate-500 dark:text-slate-400">{row.note}</span>
              </li>
            ))}
          </ul>

          <Panel className="mt-2 flex shrink-0 items-center justify-between gap-2">
            <Stat value={String(REQUIREMENTS.reconciliation.client)} label="in the brief" size="sm" tone="idle" />
            <span className="font-display text-[18px] font-bold text-slate-300 dark:text-slate-600">+</span>
            <Stat value={String(REQUIREMENTS.reconciliation.added)} label="team-added" size="sm" tone="warn" />
            <span className="font-display text-[18px] font-bold text-slate-300 dark:text-slate-600">=</span>
            <Stat value={String(REQUIREMENTS.reconciliation.total)} label="specified" size="sm" />
          </Panel>
        </motion.div>
      </div>

      <Footline className="mt-4">{REQUIREMENTS.moscow}</Footline>
    </Slide>
  );
}

/* ── 9 · Enhanced requirements and conformance ────────────────────────────── */

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

      <div className="mt-3 grid min-h-0 flex-1 grid-cols-[1fr_370px] gap-5">
        <motion.div variants={rise} className="flex min-h-0 flex-col">
          <Panel className="flex shrink-0 items-end justify-between gap-2">
            {ENHANCED.counts.map((item) => (
              <Stat key={item.label} value={item.value} label={item.label} size="sm" tone={item.tone} />
            ))}
          </Panel>

          <ul className="mt-2.5 grid flex-1 grid-cols-4 gap-1.5">
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
                      "font-mono text-[10.5px] font-bold",
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
                        "font-mono text-[7.5px] font-bold uppercase tracking-wider",
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
                <span className="text-[9.5px] leading-tight text-slate-600 dark:text-slate-300">{item.text}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div variants={rise} className="flex min-h-0 flex-col">
          <Label>Four requirements that could not be built as written</Label>
          <ul className="mt-2 flex flex-1 flex-col gap-1.5">
            {ENHANCED.defects.map((defect) => (
              <li
                key={defect.id}
                className="flex flex-1 flex-col justify-center gap-0.5 rounded-xl border border-slate-900/[0.07] bg-white/55 px-3 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <span className="flex items-center gap-2">
                  <Tag tone={defect.severity === "high" ? "bad" : "warn"}>{defect.id}</Tag>
                  <span className="min-w-0 truncate text-[10.5px] text-slate-400 line-through dark:text-slate-500">
                    {defect.was}
                  </span>
                </span>
                <span className="pl-1 text-[11px] font-bold leading-tight text-slate-800 dark:text-slate-100">
                  → {defect.now}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-2 flex shrink-0 items-center gap-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 px-4 py-2.5 text-white">
            <p className="font-display text-[26px] font-bold leading-none tracking-[-0.03em]">
              {ENHANCED.verdict.headline}
            </p>
            <p className="text-[10.5px] font-semibold leading-tight text-white/85">{ENHANCED.verdict.qualifier}</p>
          </div>
        </motion.div>
      </div>

      <Footline className="mt-3">{ENHANCED.line}</Footline>
    </Slide>
  );
}

/* ── 10 · Entity-relationship diagram ─────────────────────────────────────── */

function ErdSlide() {
  return (
    <Slide
      eyebrow="Criterion 8 · Database structure"
      title={{ lead: "Four clusters,", accent: "eighteen entities." }}
    >
      <motion.div variants={rise} className="min-h-0 flex-1">
        <EntityDiagram />
      </motion.div>
    </Slide>
  );
}

/* ── 11 · Data-flow diagram ───────────────────────────────────────────────── */

function DfdSlide() {
  return (
    <Slide
      eyebrow="Criterion 8 · Data flow"
      title={{ lead: "Four processes,", accent: "four stores, two actors." }}
    >
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_216px] gap-4">
        <motion.div variants={rise} className="min-h-0">
          <DataFlowDiagram />
        </motion.div>

        <motion.div variants={rise} className="flex min-h-0 flex-col gap-2">
          <Panel>
            <Label>As migrated</Label>
            <div className="mt-2 grid grid-cols-2 gap-y-2">
              {ARCHITECTURE.stats.map((item) => (
                <Stat key={item.label} value={item.value} label={item.label} size="sm" />
              ))}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <TriangleAlert className="h-3 w-3 shrink-0" aria-hidden="true" />
              {ARCHITECTURE.governance}
            </p>
          </Panel>

          <Panel className="flex-1">
            <Label>Nine layers, none skippable</Label>
            <ul className="mt-1.5 flex flex-col gap-px">
              {ARCHITECTURE.layers.map((layer) => (
                <li key={layer} className="font-mono text-[8.5px] text-slate-600 dark:text-slate-300">
                  {layer}
                </li>
              ))}
            </ul>
          </Panel>
        </motion.div>
      </div>

      <motion.div variants={rise} className="mt-2.5 flex shrink-0 flex-wrap gap-x-4 gap-y-0.5">
        {ARCHITECTURE.decisions.map((decision) => (
          <span key={decision} className="flex items-center gap-1.5 text-[9.5px] text-slate-600 dark:text-slate-300">
            <Check className="h-2.5 w-2.5 shrink-0 text-emerald-500" aria-hidden="true" />
            {decision}
          </span>
        ))}
      </motion.div>
    </Slide>
  );
}

/* ── 11 · User storyboard ─────────────────────────────────────────────────── */

/**
 * A wireframe of one screen, drawn as shapes rather than as a screenshot.
 *
 * A storyboard frame is about what is on the screen and what the person does
 * next, not about pixel fidelity — and a shrunken screenshot at this size is a
 * grey smear where a diagram still reads.
 */
function Wireframe({ art }: { art: string }) {
  const bar = "fill-slate-300 dark:fill-slate-600";
  const accent = "fill-indigo-500 dark:fill-cyan-400";
  const soft = "fill-slate-200 dark:fill-slate-700";

  return (
    <svg viewBox="0 0 100 62" className="w-full" aria-hidden="true">
      <rect x="0" y="0" width="100" height="62" rx="4" className="fill-white/70 dark:fill-white/[0.06]" />
      <rect x="0" y="0" width="100" height="8" rx="4" className={soft} />

      {art === "landing" ? (
        <>
          <rect x="10" y="18" width="52" height="6" rx="2" className={accent} />
          <rect x="10" y="28" width="72" height="3" rx="1.5" className={bar} />
          <rect x="10" y="34" width="60" height="3" rx="1.5" className={bar} />
          <rect x="10" y="44" width="30" height="9" rx="4.5" className={accent} />
        </>
      ) : null}

      {art === "channel" ? (
        <>
          <rect x="10" y="14" width="34" height="3" rx="1.5" className={bar} />
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <rect
              key={index}
              x={10 + (index % 3) * 28}
              y={22 + Math.floor(index / 3) * 12}
              width="24"
              height="9"
              rx="4.5"
              className={index === 0 ? accent : soft}
            />
          ))}
          <rect x="10" y="48" width="80" height="6" rx="3" className={soft} />
        </>
      ) : null}

      {art === "paste" ? (
        <>
          <rect x="10" y="14" width="30" height="3" rx="1.5" className={bar} />
          <rect x="10" y="20" width="80" height="22" rx="3" className={soft} />
          {[0, 1, 2].map((index) => (
            <rect key={index} x="14" y={24 + index * 6} width={64 - index * 14} height="2.5" rx="1.25" className={bar} />
          ))}
          <rect x="10" y="46" width="80" height="8" rx="4" className={accent} />
        </>
      ) : null}

      {art === "scan" ? (
        <>
          <circle
            cx="50"
            cy="30"
            r="14"
            className="fill-none stroke-slate-300 dark:stroke-slate-600"
            strokeWidth="1.5"
          />
          <circle
            cx="50"
            cy="30"
            r="14"
            className="origin-center fill-none stroke-indigo-500 motion-safe:animate-[hud-spin_2.2s_linear_infinite] dark:stroke-cyan-400"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="28 60"
          />
          <rect x="30" y="50" width="40" height="3" rx="1.5" className={bar} />
        </>
      ) : null}

      {art === "result" ? (
        <>
          <rect x="10" y="14" width="26" height="9" rx="4.5" className="fill-rose-500" />
          <rect x="40" y="16" width="18" height="5" rx="2.5" className={bar} />
          {[0, 1, 2].map((index) => (
            <g key={index}>
              <rect x="10" y={28 + index * 9} width="4" height="6" rx="1" className="fill-rose-400" />
              <rect x="17" y={29 + index * 9} width={62 - index * 10} height="3.5" rx="1.75" className={bar} />
            </g>
          ))}
        </>
      ) : null}

      {art === "next" ? (
        <>
          <rect x="10" y="16" width="80" height="3" rx="1.5" className={bar} />
          <rect x="10" y="26" width="38" height="10" rx="5" className={accent} />
          <rect x="52" y="26" width="38" height="10" rx="5" className={soft} />
          <rect x="10" y="42" width="80" height="10" rx="3" className="fill-emerald-500/25" />
        </>
      ) : null}
    </svg>
  );
}

function StoryboardSlide() {
  return (
    <Slide eyebrow={STORYBOARD.eyebrow} title={STORYBOARD.title}>
      <motion.div variants={rise} className="grid min-h-0 flex-1 grid-cols-6 gap-2.5">
        {STORYBOARD.frames.map((frame) => (
          <figure
            key={frame.n}
            className="flex min-h-0 flex-col rounded-xl border border-slate-900/[0.07] bg-white/55 p-2.5 dark:border-white/10 dark:bg-white/[0.04]"
          >
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500/15 font-mono text-[8px] font-bold text-indigo-700 dark:bg-cyan-400/15 dark:text-cyan-300">
                {frame.n}
              </span>
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                {frame.screen}
              </span>
            </div>

            <div className="my-2 flex flex-1 items-center">
              <Wireframe art={frame.art} />
            </div>

            <figcaption className="shrink-0 text-[9.5px] leading-tight text-slate-600 dark:text-slate-300">
              {frame.does}
            </figcaption>
          </figure>
        ))}
      </motion.div>

      <motion.div variants={rise} className="mt-4 flex shrink-0 items-center gap-3">
        <Label className="shrink-0">Guaranteed at every frame</Label>
        {STORYBOARD.guarantees.map((item) => (
          <span
            key={item}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400"
          >
            <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
            {item}
          </span>
        ))}
      </motion.div>

      <p className="mt-2 shrink-0 text-[10px] text-slate-400 dark:text-slate-500">{STORYBOARD.note}</p>
    </Slide>
  );
}

/* ── 12 · Test plan and test cases ────────────────────────────────────────── */

function TestingSlide() {
  const reduced = useReducedMotion();
  const peak = Math.max(...TESTING.cases.map((item) => item.score), 100);

  return (
    <Slide eyebrow={TESTING.eyebrow} title={TESTING.title}>
      <div className="grid min-h-0 flex-1 grid-cols-[290px_1fr] gap-5">
        <motion.div variants={rise} className="flex min-h-0 flex-col">
          <Label>Test plan — eight levels</Label>
          <ul className="mt-2 flex flex-1 flex-col gap-1">
            {TESTING.strategy.map((row) => (
              <li
                key={row.level}
                className="flex flex-1 flex-col justify-center rounded-lg border border-slate-900/[0.07] bg-white/55 px-2.5 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TONE[toneFor(row.state)].bg)}
                      aria-hidden="true"
                    />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{row.level}</span>
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {row.owner}
                  </span>
                </span>
                <span className="pl-3 text-[9px] leading-tight text-slate-500 dark:text-slate-400">{row.method}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div variants={rise} className="flex min-h-0 flex-col">
          <div className="flex shrink-0 items-baseline justify-between gap-3">
            <Label>Test cases executed 13 Aug 2026 — expected band vs result</Label>
            <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500">{TESTING.formula}</span>
          </div>

          {/* Seven cases, seven bars. The two that should read zero, do — which
              is the half of the result easiest to overlook. */}
          <div className="mt-2 flex min-h-0 flex-1 items-end gap-2.5">
            {TESTING.cases.map((item) => {
              const tone: Tone = item.expected === "HIGH" ? "bad" : item.expected === "LOW" ? "good" : "idle";
              return (
                <div key={item.n} className="flex h-full flex-1 flex-col justify-end gap-1">
                  <span className={cn("text-center font-mono text-[12px] font-bold tabular-nums", TONE[tone].text)}>
                    {item.score}
                  </span>
                  <div className="relative min-h-0 flex-1 overflow-hidden rounded-md bg-slate-900/[0.05] dark:bg-white/[0.06]">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max((item.score / peak) * 100, 2.5)}%` }}
                      transition={{
                        duration: reduced ? 0 : 0.7,
                        delay: reduced ? 0 : 0.35 + item.n * 0.07,
                        ease: EASE,
                      }}
                      className={cn("absolute bottom-0 w-full rounded-md", TONE[tone].bg)}
                    />
                  </div>
                  <span className="text-center font-mono text-[8px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {item.expected}
                  </span>
                  <span className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5 shrink-0 text-emerald-500" aria-hidden="true" />
                    <span className="font-mono text-[8px] text-slate-400 dark:text-slate-500">
                      c={item.confidence.toFixed(2)}
                    </span>
                  </span>
                  <span className="h-7 text-center text-[8.5px] leading-tight text-slate-500 dark:text-slate-400">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-2 grid shrink-0 grid-cols-2 gap-2">
            <p className="rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-[11.5px] font-bold leading-snug text-emerald-700 dark:text-emerald-400">
              {TESTING.result}
            </p>
            <p className="rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[10px] leading-snug text-amber-700 dark:text-amber-400">
              {TESTING.gap}
            </p>
          </div>
        </motion.div>
      </div>

      <motion.p
        variants={rise}
        className="mt-3 shrink-0 rounded-xl border-l-[3px] border-l-slate-400 bg-slate-500/[0.07] px-4 py-2 text-[10.5px] leading-snug text-slate-600 dark:text-slate-300"
      >
        {TESTING.acceptance}.
      </motion.p>

      <Footline className="mt-2.5">{TESTING.insight}</Footline>
    </Slide>
  );
}

/* ── 13 · Budget and financial breakdown ──────────────────────────────────── */

function BudgetSlide() {
  const reduced = useReducedMotion();
  const total = BUDGET.operatingTotal;

  return (
    <Slide eyebrow={BUDGET.eyebrow} title={BUDGET.title}>
      <motion.div variants={rise} className="grid shrink-0 grid-cols-4 gap-3">
        {BUDGET.headline.map((item) => (
          <Panel key={item.label} tone={item.tone === "idle" ? undefined : item.tone}>
            <Stat value={item.value} label={item.label} tone={item.tone} />
          </Panel>
        ))}
      </motion.div>

      <div className="mt-4 grid min-h-0 flex-1 grid-cols-[1fr_300px] gap-5">
        <motion.div variants={rise} className="flex min-h-0 flex-col">
          <Label>Annual operating cost once promoted — where the $28,400 goes</Label>

          {/* A stacked bar, because the point is the proportion: the cash line
              everyone worries about is the smaller sixth of it. */}
          <div className="mt-2.5 flex h-9 shrink-0 overflow-hidden rounded-lg">
            {BUDGET.operating.map((line, index) => (
              <motion.div
                key={line.item}
                initial={{ width: 0 }}
                animate={{ width: `${(line.amount / total) * 100}%` }}
                transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 0.3 + index * 0.15, ease: EASE }}
                className={cn(
                  "flex items-center justify-center",
                  index === 0
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-500"
                    : "bg-gradient-to-r from-cyan-500 to-teal-500",
                )}
              >
                <span className="font-mono text-[11px] font-bold text-white">${line.amount.toLocaleString()}</span>
              </motion.div>
            ))}
          </div>

          <ul className="mt-2 flex shrink-0 flex-col gap-1">
            {BUDGET.operating.map((line, index) => (
              <li key={line.item} className="flex items-center gap-2">
                <span
                  className={cn("h-2.5 w-2.5 shrink-0 rounded-sm", index === 0 ? "bg-indigo-500" : "bg-cyan-500")}
                />
                <span className="flex-1 text-[11px] text-slate-600 dark:text-slate-300">{line.item}</span>
                <span className="font-mono text-[11px] font-bold tabular-nums text-slate-800 dark:text-slate-100">
                  ${line.amount.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>

          <Label className="mt-3">What the infrastructure line buys</Label>
          <ul className="mt-1.5 flex flex-1 flex-col gap-1">
            {BUDGET.infrastructure.map((line) => (
              <li
                key={line.item}
                className="flex flex-1 items-center gap-2 rounded-lg border border-slate-900/[0.07] bg-white/55 px-2.5 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <span className="flex-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  {line.item}
                </span>
                <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500">{line.note}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div variants={rise} className="flex min-h-0 flex-col gap-2.5">
          <Panel className="flex-1">
            <Label>The economic case</Label>
            <ul className="mt-2 flex flex-col gap-2.5">
              {BUDGET.benefit.map((item) => (
                <li key={item.label}>
                  <p className="font-display text-[22px] font-bold leading-none tracking-[-0.03em] text-indigo-600 dark:text-cyan-400">
                    {item.value}
                  </p>
                  <p className="mt-1 text-[10px] leading-snug text-slate-500 dark:text-slate-400">{item.label}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel tone="warn" className="shrink-0">
            <p className="text-[10.5px] leading-snug text-slate-700 dark:text-slate-200">{BUDGET.condition}</p>
          </Panel>
        </motion.div>
      </div>

      <Footline className="mt-4">{BUDGET.line}</Footline>
    </Slide>
  );
}

/* ── 15 · Risks, communication and feedback ───────────────────────────────── */

function CloseSlide() {
  return (
    <Slide eyebrow={GOVERNANCE.eyebrow} title={{ lead: "Four risks fired,", accent: "and a GO." }}>
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_1fr_280px] gap-4">
        <motion.div variants={rise} className="flex min-h-0 flex-col gap-2">
          <div className="flex min-h-0 flex-1 flex-col">
            <Label>Critical risks — likelihood × impact</Label>
            <ul className="mt-1.5 flex flex-1 flex-col gap-1">
              {GOVERNANCE.critical.map((risk) => (
                <li
                  key={risk.id}
                  className="flex flex-1 items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5"
                >
                  <span className="font-mono text-[10px] font-bold text-rose-600 dark:text-rose-400">{risk.id}</span>
                  <span className="min-w-0 flex-1 truncate text-[10.5px] font-semibold text-slate-800 dark:text-slate-100">
                    {risk.text}
                  </span>
                  <span className="font-display text-[13px] font-bold tabular-nums text-rose-600 dark:text-rose-400">
                    {risk.score}
                  </span>
                </li>
              ))}
              {GOVERNANCE.materialised.map((risk) => (
                <StateRow key={risk.id} id={risk.id} text={risk.text} state="fired" className="flex-1" />
              ))}
            </ul>
          </div>

          <ul className="grid shrink-0 grid-cols-2 gap-1">
            {GOVERNANCE.treatment.map((row) => (
              <li
                key={row.approach}
                className="rounded-lg border border-slate-900/[0.07] bg-white/55 px-2 py-0.5 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <span className="block font-mono text-[8.5px] font-bold uppercase tracking-wider text-indigo-600 dark:text-cyan-400">
                  {row.approach}
                </span>
                <span className="block text-[8.5px] leading-tight text-slate-500 dark:text-slate-400">
                  {row.example}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div variants={rise} className="flex min-h-0 flex-col gap-2">
          <div className="flex min-h-0 flex-1 flex-col">
            <Label>Communication plan</Label>
            <ul className="mt-1.5 flex flex-1 flex-col gap-1">
              {GOVERNANCE.communication.map((row) => (
                <li
                  key={row.audience}
                  className="flex flex-1 items-center gap-2 rounded-lg border border-slate-900/[0.07] bg-white/55 px-2 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-slate-800 dark:text-slate-100">
                    {row.audience}
                  </span>
                  <span className="shrink-0 font-mono text-[8.5px] text-indigo-600 dark:text-cyan-400">
                    {row.cadence}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex shrink-0 gap-1">
            {GOVERNANCE.escalation.map((step, index) => (
              <div
                key={step.level}
                className={cn(
                  "flex-1 rounded px-1.5 py-0.5",
                  index === 4
                    ? "border border-rose-500/40 bg-rose-500/10"
                    : "border border-slate-900/[0.07] bg-white/55 dark:border-white/10 dark:bg-white/[0.04]",
                )}
              >
                <span
                  className={cn(
                    "block font-mono text-[9px] font-bold",
                    index === 4 ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400",
                  )}
                >
                  {step.level}
                </span>
                <span className="block text-[7.5px] leading-tight text-slate-600 dark:text-slate-300">
                  {step.time}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={rise} className="flex min-h-0 flex-col gap-2">
          {/*
           * The one criterion no project document answers. Left as prompts
           * rather than filled in: the lecturer will know what they said, and a
           * slide that invents their feedback is worse than one that waits.
           */}
          <div className="flex min-h-0 flex-1 flex-col rounded-xl border-2 border-dashed border-amber-500/45 bg-amber-500/[0.07] p-2.5">
            <span className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">
              {CLOSE.feedback.label}
            </span>
            <p className="mt-0.5 shrink-0 text-[8.5px] leading-tight text-amber-700/80 dark:text-amber-400/80">
              {CLOSE.feedback.todo}
            </p>
            <ul className="mt-1.5 flex flex-1 flex-col gap-1">
              {CLOSE.feedback.prompts.map((prompt) => (
                <li
                  key={prompt.on}
                  className="flex flex-1 flex-col justify-center rounded border border-amber-500/25 bg-white/50 px-2 dark:bg-white/[0.04]"
                >
                  <span className="text-[9px] font-bold text-slate-700 dark:text-slate-200">{prompt.on}</span>
                  <span className="font-mono text-[10px] text-slate-300 dark:text-slate-600">{prompt.answer}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 px-3 py-3 text-white">
            <p className="font-display text-[40px] font-bold leading-none tracking-[-0.04em]">
              {CLOSE.verdict.headline}
            </p>
            <p className="mt-1 text-center text-[10px] font-semibold text-white/85">{CLOSE.verdict.qualifier}</p>
          </div>
        </motion.div>
      </div>

      <Footline className="mt-3">{CLOSE.closing}</Footline>
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
  objectives: ObjectivesSlide,
  team: TeamSlide,
  wbs: WbsSlide,
  gantt: GanttSlide,
  usecases: UseCasesSlide,
  requirements: RequirementsSlide,
  enhanced: EnhancedSlide,
  erd: ErdSlide,
  dfd: DfdSlide,
  storyboard: StoryboardSlide,
  testing: TestingSlide,
  budget: BudgetSlide,
  risks: CloseSlide,
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
