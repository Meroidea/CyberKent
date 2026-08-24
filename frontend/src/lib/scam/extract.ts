/**
 * Pulls the checkable artefacts out of a free-text submission.
 *
 * Separate from analysis because extraction is a different job with a different
 * failure mode: it should over-collect and let the analyser decide, rather than
 * silently dropping something the user pasted in.
 */

/*
 * Two URL shapes, and the order matters.
 *
 * The first alternative is the only one allowed to carry userinfo — the
 * `user@host` form — and it requires an explicit scheme to do so. That
 * restriction is what keeps `bob@example.com` an email address rather than a
 * link to `example.com`, while still catching `https://paypal.com@evil.ru`,
 * which is a link to `evil.ru` wearing PayPal's name.
 *
 * That case is the reason this pattern was rewritten. The previous one ended a
 * match at the `@`, so the userinfo was collected as if it were the whole URL:
 * the analyser was handed `https://paypal.com`, reported it as a PayPal
 * lookalike, and never saw the host the link actually resolves to. A spoof was
 * being read as its own disguise.
 *
 * The bare-IP alternative is deliberate too: a host like 45.132.88.7 has no
 * alphabetic TLD, so a domain-shaped pattern alone silently drops exactly the
 * links most worth flagging.
 */
const URL_PATTERN = new RegExp(
  [
    /* Scheme + optional userinfo + host + optional port/path. */
    String.raw`https?:\/\/(?:[^\s/?#@]+@)?(?:(?:\d{1,3}\.){3}\d{1,3}|(?:[a-z0-9¡-￿_-]+\.)+[a-z¡-￿]{2,})(?::\d{2,5})?(?:[/?#][^\s<>"'\`]*)?`,
    /* A scheme we should never see in a message at all. */
    String.raw`(?:data|javascript|file|vbscript):[^\s<>"'\`]+`,
    /* Bare IP, with or without a scheme. */
    String.raw`(?:https?:\/\/)?(?:\d{1,3}\.){3}\d{1,3}(?::\d{2,5})?(?:[/?#][^\s<>"'\`]*)?`,
    /* Bare domain. No userinfo branch here, so emails cannot match. */
    String.raw`\b(?:[a-z0-9¡-￿_-]+\.)+[a-z¡-￿]{2,}(?::\d{2,5})?(?:[/?#][^\s<>"'\`]*)?`,
  ].join("|"),
  "gi",
);

const EMAIL_PATTERN = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi;

/**
 * Australian numbers in the shapes people actually paste: 04xx xxx xxx,
 * +61 4xx xxx xxx, 1300/1800 numbers, and landlines with an optional area code.
 */
const PHONE_PATTERN =
  /(\+?61[\s-]?4\d{2}[\s-]?\d{3}[\s-]?\d{3}|\b04\d{2}[\s-]?\d{3}[\s-]?\d{3}\b|\b1[38]00[\s-]?\d{3}[\s-]?\d{3}\b|\b\(0[2-8]\)[\s-]?\d{4}[\s-]?\d{4}\b)/g;

/* A closing bracket is only punctuation if the URL did not open one. */
const TRAILING_PUNCTUATION = /[.,;:!?'"]+$/;

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

/** Trims sentence punctuation without eating a path that legitimately ends in it. */
function tidy(match: string): string {
  let value = match.replace(TRAILING_PUNCTUATION, "");

  /* Balance brackets: "(see example.com/a_(b))" should keep "a_(b)". */
  while (value.endsWith(")") && (value.match(/\)/g)?.length ?? 0) > (value.match(/\(/g)?.length ?? 0)) {
    value = value.slice(0, -1);
  }
  while (value.endsWith("]") && (value.match(/\]/g)?.length ?? 0) > (value.match(/\[/g)?.length ?? 0)) {
    value = value.slice(0, -1);
  }

  return value.replace(TRAILING_PUNCTUATION, "");
}

export function extractUrls(text: string): string[] {
  const emails = new Set(extractEmails(text));
  const matches = text.match(URL_PATTERN) ?? [];

  return unique(
    matches
      .map(tidy)
      .filter((match) => match.length > 0)
      /*
       * An email address contains a dot-separated host, so the bare-domain
       * branch collects its domain as a link. Dropping any match that is a
       * substring of a recognised address removes that without also removing a
       * genuine link that happens to sit next to one.
       */
      .filter((match) => !emails.has(match.toLowerCase()))
      .filter((match) => ![...emails].some((email) => email.endsWith(`@${match.toLowerCase()}`)))
      .filter((match) => match.includes(".") || /^(data|javascript|file|vbscript):/i.test(match)),
  );
}

export function extractEmails(text: string): string[] {
  return unique((text.match(EMAIL_PATTERN) ?? []).map((value) => value.toLowerCase()));
}

export function extractPhones(text: string): string[] {
  return unique((text.match(PHONE_PATTERN) ?? []).map((value) => value.trim()));
}

/**
 * Normalises a URL to the host a browser would actually connect to.
 *
 * The `URL` parser is used rather than a regex precisely because it resolves
 * userinfo correctly: for `https://paypal.com@evil.ru/x` it returns `evil.ru`,
 * which is the whole point.
 */
export function hostOf(url: string): string | null {
  try {
    const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`;
    return new URL(withScheme).hostname.toLowerCase();
  } catch {
    return null;
  }
}
