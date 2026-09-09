import { extractEmails, extractPhones, extractUrls } from "@/lib/scam/extract";
import { TEXT_RULES } from "@/lib/scam/patterns";
import { inspectStructure, linkIndicators, type LinkReport } from "@/lib/scam/links";
import { analyseMedia } from "@/lib/scam/media";
import type {
  Analysis,
  Channel,
  ExaminedSource,
  Indicator,
  IndicatorWeight,
  MediaDescriptor,
  RiskBand,
  Submission,
} from "@/lib/scam/types";

/** Evidence each weight contributes, before saturation. */
const WEIGHT_POINTS: Record<IndicatorWeight, number> = {
  high: 30,
  medium: 16,
  low: 7,
};

/**
 * Controls how fast the score saturates. Larger means evidence accumulates more
 * slowly. Tuned so one high indicator lands mid-band and two clear it.
 */
const SATURATION = 45;

/** FR17 — band thresholds. */
const BAND_THRESHOLDS: { band: RiskBand; min: number }[] = [
  { band: "high", min: 65 },
  { band: "medium", min: 35 },
  { band: "low", min: 0 },
];

/** Below this many characters there is not enough to say anything useful. */
const MINIMUM_USEFUL_LENGTH = 12;

const BAND_COPY: Record<RiskBand, { headline: string; summary: string }> = {
  high: {
    headline: "Very likely a scam",
    summary:
      "Several strong indicators appear together. Do not reply, do not click anything in it, and do not send money or details. If it claims to be an organisation you deal with, contact them using a number you already have.",
  },
  medium: {
    headline: "Treat this with caution",
    summary:
      "Some indicators are present but not conclusive. Verify through a channel you found yourself — a bill, a bookmark, or a number you already had — before acting on it.",
  },
  low: {
    headline: "No strong scam indicators",
    summary:
      "Nothing here matches the patterns we check for. That is not a guarantee it is genuine: a scam written carefully will not trip these checks. Verify independently if it asks for money or details.",
  },
  unclear: {
    headline: "Not enough to assess",
    summary:
      "There is too little here to check. Paste the full message, including any link, and try again.",
  },
};

/**
 * Rules that only make sense on some channels.
 *
 * A phone call has no link to click, so "pushes you to a link" firing on a
 * transcript would be noise rather than signal.
 */
const CHANNEL_EXEMPT_RULES: Partial<Record<Channel, string[]>> = {
  phone: ["link-bait"],
};

function runTextRules(text: string, channel: Channel): Indicator[] {
  const exempt = CHANNEL_EXEMPT_RULES[channel] ?? [];

  return TEXT_RULES.filter((rule) => !exempt.includes(rule.id)).flatMap((rule) => {
    /* Reset because the patterns are global and therefore stateful. */
    rule.pattern.lastIndex = 0;
    const matches = text.match(rule.pattern);

    if (!matches || matches.length === 0) {
      return [];
    }

    return [
      {
        id: rule.id,
        label: rule.label,
        detail: rule.detail,
        weight: rule.weight,
        evidence: [...new Set(matches.map((match) => match.trim()))].slice(0, 3).join(", "),
      },
    ];
  });
}

/**
 * FR16 — combine indicator weights into a 0–100 score.
 *
 * Evidence is summed and then passed through a saturating curve, rather than
 * each successive indicator being discounted individually. The distinction
 * matters: every indicator here comes from a different rule, so they are
 * independent evidence, not repetition. Discounting them as repeats put three
 * separate high-severity signals — urgency, a gift-card demand and a request
 * for secrecy, which together describe a textbook scam — at 51, below the
 * threshold for the band they plainly belong in.
 *
 * The curve still refuses certainty: it approaches 100 without reaching it, so
 * no volume of indicators produces a verdict the service is not entitled to
 * give. That is the ethical requirement expressed in arithmetic.
 */
function scoreIndicators(indicators: Indicator[]): number {
  const evidence = indicators.reduce((total, item) => total + WEIGHT_POINTS[item.weight], 0);
  return Math.round(100 * (1 - Math.exp(-evidence / SATURATION)));
}

function bandFor(score: number): RiskBand {
  return BAND_THRESHOLDS.find((threshold) => score >= threshold.min)?.band ?? "low";
}

/**
 * How much the submission gave us to work with.
 *
 * Reported separately from the score because they answer different questions:
 * the score is how scam-like this looks, the confidence is how much of a look
 * we got. A three-word message scoring zero is not the same as a long one.
 */
function confidenceFor(
  text: string,
  indicatorCount: number,
  examined: ExaminedSource[],
): number {
  const lengthSignal = Math.min(1, text.trim().length / 180);
  const indicatorSignal = Math.min(1, indicatorCount / 4);
  const base = 0.45 * lengthSignal + 0.55 * indicatorSignal;

  /*
   * Anything submitted but not read is a hole in the evidence, and the number
   * that says how good a look we got has to shrink for it. Without this a
   * voice message the service never listened to would raise confidence simply
   * by being attached.
   */
  const unread = examined.filter((source) => source.status === "not-read").length;
  const penalty = Math.min(0.4, unread * 0.15);

  return Math.round(base * (1 - penalty) * 100) / 100;
}

/** Strongest first, so the reason that mattered most is read first. */
const WEIGHT_ORDER: Record<IndicatorWeight, number> = { high: 0, medium: 1, low: 2 };

/**
 * The single entry point. FR13–FR24.
 *
 * Pure and synchronous: given the same submission it returns the same analysis,
 * which is what makes the rule set testable and what will let the same code run
 * server-side without change.
 */
export function analyse({ text, channel, media = [], links }: Submission): Analysis {
  const typed = text.trim();
  const corpus = corpusOf({ text, channel, media });

  const extracted = {
    urls: urlsIn({ text, channel, media }),
    emails: extractEmails(corpus),
    phones: extractPhones(corpus),
  };

  /*
   * Links arrive already followed where the pipeline had the chance to follow
   * them, and are read structurally here where it did not. Either way there is
   * one report per link and the score is built from it, so what the reader is
   * shown about a link and what it contributed to the verdict are the same
   * thing rather than two parallel accounts.
   */
  const reports: LinkReport[] = links ?? extracted.urls.map(inspectStructure);

  const examined = describeSources(typed, media);
  /* Envelope rules stand on their own: they need no text to have been read. */
  const fileIndicators = analyseMedia(media);

  if (corpus.length < MINIMUM_USEFUL_LENGTH && fileIndicators.length === 0) {
    /*
     * Nothing scored — but that is not the same as nothing examined.
     *
     * The copy used to tell every reader to "paste the full message", which is
     * the wrong sentence to show someone who attached an image and had it read
     * end to end. An image that raises no indicator is the ordinary case: most
     * pictures are neither generated nor doctored, and a checker that could
     * only speak when it had bad news would be silent on almost every genuine
     * submission. So where files were examined the verdict says what was
     * looked at and points at the detail, and only a genuinely empty
     * submission is told to paste more.
     */
    const examinedFiles = media.filter((file) => file.metadata || file.provenance || file.edits);

    return {
      score: 0,
      band: "unclear",
      confidence: 0,
      ...(examinedFiles.length > 0
        ? {
            headline: "Nothing here scores as a scam",
            summary: `${
              examinedFiles.length === 1 ? "The file was" : "The files were"
            } examined and no scam indicator was raised — no signed declaration of AI generation, no sign of editing, and nothing in the wording. That is the ordinary result for an ordinary picture, and it is not a guarantee: a careful fake trips none of these checks either. Everything read from ${
              examinedFiles.length === 1 ? "the file" : "each file"
            } is set out below. If a message came with it, paste that too — the wording is where most scams give themselves away.`,
          }
        : BAND_COPY.unclear),
      indicators: [],
      extracted,
      links: reports,
      examined,
    };
  }

  const textIndicators =
    corpus.length >= MINIMUM_USEFUL_LENGTH
      ? [...runTextRules(corpus, channel), ...linkIndicators(reports)]
      : [];

  const indicators = [...textIndicators, ...fileIndicators].sort(
    (a, b) => WEIGHT_ORDER[a.weight] - WEIGHT_ORDER[b.weight],
  );

  const score = scoreIndicators(indicators);
  const band = bandFor(score);

  return {
    score,
    band,
    confidence: confidenceFor(corpus, indicators.length, examined),
    ...BAND_COPY[band],
    indicators,
    extracted,
    links: reports,
    examined,
  };
}

/**
 * Everything in a submission that the text rules read, as one string.
 *
 * Text recognised inside an upload is treated as part of the message, not as a
 * separate class of evidence. A scam screenshotted and a scam pasted are the
 * same scam, and the rules that catch one have to catch the other.
 *
 * Exported because the pipeline needs the same corpus this function builds in
 * order to find the links before the analysis runs, and two implementations of
 * "what counts as the message" would eventually disagree.
 */
export function corpusOf({ text, media = [] }: Submission): string {
  const readFromMedia = media
    .map((file) => file.extractedText?.trim() ?? "")
    .filter((value) => value.length > 0);

  return [text.trim(), ...readFromMedia].filter((value) => value.length > 0).join("\n\n");
}

/**
 * Every link in a submission: those in the words, and those a document carries.
 *
 * A PDF's links do not appear in any text the reader pasted — they sit in the
 * document's own annotation objects — so a link check that only read the
 * message would miss the address an attached invoice actually points at.
 */
export function urlsIn(submission: Submission): string[] {
  const fromText = extractUrls(corpusOf(submission));
  const fromFiles = (submission.media ?? []).flatMap(
    (file) => file.metadata?.container?.urls ?? [],
  );

  return [...new Set([...fromText, ...fromFiles])];
}

/** One line per source, saying whether it was read and what came of it. */
function describeSources(typed: string, media: MediaDescriptor[]): ExaminedSource[] {
  const sources: ExaminedSource[] = [];

  if (typed.length > 0) {
    sources.push({
      label: "Pasted message",
      status: "read",
      detail: `${typed.length} characters checked against the rule set.`,
    });
  }

  for (const file of media) {
    const read = file.extractedText?.trim() ?? "";

    if (read.length > 0) {
      sources.push({
        label: file.name,
        status: "read",
        detail: `${read.length} characters of text read from this ${file.kind} and checked.`,
      });
    } else {
      sources.push({
        label: file.name,
        status: "not-read",
        detail:
          file.unreadable ??
          `The contents of this ${file.kind} were not examined — only its name and type were.`,
      });
    }

    /*
     * The origin passes are listed separately from the text pass because they
     * answer a different question and can succeed where it failed — a photo
     * with no readable text still has metadata worth reporting.
     *
     * Provenance always counts as read, including when it finds nothing: it
     * looked, and "no credentials" is its answer rather than its failure. The
     * classifier counts as not-read when it could not run, so a report whose
     * image check never happened says so and carries the confidence penalty
     * for it rather than passing the image off as cleared.
     */
    if (file.provenance) {
      sources.push({
        label: `${file.name} — origin metadata`,
        status: "read",
        detail: file.provenance.detail,
      });
    }

    if (file.synthetic?.unavailable) {
      sources.push({
        label: `${file.name} — AI-image check`,
        status: "not-read",
        detail: file.synthetic.unavailable,
      });
    } else if (file.synthetic) {
      sources.push({
        label: `${file.name} — AI-image check`,
        status: "read",
        detail: `Assessed on this device at ${Math.round(file.synthetic.probability * 100)}% likely to be AI-generated.`,
      });
    }

    if (file.edits?.unavailable) {
      sources.push({
        label: `${file.name} — edit check`,
        status: "not-read",
        detail: file.edits.unavailable,
      });
    } else if (file.edits) {
      sources.push({
        label: `${file.name} — edit check`,
        status: "read",
        detail: file.edits.findings.length
          ? `${file.edits.examined ?? "The file"} examined; ${file.edits.findings.length} sign${file.edits.findings.length === 1 ? "" : "s"} of alteration found.`
          : `${file.edits.examined ?? "The file"} examined; nothing indicating the image was altered. That is not the same as confirming it was not.`,
      });
    }
  }

  return sources;
}
