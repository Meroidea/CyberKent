import { SITE } from "@/config/site";
import type { Analysis, Channel, RiskBand, Submission } from "@/lib/scam/types";

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
  "This is general guidance based on the text provided, not a professional assessment, and it cannot guarantee that a message is safe or unsafe. If money has already changed hands, contact your bank first.";

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

  /*
   * The link inspection, in full, including the checks that passed.
   *
   * The downloaded copy is the one that gets forwarded to a family member or
   * attached to a report, and it has to carry the same reasoning the screen
   * showed. A file that lists only what was wrong cannot answer the question
   * the reader will actually be asked — "did you check X?" — which is the
   * whole reason the on-screen version shows its passes too.
   */
  if (analysis.links.length > 0) {
    const OUTCOME_LABEL: Record<string, string> = {
      critical: "SERIOUS",
      concern: "CONCERN",
      note: "NOTE   ",
      unknown: "NOT RUN",
      clear: "CLEAR  ",
    };

    const body = analysis.links
      .map((link, index) => {
        const heading =
          analysis.links.length > 1
            ? `  Link ${index + 1} of ${analysis.links.length}: ${link.raw}`
            : `  ${link.raw}`;

        const anatomy = link.parsed
          ? [
              `    scheme      ${link.scheme}`,
              link.userinfo ? `    before @    ${link.userinfo}  (ignored by the browser)` : null,
              `    goes to     ${link.displayHost}${link.host !== link.displayHost ? `  (written as ${link.host})` : ""}`,
              link.port ? `    port        ${link.port}` : null,
              link.path && link.path !== "/" ? `    path        ${link.path}` : null,
              link.query ? `    parameters  ${link.query}` : null,
            ].filter(Boolean).join("\n")
          : "    could not be parsed as a link";

        const checks = link.checks
          .map((check) =>
            [
              `    [${OUTCOME_LABEL[check.outcome] ?? check.outcome}] ${check.label}`,
              indent(wrap(check.finding, 62), 14),
            ].join("\n"),
          )
          .join("\n\n");

        return [heading, "", anatomy, "", checks].join("\n");
      })
      .join(`\n\n${"-".repeat(72)}\n\n`);

    sections.push(["EVERY LINK, CHECK BY CHECK", "", body].join("\n"));
  }

  /* What each attachment turned out to be, metadata first. */
  const media = submission.media ?? [];

  if (media.length > 0) {
    const body = media
      .map((file) => {
        const facts = (file.metadata?.fields ?? [])
          .map((field) => `    ${field.label.padEnd(26)} ${field.value}`)
          .join("\n");

        const gaps = (file.metadata?.gaps ?? [])
          .map((gap) => indent(wrap(`Gap: ${gap}`, 66), 4))
          .join("\n");

        const readText = file.extractedText?.trim()
          ? `    Text recognised            ${file.extractedText.trim().length} characters, checked against the wording rules`
          : `    Text recognised            none — ${file.unreadable ?? "not examined"}`;

        return [`  ${file.name}`, "", facts, readText, gaps].filter(Boolean).join("\n");
      })
      .join("\n\n");

    sections.push(["ATTACHMENTS, AS READ FROM THE FILES THEMSELVES", "", body].join("\n"));
  }

  sections.push(
    [
      "WHAT THIS CHECK COULD NOT DO",
      "",
      indent(
        wrap(
          "Three checks that would settle most cases need a lookup against a service outside your device, and this checker does not make one: how long the domain has existed (WHOIS), whether it appears on any reputation blocklist, and where a link actually lands once redirects are followed. Nothing you pasted or attached left your device, and that privacy is the reason these are missing. Treat the result as one input, not as the answer.",
          72,
        ),
        2,
      ),
    ].join("\n"),
  );

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

  if (submission.text.trim().length > 0) {
    sections.push(["THE MESSAGE AS SUBMITTED", "", indent(submission.text.trim(), 2)].join("\n"));
  }

  sections.push(["IMPORTANT", "", indent(wrap(ADVISORY, 72), 2)].join("\n"));

  sections.push(
    [
      rule,
      wrap(
        `Checked on the reader's own device by ${SITE.name}. The message was not sent to ${SITE.owner} and was not stored. To report it, visit the service and choose "Report a scam".`,
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
