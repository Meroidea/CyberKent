import type { IndicatorWeight } from "@/lib/scam/types";

/**
 * The rule set the analyser runs.
 *
 * Kept as data rather than as branches in the analyser so a rule can be added,
 * reweighted or removed without touching the scoring code — and so the whole
 * set can be read by a non-developer, which matters for a service that has to
 * be able to explain itself to the people it scores.
 */

export interface TextRule {
  id: string;
  label: string;
  detail: string;
  weight: IndicatorWeight;
  /** Global so every occurrence can be counted, not just the first. */
  pattern: RegExp;
}

/** FR15 — wording patterns common to scam messages. */
export const TEXT_RULES: TextRule[] = [
  {
    id: "urgency",
    label: "Urgency language",
    detail: "Pressure to act inside a deadline is the most common lever in a scam.",
    weight: "high",
    pattern:
      /\b(within \d+\s*(hours?|minutes?|days?)|final notice|immediately|urgent(ly)?|act now|expires? (today|soon)|last chance|before it is too late)\b/gi,
  },
  {
    id: "threat",
    label: "Threatened consequence",
    detail: "A penalty for not responding — suspension, cancellation, legal action, arrest.",
    weight: "high",
    pattern:
      /\b(suspend(ed|ing)?|deactivat(e|ed|ion)|cancel(led)?|terminat(e|ed|ion)|legal action|court|arrest(ed)?|fine|penalty|permanent closure)\b/gi,
  },
  {
    id: "credentials",
    label: "Asks for credentials or banking details",
    detail:
      "Legitimate organisations do not ask for passwords, PINs or full account numbers by message.",
    weight: "high",
    pattern:
      /\b(bsb|account number|card (number|details)|cvv|pin\b|password|one[- ]?time (code|password)|otp|verify your identity|confirm your (bank|card|account))\b/gi,
  },
  {
    id: "payment",
    label: "Unusual payment method",
    detail: "Gift cards, crypto and wire transfers are chosen because they cannot be reversed.",
    weight: "high",
    pattern:
      /\b(gift ?cards?|itunes|google play|steam card|bitcoin|crypto(currency)?|usdt|wire transfer|western union|money ?gram)\b/gi,
  },
  {
    id: "payment-request",
    label: "Requests a payment or fee",
    detail: "A small fee is often bait to capture card details rather than to collect the amount.",
    weight: "medium",
    pattern:
      /\b(\$\s?\d[\d,]*(\.\d{2})?|fee|payment|outstanding|owing|unpaid|overdue|invoice|refund|rebate|deposit)\b/gi,
  },
  {
    id: "impersonation",
    label: "Impersonates a known organisation",
    detail: "Names a trusted body to borrow its authority. Check by contacting them yourself.",
    weight: "medium",
    pattern:
      /\b(mygov|ato|australia ?post|auspost|linkt|centrelink|medicare|nbn|telstra|optus|council|police|bank|paypal|netflix|amazon|apple|microsoft)\b/gi,
  },
  {
    id: "link-bait",
    label: "Pushes you to a link",
    detail: "Directing you away from official channels is how the credential capture happens.",
    weight: "medium",
    pattern: /\b(click (here|the link|below)|follow the link|log ?in (here|now)|tap here|visit)\b/gi,
  },
  {
    id: "remote-access",
    label: "Asks to install software or grant access",
    detail: "No provider asks to install remote-access tools over an unsolicited contact.",
    weight: "high",
    pattern:
      /\b(anydesk|teamviewer|remote ?(access|desktop|tool)|install (our|the|this) (app|tool|software)|support tool|grant access)\b/gi,
  },
  {
    id: "prize",
    label: "Unexpected prize or windfall",
    detail: "You cannot win a competition you did not enter.",
    weight: "medium",
    pattern:
      /\b(congratulations|you have won|winner|prize|lottery|lucky (draw|winner)|claim your (reward|prize))\b/gi,
  },
  {
    id: "secrecy",
    label: "Asks you to keep it quiet",
    detail: "Discouraging you from checking with someone else is a deliberate isolation tactic.",
    weight: "high",
    pattern:
      /\b(do not (tell|discuss|share)|keep this (confidential|between us|to yourself)|don'?t tell anyone)\b/gi,
  },
  {
    id: "generic-greeting",
    label: "Generic greeting",
    detail:
      "An organisation you hold an account with normally knows your name. Weak on its own.",
    weight: "low",
    pattern: /\b(dear (customer|user|sir\/madam|account holder)|valued customer)\b/gi,
  },
];

/**
 * Top-level domains that carry a disproportionate share of abuse, and the
 * shapes commonly used to make a hostile domain look official.
 */
export const SUSPICIOUS_TLDS = [
  "zip",
  "mov",
  "top",
  "xyz",
  "online",
  "click",
  "link",
  "info",
  "live",
  "buzz",
  "rest",
  "cfd",
];

/** Hosts a message may legitimately name, used to spot lookalikes. */
export const IMPERSONATED_BRANDS = [
  "mygov",
  "auspost",
  "australiapost",
  "linkt",
  "ato",
  "centrelink",
  "medicare",
  "hume",
  "paypal",
  "netflix",
  "commbank",
  "westpac",
  "nab",
  "anz",
];

/** Shorteners hide the true destination, so the host tells you nothing. */
export const URL_SHORTENERS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "rb.gy",
  "cutt.ly",
  "shorturl.at",
];

/** Australian government and council domains, which scams cannot register. */
export const OFFICIAL_SUFFIXES = [".gov.au", ".edu.au", ".org.au"];
