import { extractEmails, extractPhones, extractUrls, proseOf } from "@/lib/scam/extract";
import { TEXT_RULES } from "@/lib/scam/patterns";
import { analyseLinks, analyseSenderDomains } from "@/lib/scam/links";
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

/** Score a single decisive finding is lifted to — the bottom of the HIGH band plus margin. */
const DECISIVE_FLOOR = 70;

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

const DECISIVE_COPY = {
  headline: "Very likely a scam",
  summary:
    "One finding here is conclusive on its own — something is disguised as what it is not. Do not open, click or reply to it, and delete it once you have reported it.",
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

/** The sentence a match sits in, so a rule's `unless` can see its context. */
function sentenceAround(text: string, index: number): string {
  const start = Math.max(0, text.lastIndexOf(".", index) + 1, text.lastIndexOf("\n", index) + 1);
  const ends = [text.indexOf(".", index), text.indexOf("\n", index)].filter((at) => at >= 0);
  return text.slice(start, ends.length > 0 ? Math.min(...ends) : text.length);
}

/**
 * FR15 — runs the wording rules over the message's prose.
 *
 * `prose` has had its links and addresses blanked out already; see `proseOf`.
 */
function runTextRules(prose: string, channel: Channel): Indicator[] {
  const exempt = CHANNEL_EXEMPT_RULES[channel] ?? [];

  return TEXT_RULES.filter((rule) => !exempt.includes(rule.id)).flatMap((rule) => {
    const matches = [...prose.matchAll(rule.pattern)].filter(
      (match) => !rule.unless || !rule.unless.test(sentenceAround(prose, match.index ?? 0)),
    );

    if (matches.length === 0) {
      return [];
    }

    return [
      {
        id: rule.id,
        label: rule.label,
        detail: rule.detail,
        weight: rule.weight,
        evidence: [...new Set(matches.map((match) => match[0].trim()))].slice(0, 3).join(", "),
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
  const curve = Math.round(100 * (1 - Math.exp(-evidence / SATURATION)));

  /* A decisive finding is enough by itself; the floor sits just inside HIGH. */
  return indicators.some((item) => item.decisive) ? Math.max(curve, DECISIVE_FLOOR) : curve;
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
export function analyse({ text, channel, media = [] }: Submission): Analysis {
  const typed = text.trim();

  /*
   * Text recognised inside an upload is treated as part of the message, not as
   * a separate class of evidence. A scam screenshotted and a scam pasted are
   * the same scam, and the rules that catch one have to catch the other.
   */
  const readFromMedia = media
    .map((file) => file.extractedText?.trim() ?? "")
    .filter((value) => value.length > 0);

  const corpus = [typed, ...readFromMedia].filter((value) => value.length > 0).join("\n\n");

  /*
   * A QR code is a link that cannot be read by eye, which makes it the most
   * link-like thing a message can carry. Its destination is judged exactly as
   * a typed URL is.
   */
  const qrLinks = media.flatMap((file) => file.qrCodes ?? []).filter((value) => /^[a-z]+:|\./i.test(value));

  const extracted = {
    urls: [...new Set([...extractUrls(corpus), ...qrLinks])],
    emails: extractEmails(corpus),
    phones: extractPhones(corpus),
  };

  const examined = describeSources(typed, media);
  /* Envelope rules stand on their own: they need no text to have been read. */
  const fileIndicators = analyseMedia(media);
  const { links, indicators: linkIndicators } = analyseLinks(extracted.urls);

  if (corpus.length < MINIMUM_USEFUL_LENGTH && fileIndicators.length === 0 && linkIndicators.length === 0) {
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
      links,
      extracted,
      examined,
    };
  }

  const textIndicators =
    corpus.length >= MINIMUM_USEFUL_LENGTH
      ? [...runTextRules(proseOf(corpus), channel), ...analyseSenderDomains(extracted.emails)]
      : [];

  const indicators = [...textIndicators, ...linkIndicators, ...fileIndicators].sort(
    (a, b) => WEIGHT_ORDER[a.weight] - WEIGHT_ORDER[b.weight],
  );

  const score = scoreIndicators(indicators);
  const band = bandFor(score);

  /* "Several indicators appear together" is untrue of a verdict carried by one
     decisive finding, and the copy has to say what actually happened. */
  const copy =
    band === "high" && indicators.filter((item) => item.weight === "high").length === 1 && indicators.some((item) => item.decisive)
      ? DECISIVE_COPY
      : BAND_COPY[band];

  return {
    score,
    band,
    confidence: confidenceFor(corpus, indicators.length, examined),
    ...copy,
    indicators,
    links,
    extracted,
    examined,
  };
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
    const qr = file.qrCodes?.length ? ` A QR code was decoded and its destination checked as a link.` : "";
    const detected = file.metadata?.sniffedLabel;
    const identity = detected ? ` Content identified from its bytes as ${detected}.` : "";

    if (read.length > 0) {
      sources.push({
        label: file.name,
        status: "read",
        detail: `${read.length} characters of text read from this ${file.kind} and checked.${identity}${qr}`,
      });
    } else {
      sources.push({
        label: file.name,
        status: "not-read",
        detail: `${
          file.unreadable ?? `The contents of this ${file.kind} were not examined — only its name and type were.`
        }${identity}${qr}`,
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
