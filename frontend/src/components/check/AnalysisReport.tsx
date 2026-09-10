import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, AtSign, Phone, ShieldCheck, ShieldQuestion } from "lucide-react";
import { ROUTES } from "@/config/site";
import { ReportActions } from "@/components/check/ReportActions";
import { LinkBreakdown } from "@/components/check/LinkBreakdown";
import { FileDetails } from "@/components/check/FileDetails";
import { AiSecondOpinion } from "@/components/ai/AiSecondOpinion";
import type { Analysis, RiskBand, Submission } from "@/lib/scam/types";
import { EASE_OUT_EXPO, fadeUp, staggerParent } from "@/lib/motion";
import { cn } from "@/lib/cn";

const BAND_STYLES: Record<
  RiskBand,
  { ring: string; text: string; chip: string; Icon: typeof ShieldCheck }
> = {
  high: {
    ring: "stroke-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    chip: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    Icon: AlertTriangle,
  },
  medium: {
    ring: "stroke-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    Icon: ShieldQuestion,
  },
  low: {
    ring: "stroke-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    Icon: ShieldCheck,
  },
  unclear: {
    ring: "stroke-slate-400",
    text: "text-slate-600 dark:text-slate-300",
    chip: "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300",
    Icon: ShieldQuestion,
  },
};

const WEIGHT_CHIP: Record<string, string> = {
  high: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

/** Circumference of the r=42 gauge, so the score can be drawn as a dash offset. */
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 42;

export function ScoreGauge({ analysis }: { analysis: Analysis }) {
  const style = BAND_STYLES[analysis.band];
  const offset = GAUGE_CIRCUMFERENCE * (1 - analysis.score / 100);

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          strokeWidth="7"
          className="stroke-slate-200 dark:stroke-white/10"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          className={style.ring}
          strokeDasharray={GAUGE_CIRCUMFERENCE}
          initial={{ strokeDashoffset: GAUGE_CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-display text-2xl font-bold tabular-nums", style.text)}>
          {analysis.score}
        </span>
        <span className="text-[0.625rem] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          risk score
        </span>
      </div>
    </div>
  );
}

/**
 * The contact details the extractor pulls out. Links are not listed here: they
 * are taken apart in `LinkBreakdown`, because a link is a structure and not a
 * string.
 */
const EXTRACTED_GROUPS = [
  { key: "emails", label: "Email addresses", Icon: AtSign },
  { key: "phones", label: "Phone numbers", Icon: Phone },
] as const;

function ExtractedEntities({ analysis }: { analysis: Analysis }) {
  const groups = EXTRACTED_GROUPS.map((group) => ({
    ...group,
    values: analysis.extracted[group.key],
  })).filter((group) => group.values.length > 0);

  if (groups.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-caption font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        Pulled out of the message
      </h3>
      <div className="mt-3 flex flex-col gap-3">
        {groups.map(({ key, label, Icon, values }) => (
          <div key={key} className="flex items-start gap-3">
            <Icon
              className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-caption font-medium text-slate-500 dark:text-slate-400">{label}</p>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {values.map((value) => (
                  <li
                    key={value}
                    /*
                     * Rendered as inert text, never as an anchor. Half of what
                     * lands here is the exact address the message was trying to
                     * get someone to open, and a report that makes it clickable
                     * hands them the click it was warning them about.
                     */
                    className="max-w-full break-all rounded-md border border-slate-900/[0.08] bg-slate-900/[0.03] px-2 py-0.5 font-mono text-[0.6875rem] text-slate-600 dark:border-white/10 dark:bg-black/20 dark:text-slate-300"
                  >
                    {value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AnalysisReportProps {
  analysis: Analysis;
  /** What was checked. Carried into the downloaded and shared copies. */
  submission: Submission;
  /** Offered where there is somewhere to go back to, i.e. the modal. */
  onCheckAnother?: () => void;
  /** The original uploads, for the optional AI image analysis. */
  files?: File[];
  className?: string;
}

/**
 * FR16–FR18. The verdict, its reasoning and its limits.
 *
 * Shared by the checker page and the modal rather than written twice. The
 * disclaimer below is an ethical requirement of the service, not decoration —
 * two copies of this markup would eventually be one copy with the disclaimer
 * and one without.
 */
export function AnalysisReport({
  analysis,
  submission,
  onCheckAnother,
  files = [],
  className,
}: AnalysisReportProps) {
  const style = BAND_STYLES[analysis.band];
  const { Icon } = style;

  /*
   * Stamped when this verdict is first shown rather than when a copy of it is
   * taken, so the downloaded file, the emailed summary and the line on screen
   * all name the same moment — a reader who exports twice should not get two
   * reports that disagree about when the check ran.
   */
  const generatedAt = useMemo(() => new Date(), [analysis]);

  return (
    <motion.div
      variants={staggerParent(0.08)}
      initial="hidden"
      animate="visible"
      className={cn("flex flex-col gap-5", className)}
    >
      <motion.div variants={fadeUp} className="flex flex-wrap items-start gap-5">
        <ScoreGauge analysis={analysis} />
        <div className="min-w-[14rem] flex-1">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em]",
              style.chip,
            )}
          >
            <Icon className="h-3 w-3" aria-hidden="true" />
            {analysis.band === "unclear" ? "inconclusive" : `${analysis.band} risk`}
          </span>
          <p className={cn("mt-2 font-display text-display-3 font-semibold", style.text)}>
            {analysis.headline}
          </p>
          <p className="mt-2 text-copy text-slate-600 dark:text-slate-400">{analysis.summary}</p>
          <p className="mt-3 font-mono text-caption text-slate-500 dark:text-slate-400">
            confidence {analysis.confidence.toFixed(2)} · advisory only
          </p>
        </div>
      </motion.div>

      {analysis.indicators.length > 0 ? (
        <motion.div variants={fadeUp}>
          <h3 className="text-caption font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Why — {analysis.indicators.length}{" "}
            {analysis.indicators.length === 1 ? "signal" : "signals"}
          </h3>
          <ul className="mt-3 flex flex-col divide-y divide-slate-900/[0.06] dark:divide-white/10">
            {analysis.indicators.map((indicator) => (
              <li key={indicator.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {indicator.label}
                  </p>
                  <p className="mt-0.5 text-copy text-slate-600 dark:text-slate-400">
                    {indicator.detail}
                  </p>
                  {indicator.evidence ? (
                    <p className="mt-1 break-all font-mono text-[0.6875rem] text-slate-500 dark:text-slate-400">
                      {indicator.evidence}
                    </p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-md border px-2 py-0.5 text-[0.625rem] font-semibold uppercase",
                    WEIGHT_CHIP[indicator.weight],
                  )}
                >
                  {indicator.weight}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      ) : null}

      {/* Each section is only laid out when it has something in it, so an empty
          one does not leave a gap the size of the column's spacing. */}
      {analysis.links.length > 0 ? (
        <motion.div variants={fadeUp}>
          <LinkBreakdown
            links={analysis.links}
            qrCodes={(submission.media ?? []).flatMap((file) => file.qrCodes ?? [])}
          />
        </motion.div>
      ) : null}

      {analysis.extracted.emails.length + analysis.extracted.phones.length > 0 ? (
        <motion.div variants={fadeUp}>
          <ExtractedEntities analysis={analysis} />
        </motion.div>
      ) : null}

      {(submission.media ?? []).some((file) => file.metadata) ? (
        <motion.div variants={fadeUp}>
          <FileDetails media={submission.media ?? []} />
        </motion.div>
      ) : null}

      {/*
       * The OpenAI second opinion. Offered after the rule-based verdict rather
       * than instead of it: the rules are explainable line by line and run
       * with nothing leaving the device, so they are the result; the model is
       * a second reader the person can choose to ask.
       */}
      <motion.div variants={fadeUp}>
        <AiSecondOpinion analysis={analysis} submission={submission} files={files} />
      </motion.div>

      {/*
       * Ethical requirement, stated at the point of the verdict rather than only
       * in a policy page — this is the moment a reader is deciding how much
       * authority to give the result.
       */}
      <motion.p
        variants={fadeUp}
        className="rounded-xl border border-slate-900/[0.06] bg-slate-900/[0.03] p-3 text-caption leading-relaxed text-slate-600 dark:border-white/10 dark:bg-black/20 dark:text-slate-400"
      >
        This is general guidance based on the text you provided, not a professional assessment, and
        it cannot guarantee that a message is safe or unsafe. If money has already changed hands,
        contact your bank first and then use the{" "}
        <a
          href={ROUTES.recover}
          className="font-medium text-indigo-600 underline underline-offset-4 dark:text-cyan-400"
        >
          recovery checklist
        </a>
        .
      </motion.p>

      <motion.div variants={fadeUp}>
        <ReportActions
          analysis={analysis}
          submission={submission}
          generatedAt={generatedAt}
          onCheckAnother={onCheckAnother}
        />
      </motion.div>
    </motion.div>
  );
}
