import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  AtSign,
  Camera,
  Phone,
  Scissors,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
} from "lucide-react";
import { ROUTES } from "@/config/site";
import { ReportActions } from "@/components/check/ReportActions";
import { LinkBreakdown } from "@/components/check/LinkBreakdown";
import { AiSecondOpinion } from "@/components/ai/AiSecondOpinion";
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

/** One label/value line in the file-detail list. */
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-[3px]">
      <dt className="shrink-0 text-caption text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="min-w-0 break-words text-right text-caption font-medium text-slate-700 dark:text-slate-300">
        {value}
      </dd>
    </div>
  );
}

const BYTE_UNITS = ["bytes", "KB", "MB", "GB"];

function bytes(size: number): string {
  let value = size;
  let unit = 0;
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${unit === 0 ? value : value.toFixed(1)} ${BYTE_UNITS[unit]}${
    unit > 0 ? ` (${size.toLocaleString()} bytes)` : ""
  }`;
}

/**
 * Everything the file said about itself.
 *
 * Always rendered when a file was submitted, including — especially — when
 * nothing was found. A reader who attached an image and was handed a score of
 * zero and no detail has been told their file was ignored, which is both untrue
 * and the single most common way this checker looked broken.
 */
function FileDetails({ file }: { file: MediaDescriptor }) {
  const meta = file.metadata;

  if (!meta) {
    return null;
  }

  const exif = meta.exif;

  return (
    <details className="mt-2 border-t border-slate-900/[0.06] pt-2 dark:border-white/10" open>
      <summary className="cursor-pointer list-none text-caption font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        File and image details
      </summary>

      <dl className="mt-2 divide-y divide-slate-900/[0.04] dark:divide-white/[0.06]">
        <Detail label="Size" value={bytes(meta.sizeBytes)} />
        {meta.width && meta.height ? (
          <Detail
            label="Dimensions"
            value={`${meta.width} × ${meta.height} px (${(
              (meta.width * meta.height) / 1_000_000
            ).toFixed(2)} MP)`}
          />
        ) : null}
        {meta.format ? <Detail label="Format" value={meta.format} /> : null}
        <Detail
          label="Declared type"
          value={
            meta.typeMatches === false
              ? `${meta.declaredType} — but the bytes are ${meta.sniffedLabel}`
              : `${meta.declaredType}${
                  meta.sniffedLabel ? ` (bytes confirm ${meta.sniffedLabel})` : ""
                }`
          }
        />
        {meta.colour ? <Detail label="Colour" value={meta.colour} /> : null}
        {meta.bitDepth ? <Detail label="Bit depth" value={`${meta.bitDepth}-bit`} /> : null}
        {meta.subsampling ? <Detail label="Chroma subsampling" value={meta.subsampling} /> : null}
        {typeof meta.quality === "number" ? (
          <Detail label="JPEG quality (estimated)" value={`about ${meta.quality} of 100`} />
        ) : null}
        {meta.progressive !== undefined ? (
          <Detail label="Encoding" value={meta.progressive ? "Progressive" : "Baseline"} />
        ) : null}
        {meta.interlaced !== undefined ? (
          <Detail label="Interlacing" value={meta.interlaced ? "Interlaced (Adam7)" : "None"} />
        ) : null}
        <Detail label="Colour profile" value={meta.iccProfile ?? "none embedded"} />
        <Detail
          label="Metadata carried"
          value={meta.segments?.length ? meta.segments.join(", ") : "none"}
        />
        {meta.lastModified ? (
          <Detail
            label="File modified"
            value={new Date(meta.lastModified).toLocaleString("en-AU")}
          />
        ) : null}
        {meta.sha256 ? (
          <Detail label="SHA-256" value={`${meta.sha256.slice(0, 32)}…`} />
        ) : null}
      </dl>

      {/* The camera record, kept as its own list because its absence means
          something different from a missing colour profile: it is the ordinary
          state of every image that has been through a messaging app. */}
      <p className="mt-3 text-caption font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        Camera record (EXIF)
      </p>

      {exif?.present ? (
        <dl className="mt-1 divide-y divide-slate-900/[0.04] dark:divide-white/[0.06]">
          <Detail label="Tags found" value={String(exif.fields)} />
          {exif.make || exif.model ? (
            <Detail label="Camera" value={[exif.make, exif.model].filter(Boolean).join(" ")} />
          ) : null}
          {exif.lens ? <Detail label="Lens" value={exif.lens} /> : null}
          {exif.software ? <Detail label="Software" value={exif.software} /> : null}
          {exif.taken ? (
            <Detail label="Taken" value={new Date(exif.taken).toLocaleString("en-AU")} />
          ) : null}
          {exif.capturedWidth && exif.capturedHeight ? (
            <Detail
              label="Captured at"
              value={`${exif.capturedWidth} × ${exif.capturedHeight} px`}
            />
          ) : null}
          {exif.orientation ? <Detail label="Orientation" value={String(exif.orientation)} /> : null}
          <Detail
            label="Location"
            value={
              exif.gps
                ? `${exif.gps.lat.toFixed(5)}, ${exif.gps.lon.toFixed(5)}`
                : "not recorded"
            }
          />
        </dl>
      ) : (
        <p className="mt-1 text-copy leading-relaxed text-slate-600 dark:text-slate-400">
          None. The file carries no camera record at all. This is the ordinary state of a
          screenshot, and of any photograph that has passed through a messaging app or a social
          network — they strip it. Its absence says nothing about whether the image is genuine.
        </p>
      )}

      {exif?.gps ? (
        <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-copy leading-relaxed text-amber-700 dark:text-amber-400">
          This image carries the coordinates of where it was taken. Sending it to anyone sends
          that location with it. Nothing was uploaded from here — the coordinates were read on
          this device — but consider stripping them before you forward the file.
        </p>
      ) : null}
    </details>
  );
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
    (file) =>
      file.metadata || (file.kind === "image" && (file.provenance || file.synthetic || file.edits)),
  );

  if (images.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-caption font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        What {images.length === 1 ? "the file" : "each file"} is, where it came from, and whether
        it was altered
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
                {/* The origin verdict is about pixels, so it is shown only for
                    images. A PDF gets its details and no chip, rather than an
                    "unconfirmed" badge for a question never asked of it. */}
                {file.kind === "image" ? (
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.1em]",
                      style.chip,
                    )}
                  >
                    <style.Icon className="h-3 w-3" aria-hidden="true" />
                    {style.label}
                  </span>
                ) : null}
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
              <FileDetails file={file} />
            </li>
          );
        })}
      </ul>

      <p className="mt-2 text-caption leading-relaxed text-slate-500 dark:text-slate-400">
        Every one of these checks ran on this device and nothing was uploaded — the file never left
        your browser. An image with nothing to confirm it is the ordinary case: messaging apps and
        social networks strip this information from every picture that passes through them, so its
        absence is not a sign of anything.
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

/**
 * The contact details the extractor pulls out. Links are not listed here: they
 * are taken apart in `LinkBreakdown`, because a link is a structure and not a
 * string (Lecturer feedback, point 2).
 */
const EXTRACTED_GROUPS = [
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
  /** The original uploads, for the optional AI image analysis. */
  files?: File[];
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

      {/*
       * The OpenAI second opinion. Offered after the rule-based verdict rather
       * than instead of it: the rules are explainable line by line and run
       * with nothing leaving the device, so they are the result; the model is
       * a second reader the person can choose to ask.
       */}
      <motion.div variants={fadeUp}>
        <AiSecondOpinion analysis={analysis} submission={submission} files={files} />
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
