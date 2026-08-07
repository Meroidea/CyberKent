import { extractEmails, extractPhones, extractUrls, hostOf } from "@/lib/scam/extract";
import {
  IMPERSONATED_BRANDS,
  OFFICIAL_SUFFIXES,
  SUSPICIOUS_TLDS,
  TEXT_RULES,
  URL_SHORTENERS,
} from "@/lib/scam/patterns";
import type {
  Analysis,
  Channel,
  Indicator,
  IndicatorWeight,
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

/** FR20, FR21 — validate the shape of each URL, then inspect the host. */
function runUrlRules(urls: string[]): Indicator[] {
  const indicators: Indicator[] = [];

  for (const url of urls) {
    const host = hostOf(url);

    if (!host) {
      indicators.push({
        id: `url-malformed-${url}`,
        label: "Link is malformed",
        detail: "The address could not be parsed, which is itself unusual in a genuine message.",
        weight: "medium",
        evidence: url,
      });
      continue;
    }

    /* An official Australian domain cannot be registered by a scammer, so it
       clears the host-shape rules below rather than being scored by them. */
    if (OFFICIAL_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
      continue;
    }

    const tld = host.split(".").pop() ?? "";

    if (SUSPICIOUS_TLDS.includes(tld)) {
      indicators.push({
        id: `url-tld-${host}`,
        label: "Uncommon top-level domain",
        detail: `".${tld}" is cheap to register and carries a high share of abuse.`,
        weight: "medium",
        evidence: host,
      });
    }

    if (URL_SHORTENERS.includes(host)) {
      indicators.push({
        id: `url-shortener-${host}`,
        label: "Shortened link",
        detail: "A shortener hides the real destination until you have already opened it.",
        weight: "medium",
        evidence: host,
      });
    }

    /*
     * Lookalike test: the host names a brand but is not that brand's own
     * domain. "hume-rates-refund.online" contains "hume" without being
     * anything hume.vic.gov.au controls.
     */
    const brand = IMPERSONATED_BRANDS.find((candidate) => host.includes(candidate));

    if (brand && !OFFICIAL_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
      indicators.push({
        id: `url-lookalike-${host}`,
        label: "Lookalike domain",
        detail: `Contains "${brand}" but is not an official address for it.`,
        weight: "high",
        evidence: host,
      });
    }

    if (host.split(".").length > 3) {
      indicators.push({
        id: `url-depth-${host}`,
        label: "Deeply nested subdomain",
        detail: "Stacking subdomains pushes the real domain out of view on a phone.",
        weight: "low",
        evidence: host,
      });
    }

    if (/\d{1,3}(\.\d{1,3}){3}/.test(host)) {
      indicators.push({
        id: `url-ip-${host}`,
        label: "Link points to a raw IP address",
        detail: "Genuine services publish a domain name, not a bare address.",
        weight: "high",
        evidence: host,
      });
    }
  }

  return indicators;
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
function confidenceFor(text: string, indicatorCount: number): number {
  const lengthSignal = Math.min(1, text.trim().length / 180);
  const indicatorSignal = Math.min(1, indicatorCount / 4);
  return Math.round((0.45 * lengthSignal + 0.55 * indicatorSignal) * 100) / 100;
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
export function analyse({ text, channel }: Submission): Analysis {
  const trimmed = text.trim();

  const extracted = {
    urls: extractUrls(trimmed),
    emails: extractEmails(trimmed),
    phones: extractPhones(trimmed),
  };

  if (trimmed.length < MINIMUM_USEFUL_LENGTH) {
    return {
      score: 0,
      band: "unclear",
      confidence: 0,
      ...BAND_COPY.unclear,
      indicators: [],
      extracted,
    };
  }

  const indicators = [...runTextRules(trimmed, channel), ...runUrlRules(extracted.urls)].sort(
    (a, b) => WEIGHT_ORDER[a.weight] - WEIGHT_ORDER[b.weight],
  );

  const score = scoreIndicators(indicators);
  const band = bandFor(score);

  return {
    score,
    band,
    confidence: confidenceFor(trimmed, indicators.length),
    ...BAND_COPY[band],
    indicators,
    extracted,
  };
}
