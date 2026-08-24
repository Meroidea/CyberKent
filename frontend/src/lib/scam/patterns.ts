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
  /*
   * Naming an organisation is not, by itself, evidence of anything.
   *
   * There used to be an "impersonates a known organisation" rule here that
   * fired on any mention of a trusted name and scored medium. It flagged
   * PayPal's own receipt email, the ATO's lodgement reminder and an Amazon
   * dispatch notice, because all three name the organisation that sent them —
   * as every genuine message from an organisation does.
   *
   * The signal is not the name. It is the name set against where the message
   * actually points, which needs the link inspection to have run first, so it
   * lives in `analyse.ts` as a cross-check rather than here as a pattern.
   */
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
  "zip", "mov", "top", "xyz", "online", "click", "link", "info", "live",
  "buzz", "rest", "cfd", "icu", "cyou", "sbs", "quest", "monster", "lol",
  "bond", "cam", "shop", "store", "site", "website", "space", "fun", "gq",
  "cf", "ml", "tk", "ga", "work", "party", "review", "date", "loan", "men",
  "stream", "download", "racing", "win", "bid", "trade", "accountant", "science",
];

/**
 * Names a message may legitimately mention, used to spot a domain wearing one.
 *
 * Short entries are dangerous here: "ato" matches "potato" and "anz" matches
 * "finanzen", so anything under four characters has to be worth the false
 * positives it will cause. Both are kept because the Australian Taxation Office
 * and ANZ are two of the most impersonated names in the country, and a domain
 * containing either is worth a second look even when the match is incidental —
 * but this is the list to revisit first if the checker starts crying wolf.
 */
export const IMPERSONATED_BRANDS = [
  "mygov",
  "myg0v",
  "auspost",
  "australiapost",
  "australia-post",
  "linkt",
  "citylink",
  "eastlink",
  "ato",
  "centrelink",
  "servicesaustralia",
  "medicare",
  "hume",
  "paypal",
  "netflix",
  "commbank",
  "commonwealthbank",
  "westpac",
  "bendigobank",
  "macquarie",
  "ubank",
  "nab",
  "anz",
  "telstra",
  "optus",
  "vodafone",
  "amazon",
  "apple",
  "microsoft",
  "outlook",
  "binance",
  "coinbase",
  "dhl",
  "fedex",
  "toll",
  "auspostal",
];

/**
 * Where each of those names actually lives.
 *
 * Without this the brand check is worse than useless: it fires on the brand's
 * own site. `paypal.com` contains "paypal" and is not a `.gov.au`, so the first
 * version of the check called PayPal a PayPal lookalike — and a checker that
 * flags the real thing teaches people to ignore it, which is the one outcome
 * worse than missing a scam.
 *
 * Compared against the registrable domain, never the full host, so
 * `support.microsoft.com` and `login.paypal.com` are recognised while
 * `paypal.com.evil.ru` is not.
 *
 * Necessarily incomplete, and handled honestly rather than silently: a host
 * carrying a brand that is not matched here is reported as "not an address this
 * checker can confirm belongs to them", not as a proven fake.
 */
export const BRAND_DOMAINS: Record<string, string[]> = {
  mygov: ["mygov.au", "my.gov.au"],
  auspost: ["auspost.com.au"],
  australiapost: ["auspost.com.au"],
  "australia-post": ["auspost.com.au"],
  linkt: ["linkt.com.au"],
  citylink: ["linkt.com.au", "transurban.com"],
  eastlink: ["eastlink.com.au"],
  ato: ["ato.gov.au"],
  centrelink: ["servicesaustralia.gov.au"],
  servicesaustralia: ["servicesaustralia.gov.au"],
  medicare: ["servicesaustralia.gov.au"],
  hume: ["hume.vic.gov.au"],
  paypal: ["paypal.com", "paypal.com.au", "paypalobjects.com"],
  netflix: ["netflix.com"],
  commbank: ["commbank.com.au"],
  commonwealthbank: ["commbank.com.au", "commonwealthbank.com.au"],
  westpac: ["westpac.com.au"],
  bendigobank: ["bendigobank.com.au"],
  macquarie: ["macquarie.com", "macquarie.com.au"],
  ubank: ["ubank.com.au"],
  nab: ["nab.com.au"],
  anz: ["anz.com", "anz.com.au"],
  telstra: ["telstra.com.au", "telstra.com"],
  optus: ["optus.com.au"],
  vodafone: ["vodafone.com.au", "vodafone.com"],
  amazon: ["amazon.com", "amazon.com.au", "amazon.co.uk"],
  apple: ["apple.com", "icloud.com"],
  microsoft: ["microsoft.com", "live.com", "outlook.com", "office.com", "msn.com"],
  outlook: ["outlook.com", "microsoft.com", "live.com"],
  binance: ["binance.com"],
  coinbase: ["coinbase.com"],
  dhl: ["dhl.com", "dhl.com.au"],
  fedex: ["fedex.com"],
};

/**
 * Suffixes under which the registrable name is the second-last label.
 *
 * A short, hand-kept list rather than the full public suffix list, which is
 * tens of thousands of entries and a dependency this bundle does not need.
 * These are the ones an Australian audience actually encounters; anything not
 * listed falls back to the last two labels, which is right for `.com`, `.ru`,
 * `.online` and every other flat registry.
 */
export const MULTI_LEVEL_SUFFIXES = [
  "com.au", "net.au", "org.au", "edu.au", "gov.au", "asn.au", "id.au",
  "co.uk", "org.uk", "ac.uk", "gov.uk", "co.nz", "net.nz", "org.nz",
  "govt.nz", "com.sg", "co.jp", "com.cn", "co.in", "com.br",
];

/**
 * Words a hostile domain is assembled from when it has no brand to borrow.
 *
 * The tell is that they describe a feeling rather than an organisation.
 * `secure-account-verify.com` promises safety and names nobody; a real service
 * puts its own name in its domain and does not need to reassure you in the
 * address bar.
 */
export const LURE_WORDS = [
  "secure",
  "verify",
  "verification",
  "confirm",
  "update",
  "account",
  "billing",
  "payment",
  "refund",
  "recovery",
  "unlock",
  "support",
  "helpdesk",
  "signin",
  "login",
  "auth",
  "wallet",
  "alert",
  "notice",
];

/** Path segments that name the step where credentials are handed over. */
export const CREDENTIAL_PATH_WORDS = [
  "login",
  "signin",
  "sign-in",
  "log-in",
  "auth",
  "verify",
  "verification",
  "confirm",
  "account",
  "secure",
  "update",
  "unlock",
  "recover",
  "password",
  "wallet",
  "billing",
  "payment",
];

/** Query keys that identify the recipient before a page has been opened. */
export const SENSITIVE_QUERY_KEYS = [
  "email",
  "e",
  "user",
  "username",
  "login",
  "token",
  "session",
  "sid",
  "auth",
  "key",
  "pw",
  "pass",
  "password",
  "account",
  "acct",
  "phone",
  "mobile",
];

/** A link ending in one of these downloads something that runs. */
export const PAYLOAD_EXTENSIONS = [
  "exe", "scr", "com", "pif", "bat", "cmd", "msi", "apk", "dmg", "app", "jar",
  "vbs", "vbe", "jse", "wsf", "wsh", "ps1", "lnk", "reg", "hta",
  "docm", "xlsm", "pptm", "dotm", "xltm",
  "zip", "rar", "7z", "iso", "img", "cab",
];

/** Schemes that have no business arriving in a message. */
export const HOSTILE_SCHEMES = ["data", "javascript", "vbscript", "file"];

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

/**
 * Suffixes whose eligibility is verified, so a lookalike cannot be registered.
 *
 * `.org.au` used to be on this list and has been removed. Eligibility for it is
 * an incorporated association or a registered trading name — a low bar, and one
 * scams have cleared before. Treating it as proof of legitimacy meant any
 * `.org.au` host skipped every remaining link check, so
 * `hume-rates-refund.org.au` came back clean. Only `.gov.au` and `.edu.au` are
 * checked against a register of actual government and education bodies.
 */
export const RESTRICTED_SUFFIXES = [".gov.au", ".edu.au"];

/** Retained under its old name for the text rules that still import it. */
export const OFFICIAL_SUFFIXES = RESTRICTED_SUFFIXES;
