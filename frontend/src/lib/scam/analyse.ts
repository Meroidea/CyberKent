import { extractEmails, extractPhones, extractUrls } from "@/lib/scam/extract";
import { BRAND_DOMAINS, IMPERSONATED_BRANDS, TEXT_RULES } from "@/lib/scam/patterns";
import { inspectUrls, registrableDomain, type UrlReport } from "@/lib/scam/url";
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
  critical: 62,
  high: 34,
  medium: 20,
  low: 8,
};

/**
 * Controls how fast the score saturates. Larger means evidence accumulates more
 * slowly.
 *
 * Retuned along with the weights above, because the old pair produced the
 * complaint that prompted this work: a single medium indicator scored 30, which
 * fell in the low band, which printed the headline "No strong scam indicators".
 * A bare link shortener — a thing whose entire purpose is to conceal where it
 * goes — was therefore reported as though it had been examined and found sound.
 *
 * The floor is now set so that any one medium finding reaches the caution band
 * on its own, and one `critical` finding reaches the high band on its own,
 * since a critical finding is a deception rather than a probability.
 */
const SATURATION = 42;

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
  /*
   * Worded as the absence of a finding rather than as a clearance.
   *
   * "No strong scam indicators" was read as "this is safe", which is not what
   * the checker is able to say about anything. What it can say is what it
   * looked at and what it did not find — so the headline names the check
   * rather than the message, and the summary leads with the limit instead of
   * burying it in the third sentence.
   */
  low: {
    headline: "Nothing matched, but little was checkable",
    summary:
      "None of the patterns this checker knows about appear here. That is a statement about the checks, not about the message: a careful scam trips none of them, and the checks that would settle it — how old the domain is, who registered it, where a link really leads — cannot run on your device. If it asks for money, details or urgency, verify through a number or address you already had.",
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

/**
 * The organisation a message claims to be from, set against where it points.
 *
 * This is the check that "impersonation" should always have been. A genuine
 * message from a bank names the bank and links to the bank; a scam names the
 * bank and links somewhere else. Neither half is evidence alone — every real
 * notice names its sender, and plenty of honest messages carry a link to a
 * third party — but the two together are close to decisive, and they are the
 * single most common shape a phishing message takes.
 *
 * Only fires when there is a link to disagree with. A message naming a bank
 * with no link in it is just a message naming a bank.
 */
function brandAgainstDestination(text: string, links: UrlReport[]): Indicator[] {
  const named = IMPERSONATED_BRANDS.filter((brand) =>
    new RegExp(`\\b${brand.replace(/[-]/g, "[- ]?")}\\b`, "i").test(text),
  );

  const resolvable = links.filter((link) => link.parsed && link.host);

  if (named.length === 0 || resolvable.length === 0) {
    return [];
  }

  return named.flatMap((brand) => {
    const owned = BRAND_DOMAINS[brand] ?? [];

    if (owned.length === 0) {
      return [];
    }

    const destinations = resolvable.map((link) => registrableDomain(link.host));

    /* One link landing where it should is enough to settle it. */
    if (destinations.some((destination) => owned.includes(destination))) {
      return [];
    }

    return [
      {
        id: `brand-mismatch-${brand}`,
        label: `Says "${brand}", but does not link to ${brand}`,
        detail: `The message names ${brand}, and the ${
          destinations.length === 1 ? "link in it goes" : "links in it go"
        } to ${[...new Set(destinations)].join(", ")} instead. A genuine message from an organisation links to its own address. This is the commonest shape a phishing message takes.`,
        weight: "critical" as const,
        evidence: [...new Set(destinations)].join(", "),
      },
    ];
  });
}

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
const WEIGHT_ORDER: Record<IndicatorWeight, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

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

  const extracted = {
    urls: extractUrls(corpus),
    emails: extractEmails(corpus),
    phones: extractPhones(corpus),
  };

  const examined = describeSources(typed, media);
  /* Envelope rules stand on their own: they need no text to have been read. */
  const fileIndicators = analyseMedia(media);

  if (
    corpus.length < MINIMUM_USEFUL_LENGTH &&
    fileIndicators.length === 0 &&
    extracted.urls.length === 0
  ) {
    return {
      score: 0,
      band: "unclear",
      confidence: 0,
      ...BAND_COPY.unclear,
      indicators: [],
      extracted,
      examined,
      links: [],
    };
  }

  /*
   * Links are inspected whatever the length of the message around them.
   *
   * The old guard ran the URL rules only once the whole submission cleared the
   * minimum useful length, so pasting a bare shortened link — nine characters,
   * and the single most common way a scam arrives — skipped link analysis
   * entirely and returned "not enough to assess". A link is self-contained
   * evidence; it does not need a sentence around it to be worth taking apart.
   */
  const links = inspectUrls(extracted.urls);
  const linkIndicators = links.flatMap((link) => link.indicators);

  /*
   * The wording rules read the message with its links removed.
   *
   * A URL is a string of words too, and leaving them in meant the rules matched
   * inside them: Microsoft's own support address ends in "reset-password",
   * which tripped "asks for credentials" — a high-weight finding drawn from a
   * path segment rather than from anything the sender wrote. Links now get the
   * dedicated inspection in `url.ts` and are taken out of the prose before the
   * wording rules see it, so neither double-counts the other.
   */
  const prose = extracted.urls.reduce((value, url) => value.split(url).join(" "), corpus);

  const textIndicators =
    corpus.length >= MINIMUM_USEFUL_LENGTH
      ? [...runTextRules(prose, channel), ...brandAgainstDestination(prose, links)]
      : [];

  const indicators = [...textIndicators, ...linkIndicators, ...fileIndicators].sort(
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
    examined,
    links,
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

    if (read.length > 0) {
      sources.push({
        label: file.name,
        status: "read",
        detail: `${read.length} characters of text read from this ${file.kind} and checked.`,
      });
      continue;
    }

    sources.push({
      label: file.name,
      status: "not-read",
      detail:
        file.unreadable ??
        `The contents of this ${file.kind} were not examined — only its name and type were.`,
    });
  }

  return sources;
}
