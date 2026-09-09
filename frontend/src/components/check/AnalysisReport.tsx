import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  AtSign,
  Camera,
  EyeOff,
  FileText,
  MapPin,
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
import { assessOrigin, type OriginAnswer, type OriginAssessment } from "@/lib/scam/origin";
import type { LinkReport } from "@/lib/scam/links";
import type { Analysis, FileMetadata, MediaDescriptor, RiskBand, Submission } from "@/lib/scam/types";
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
 * How each answer to "is this AI-generated?" is shown.
 *
 * There is no green for "probably fine" among them, and its absence is the
 * point. The only calm state is `captured`, which requires a signature saying
 * a camera took the picture. An image with no metadata and a low model score
 * is `unclear` — telling somebody their screenshot passed when nothing
 * actually verified it is the failure that would make this whole feature
 * worse than not having it.
 */
const ORIGIN_STYLES: Record<
  OriginAnswer,
  { chip: string; bar: string; label: string; Icon: typeof ShieldCheck }
> = {
  generated: {
    chip: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    bar: "bg-rose-500",
    label: "AI-generated",
    Icon: Sparkles,
  },
  "likely-generated": {
    chip: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    bar: "bg-rose-500",
    label: "Probably AI",
    Icon: Sparkles,
  },
  "leaning-generated": {
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500",
    label: "Possibly AI",
    Icon: ShieldQuestion,
  },
  unclear: {
    chip: "border-slate-500/30 bg-slate-500/10 text-ui-label-2",
    bar: "bg-slate-400",
    label: "Cannot tell",
    Icon: ShieldQuestion,
  },
  "likely-captured": {
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
    label: "Probably a photo",
    Icon: Camera,
  },
  captured: {
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
    label: "Camera capture",
    Icon: Camera,
  },
};

/**
 * The answer, its number, and the evidence on both sides of it.
 *
 * The scale is drawn because the number is the answer: a reader who is told
 * "possibly" needs to see whether that means 52% or 79%, and whether it rests
 * on one damped model reading or on four things agreeing. Both columns are
 * shown even when one is empty, because "nothing at all argued against this"
 * is a fact about the evidence and an absent column looks like an oversight.
 */
function OriginVerdict({ origin }: { origin: OriginAssessment }) {
  const style = ORIGIN_STYLES[origin.answer];
  const percent = Math.round(origin.probability * 100);

  return (
    <div className="mt-3 rounded-xl border border-slate-900/[0.06] bg-white/60 p-3 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-caption font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Is this AI-generated?
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

      <p className="mt-1.5 text-[0.9375rem] font-semibold leading-snug text-slate-800 dark:text-slate-200">
        {origin.headline}
      </p>

      {/* The estimate, drawn and stated. Labelled as an estimate in the same
          breath, because a bar reads as a measurement unless it is told not to. */}
      <div className="mt-2 flex items-center gap-2.5">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10"
          role="img"
          aria-label={`Estimated ${percent} per cent likely to be AI-generated`}
        >
          <div className={cn("h-full rounded-full", style.bar)} style={{ width: `${percent}%` }} />
        </div>
        <span className="shrink-0 font-mono text-caption tabular-nums text-slate-600 dark:text-slate-300">
          {percent}%
        </span>
      </div>

      <p className="mt-1 text-caption text-slate-500 dark:text-slate-400">
        This service&rsquo;s own estimate, weighing every signal below · {origin.confidence} confidence
      </p>

      <p className="mt-2 text-copy leading-relaxed text-slate-600 dark:text-slate-400">
        {origin.detail}
      </p>

      <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
        <ReasonColumn
          title="Points to generated"
          reasons={origin.towardsGenerated}
          empty="Nothing found argued that this was generated."
        />
        <ReasonColumn
          title="Points to photographed"
          reasons={origin.towardsCaptured}
          empty="Nothing found argued that this was photographed."
        />
      </div>

      <p className="mt-2.5 border-t border-slate-900/[0.06] pt-2 text-caption leading-relaxed text-slate-500 dark:border-white/10 dark:text-slate-400">
        {origin.limits}
      </p>
    </div>
  );
}

/** How much each reason moved the answer, so the reasoning can be argued with. */
function ReasonColumn({
  title,
  reasons,
  empty,
}: {
  title: string;
  reasons: OriginAssessment["towardsGenerated"];
  empty: string;
}) {
  return (
    <div>
      <p className="text-caption font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
        {title}
      </p>
      {reasons.length === 0 ? (
        <p className="mt-1 text-caption leading-relaxed text-slate-500 dark:text-slate-400">
          {empty}
        </p>
      ) : (
        <ul className="mt-1 flex flex-col gap-1.5">
          {reasons.map((reason) => (
            <li key={reason.text} className="text-copy leading-relaxed text-slate-600 dark:text-slate-400">
              {reason.text}
              <span className="ml-1 font-mono text-caption text-slate-400 dark:text-slate-500">
                ({reason.kind}, weight {Math.abs(reason.weight).toFixed(1)})
              </span>
            </li>
          ))}
        </ul>
      )}
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

/** A short label/value row, used wherever the file states a fact about itself. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-[3px]">
      <dt className="shrink-0 text-caption text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="min-w-0 break-words text-right text-caption font-medium text-slate-700 dark:text-slate-300">
        {value}
      </dd>
    </div>
  );
}

/** A heading inside the detail panel. */
function Subhead({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 text-caption font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
      {children}
    </p>
  );
}

function when(iso: string | undefined): string | undefined {
  if (!iso) {
    return undefined;
  }

  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString("en-AU");
}

/**
 * The size and shape of the picture, as its owner's own machine reports it.
 *
 * The stored frame and the displayed frame differ whenever a phone writes a
 * landscape file with a "rotate 90°" flag, which is most photographs taken
 * upright. Every viewer shows the rotated result, so that is what is shown
 * first — and the stored frame is kept beside it, because the difference
 * between the two is itself worth knowing and hiding it would just move the
 * disagreement somewhere else.
 */
function dimensions(meta: FileMetadata): string | null {
  const width = meta.displayWidth ?? meta.width;
  const height = meta.displayHeight ?? meta.height;

  if (!width || !height) {
    return null;
  }

  const megapixels = ((width * height) / 1_000_000).toFixed(2);
  const turned = meta.width !== width || meta.height !== height;

  return `${width} × ${height} px (${megapixels} MP)${
    turned ? `, stored as ${meta.width} × ${meta.height} and rotated on display` : ""
  }`;
}

/**
 * Everything the file said about itself.
 *
 * Always rendered when a file was submitted, including — especially — when
 * nothing was found. A reader who attached an image and was handed a score of
 * zero and no detail has been told their file was ignored, which is both
 * untrue and the single most common way this checker looked broken.
 */
function FileDetails({ file }: { file: MediaDescriptor }) {
  const meta = file.metadata;

  if (!meta) {
    return null;
  }

  const exif = meta.exif;
  const container = meta.container;
  const size = dimensions(meta);

  return (
    <details className="mt-2 border-t border-slate-900/[0.06] pt-2 dark:border-white/10" open>
      <summary className="cursor-pointer list-none text-caption font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        File and image details
      </summary>

      <dl className="mt-2 divide-y divide-slate-900/[0.04] dark:divide-white/[0.06]">
        <Row label="Size" value={bytes(meta.sizeBytes)} />
        {size ? <Row label="Dimensions" value={size} /> : null}
        {meta.format ? <Row label="Format" value={meta.format} /> : null}
        <Row
          label="Declared type"
          value={
            meta.typeMatches === false
              ? `${meta.declaredType} — but the bytes are ${meta.sniffedLabel}`
              : `${meta.declaredType}${
                  meta.sniffedLabel ? ` (bytes confirm ${meta.sniffedLabel})` : ""
                }`
          }
        />
        {meta.colour ? (
          <Row
            label="Colour"
            value={`${meta.colour}${meta.hasAlpha ? ", with transparency" : ""}`}
          />
        ) : null}
        {meta.bitDepth ? <Row label="Bit depth" value={`${meta.bitDepth}-bit`} /> : null}
        {meta.subsampling ? <Row label="Chroma subsampling" value={meta.subsampling} /> : null}
        {meta.dpi ? <Row label="Resolution" value={`${meta.dpi} dpi as declared`} /> : null}
        {typeof meta.quality === "number" ? (
          <Row label="JPEG quality (estimated)" value={`about ${meta.quality} of 100`} />
        ) : null}
        {meta.progressive !== undefined ? (
          <Row label="Encoding" value={meta.progressive ? "Progressive" : "Baseline"} />
        ) : null}
        {meta.interlaced !== undefined ? (
          <Row label="Interlacing" value={meta.interlaced ? "Interlaced (Adam7)" : "None"} />
        ) : null}
        {meta.orientationLabel ? (
          <Row label="Orientation" value={`${meta.orientationLabel} (flag ${meta.orientation})`} />
        ) : null}
        <Row label="Colour profile" value={meta.iccProfile ?? "none embedded"} />
        <Row
          label="Metadata carried"
          value={meta.segments?.length ? meta.segments.join(", ") : "none"}
        />
        {meta.tagCounts ? (
          <Row
            label="Tags by block"
            value={`Exif ${meta.tagCounts.exif} · GPS ${meta.tagCounts.gps} · XMP ${meta.tagCounts.xmp} · IPTC ${meta.tagCounts.iptc} · ICC ${meta.tagCounts.icc}`}
          />
        ) : null}
        {meta.lastModified ? (
          <Row
            label="Modified (as your device records it)"
            value={new Date(meta.lastModified).toLocaleString("en-AU")}
          />
        ) : null}
        {meta.sha256 ? <Row label="SHA-256" value={meta.sha256} /> : null}
      </dl>

      {/* The filesystem timestamp is the one number people compare against
          their own machine and find different, because it is not the same
          number their machine labels "Created". Saying so is cheaper than
          being wrong about it. */}
      <p className="mt-1.5 text-caption leading-relaxed text-slate-500 dark:text-slate-400">
        The modified time above is what your own device reports for this copy of the file. It is
        not the same as the &ldquo;created&rdquo; date a file browser shows, which records when the
        copy arrived on that machine — a file that was downloaded, sent to you or restored from a
        backup will have a newer one. The dates written inside the file, below, are the ones that
        travel with it.
      </p>

      {meta.metadataUnreadable ? (
        <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-copy leading-relaxed text-amber-700 dark:text-amber-400">
          {meta.metadataUnreadable}
        </p>
      ) : null}

      {/* Who and what made it. Gathered into one list whatever format it came
          from, because "where did this come from" is one question whether the
          answer sits in a camera's EXIF or a PDF's information dictionary. */}
      {meta.author || meta.software || meta.copyright || container?.people.lastEditedBy ? (
        <>
          <Subhead>Who and what made it</Subhead>
          <dl className="mt-1 divide-y divide-slate-900/[0.04] dark:divide-white/[0.06]">
            {meta.author ? <Row label="Named author" value={meta.author} /> : null}
            {container?.people.lastEditedBy ? (
              <Row label="Last saved by" value={container.people.lastEditedBy} />
            ) : null}
            {container?.people.company ? (
              <Row label="Organisation" value={container.people.company} />
            ) : null}
            {meta.software ? <Row label="Written by" value={meta.software} /> : null}
            {container?.people.producer && container.people.producer !== meta.software ? (
              <Row label="Produced by" value={container.people.producer} />
            ) : null}
            {meta.copyright ? <Row label="Copyright" value={meta.copyright} /> : null}
          </dl>
          <p className="mt-1.5 text-caption leading-relaxed text-slate-500 dark:text-slate-400">
            None of these names is signed or verified. They are fields inside the file that whoever
            made it filled in, and anybody with the right tool can change them.
          </p>
        </>
      ) : null}

      {/* Container structure, for the files that are not pictures. */}
      {container ? (
        <>
          <Subhead>Document structure</Subhead>
          <dl className="mt-1 divide-y divide-slate-900/[0.04] dark:divide-white/[0.06]">
            {container.count !== undefined ? (
              <Row label="Contains" value={`${container.count} ${container.countLabel ?? "items"}`} />
            ) : null}
            {container.revisions !== undefined ? (
              <Row
                label="Times written"
                value={
                  container.revisions === 1
                    ? "once — this is the document as first produced"
                    : `${container.revisions}, so it was changed after it was first produced`
                }
              />
            ) : null}
            {when(container.created) ? (
              <Row label="Created (recorded inside)" value={when(container.created)!} />
            ) : null}
            {when(container.modified) ? (
              <Row label="Modified (recorded inside)" value={when(container.modified)!} />
            ) : null}
          </dl>

          {container.entries && container.entries.length > 0 ? (
            <details className="mt-2">
              <summary className="cursor-pointer list-none text-caption text-ui-tint underline underline-offset-2">
                Show the {container.entries.length} entries inside it
              </summary>
              <ul className="mt-1.5 flex flex-col gap-0.5">
                {container.entries.map((entry) => (
                  <li
                    key={entry}
                    className="break-all font-mono text-[0.6875rem] text-slate-500 dark:text-slate-400"
                  >
                    {entry}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          {container.unavailable ? (
            <p className="mt-1.5 text-caption text-slate-500 dark:text-slate-400">
              {container.unavailable}
            </p>
          ) : null}
        </>
      ) : null}

      {/* The camera record, kept as its own list because its absence means
          something different from a missing colour profile: it is the ordinary
          state of every image that has been through a messaging app. */}
      <Subhead>Camera record (EXIF)</Subhead>

      {exif?.present ? (
        <dl className="mt-1 divide-y divide-slate-900/[0.04] dark:divide-white/[0.06]">
          <Row label="Tags found" value={String(exif.fields)} />
          {exif.make || exif.model ? (
            <Row label="Device" value={[exif.make, exif.model].filter(Boolean).join(" ")} />
          ) : null}
          {exif.lens ? <Row label="Lens" value={exif.lens} /> : null}
          {exif.serial ? <Row label="Serial number" value={exif.serial} /> : null}
          {exif.exposure ? <Row label="Exposure" value={exif.exposure} /> : null}
          {exif.software ? <Row label="Software" value={exif.software} /> : null}
          {when(exif.taken) ? (
            <Row
              label="Taken"
              value={`${when(exif.taken)}${exif.offset ? ` (camera set to ${exif.offset})` : ""}`}
            />
          ) : null}
          {when(exif.digitised) && exif.digitised !== exif.taken ? (
            <Row label="Digitised" value={when(exif.digitised)!} />
          ) : null}
          {when(exif.changed) ? <Row label="Last written" value={when(exif.changed)!} /> : null}
          {exif.capturedWidth && exif.capturedHeight ? (
            <Row label="Captured at" value={`${exif.capturedWidth} × ${exif.capturedHeight} px`} />
          ) : null}
          {exif.thumbnail !== undefined ? (
            <Row
              label="Embedded preview"
              value={exif.thumbnail ? "present" : "none"}
            />
          ) : null}
          <Row
            label="Location"
            value={
              exif.gps
                ? `${exif.gps.lat.toFixed(5)}, ${exif.gps.lon.toFixed(5)}${
                    typeof exif.gps.altitude === "number"
                      ? `, ${Math.round(exif.gps.altitude)} m`
                      : ""
                  }`
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
        <p className="mt-2 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-copy leading-relaxed text-amber-700 dark:text-amber-400">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            This image carries the coordinates of where it was taken. Sending it to anyone sends
            that location with it. Nothing was uploaded from here — the coordinates were read on
            this device — but consider stripping them before you forward the file.
          </span>
        </p>
      ) : null}
    </details>
  );
}

/**
 * What the file carries that it has no reason to carry.
 *
 * Reported whether or not anything was found, and with what was searched named
 * either way. "Nothing hidden" from a check that says which hiding places it
 * looked in is a useful sentence; the same words from a check that will not say
 * are a claim nobody should accept.
 */
function HiddenContents({ file }: { file: MediaDescriptor }) {
  const hidden = file.metadata?.hidden;

  if (!hidden) {
    return null;
  }

  return (
    <div className="mt-2 border-t border-slate-900/[0.06] pt-2 dark:border-white/10">
      {hidden.findings.length === 0 ? (
        <p className="text-caption leading-relaxed text-slate-500 dark:text-slate-400">
          Nothing hidden was found. Searched: {hidden.examined}
          {hidden.trailingBytes === 0 ? ", and the file ends exactly where it should" : ""}. This
          does not rule out data concealed inside the picture itself, which needs a different kind
          of analysis than any browser can do.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {hidden.findings.map((finding) => (
            <li key={finding.id} className="flex items-start gap-2">
              <EyeOff className="mt-0.5 h-3 w-3 shrink-0 text-rose-500" aria-hidden="true" />
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
    </div>
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
 * One card per file: what it is, where it came from, and what is inside it.
 *
 * Separate from the indicator list because it answers questions the score does
 * not. The score is how scam-like a message is; this is what could be
 * established about the file that came with it. An image can be verifiably
 * AI-generated in a message that is otherwise entirely benign, and a PDF can
 * be a genuine document that has been saved over twice.
 */
function FilePanel({ media }: { media: MediaDescriptor[] }) {
  const files = media.filter(
    (file) => file.metadata || file.provenance || file.synthetic || file.edits,
  );

  if (files.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-caption font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        What {files.length === 1 ? "the file" : "each file"} is, where it came from, and whether it
        was altered
      </h3>

      <ul className="mt-3 flex flex-col gap-2">
        {files.map((file) => {
          const origin = file.origin ?? assessOrigin(file);

          return (
            <li
              key={file.name}
              className="rounded-xl border border-slate-900/[0.06] bg-slate-900/[0.02] p-3 dark:border-white/10 dark:bg-black/20"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 break-all font-mono text-[0.6875rem] text-slate-600 dark:text-slate-300">
                  {file.name}
                </p>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-900/[0.05] px-2.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:bg-white/10 dark:text-slate-400">
                  <FileText className="h-3 w-3" aria-hidden="true" />
                  {file.metadata?.sniffedLabel ?? file.kind}
                </span>
              </div>

              {file.provenance ? (
                <p className="mt-2 text-copy leading-relaxed text-slate-600 dark:text-slate-400">
                  {file.provenance.detail}
                </p>
              ) : null}

              {/* The single answer to the question people actually came with,
                  shown for images only — it is a question about pixels, and a
                  PDF should get its details rather than a verdict on one that
                  was never asked of it. */}
              {origin ? <OriginVerdict origin={origin} /> : null}

              {/* The model's own number, shown whenever it ran, including when
                  it came back low. A detector quoted only when it agrees with
                  the verdict is not evidence, it is decoration. */}
              {file.synthetic?.unavailable ? (
                <p className="mt-1.5 text-caption text-slate-500 dark:text-slate-400">
                  {file.synthetic.unavailable}
                </p>
              ) : file.synthetic ? (
                <p className="mt-1.5 font-mono text-caption text-slate-500 dark:text-slate-400">
                  on-device model · {Math.round(file.synthetic.probability * 100)}% generated ·{" "}
                  {file.synthetic.model}
                </p>
              ) : null}

              <ImageEdits file={file} />
              <HiddenContents file={file} />
              <FileDetails file={file} />
            </li>
          );
        })}
      </ul>

      <p className="mt-2 text-caption leading-relaxed text-slate-500 dark:text-slate-400">
        Every one of these checks ran on this device and nothing was uploaded — the file never left
        your browser. A file with nothing to confirm it is the ordinary case: messaging apps and
        social networks strip this information from everything that passes through them, so its
        absence is not a sign of anything.
      </p>
    </div>
  );
}

/** How a link's own findings are coloured, matching the indicator weights. */
const LINK_WEIGHT_DOT: Record<string, string> = {
  high: "bg-rose-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
};

/**
 * Where each link actually goes.
 *
 * The old report listed addresses under "pulled out of the message" and left
 * it there, which answers a question nobody asked. What somebody holding a
 * shortened link wants is the destination, and that is what leads here: the
 * end of the chain first, the hops beneath it, and the address as written last,
 * because the address as written is the part designed to mislead.
 *
 * Nothing in this section is a real anchor. A report that makes the address
 * clickable hands the reader the click it was warning them about.
 */
function LinkPanel({ links }: { links: LinkReport[] }) {
  if (links.length === 0) {
    return null;
  }

  const followed = links.filter((link) => link.resolution && !link.resolution.error).length;

  return (
    <div>
      <h3 className="text-caption font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        Where {links.length === 1 ? "the link goes" : `each of the ${links.length} links goes`}
      </h3>

      <ul className="mt-3 flex flex-col gap-2">
        {links.map((link) => (
          <li
            key={link.raw}
            className="rounded-xl border border-slate-900/[0.06] bg-slate-900/[0.02] p-3 dark:border-white/10 dark:bg-black/20"
          >
            <p className="text-copy font-medium leading-relaxed text-slate-700 dark:text-slate-300">
              {link.summary}
            </p>

            {/* The chain, in the order a browser would walk it. */}
            {link.resolution && link.resolution.hops.length > 1 ? (
              <ol className="mt-2 flex flex-col gap-1">
                {link.resolution.hops.map((hop, index) => (
                  <li key={`${hop.url}-${index}`} className="flex items-start gap-1.5">
                    <ArrowRight
                      className="mt-1 h-3 w-3 shrink-0 text-slate-400 dark:text-slate-500"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 break-all font-mono text-[0.6875rem] text-slate-500 dark:text-slate-400">
                      {hop.url}
                      <span className="ml-1.5 text-slate-400 dark:text-slate-500">
                        {hop.status || "no reply"}
                        {hop.via === "meta-refresh" ? " · forwarded by the page" : ""}
                        {hop.via === "script" ? " · forwarded by script" : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : null}

            {link.findings.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-1.5">
                {link.findings.map((finding) => (
                  <li key={finding.id} className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                        LINK_WEIGHT_DOT[finding.weight],
                      )}
                      aria-hidden="true"
                    />
                    <p className="text-copy leading-relaxed text-slate-600 dark:text-slate-400">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {finding.label}.
                      </span>{" "}
                      {finding.detail}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}

            <dl className="mt-2 divide-y divide-slate-900/[0.04] border-t border-slate-900/[0.06] pt-1.5 dark:divide-white/[0.06] dark:border-white/10">
              <Row label="As written" value={link.raw} />
              {link.domain ? <Row label="Domain that owns it" value={link.domain} /> : null}
              {link.resolution && !link.resolution.error ? (
                <>
                  <Row label="Ends at" value={link.resolution.finalUrl} />
                  <Row
                    label="Answered with"
                    value={`HTTP ${link.resolution.status}${
                      link.resolution.contentType ? ` · ${link.resolution.contentType}` : ""
                    }`}
                  />
                  {link.resolution.server ? (
                    <Row label="Served by" value={link.resolution.server} />
                  ) : null}
                  {link.resolution.ip ? <Row label="Address" value={link.resolution.ip} /> : null}
                  {link.resolution.tls?.issuer ? (
                    <Row
                      label="Certificate"
                      value={`issued by ${link.resolution.tls.issuer}${
                        typeof link.resolution.tls.daysOld === "number"
                          ? `, ${link.resolution.tls.daysOld} days ago`
                          : ""
                      }`}
                    />
                  ) : null}
                </>
              ) : null}
            </dl>

            {link.notFollowed ? (
              <p className="mt-1.5 text-caption text-slate-500 dark:text-slate-400">
                {link.notFollowed}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      {/* The one place in this service where something leaves the device, said
          plainly and at the point where it happened rather than in a policy
          page nobody opens. */}
      <p className="mt-2 text-caption leading-relaxed text-slate-500 dark:text-slate-400">
        {followed > 0
          ? `${followed === 1 ? "This link was" : `${followed} of these links were`} opened by CyberKent rather than by you, so the address was sent to this service — nothing else was, and no file was. Opening a scam link from your own phone tells whoever sent it that a real person read the message; this is what avoids that.`
          : "None of these links could be followed, so what is reported above comes from the address alone."}
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
 * What else the extractor pulls out, and how to label each.
 *
 * Links are deliberately absent. They have a section of their own that says
 * where each one goes, and listing them here as well would put a bare address
 * beside a report about that same address — two accounts of one link, with the
 * shorter and less informative one shown first.
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
      title="Also pulled out of the message"
      footer="Shown as plain text, never as something to tap. Check an address or a number by looking it up yourself rather than by using the one in the message."
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

      {analysis.links.length > 0 ? (
        <motion.div variants={fadeUp}>
          <LinkPanel links={analysis.links} />
        </motion.div>
      ) : null}

      {submission.media && submission.media.length > 0 ? (
        <motion.div variants={fadeUp}>
          <FilePanel media={submission.media} />
        </motion.div>
      ) : null}

      <motion.div variants={fadeUp}>
        <ExtractedEntities analysis={analysis} />
      </motion.div>

      <motion.div variants={fadeUp}>
        <SettingsGroup title="How much to trust this">
          <SettingsRows>
            <SettingsRow label="Confidence" value={analysis.confidence.toFixed(2)} />
            <SettingsRow
              label="Checked"
              value={
                analysis.links.some((link) => link.resolution)
                  ? "On your device, links from here"
                  : "On your device"
              }
            />
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
