import { SITE } from "@/config/site";
import type { Analysis, Channel, MediaDescriptor, RiskBand, Submission } from "@/lib/scam/types";

/**
 * Rendering an analysis as text, for the copies of it that leave the screen.
 *
 * Deliberately free of React: a downloaded file, an email body and a clipboard
 * paste are the same document at three lengths, and writing them separately is
 * how a report ends up carrying its verdict without its limits.
 */

const CHANNEL_LABELS: Record<Channel, string> = {
  sms: "Text message",
  email: "Email",
  phone: "Phone call",
  website: "Website",
  social: "Social media",
  other: "Something else",
};

const BAND_LABELS: Record<RiskBand, string> = {
  high: "High risk",
  medium: "Medium risk",
  low: "Low risk",
  unclear: "Inconclusive",
};

/**
 * The advisory limit, in the words the on-screen report uses.
 *
 * Carried on every exported copy. A screenshot of a verdict travels further
 * than the page it came from, and it has to take its own qualification with it.
 */
const ADVISORY =
  "This is general guidance based on what you provided, not a professional assessment, and it cannot guarantee that a message is safe or unsafe. If money has already changed hands, contact your bank first.";

function formatTimestamp(at: Date): string {
  return at.toLocaleString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function indent(value: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line) => `${pad}${line}`)
    .join("\n");
}

/** Wraps prose so the file reads in a plain text viewer at any width. */
function wrap(value: string, width = 76): string {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    if (line.length === 0) {
      line = word;
    } else if (line.length + word.length + 1 <= width) {
      line += ` ${word}`;
    } else {
      lines.push(line);
      line = word;
    }
  }

  if (line.length > 0) {
    lines.push(line);
  }

  return lines.join("\n");
}

export interface ReportInput {
  analysis: Analysis;
  submission: Submission;
  generatedAt: Date;
}

/** The full report, as it is downloaded. */

const BYTE_UNITS = ["bytes", "KB", "MB", "GB"];

function bytes(size: number): string {
  let value = size;
  let unit = 0;
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return unit === 0 ? `${size} bytes` : `${value.toFixed(1)} ${BYTE_UNITS[unit]} (${size.toLocaleString()} bytes)`;
}

/**
 * Everything read from the attached files, as text.
 *
 * The exported report used to carry the verdict and the message and nothing
 * else, so a reader who submitted an image and downloaded their report got a
 * page that did not mention it. Whatever the screen shows about a file, the
 * copy that leaves with the reader has to show too — that copy is the one that
 * gets forwarded to a bank or attached to a police report.
 */
function describeFiles(media: MediaDescriptor[]): string[] {
  const sections: string[] = [];

  for (const file of media) {
    const lines: string[] = [file.name, ""];
    const meta = file.metadata;

    if (meta) {
      const row = (label: string, value: string) => lines.push(`  ${(label + ":").padEnd(24)}${value}`);

      row("Size", bytes(meta.sizeBytes));
      if (meta.width && meta.height) row("Dimensions", `${meta.width} x ${meta.height} px`);
      if (meta.format) row("Format", meta.format);
      row(
        "Declared type",
        meta.typeMatches === false
          ? `${meta.declaredType} - but the bytes are ${meta.sniffedLabel}`
          : `${meta.declaredType}${meta.sniffedLabel ? ` (bytes confirm ${meta.sniffedLabel})` : ""}`,
      );
      if (meta.colour) row("Colour", meta.colour);
      if (meta.bitDepth) row("Bit depth", `${meta.bitDepth}-bit`);
      if (meta.subsampling) row("Chroma subsampling", meta.subsampling);
      if (typeof meta.quality === "number") row("JPEG quality (est.)", `about ${meta.quality} of 100`);
      if (meta.progressive !== undefined) row("Encoding", meta.progressive ? "Progressive" : "Baseline");
      if (meta.interlaced !== undefined) row("Interlacing", meta.interlaced ? "Interlaced" : "None");
      row("Colour profile", meta.iccProfile ?? "none embedded");
      row("Metadata carried", meta.segments?.length ? meta.segments.join(", ") : "none");
      if (meta.sha256) row("SHA-256", meta.sha256);

      lines.push("", "  Camera record (EXIF)");

      if (meta.exif?.present) {
        const e = meta.exif;
        row("  Tags found", String(e.fields));
        if (e.make || e.model) row("  Camera", [e.make, e.model].filter(Boolean).join(" "));
        if (e.lens) row("  Lens", e.lens);
        if (e.software) row("  Software", e.software);
        if (e.taken) row("  Taken", e.taken);
        if (e.capturedWidth && e.capturedHeight) row("  Captured at", `${e.capturedWidth} x ${e.capturedHeight} px`);
        row("  Location", e.gps ? `${e.gps.lat.toFixed(5)}, ${e.gps.lon.toFixed(5)}` : "not recorded");

        if (e.gps) {
          lines.push("", indent(wrap("This image carries the coordinates of where it was taken. Sending the file sends that location with it.", 70), 4));
        }
      } else {
        lines.push(indent(wrap("None. The file carries no camera record. This is ordinary for a screenshot and for any photograph that has passed through a messaging app, which strip it. Its absence says nothing about whether the image is genuine.", 70), 4));
      }
    }

    if (file.provenance) {
      lines.push("", "  Origin", indent(wrap(file.provenance.detail, 70), 4));
    }

    if (file.synthetic) {
      lines.push(
        "",
        "  AI-image check",
        indent(
          file.synthetic.unavailable ??
            `Assessed on this device at ${Math.round(file.synthetic.probability * 100)}% likely to be AI-generated (${file.synthetic.model}).`,
          4,
        ),
      );
    }

    if (file.edits) {
      lines.push("", "  Edit check");
      if (file.edits.unavailable) {
        lines.push(indent(wrap(file.edits.unavailable, 70), 4));
      } else if (file.edits.findings.length === 0) {
        lines.push(indent(wrap(`${file.edits.examined ?? "The file"} examined; nothing indicating the image was altered. A careful edit leaves nothing either.`, 70), 4));
      } else {
        for (const finding of file.edits.findings) {
          lines.push(indent(`- ${finding.label} [${finding.weight}]`, 4));
          lines.push(indent(wrap(finding.detail, 68), 6));
          if (finding.evidence) lines.push(indent(`Evidence: ${finding.evidence}`, 6));
        }
      }
    }

    if (file.extractedText?.trim()) {
      lines.push("", "  Text read from this file", indent(wrap(file.extractedText.trim(), 70), 4));
    } else if (file.unreadable) {
      lines.push("", "  Contents", indent(wrap(file.unreadable, 70), 4));
    }

    sections.push(lines.join("\n"));
  }

  return sections;
}

export function formatReport({ analysis, submission, generatedAt }: ReportInput): string {
  const rule = "=".repeat(76);
  const sections: string[] = [];

  sections.push(
    [
      rule,
      `${SITE.name} — scam check report`,
      `${SITE.owner} · ${SITE.program}`,
      rule,
      "",
      `Generated   ${formatTimestamp(generatedAt)}`,
      `Arrived by  ${CHANNEL_LABELS[submission.channel]}`,
    ].join("\n"),
  );

  sections.push(
    [
      "RESULT",
      "",
      `  Verdict      ${analysis.headline}`,
      `  Risk score   ${analysis.score} of 100 (${BAND_LABELS[analysis.band]})`,
      `  Confidence   ${analysis.confidence.toFixed(2)}`,
      "",
      indent(wrap(analysis.summary, 72), 2),
    ].join("\n"),
  );

  if (analysis.indicators.length > 0) {
    const body = analysis.indicators
      .map((indicator) => {
        const lines = [
          `  [${indicator.weight.toUpperCase()}] ${indicator.label}`,
          indent(wrap(indicator.detail, 66), 10),
        ];

        if (indicator.evidence) {
          lines.push(indent(`Evidence: ${indicator.evidence}`, 10));
        }

        return lines.join("\n");
      })
      .join("\n\n");

    sections.push(
      [
        `WHY — ${analysis.indicators.length} ${
          analysis.indicators.length === 1 ? "signal" : "signals"
        }`,
        "",
        body,
      ].join("\n"),
    );
  } else {
    sections.push(["WHY", "", "  No indicators from the checked rule set were found."].join("\n"));
  }

  const extracted: string[] = [];

  if (analysis.extracted.urls.length > 0) {
    extracted.push(`  Links            ${analysis.extracted.urls.join("\n                   ")}`);
  }

  if (analysis.extracted.emails.length > 0) {
    extracted.push(`  Email addresses  ${analysis.extracted.emails.join("\n                   ")}`);
  }

  if (analysis.extracted.phones.length > 0) {
    extracted.push(`  Phone numbers    ${analysis.extracted.phones.join("\n                   ")}`);
  }

  if (extracted.length > 0) {
    sections.push(["PULLED OUT OF THE MESSAGE", "", ...extracted].join("\n"));
  }

  const files = submission.media ?? [];

  if (files.length > 0) {
    sections.push(
      [
        files.length === 1 ? "THE FILE THAT WAS CHECKED" : "THE FILES THAT WERE CHECKED",
        "",
        ...describeFiles(files),
      ].join("\n"),
    );
  }

  if (submission.text.trim()) {
    sections.push(["THE MESSAGE AS SUBMITTED", "", indent(submission.text.trim(), 2)].join("\n"));
  }

  sections.push(["IMPORTANT", "", indent(wrap(ADVISORY, 72), 2)].join("\n"));

  sections.push(
    [
      rule,
      wrap(
        `Checked on the reader's own device by ${SITE.name}. Nothing submitted — message or file — was sent to ${SITE.owner} or stored. To report it, visit the service and choose "Report a scam".`,
      ),
      rule,
    ].join("\n"),
  );

  return `${sections.join("\n\n")}\n`;
}

/** A few lines suitable for a clipboard paste or a message to someone else. */
export function formatSummary({ analysis, submission, generatedAt }: ReportInput): string {
  const lines = [
    `${SITE.name} scam check — ${analysis.headline}`,
    `Risk score ${analysis.score}/100 (${BAND_LABELS[analysis.band]}), confidence ${analysis.confidence.toFixed(2)}.`,
    `Arrived by ${CHANNEL_LABELS[submission.channel].toLowerCase()} · checked ${formatTimestamp(generatedAt)}.`,
    "",
    analysis.summary,
  ];

  if (analysis.indicators.length > 0) {
    lines.push(
      "",
      `Signals found (${analysis.indicators.length}):`,
      ...analysis.indicators.map(
        (indicator) => `· ${indicator.label} [${indicator.weight}]`,
      ),
    );
  }

  lines.push("", ADVISORY);

  return lines.join("\n");
}

/** Subject line for the emailed copy. */
export function formatSubject(analysis: Analysis): string {
  return `${SITE.name} scam check — ${analysis.headline} (${analysis.score}/100)`;
}

/** A filename that sorts by date and says what it is. */
export function reportFilename(analysis: Analysis, generatedAt: Date): string {
  const stamp = [
    generatedAt.getFullYear(),
    String(generatedAt.getMonth() + 1).padStart(2, "0"),
    String(generatedAt.getDate()).padStart(2, "0"),
    "-",
    String(generatedAt.getHours()).padStart(2, "0"),
    String(generatedAt.getMinutes()).padStart(2, "0"),
  ].join("");

  return `cyberkent-scam-check-${analysis.band}-${stamp}.txt`;
}
