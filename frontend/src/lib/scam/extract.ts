/**
 * Pulls the checkable artefacts out of a free-text submission.
 *
 * Separate from analysis because extraction is a different job with a different
 * failure mode: it should over-collect and let the analyser decide, rather than
 * silently dropping something the user pasted in.
 */

/*
 * Trailing punctuation is part of the sentence, not of the URL.
 *
 * The bare-IP alternative is first and deliberate: a host like 192.168.44.9 has
 * no alphabetic TLD, so a domain-shaped pattern alone silently drops exactly the
 * links most worth flagging.
 */
const URL_PATTERN =
  /((?:https?:\/\/)?(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/[^\s<>"']*)?|\b(?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>"']*)?)/gi;
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

export function extractUrls(text: string): string[] {
  const matches = text.match(URL_PATTERN) ?? [];

  return unique(
    matches
      .map((match) => match.replace(TRAILING_PUNCTUATION, ""))
      /* An email address contains a dot-separated host and would otherwise be
         collected twice, once as itself and once as a bare domain. */
      .filter((match) => !text.includes(`@${match}`))
      .filter((match) => match.includes(".")),
  );
}

export function extractEmails(text: string): string[] {
  return unique((text.match(EMAIL_PATTERN) ?? []).map((value) => value.toLowerCase()));
}

export function extractPhones(text: string): string[] {
  return unique((text.match(PHONE_PATTERN) ?? []).map((value) => value.trim()));
}

/** Normalises a URL to a host, tolerating the missing scheme people paste. */
export function hostOf(url: string): string | null {
  try {
    const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(withScheme).hostname.toLowerCase();
  } catch {
    return null;
  }
}
