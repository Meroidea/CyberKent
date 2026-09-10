/**
 * Pulls the checkable artefacts out of a free-text submission.
 *
 * Separate from analysis because extraction is a different job with a different
 * failure mode: it should over-collect and let the analyser decide, rather than
 * silently dropping something the user pasted in.
 *
 * Links are taken out in two passes, and the order is the fix for the defect
 * the Lecturer's feedback exposed. A link that states its scheme is taken
 * whole — up to the next space — before anything else looks at the text, so
 * `https://www.paypal.com@payment-review.top/cancel` survives as one link
 * rather than being split into a PayPal address and an "email". Only then are
 * scheme-less hosts collected from what remains.
 */

const SCHEMED_URL = /\b(?:https?:\/\/|www\.)[^\s<>"'`]+|\b(?:javascript|data):[^\s<>"'`]+/gi;

/*
 * The bare-IP alternative is first and deliberate: a host like 192.168.44.9 has
 * no alphabetic TLD, so a domain-shaped pattern alone silently drops exactly the
 * links most worth flagging.
 */
const BARE_URL =
  /\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/[^\s<>"'`]*)?|\b(?:[a-z0-9-]+\.)+([a-z]{2,})(?::\d+)?(?:\/[^\s<>"'`]*)?/gi;

/**
 * Top-level domains accepted for a link written without a scheme.
 *
 * Without a list, two sentences run together — "tonight.See you" — read as a
 * domain. With one, a bare host is only a link when it ends the way real ones
 * do. Links that state their scheme are exempt: `https://` is its own proof.
 */
const KNOWN_TLDS = new Set([
  "com", "net", "org", "edu", "gov", "au", "uk", "nz", "us", "ca", "io", "co", "me", "info", "biz",
  "xyz", "online", "top", "click", "link", "live", "buzz", "rest", "cfd", "help", "support", "icu",
  "sbs", "cyou", "quest", "shop", "app", "dev", "site", "store", "tech", "club", "cc", "ly", "gl",
  "gd", "at", "id", "in", "tk", "ml", "ws", "pw", "to", "sh", "ai", "gg", "zip", "mov", "vip",
  "win", "bid", "loan", "work", "email", "services", "page", "one", "pro", "tv",
]);

const EMAIL_PATTERN = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi;

/**
 * Australian numbers in the shapes people actually paste: 04xx xxx xxx,
 * +61 4xx xxx xxx, 1300/1800 numbers, and landlines with an optional area code.
 */
const PHONE_PATTERN =
  /(\+?61[\s-]?4\d{2}[\s-]?\d{3}[\s-]?\d{3}|\b04\d{2}[\s-]?\d{3}[\s-]?\d{3}\b|\b1[38]00[\s-]?\d{3}[\s-]?\d{3}\b|\b\(0[2-8]\)[\s-]?\d{4}[\s-]?\d{4}\b)/g;

const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"]+$/;

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

/** Replaces every match with spaces of the same length, so offsets survive. */
function blank(text: string, pattern: RegExp): string {
  return text.replace(pattern, (match) => " ".repeat(match.length));
}

export function extractUrls(text: string): string[] {
  const schemed = (text.match(SCHEMED_URL) ?? []).map((match) =>
    match.replace(TRAILING_PUNCTUATION, ""),
  );

  /* What is left once whole links and email addresses are out of the way. An
     address contains a host, and would otherwise be collected a second time as
     a bare domain. */
  const remainder = blank(blank(text, SCHEMED_URL), EMAIL_PATTERN);
  const bare: string[] = [];

  for (const match of remainder.matchAll(BARE_URL)) {
    const value = match[0].replace(TRAILING_PUNCTUATION, "");
    const tld = match[1]?.toLowerCase();

    if (!tld || KNOWN_TLDS.has(tld)) {
      bare.push(value);
    }
  }

  return unique([...schemed, ...bare].filter((value) => value.includes(".") || value.includes(":")));
}

export function extractEmails(text: string): string[] {
  /* An address inside a link's userinfo is part of the link, not a contact. */
  return unique((blank(text, SCHEMED_URL).match(EMAIL_PATTERN) ?? []).map((value) => value.toLowerCase()));
}

export function extractPhones(text: string): string[] {
  return unique((text.match(PHONE_PATTERN) ?? []).map((value) => value.trim()));
}

/**
 * The message with its links and addresses taken out.
 *
 * The wording rules read prose. Running them over a URL is treating a link as
 * text — "login" in a path is not a request to log in, and "secure" in a
 * domain is not reassurance — so the link rules see the links and the wording
 * rules see everything else.
 */
export function proseOf(text: string): string {
  return blank(blank(text, SCHEMED_URL), EMAIL_PATTERN).replace(BARE_URL, (match, tld?: string) =>
    !tld || KNOWN_TLDS.has(tld.toLowerCase()) ? " ".repeat(match.length) : match,
  );
}
