import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  AtSign,
  Camera,
  Link2,
  Phone,
  Scissors,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
} from "lucide-react";
import { ROUTES } from "@/config/site";
import { ReportActions } from "@/components/check/ReportActions";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import { ProgressRing } from "@/components/settings/ProgressRing";
import { SYNTHETIC_ABOVE } from "@/lib/scam/synthetic";
import type { Analysis, MediaDescriptor, RiskBand, Submission } from "@/lib/scam/types";
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
 * The three states an image's origin can be reported in.
 *
 * There is no "likely real" among them, and its absence is the point. The only
 * green this panel shows is `captured`, which requires a signed declaration
 * that a camera took the picture. An image with no metadata and a low model
 * score is `unconfirmed`, not clean — telling someone their screenshot passed
 * when nothing actually verified it is the failure mode that would make this
 * whole feature worse than not having it.
 */
type OriginVerdict = "generated" | "unconfirmed" | "captured";

const ORIGIN_STYLES: Record<
  OriginVerdict,
  { chip: string; dot: string; label: string; Icon: typeof ShieldCheck }
> = {
  generated: {
    chip: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
    label: "AI-generated",
    Icon: Sparkles,
  },
  unconfirmed: {
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    label: "Unconfirmed",
    Icon: ShieldQuestion,
  },
  captured: {
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    label: "Camera capture",
    Icon: Camera,
  },
};

/** Reduces the two origin passes on one image to a single reportable state. */
function originVerdict(file: MediaDescriptor): OriginVerdict {
  if (file.provenance?.status === "declared-ai") {
    return "generated";
  }

  if (file.provenance?.status === "declared-capture") {
    return "captured";
  }

  const synthetic = file.synthetic;

  if (synthetic && !synthetic.unavailable && synthetic.probability >= SYNTHETIC_ABOVE) {
    return "generated";
  }

  return "unconfirmed";
}

/**
 * What the forensic pass found on one image, and the map it drew.
 *
 * Kept beneath the origin verdict rather than beside it because it answers the
 * second question, not the first. An image can be a genuine photograph — camera
 * credentials and all — and still have had a figure painted over, and this is
 * the only part of the report that would say so.
 *
 * The error map is offered rather than shown. It is a picture of compression
 * error, not a picture of tampering, and unfolding it by default would invite
 * every reader to interpret ordinary texture as evidence.
 */
function ImageEdits({ file }: { file: MediaDescriptor }) {
  const edits = file.edits;

  if (!edits) {
    return null;
  }

  if (edits.unavailable) {
    return (
      <p className="mt-1.5 text-caption text-slate-500 dark:text-slate-400">{edits.unavailable}</p>
    );
  }

  return (
    <div className="mt-2 border-t border-slate-900/[0.06] pt-2 dark:border-white/10">
      {edits.findings.length === 0 ? (
        <p className="text-caption text-slate-500 dark:text-slate-400">
          {edits.examined ? `${edits.examined} checked` : "Checked"} for signs of editing; none
          found. A careful edit leaves none either.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {edits.findings.map((finding) => (
            <li key={finding.id} className="flex items-start gap-2">
              <Scissors
                className="mt-0.5 h-3 w-3 shrink-0 text-amber-500"
                aria-hidden="true"
              />
              <p className="text-copy leading-relaxed text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {finding.label}.
                </span>{" "}
                {finding.detail}
                {finding.evidence ? (
                  <span className="ml-1 font-mono text-caption text-slate-500 dark:text-slate-400">
                    ({finding.evidence})
                  </span>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      )}

      {edits.heatmap ? (
        <details className="mt-2 group">
          <summary className="cursor-pointer list-none text-caption text-ui-tint underline underline-offset-2">
            Show the compression error map
          </summary>
          <img
            src={edits.heatmap}
            alt={`Error level map for ${file.name}. Brighter areas compressed differently from the rest of the image.`}
            className="mt-2 w-full rounded-lg border border-slate-900/[0.06] bg-black dark:border-white/10"
          />
          <p className="mt-1.5 text-caption leading-relaxed text-slate-500 dark:text-slate-400">
            Brighter means the area changed more when the image was re-compressed. Edges, text and
            fine detail are bright on any image, including untouched ones — this map is a prompt to
            look, never a finding on its own.
          </p>
        </details>
      ) : null}
    </div>
  );
}

/**
 * Per-image origin, shown only when images were actually submitted.
 *
 * Separate from the indicator list because it answers a question the score does
 * not: the score is how scam-like the message is, and this is what could be
 * established about where one of its pictures came from. An image can be
 * verifiably AI-generated in a message that is otherwise entirely benign.
 */
function ImageOrigin({ media }: { media: MediaDescriptor[] }) {
  const images = media.filter(
    (file) => file.kind === "image" && (file.provenance || file.synthetic || file.edits),
  );

  if (images.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-caption font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        Where {images.length === 1 ? "the image" : "each image"} came from, and whether it was
        altered
      </h3>

      <ul className="mt-3 flex flex-col gap-2">
        {images.map((file) => {
          const verdict = originVerdict(file);
          const style = ORIGIN_STYLES[verdict];
          const reading = file.synthetic;

          return (
            <li
              key={file.name}
              className="rounded-xl border border-slate-900/[0.06] bg-slate-900/[0.02] p-3 dark:border-white/10 dark:bg-black/20"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 break-all font-mono text-[0.6875rem] text-slate-600 dark:text-slate-300">
                  {file.name}
                </p>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.1em]",
                    style.chip,
                  )}
                >
                  <style.Icon className="h-3 w-3" aria-hidden="true" />
                  {style.label}
                </span>
              </div>

              {file.provenance ? (
                <p className="mt-2 text-copy leading-relaxed text-slate-600 dark:text-slate-400">
                  {file.provenance.detail}
                </p>
              ) : null}

              {/*
               * The model's own number, shown whenever it ran — including when
               * it came back low. A detector that is only quoted when it agrees
               * with the verdict is not evidence, it is decoration.
               */}
              {reading?.unavailable ? (
                <p className="mt-1.5 text-caption text-slate-500 dark:text-slate-400">
                  {reading.unavailable}
                </p>
              ) : reading ? (
                <p className="mt-1.5 font-mono text-caption text-slate-500 dark:text-slate-400">
                  on-device model · {Math.round(reading.probability * 100)}% generated ·{" "}
                  {reading.model}
                </p>
              ) : null}

              <ImageEdits file={file} />
            </li>
          );
        })}
      </ul>

      <p className="mt-2 text-caption leading-relaxed text-slate-500 dark:text-slate-400">
        Images are checked on this device and are never uploaded. An image with nothing to confirm
        it is the ordinary case — messaging apps and social networks strip this information from
        every picture that passes through them, so its absence is not a sign of anything.
      </p>
    </div>
  );
}

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

      {submission.media && submission.media.length > 0 ? (
        <motion.div variants={fadeUp}>
          <ImageOrigin media={submission.media} />
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
