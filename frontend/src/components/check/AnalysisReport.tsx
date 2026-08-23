import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, AtSign, Link2, Phone, ShieldCheck, ShieldQuestion } from "lucide-react";
import { ROUTES } from "@/config/site";
import { ReportActions } from "@/components/check/ReportActions";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import { ProgressRing } from "@/components/settings/ProgressRing";
import type { Analysis, RiskBand, Submission } from "@/lib/scam/types";
import { fadeUp, staggerParent } from "@/lib/motion";
import { cn } from "@/lib/cn";

/**
 * One band, one colour, used everywhere the verdict is stated.
 *
 * The ring, the chip and the headline all take their colour from the same
 * entry, so a reader who learns what amber means on the gauge does not have to
 * learn it again three inches lower. Colour is never the only carrier — the
 * band is always spelled out in words beside it (UI-8, WCAG 1.4.1).
 */
const BAND_STYLES: Record<
  RiskBand,
  { ring: string; text: string; chip: string; tile: string; Icon: typeof ShieldCheck }
> = {
  high: {
    ring: "stroke-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    chip: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
    tile: "bg-rose-500",
    Icon: AlertTriangle,
  },
  medium: {
    ring: "stroke-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    chip: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
    tile: "bg-amber-500",
    Icon: ShieldQuestion,
  },
  low: {
    ring: "stroke-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    chip: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
    tile: "bg-emerald-500",
    Icon: ShieldCheck,
  },
  unclear: {
    ring: "stroke-slate-400",
    text: "text-ui-label",
    chip: "bg-slate-500/12 text-ui-label-2",
    tile: "bg-slate-500",
    Icon: ShieldQuestion,
  },
};

const WEIGHT_CHIP: Record<string, string> = {
  high: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
  medium: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
  low: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
};

/**
 * The verdict, drawn as the accessory panel draws a battery.
 *
 * Exported because the checker's own progress step shows the same dial while
 * the analysis runs, and two dials that disagree by a pixel is exactly what a
 * reader notices when one replaces the other.
 */
export function ScoreGauge({ analysis, size = 104 }: { analysis: Analysis; size?: number }) {
  const style = BAND_STYLES[analysis.band];

  return (
    <ProgressRing value={analysis.score} size={size} trackClassName={style.ring}>
      <span className={cn("text-[1.5rem] font-semibold tabular-nums leading-none", style.text)}>
        {analysis.score}
      </span>
      <span className="mt-0.5 text-[0.625rem] uppercase tracking-[0.1em] text-ui-label-3">
        risk
      </span>
    </ProgressRing>
  );
}

/** The three kinds of thing the extractor pulls out, and how to label each. */
const EXTRACTED_GROUPS = [
  { key: "urls", label: "Links", Icon: Link2, tile: "bg-sky-500" },
  { key: "emails", label: "Email addresses", Icon: AtSign, tile: "bg-violet-500" },
  { key: "phones", label: "Phone numbers", Icon: Phone, tile: "bg-teal-500" },
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
    <SettingsGroup
      title="Pulled out of the message"
      footer="Shown as plain text, never as links. Half of what lands here is the exact address the message wanted opened."
    >
      <SettingsRows>
        {groups.map(({ key, label, Icon, tile, values }) => (
          <SettingsRow
            key={key}
            icon={Icon}
            iconClassName={tile}
            label={label}
            value={`${values.length}`}
            detail={
              <span className="mt-1 flex flex-wrap gap-1.5">
                {values.map((value) => (
                  <span
                    key={value}
                    /*
                     * Inert text, never an anchor — a report that makes the
                     * address clickable hands the reader the click it was
                     * warning them about.
                     */
                    className="max-w-full break-all rounded-md bg-ui-fill px-1.5 py-0.5 font-mono text-[0.6875rem] text-ui-label-2"
                  >
                    {value}
                  </span>
                ))}
              </span>
            }
          />
        ))}
      </SettingsRows>
    </SettingsGroup>
  );
}

interface AnalysisReportProps {
  analysis: Analysis;
  /** What was checked. Carried into the downloaded and shared copies. */
  submission: Submission;
  /** Offered where there is somewhere to go back to, i.e. the modal. */
  onCheckAnother?: () => void;
  className?: string;
}

/**
 * FR16–FR18. The verdict, its reasoning and its limits.
 *
 * Set as a settings pane: a gauge at the head, then grouped cards, each with
 * its caveat printed underneath it rather than collected into a block of small
 * print at the end. That arrangement is the point rather than the style — the
 * limits of a signal belong next to the signal, where someone deciding how
 * much to trust it is actually looking.
 *
 * Shared by the checker page and the modal rather than written twice. The
 * disclaimer below is an ethical requirement of the service, not decoration:
 * two copies of this markup would eventually be one copy with the disclaimer
 * and one without.
 */
export function AnalysisReport({
  analysis,
  submission,
  onCheckAnother,
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
      variants={staggerParent(0.07)}
      initial="hidden"
      animate="visible"
      className={cn("flex flex-col gap-7 font-system text-ui-label", className)}
    >
      <motion.header variants={fadeUp} className="flex flex-col items-center pt-1 text-center">
        <ScoreGauge analysis={analysis} />

        <span
          className={cn(
            "mt-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em]",
            style.chip,
          )}
        >
          <Icon className="h-3 w-3" aria-hidden="true" />
          {analysis.band === "unclear" ? "inconclusive" : `${analysis.band} risk`}
        </span>

        <h2
          className={cn(
            "mt-3 max-w-[26rem] text-[1.375rem] font-semibold leading-tight tracking-[-0.02em]",
            style.text,
          )}
        >
          {analysis.headline}
        </h2>
        <p className="mt-2 max-w-[30rem] text-[0.9375rem] leading-relaxed text-ui-label-2">
          {analysis.summary}
        </p>
      </motion.header>

      {analysis.indicators.length > 0 ? (
        <motion.div variants={fadeUp}>
          <SettingsGroup
            title={`Why — ${analysis.indicators.length} ${
              analysis.indicators.length === 1 ? "signal" : "signals"
            }`}
            footer="Each signal is a pattern seen in reported scams, not proof. Weight is how much it moved the score."
          >
            <SettingsRows>
              {analysis.indicators.map((indicator) => (
                <SettingsRow
                  key={indicator.id}
                  label={indicator.label}
                  detail={
                    <>
                      {indicator.detail}
                      {indicator.evidence ? (
                        <span className="mt-1 block break-all font-mono text-[0.6875rem] text-ui-label-3">
                          {indicator.evidence}
                        </span>
                      ) : null}
                    </>
                  }
                  trailing={
                    <span
                      className={cn(
                        "shrink-0 self-start rounded-md px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase",
                        WEIGHT_CHIP[indicator.weight],
                      )}
                    >
                      {indicator.weight}
                    </span>
                  }
                />
              ))}
            </SettingsRows>
          </SettingsGroup>
        </motion.div>
      ) : null}

      <motion.div variants={fadeUp}>
        <ExtractedEntities analysis={analysis} />
      </motion.div>

      <motion.div variants={fadeUp}>
        <SettingsGroup title="How much to trust this">
          <SettingsRows>
            <SettingsRow label="Confidence" value={analysis.confidence.toFixed(2)} />
            <SettingsRow label="Checked" value="On your device" />
            <SettingsRow label="Standing" value="Advisory only" />
          </SettingsRows>
        </SettingsGroup>

        {/*
         * Ethical requirement, stated at the point of the verdict rather than
         * only in a policy page — this is the moment a reader is deciding how
         * much authority to give the result. It is the group's own footer, so
         * it cannot be scrolled past on the way to the actions.
         */}
        <p className="px-4 pt-2 text-[0.8125rem] leading-[1.45] text-ui-label-2">
          This is general guidance based on what you provided, not a professional assessment, and it
          cannot guarantee that a message is safe or unsafe. If money has already changed hands,
          contact your bank first and then use the{" "}
          <a href={ROUTES.recover} className="text-ui-tint underline underline-offset-2">
            recovery checklist
          </a>
          .
        </p>
      </motion.div>

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
