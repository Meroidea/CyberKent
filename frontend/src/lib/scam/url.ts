import { decodeHost, hasLatinLookalikes, isPunycode, mixedScripts } from "@/lib/scam/punycode";
import {
  BRAND_DOMAINS,
  CREDENTIAL_PATH_WORDS,
  HOSTILE_SCHEMES,
  IMPERSONATED_BRANDS,
  LURE_WORDS,
  MULTI_LEVEL_SUFFIXES,
  PAYLOAD_EXTENSIONS,
  RESTRICTED_SUFFIXES,
  SENSITIVE_QUERY_KEYS,
  SUSPICIOUS_TLDS,
  URL_SHORTENERS,
} from "@/lib/scam/patterns";
import type { Indicator, IndicatorWeight } from "@/lib/scam/types";

/**
 * Taking a link apart.
 *
 * The checker used to look only at the shape of the host, which meant a link
 * could be picked apart by anyone reading it carefully and still come back
 * clean: `http://secure-mybank-verify.com/login/verify-account.php` scored
 * zero, because nothing examined the scheme, the path or the query. This module
 * is the answer to that — every part of a URL a browser would act on gets a
 * check, and every check reports its outcome whether or not it found anything.
 *
 * Reporting the passes matters as much as reporting the failures. A reader who
 * is told only what is wrong cannot tell the difference between a link that was
 * examined thoroughly and found sound, and a link nobody looked at. The first
 * is a finding; the second is silence wearing a finding's clothes.
 *
 * Everything here is static. The checker runs in the browser and the service
 * promises that nothing pasted into it is transmitted, so there is no DNS
 * lookup, no WHOIS, no request to the address to see where it lands. The checks
 * that would need one are still listed, marked `unknown`, with the reason —
 * because "we did not check this" is information the reader is owed, and
 * leaving it out is how a partial inspection comes to look like a complete one.
 */

/** What a single check concluded. */
export type CheckOutcome = "clear" | "note" | "concern" | "critical" | "unknown";

export interface UrlCheck {
  id: string;
  /** What was examined, as a noun phrase. */
  label: string;
  outcome: CheckOutcome;
  /** What was found, in words a non-specialist can act on. */
  finding: string;
}

export interface UrlReport {
  /** Exactly as it appeared in the message. */
  raw: string;
  parsed: boolean;
  scheme: string;
  /** The host a browser would actually connect to. */
  host: string;
  /** The same host as it would be displayed, with punycode decoded. */
  displayHost: string;
  /** Anything before the `@`, which is not part of the destination. */
  userinfo: string | null;
  port: string | null;
  path: string;
  query: string;
  checks: UrlCheck[];
  indicators: Indicator[];
}

/** Outcomes that contribute to the score, and how much. */
const OUTCOME_WEIGHT: Partial<Record<CheckOutcome, IndicatorWeight>> = {
  critical: "critical",
  concern: "high",
  note: "low",
};

function isIpHost(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[");
}

/** Everything after the public suffix guess, used for lookalike comparisons. */
function labelsOf(host: string): string[] {
  return host.split(".").filter(Boolean);
}

/**
 * Whether the host is, or sits under, a suffix that a scammer cannot register.
 *
 * `.gov.au` and `.edu.au` are genuinely restricted — eligibility is checked
 * against a register of government and education bodies, so a lookalike cannot
 * be bought. `.org.au` deliberately is *not* in that list any more: it is open
 * to any incorporated association or trading name, which is a low bar and one
 * that has been cleared by scams before. Treating it as proof of legitimacy was
 * a hole big enough to drive `hume-rates-refund.org.au` through.
 */
function isRestricted(host: string): boolean {
  return RESTRICTED_SUFFIXES.some((suffix) => host === suffix.slice(1) || host.endsWith(suffix));
}

/**
 * The name that was actually registered — `paypal.com` out of `login.paypal.com`.
 *
 * This is the only part of a host that means anything about ownership.
 * Everything to the left of it can be set to whatever the owner likes, which is
 * why `paypal.com.evil.ru` is a domain belonging to `evil.ru` and reads to a
 * hurried eye as one belonging to PayPal.
 */
export function registrableDomain(host: string): string {
  const labels = labelsOf(host);

  if (labels.length <= 2) {
    return host;
  }

  const lastTwo = labels.slice(-2).join(".");

  return MULTI_LEVEL_SUFFIXES.includes(lastTwo)
    ? labels.slice(-3).join(".")
    : lastTwo;
}

/**
 * Whether a brand name really appears in a host, rather than incidentally.
 *
 * Short names have to be matched as whole labels or they are noise: "ato"
 * appears in "potato", "anz" in "alliance", "nab" in "cabinet". Long names are
 * distinctive enough that a substring match is safe and catches the run-together
 * forms — "paypalsecure", "netflixbilling" — that a token match would miss.
 */
function hostCarriesBrand(host: string, brand: string): boolean {
  if (brand.length > 4) {
    return host.includes(brand);
  }

  return host.split(/[.\-_]/).includes(brand);
}

/** Hyphens in a host, the usual tell of a name assembled rather than chosen. */
function hyphenCount(host: string): number {
  return (host.match(/-/g) ?? []).length;
}

/** A crude but useful "does this label look typed or generated" test. */
function looksGenerated(label: string): boolean {
  if (label.length < 8) {
    return false;
  }

  const digits = (label.match(/\d/g) ?? []).length;
  const consonantRun = /[bcdfghjklmnpqrstvwxz]{5,}/i.test(label);
  const vowels = (label.match(/[aeiou]/gi) ?? []).length;

  return consonantRun || digits >= 4 || (label.length >= 12 && vowels / label.length < 0.2);
}

/**
 * Inspects one link and reports on every part of it.
 *
 * The order of the checks is the order the parts of a URL are read in a
 * browser's address bar, which is also the order in which each part can lie to
 * you: scheme, then who it says it is, then where it actually goes, then what
 * it asks for when it gets there.
 */
export function inspectUrl(raw: string): UrlReport {
  const checks: UrlCheck[] = [];
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw);
  const candidate = hasScheme ? raw : `https://${raw}`;

  let url: URL;

  try {
    url = new URL(candidate);
  } catch {
    return {
      raw,
      parsed: false,
      scheme: "",
      host: "",
      displayHost: "",
      userinfo: null,
      port: null,
      path: "",
      query: "",
      checks: [
        {
          id: "parse",
          label: "Address structure",
          outcome: "concern",
          finding:
            "This address could not be parsed as a link at all. A genuine message from an organisation does not contain a malformed address.",
        },
      ],
      indicators: [
        {
          id: `url-malformed-${raw}`,
          label: "Link is malformed",
          detail: "The address could not be read as a valid link, which is itself unusual.",
          weight: "medium",
          evidence: raw,
        },
      ],
    };
  }

  const scheme = url.protocol.replace(":", "");
  const host = url.hostname.toLowerCase();
  const displayHost = decodeHost(host);
  const userinfo = url.username ? decodeURIComponent(url.username) : null;
  const port = url.port || null;
  const path = url.pathname;
  const query = url.search;
  const labels = labelsOf(host);
  const restricted = isRestricted(host);
  const registrable = registrableDomain(host);

  /*
   * Read once, up front, because two separate checks turn on it: plain http is
   * a footnote on a page that only shows you something and a serious problem on
   * a page that asks you to sign in.
   */
  const lowerPath = decodeURIComponent(path).toLowerCase();
  const payload = PAYLOAD_EXTENSIONS.find((extension) => lowerPath.endsWith(`.${extension}`));
  const credentialWords = CREDENTIAL_PATH_WORDS.filter((word) => lowerPath.includes(word));

  /* ---- 1. Scheme ------------------------------------------------------- */

  if (HOSTILE_SCHEMES.includes(scheme)) {
    checks.push({
      id: "scheme",
      label: "Link type",
      outcome: "critical",
      finding: `This is a "${scheme}:" address, not a web address. Opening it runs content directly rather than visiting a site. These are never sent legitimately in a message.`,
    });
  } else if (scheme === "http") {
    checks.push({
      id: "scheme",
      label: "Connection security",
      /* A footnote on a page that shows you something; serious on one that
         asks you to type a password into it. */
      outcome: credentialWords.length > 0 ? "concern" : "note",
      finding:
        credentialWords.length > 0
          ? "Plain http, not https, on a page that asks you to sign in. Anything typed here travels unencrypted and can be read in transit. No current organisation collects credentials over http."
          : "Plain http, not https, so the connection is unencrypted. Common on older sites and not damning on its own, but no modern organisation sends an http link for anything that matters.",
    });
  } else {
    checks.push({
      id: "scheme",
      label: "Connection security",
      outcome: "clear",
      finding: "Uses https. That encrypts the connection — it says nothing about who is on the other end.",
    });
  }

  /* ---- 2. Who the link appears to be, versus where it goes -------------- */

  if (userinfo) {
    const impersonated = IMPERSONATED_BRANDS.find((brand) => userinfo.toLowerCase().includes(brand));

    checks.push({
      id: "userinfo",
      label: "Displayed name against destination",
      outcome: "critical",
      finding: impersonated
        ? `The text before the "@" reads "${userinfo}", which names ${impersonated} — but everything before an "@" is ignored by the browser. This link goes to ${displayHost}. This is a deliberate disguise; there is no innocent reason to build an address this way.`
        : `The text before the "@" reads "${userinfo}", which a browser ignores entirely. This link goes to ${displayHost}, not to what is written first.`,
    });
  } else {
    checks.push({
      id: "userinfo",
      label: "Displayed name against destination",
      outcome: "clear",
      finding: `No "@" trick — the destination is written plainly as ${displayHost}.`,
    });
  }

  /* ---- 3. The host itself ---------------------------------------------- */

  if (isIpHost(host)) {
    checks.push({
      id: "host-form",
      label: "Destination host",
      outcome: "critical",
      finding: `The link points at a raw address (${host}) rather than a domain name. Organisations publish names, not numbers; this is characteristic of a machine set up to collect and then abandoned.`,
    });
  } else if (isPunycode(host)) {
    const scripts = mixedScripts(displayHost);

    checks.push({
      id: "host-form",
      label: "Destination host",
      outcome: scripts.length > 0 || hasLatinLookalikes(displayHost) ? "critical" : "concern",
      finding:
        scripts.length > 0
          ? `The host is written in punycode as "${host}" and displays as "${displayHost}", which mixes ${scripts.join(" and ")} letters into Latin ones. Characters from another alphabet that look identical to ours are the standard way to register a convincing fake of a real domain.`
          : hasLatinLookalikes(displayHost)
            ? `The host is written in punycode as "${host}" and displays as "${displayHost}". Accented characters that read as their plain form at a glance are how a lookalike domain is built.`
            : `The host is written in punycode as "${host}" and displays as "${displayHost}". This is legitimate for a non-English domain, but it is also how a lookalike is hidden — read the second form, not the first.`,
    });
  } else {
    checks.push({
      id: "host-form",
      label: "Destination host",
      outcome: "clear",
      finding: `Resolves to ${host}, an ordinary domain name in the Latin alphabet.`,
    });
  }

  /* ---- 4. Registry it sits in ------------------------------------------ */

  const tld = labels.at(-1) ?? "";

  if (restricted) {
    checks.push({
      id: "registry",
      label: "Registry",
      outcome: "clear",
      finding: `Sits under "${RESTRICTED_SUFFIXES.find((suffix) => host.endsWith(suffix))}", which is restricted to verified Australian government or education bodies. A scammer cannot register one.`,
    });
  } else if (SUSPICIOUS_TLDS.includes(tld)) {
    checks.push({
      id: "registry",
      label: "Registry",
      outcome: "concern",
      finding: `Ends in ".${tld}", one of the cheap registries that carry a disproportionate share of abuse. Legitimate Australian organisations rarely use one.`,
    });
  } else {
    checks.push({
      id: "registry",
      label: "Registry",
      outcome: "clear",
      finding: `Ends in ".${tld}", which is not one of the registries most associated with abuse. That is not a recommendation — most scams use ordinary ones.`,
    });
  }

  /* ---- 5. Is it wearing someone else's name? --------------------------- */

  const brand = IMPERSONATED_BRANDS.find((candidate) => hostCarriesBrand(displayHost, candidate));
  const lures = LURE_WORDS.filter((word) => displayHost.includes(word));
  const brandOwns = brand ? (BRAND_DOMAINS[brand] ?? []).includes(registrable) : false;
  const verified = restricted || brandOwns;

  if (brand && brandOwns) {
    checks.push({
      id: "brand",
      label: "Brand in the domain",
      outcome: "clear",
      finding: `Names "${brand}", and "${registrable}" is an address ${brand} actually uses. The brand here is its own, not borrowed.`,
    });
  } else if (brand && restricted) {
    checks.push({
      id: "brand",
      label: "Brand in the domain",
      outcome: "clear",
      finding: `Names "${brand}" and sits on a restricted Australian registry, so the name is verified rather than borrowed.`,
    });
  } else if (brand) {
    checks.push({
      id: "brand",
      label: "Brand in the domain",
      outcome: "critical",
      finding: `The host contains "${brand}", but the registered name is "${registrable}" — not an address this checker can confirm belongs to ${brand}. Anyone can put a brand anywhere to the left of the registered name; only the registered name says who owns it.`,
    });
  } else if (lures.length >= 2 && !verified) {
    checks.push({
      id: "brand",
      label: "Brand in the domain",
      outcome: "concern",
      finding: `The registered name "${registrable}" is assembled from reassurance words — ${lures.map((word) => `"${word}"`).join(", ")} — rather than from an organisation's name. Real services put their own name in a domain; fakes put a promise in it.`,
    });
  } else if (lures.length === 1 && hyphenCount(host) >= 2 && !verified) {
    checks.push({
      id: "brand",
      label: "Brand in the domain",
      outcome: "note",
      finding: `"${registrable}" leans on the word "${lures[0]}" and is hyphen-assembled, which is a common shape for a throwaway domain — though plenty of ordinary sites look like this too.`,
    });
  } else {
    checks.push({
      id: "brand",
      label: "Brand in the domain",
      outcome: "clear",
      finding: `The registered name is "${registrable}", which does not borrow a known brand or lean on reassurance words.`,
    });
  }

  /* ---- 6. Shape of the name -------------------------------------------- */

  const hyphens = hyphenCount(host);
  const generated = labels.find(looksGenerated);
  const shapeProblems: string[] = [];

  const meaningfulLabels = labels[0] === "www" ? labels.slice(1) : labels;

  if (meaningfulLabels.length > 3) {
    shapeProblems.push(
      `${meaningfulLabels.length} levels deep — stacking subdomains pushes the real registered name off the right-hand edge of a phone's address bar, which is exactly what it is for`,
    );
  }
  if (hyphens >= 2) {
    shapeProblems.push(`${hyphens} hyphens, the usual way of assembling a phrase that a real domain would not need`);
  }
  if (generated) {
    shapeProblems.push(`the label "${generated}" looks machine-generated rather than chosen`);
  }
  if (host.length > 40) {
    shapeProblems.push(`${host.length} characters long, past the point where anyone reads to the end`);
  }

  checks.push(
    shapeProblems.length > 0
      ? {
          id: "host-shape",
          label: "Shape of the name",
          outcome: shapeProblems.length >= 2 ? "concern" : "note",
          finding: `${shapeProblems.join("; ")}.`,
        }
      : {
          id: "host-shape",
          label: "Shape of the name",
          outcome: "clear",
          finding: `A plain ${meaningfulLabels.length}-level name of ${host.length} characters, with nothing padded onto it.`,
        },
  );

  /* ---- 7. Port ---------------------------------------------------------- */

  if (port && port !== "80" && port !== "443") {
    checks.push({
      id: "port",
      label: "Port",
      outcome: "concern",
      finding: `Connects on port ${port} rather than the standard 80 or 443. Public services do not ask you to visit an unusual port.`,
    });
  } else {
    checks.push({
      id: "port",
      label: "Port",
      outcome: "clear",
      finding: port ? `Standard port ${port}.` : "No unusual port — uses the web default.",
    });
  }

  /* ---- 8. Shortener ----------------------------------------------------- */

  if (URL_SHORTENERS.includes(host)) {
    checks.push({
      id: "shortener",
      label: "Destination visibility",
      outcome: "concern",
      finding: `${host} is a link shortener, so the address above is not the destination — it is a redirect to somewhere this check cannot see without opening it, which is the one thing you should not do. Treat the destination as unknown.`,
    });
  } else {
    checks.push({
      id: "shortener",
      label: "Destination visibility",
      outcome: "clear",
      finding: "Not a shortener — the address shown is the address it goes to.",
    });
  }

  /* ---- 9. What the path asks for ---------------------------------------- */

  if (payload) {
    checks.push({
      id: "path",
      label: "What the link opens",
      outcome: "critical",
      finding: `The link ends in ".${payload}", so it downloads a file that runs code rather than opening a page. No legitimate notice asks you to install something from a link in a message.`,
    });
  } else if (credentialWords.length > 0 && !verified) {
    checks.push({
      id: "path",
      label: "What the link opens",
      outcome: "concern",
      finding: `The path is ${path} — a ${credentialWords.map((word) => `"${word}"`).join("/")} page on a registered name this checker cannot tie to any organisation. A sign-in step is where credentials are captured, so it matters a great deal whose sign-in page this is.`,
    });
  } else if (credentialWords.length > 0) {
    checks.push({
      id: "path",
      label: "What the link opens",
      outcome: "clear",
      finding: `The path is ${path} — a sign-in step, but on "${registrable}", which is a verified address for this organisation.`,
    });
  } else if (path && path !== "/") {
    checks.push({
      id: "path",
      label: "What the link opens",
      outcome: "clear",
      finding: `The path is ${path}, which does not name a sign-in step or a downloadable file.`,
    });
  } else {
    checks.push({
      id: "path",
      label: "What the link opens",
      outcome: "clear",
      finding: "Points at the site's front page rather than at a specific action.",
    });
  }

  /* ---- 10. What the query carries --------------------------------------- */

  const embedded = /https?(:|%3a)/i.test(query);
  const sensitiveKeys = SENSITIVE_QUERY_KEYS.filter((key) =>
    new RegExp(`[?&]${key}=`, "i").test(query),
  );

  if (embedded) {
    checks.push({
      id: "query",
      label: "Hidden second address",
      outcome: "concern",
      finding:
        "The link carries another web address inside its own parameters. That is how a trusted domain is used to bounce you somewhere untrusted — the address you check is not the address you land on.",
    });
  } else if (sensitiveKeys.length > 0) {
    checks.push({
      id: "query",
      label: "What the link carries",
      outcome: "note",
      finding: `Carries ${sensitiveKeys.map((key) => `"${key}"`).join(", ")} in the address, which identifies you to whoever receives it before you have typed anything.`,
    });
  } else if (query) {
    checks.push({
      id: "query",
      label: "What the link carries",
      outcome: "clear",
      finding: "Parameters are present but carry no second address and nothing that identifies you.",
    });
  } else {
    checks.push({
      id: "query",
      label: "What the link carries",
      outcome: "clear",
      finding: "No parameters attached.",
    });
  }

  /* ---- 11. The things a browser check cannot answer ---------------------- */

  checks.push(
    {
      id: "age",
      label: "How long the domain has existed",
      outcome: "unknown",
      finding:
        "Not checked. Registration dates come from a WHOIS lookup, and this check runs entirely on your device so that nothing you paste is sent anywhere. A domain registered days ago is a strong signal — this report cannot tell you either way.",
    },
    {
      id: "reputation",
      label: "Whether it is on a blocklist",
      outcome: "unknown",
      finding:
        "Not checked. Reputation services require sending the address to a third party, which this check does not do.",
    },
    {
      id: "destination",
      label: "Where it actually leads",
      outcome: "unknown",
      finding: URL_SHORTENERS.includes(host)
        ? "Not checked, and for a shortener this is the whole address. Following the redirect would mean requesting it, which is what a hostile link wants."
        : "Not checked. The only way to know what a page serves is to request it, and doing that from your browser is the risk this check exists to avoid.",
    },
  );

  /* ---- Indicators ------------------------------------------------------- */

  const shown = displayHost || host || raw;

  const indicators: Indicator[] = checks
    .filter((check) => OUTCOME_WEIGHT[check.outcome])
    .map((check) => ({
      id: `url-${check.id}-${shown}`,
      label: `${check.label} — ${shown}`,
      detail: check.finding,
      weight: OUTCOME_WEIGHT[check.outcome]!,
      evidence: shown,
    }));

  return {
    raw,
    parsed: true,
    scheme,
    host,
    displayHost,
    userinfo,
    port,
    path,
    query,
    checks,
    indicators,
  };
}

/** Inspects every link in a submission. */
export function inspectUrls(urls: string[]): UrlReport[] {
  return urls.map(inspectUrl);
}
