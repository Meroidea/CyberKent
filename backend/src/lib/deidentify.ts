/**
 * FR50, ER-2, ER-13 — takes the personal out of text before Council publishes it.
 *
 * An alert quotes the scam's wording because recognising the wording is what
 * protects people. But a scam message arrives addressed to someone, and a
 * resident's report of it names them, their bank and their card. None of that
 * may reach a public page, so this removes, in order:
 *
 * - the reporter's own name, wherever it appears
 * - email addresses
 * - phone numbers (the scammer's included — ER-13: numbers are routinely
 *   spoofed from innocent people, and an alert describes a pattern, not a
 *   person)
 * - card, account and reference-like digit runs
 * - street addresses
 * - a greeting's name ("Hi Priya," → "Hi [name],")
 *
 * Links and domains are kept, defanged: a lookalike domain is the one detail a
 * resident most needs to recognise, it names no person, and defanging it stops
 * a published alert from becoming a working link to the scam.
 *
 * Automated removal is a first pass, not a guarantee. Every alert is read by
 * a second officer before it is published (FR51), and the editor shows what
 * was removed so they know what to look for.
 */

export interface Redaction {
  kind: "name" | "email" | "phone" | "number" | "address" | "greeting";
  count: number;
}

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
/* Australian and international phone shapes, with or without separators. */
const PHONE = /(?:\+?61[\s-]?|\(?0)[2-478]\)?(?:[\s-]?\d){8}|\b1[38]00(?:[\s-]?\d){6}\b|\b13(?:[\s-]?\d){4}\b|\+\d{1,3}(?:[\s-]?\d){7,12}/g;
/* Six or more digits, allowing separators: cards, BSBs, accounts, customer numbers. */
const LONG_NUMBER = /\b\d(?:[\s-]?\d){5,}\b/g;
const ADDRESS =
  /\b\d{1,5}[A-Za-z]?\s+(?:[A-Z][a-z]+\s){1,3}(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Court|Ct|Crescent|Cres|Place|Pl|Lane|Ln|Way|Boulevard|Blvd|Parade|Pde|Close|Cl|Terrace|Tce|Highway|Hwy)\b\.?/g;
const GREETING = /\b(Hi|Hello|Dear|Hey|G'day)\s+([A-Z][a-z]{1,20})(?=[\s,!.:])/g;
/* A path stops before trailing punctuation, so the sentence's full stop stays the sentence's. */
const URL_LIKE = /\b((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*[^\s.,;:!?)'"])?)/gi;

function escape(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** `example.com` → `example[.]com`, so a quoted link cannot be tapped. */
export function defang(text: string): string {
  return text.replace(URL_LIKE, (match) => match.replace(/^https?:\/\//i, "").replace(/\./g, "[.]"));
}

export function deidentify(text: string, options: { names?: string[] } = {}): { text: string; redactions: Redaction[] } {
  const counts = new Map<Redaction["kind"], number>();
  const bump = (kind: Redaction["kind"]) => counts.set(kind, (counts.get(kind) ?? 0) + 1);
  let out = text;

  const names = (options.names ?? [])
    .flatMap((name) => [name, ...name.split(/\s+/)])
    .map((name) => name.trim())
    .filter((name) => name.length >= 3)
    .sort((a, b) => b.length - a.length);

  for (const name of new Set(names)) {
    out = out.replace(new RegExp(`\\b${escape(name)}\\b`, "gi"), () => {
      bump("name");
      return "[name]";
    });
  }

  out = out.replace(EMAIL, () => {
    bump("email");
    return "[email removed]";
  });
  out = out.replace(PHONE, () => {
    bump("phone");
    return "[phone number removed]";
  });
  out = out.replace(LONG_NUMBER, () => {
    bump("number");
    return "[number removed]";
  });
  out = out.replace(ADDRESS, () => {
    bump("address");
    return "[address removed]";
  });
  out = out.replace(GREETING, (_match, word: string) => {
    bump("greeting");
    return `${word} [name]`;
  });

  return { text: defang(out), redactions: [...counts].map(([kind, count]) => ({ kind, count })) };
}
