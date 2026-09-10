import type { Indicator } from "@/lib/scam/types";

/**
 * Links, parsed as links.
 *
 * The first version of the checker read a URL the way it read every other word
 * in a message: a string that either contained a suspicious fragment or did
 * not. The Lecturer's feedback was that links must not be treated as plain
 * text, and the evaluation corpus showed why that matters in both directions —
 * `auspost.com.au` was flagged as a lookalike of Australia Post because the
 * string contains "auspost", while `paypal.com@payment-review.top` passed as
 * PayPal because the string starts with it.
 *
 * A URL has structure, and the structure is where the deception lives. The
 * part a reader looks at (the start) and the part that decides where the
 * browser actually goes (the registrable domain) are different parts. This
 * module separates them with the platform's own URL parser and reasons about
 * each one on its own terms.
 */

/** A link, taken apart. Every field is derived by `URL`, never by regex. */
export interface ParsedLink {
  /** Exactly as it appeared in the message. */
  raw: string;
  /** With a scheme, so it parses; `https://` is assumed when none was given. */
  href: string;
  scheme: string;
  /** Whether the message itself stated the scheme. */
  schemeGiven: boolean;
  host: string;
  /** The part of the host that is actually registered — who owns the link. */
  registrableDomain: string;
  /** Everything to the left of the registrable domain, possibly empty. */
  subdomain: string;
  port: string;
  path: string;
  query: string;
  /** `user@` before the host — the text the browser discards. */
  userinfo: string;
  isIpAddress: boolean;
  /** Internationalised host, stored by the browser as `xn--`. */
  isPunycode: boolean;
  /** Under a namespace only government or accredited education can register. */
  isOfficial: boolean;
  /** Displayable without being clickable or auto-linked: `hxxps://x[.]com`. */
  defanged: string;
}

/**
 * Suffixes under which registration happens one level down.
 *
 * Without this, the registrable domain of `scam.com.au` would come out as
 * `com.au` and every Australian site would look like the same owner. A full
 * public-suffix list is ~200 KB; this covers the suffixes a Hume resident is
 * realistically sent, and anything else falls back to the last two labels.
 */
const MULTI_LABEL_SUFFIXES = [
  "com.au", "net.au", "org.au", "gov.au", "edu.au", "asn.au", "id.au",
  "vic.gov.au", "nsw.gov.au", "qld.gov.au", "wa.gov.au", "sa.gov.au", "tas.gov.au", "act.gov.au", "nt.gov.au",
  "co.uk", "org.uk", "gov.uk", "ac.uk", "co.nz", "org.nz", "govt.nz", "com.sg", "co.in", "com.cn", "com.hk",
];

/**
 * Namespaces a scammer cannot register into.
 *
 * `.org.au` was on this list in the first version and has been removed: any
 * incorporated association can register under it, which makes it evidence of
 * being an organisation, not evidence of being the one the message claims.
 */
const OFFICIAL_SUFFIXES = ["gov.au", "edu.au"];

/**
 * Brands a message may claim to be, and the domains they genuinely own.
 *
 * This is what fixes the false positives the evaluation found. A lookalike is
 * a host that *names* a brand without being registered to it — so the rule has
 * to know what "registered to it" means, not merely whether the name appears.
 */
export const BRAND_DOMAINS: Record<string, string[]> = {
  auspost: ["auspost.com.au"],
  australiapost: ["auspost.com.au"],
  linkt: ["linkt.com.au"],
  mygov: ["my.gov.au"],
  ato: ["ato.gov.au"],
  centrelink: ["servicesaustralia.gov.au"],
  medicare: ["servicesaustralia.gov.au"],
  hume: ["hume.vic.gov.au"],
  paypal: ["paypal.com", "paypal.com.au"],
  netflix: ["netflix.com"],
  commbank: ["commbank.com.au"],
  westpac: ["westpac.com.au"],
  nab: ["nab.com.au"],
  anz: ["anz.com.au", "anz.com"],
  telstra: ["telstra.com.au", "telstra.com"],
  optus: ["optus.com.au"],
  amazon: ["amazon.com.au", "amazon.com"],
  apple: ["apple.com", "icloud.com"],
  microsoft: ["microsoft.com", "office.com", "live.com", "outlook.com"],
  office365: ["office.com", "microsoft.com"],
};

/**
 * Brands short enough to occur inside unrelated words.
 *
 * "ato" is inside "tomato", "nab" inside "unable". For these a match must be a
 * whole label or hyphen-separated token; longer names may also appear fused,
 * as in "auspostdelivery".
 */
const SHORT_BRAND_LENGTH = 4;

/** Shorteners hide the true destination, so the host tells you nothing. */
export const URL_SHORTENERS = [
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly", "rb.gy",
  "cutt.ly", "shorturl.at", "t.ly", "s.id", "tiny.cc",
];

/** Top-level domains that are cheap to register and carry a high share of abuse. */
export const SUSPICIOUS_TLDS = [
  "zip", "mov", "top", "xyz", "online", "click", "link", "info", "live", "buzz",
  "rest", "cfd", "help", "support", "icu", "sbs", "cyou", "quest", "shop",
];

/** Paths that end in something that installs or runs. */
const DOWNLOAD_EXTENSIONS = ["apk", "exe", "scr", "msi", "dmg", "jar", "bat", "cmd", "ps1", "vbs", "zip", "rar", "7z", "iso", "hta"];

/** Words a credential-harvesting page puts in its path to look like a sign-in. */
const CREDENTIAL_PATH = /\b(log-?in|sign-?in|verify|verification|secure|account|update|unlock|confirm|validate|wallet|password|auth)\b/i;

/** Query keys that hand the browser on to somewhere else. */
const REDIRECT_KEYS = /^(url|redirect|redirect_uri|redir|next|goto|dest|destination|target|return|continue|r|u|link)$/i;

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * Characters people and scammers substitute for letters.
 *
 * Applied before comparing a domain against the brands, so `paypa1`, `rnicrosoft`
 * and `c0mmbank` fold back to what they are pretending to be.
 */
function foldHomoglyphs(label: string): string {
  return label
    .replace(/rn/g, "m")
    .replace(/vv/g, "w")
    .replace(/0/g, "o")
    .replace(/[1l|]/g, "l")
    .replace(/3/g, "e")
    .replace(/5/g, "s")
    .replace(/\$/g, "s")
    .replace(/@/g, "a");
}

/** Edit distance, bounded — only distances of 0–2 are ever interesting. */
function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) {
    return 3;
  }

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0]!;
    previous[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j]!;
      previous[j] = Math.min(
        previous[j]! + 1,
        previous[j - 1]! + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }

  return previous[b.length]!;
}

function registrableOf(host: string): string {
  const labels = host.split(".");
  const suffix = MULTI_LABEL_SUFFIXES.filter((candidate) => host.endsWith(`.${candidate}`))
    .sort((a, b) => b.length - a.length)[0];

  const keep = suffix ? suffix.split(".").length + 1 : 2;
  return labels.slice(-keep).join(".");
}

function defang(href: string): string {
  return href.replace(/^http/i, "hxxp").replace(/\./g, "[.]");
}

/**
 * Parses one link. Returns null for anything the platform's parser rejects —
 * the analyser reports that as its own finding rather than guessing.
 */
export function parseLink(raw: string): ParsedLink | null {
  const trimmed = raw.trim();
  /* A scheme is "name://" or one of the two schemes that have no slashes.
     A bare "host:8080" is a port, not a scheme. */
  const schemeGiven = /^([a-z][a-z0-9+.-]*:\/\/|javascript:|data:)/i.test(trimmed);
  const href = schemeGiven ? trimmed : `https://${trimmed}`;

  let url: URL;

  try {
    url = new URL(href);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, "");

  if (!host && !/^(javascript|data):/i.test(href)) {
    return null;
  }

  const registrableDomain = IPV4.test(host) ? host : registrableOf(host);
  const subdomain = host.endsWith(registrableDomain)
    ? host.slice(0, host.length - registrableDomain.length).replace(/\.$/, "")
    : "";

  return {
    raw: trimmed,
    href: url.href,
    scheme: url.protocol.replace(":", "").toLowerCase(),
    schemeGiven,
    host,
    registrableDomain,
    subdomain,
    port: url.port,
    path: decodeSafely(url.pathname),
    query: url.search,
    userinfo: [url.username, url.password].filter(Boolean).join(":"),
    isIpAddress: IPV4.test(host),
    isPunycode: host.split(".").some((label) => label.startsWith("xn--")),
    isOfficial: OFFICIAL_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`)),
    defanged: defang(url.href),
  };
}

function decodeSafely(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * The brand a hostname token names, if any.
 *
 * Fused names count when the brand opens the token ("auspostdelivery"), or
 * closes it and is long enough not to be an ordinary word ending — "mynetflix"
 * names Netflix, "pineapple" does not name Apple.
 */
function brandNamedBy(tokens: string[]): string | undefined {
  return Object.keys(BRAND_DOMAINS).find((brand) =>
    tokens.some((token) =>
      token === brand ||
      (brand.length > SHORT_BRAND_LENGTH &&
        (token.startsWith(brand) || (brand.length >= 6 && token.endsWith(brand)))),
    ),
  );
}

/** Whether a registrable domain belongs to the brand it names. */
function ownedBy(brand: string, registrableDomain: string, host: string): boolean {
  return (BRAND_DOMAINS[brand] ?? []).some(
    (owned) => registrableDomain === owned || host === owned || host.endsWith(`.${owned}`),
  );
}

/**
 * The brand a domain is a near-miss of: one or two edits away from a domain
 * the brand owns, once lookalike characters are folded.
 */
function typosquatOf(registrableDomain: string): { brand: string; genuine: string } | undefined {
  const [label = ""] = registrableDomain.split(".");
  const folded = foldHomoglyphs(label);

  for (const [brand, owned] of Object.entries(BRAND_DOMAINS)) {
    for (const genuine of owned) {
      if (registrableDomain === genuine) {
        return undefined;
      }

      const [genuineLabel = ""] = genuine.split(".");

      if (genuineLabel.length < 5) {
        continue;
      }

      const distance = editDistance(folded, genuineLabel);

      if ((folded === genuineLabel && label !== genuineLabel) || (distance > 0 && distance <= 1)) {
        return { brand, genuine };
      }
    }
  }

  return undefined;
}

/**
 * FR19–FR21 — every check a link is put through.
 *
 * Each finding names the part of the link it came from, because the reader's
 * next question is always "which bit of it is wrong?", and the answer is almost
 * never the bit they were looking at.
 */
export function analyseLink(link: ParsedLink): Indicator[] {
  const found: Indicator[] = [];
  const at = link.registrableDomain;
  const add = (id: string, label: string, detail: string, weight: Indicator["weight"], decisive = false) =>
    found.push({ id: `link-${id}-${link.host || link.raw}`, label, detail, weight, decisive, evidence: link.defanged });

  if (link.scheme === "javascript" || link.scheme === "data") {
    add(
      "script-scheme",
      "Link runs code instead of opening a page",
      `A "${link.scheme}:" link executes or embeds content directly. It is never a genuine page address.`,
      "high",
      true,
    );
    return found;
  }

  if (link.userinfo) {
    add(
      "userinfo",
      "Link hides its real destination",
      `Everything before the "@" is ignored by the browser. This link looks like "${link.userinfo}" but actually opens ${at}.`,
      "high",
      true,
    );
  }

  if (link.isPunycode) {
    add(
      "punycode",
      "Domain uses look-alike characters",
      "The address is written with international characters that can be made to look identical to a familiar name. Browsers store it as \"xn--\".",
      "high",
    );
  }

  if (link.isIpAddress) {
    add(
      "ip",
      "Link points to a raw IP address",
      "Genuine services publish a domain name, not a bare numeric address.",
      "high",
    );
  }

  const extension = /\.([a-z0-9]{2,4})$/i.exec(link.path)?.[1]?.toLowerCase();

  if (extension && DOWNLOAD_EXTENSIONS.includes(extension)) {
    add(
      "download",
      "Link downloads an app or program",
      `The link ends in ".${extension}", which installs or runs software rather than showing a page. Messages about voicemail, parcels or invoices never need this.`,
      "high",
    );
  }

  /* Official namespaces cannot be registered by a scammer, so the ownership
     tests below would only ever produce noise for them. */
  if (link.isOfficial) {
    return found;
  }

  const tokens = link.host.split(/[.-]/).filter(Boolean);
  const brand = brandNamedBy(tokens);

  if (brand && !ownedBy(brand, at, link.host)) {
    /*
     * The genuine domain appearing to the *left* of the registrable one is a
     * distinct and stronger trick than a brand name merely appearing: the
     * reader sees "auspost.com.au" and stops reading before the part that
     * decides where they go.
     */
    const genuineInSubdomain = (BRAND_DOMAINS[brand] ?? []).some((owned) =>
      link.subdomain.includes(owned),
    );

    add(
      genuineInSubdomain ? "hidden-domain" : "lookalike",
      genuineInSubdomain ? "Real domain hidden behind a familiar one" : "Lookalike domain",
      genuineInSubdomain
        ? `The link starts with a genuine-looking address, but it is only a prefix. It is registered to ${at}, not to ${brand}.`
        : `Uses the name "${brand}" but is registered to ${at}, which ${brand} does not own.`,
      "high",
    );
  } else {
    const squat = typosquatOf(at);

    if (squat) {
      add(
        "typosquat",
        "Misspelled version of a known domain",
        `"${at}" is one character away from ${squat.genuine}. Swapped or doubled letters are how a fake address passes a quick glance.`,
        "high",
      );
    }
  }

  const tld = at.split(".").pop() ?? "";

  if (SUSPICIOUS_TLDS.includes(tld)) {
    add(
      "tld",
      "Uncommon top-level domain",
      `".${tld}" is cheap to register and carries a high share of abuse.`,
      "medium",
    );
  }

  if (URL_SHORTENERS.includes(link.host)) {
    add(
      "shortener",
      "Shortened link",
      "A shortener hides the real destination until you have already opened it.",
      "medium",
    );
  }

  if (link.schemeGiven && link.scheme === "http" && !link.isIpAddress) {
    add(
      "unencrypted",
      "Link is not encrypted",
      "It starts with http:// rather than https://. A genuine sign-in or payment page is never served without encryption.",
      "medium",
    );
  }

  if (link.port && !["80", "443"].includes(link.port)) {
    add(
      "port",
      "Link uses an unusual port",
      `":${link.port}" points at a non-standard service. Public websites do not ask you to type one.`,
      "medium",
    );
  }

  const redirect = [...new URLSearchParams(link.query).entries()].find(
    ([key, value]) => REDIRECT_KEYS.test(key) && /^(https?:|\/\/|www\.)/i.test(value),
  );

  if (redirect) {
    const onward = parseLink(redirect[1]);

    add(
      "redirect",
      "Link forwards you somewhere else",
      `A parameter in the link sends the browser on to ${onward?.registrableDomain ?? "another address"}, so the site you see in the message is not where you end up.`,
      "medium",
    );
  }

  if (CREDENTIAL_PATH.test(link.path)) {
    add(
      "credential-path",
      "Link leads to a sign-in or verification page",
      "The path is dressed as a login or verification step on a domain that is not the organisation's own.",
      "low",
    );
  }

  if (link.subdomain.split(".").filter(Boolean).length >= 3) {
    add(
      "depth",
      "Deeply nested subdomain",
      "Stacking subdomains pushes the real domain out of view on a phone.",
      "low",
    );
  }

  return found;
}

/** Parses every link, keeping the ones that fail to parse as their own finding. */
export function analyseLinks(raws: string[]): { links: ParsedLink[]; indicators: Indicator[] } {
  const links: ParsedLink[] = [];
  const indicators: Indicator[] = [];

  for (const raw of raws) {
    const link = parseLink(raw);

    if (!link) {
      indicators.push({
        id: `link-malformed-${raw}`,
        label: "Link is malformed",
        detail: "The address could not be parsed, which is itself unusual in a genuine message.",
        weight: "medium",
        evidence: defang(raw),
      });
      continue;
    }

    links.push(link);

    /*
     * Findings are keyed by rule and host, so the same domain reached by two
     * links — typed once and again inside a QR code — is one piece of evidence,
     * not two. Counting it twice would let repetition inflate the score, which
     * is exactly what the saturating curve is meant to prevent.
     */
    for (const finding of analyseLink(link)) {
      if (!indicators.some((existing) => existing.id === finding.id)) {
        indicators.push(finding);
      }
    }
  }

  return { links, indicators };
}

/**
 * The domain of an email address, checked the way a link's domain is.
 *
 * "support@commbank-alerts.com" is a lookalike in exactly the way
 * "commbank-alerts.com/login" is, and the sender address is often the only
 * link-shaped thing in a phishing email.
 */
export function analyseSenderDomains(emails: string[]): Indicator[] {
  return emails.flatMap((email) => {
    const domain = email.split("@")[1];
    const link = domain ? parseLink(domain) : null;

    if (!link || link.isOfficial) {
      return [];
    }

    const tokens = link.host.split(/[.-]/).filter(Boolean);
    const brand = brandNamedBy(tokens);

    if (brand && !ownedBy(brand, link.registrableDomain, link.host)) {
      return [
        {
          id: `email-lookalike-${email}`,
          label: "Sender address imitates an organisation",
          detail: `The address names "${brand}" but its domain, ${link.registrableDomain}, is not one ${brand} uses.`,
          weight: "high" as const,
          evidence: email,
        },
      ];
    }

    return [];
  });
}
