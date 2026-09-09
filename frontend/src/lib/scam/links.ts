import {
  IMPERSONATED_BRANDS,
  OFFICIAL_SUFFIXES,
  SUSPICIOUS_TLDS,
  URL_SHORTENERS,
} from "@/lib/scam/patterns";
import type { Indicator, IndicatorWeight } from "@/lib/scam/types";

/**
 * Treating a link as a destination rather than as a piece of text.
 *
 * A link in a scam message is not a string, it is an instruction, and the
 * checker used to report it as neither: it pulled the address out, listed it
 * under "pulled out of the message", and scored it on the spelling of its
 * hostname. That is the half of the job a shortener exists to defeat. Somebody
 * handed "is bit.ly/3xKq9 safe?" is asking where it goes, and the spelling of
 * a shortened link is designed to say nothing about that.
 *
 * So this module does two things, and the split between them is the whole
 * design. The structural pass reads the URL itself and runs entirely on the
 * reader's device — every trick that lives in how an address is written is
 * caught here, at no cost and with nothing transmitted. The resolution pass
 * asks this service's own endpoint to follow the link and report back what is
 * at the end of it, because a browser is not permitted to see a cross-origin
 * redirect chain and so a page can never answer that question about itself.
 *
 * The privacy cost of the second pass is real, bounded and disclosed: the URL
 * goes to this service, nothing else does, and the request is made from the
 * service rather than from the reader, so opening a scam link no longer tells
 * its operator that a real person read the message.
 */

export type LinkFindingId =
  | "userinfo"
  | "punycode"
  | "non-ascii-host"
  | "raw-ip"
  | "unusual-port"
  | "shortener"
  | "suspicious-tld"
  | "lookalike"
  | "brand-in-path"
  | "deep-subdomain"
  | "embedded-url"
  | "encoded-host"
  | "downloads-file"
  | "insecure"
  | "malformed"
  | "redirect-chain"
  | "cross-site-redirect"
  | "asks-for-password"
  | "asks-for-payment"
  | "unreachable";

export interface LinkFinding {
  id: LinkFindingId;
  label: string;
  detail: string;
  weight: IndicatorWeight;
  evidence?: string;
}

/** One hop in a redirect chain, as the resolver observed it. */
export interface LinkHop {
  url: string;
  status: number;
  via: "start" | "http-redirect" | "meta-refresh" | "script";
}

export interface LinkResolution {
  finalUrl: string;
  finalHost: string;
  status: number;
  hops: LinkHop[];
  contentType?: string;
  server?: string;
  title?: string;
  hasForm?: boolean;
  asksForPassword?: boolean;
  asksForPayment?: boolean;
  ip?: string;
  tls?: { issuer?: string; subject?: string; validFrom?: string; validTo?: string; daysOld?: number };
  error?: string;
}

export interface LinkReport {
  /** Exactly as it appeared in the message or the file. */
  raw: string;
  /** The absolute form, where it parses. */
  url?: string;
  host?: string;
  /** The registrable part, which is the only part of a host that is owned. */
  domain?: string;
  scheme?: string;
  path?: string;
  findings: LinkFinding[];
  /** What following it actually found. Absent where the resolver did not run. */
  resolution?: LinkResolution;
  /** Why the resolver did not run, where it did not. */
  notFollowed?: string;
  /** One sentence answering "what happens if I click this". Always present. */
  summary: string;
}

/* ────────────────────────────── structural pass ─────────────────────────── */

/** Two-part suffixes where the registrable domain is one label further left. */
const COMPOUND_SUFFIXES = [
  "com.au", "net.au", "org.au", "edu.au", "gov.au", "asn.au", "id.au",
  "co.uk", "org.uk", "gov.uk", "ac.uk", "co.nz", "govt.nz", "co.za", "com.sg",
];

/** The registrable domain: the part somebody actually bought. */
export function registrableDomain(host: string): string {
  const labels = host.split(".");

  if (labels.length <= 2) {
    return host;
  }

  const lastTwo = labels.slice(-2).join(".");

  return COMPOUND_SUFFIXES.includes(lastTwo)
    ? labels.slice(-3).join(".")
    : lastTwo;
}

/** Path extensions that mean the link hands over a file rather than a page. */
const DOWNLOAD_EXTENSIONS =
  /\.(exe|scr|msi|apk|dmg|jar|bat|cmd|ps1|vbs|hta|lnk|zip|rar|7z|iso|img)(\?|$)/i;

/**
 * Everything that can be established from the address itself.
 *
 * Runs on the reader's device and transmits nothing, which is why it runs on
 * every link whether or not the resolver is available or wanted.
 */
export function inspectStructure(raw: string): LinkReport {
  const findings: LinkFinding[] = [];
  const trimmed = raw.trim();

  let url: URL;

  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return {
      raw: trimmed,
      findings: [
        {
          id: "malformed",
          label: "Link is malformed",
          detail:
            "The address could not be parsed as a web address at all, which is itself unusual in a genuine message.",
          weight: "medium",
          evidence: trimmed.slice(0, 120),
        },
      ],
      summary: "This is not a well-formed web address, so where it leads could not be established.",
    };
  }

  const host = url.hostname.toLowerCase();
  const isAddress = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":");
  const domain = isAddress ? host : registrableDomain(host);
  const official = OFFICIAL_SUFFIXES.some((suffix) => host.endsWith(suffix));

  const report: LinkReport = {
    raw: trimmed,
    url: url.toString(),
    host,
    domain,
    scheme: url.protocol.replace(":", ""),
    path: url.pathname + url.search,
    findings,
    summary: "",
  };

  /*
   * The oldest trick that still works, and the one people are least equipped
   * to see. Everything before an "@" in a URL is credentials, which browsers
   * ignore and do not display — so "https://mygov.au@203.0.113.9/login" is a
   * link to 203.0.113.9 that reads as a link to mygov.au.
   */
  if (url.username || url.password || /^[a-z]+:\/\/[^/?#]*@/i.test(trimmed)) {
    findings.push({
      id: "userinfo",
      label: "The address is not what it appears to say",
      detail: `Everything before the "@" in this link is ignored by the browser. It reads as though it goes to ${
        (url.username || "the name shown").slice(0, 40)
      }, and it actually goes to ${host}. There is no legitimate use for this in a message to the public.`,
      weight: "high",
      evidence: host,
    });
  }

  /* An internationalised domain encoded for DNS. Used to register a name that
     renders identically to a real one in a different alphabet. */
  if (host.includes("xn--")) {
    findings.push({
      id: "punycode",
      label: "The address uses characters from another alphabet",
      detail:
        "This hostname is written in an encoding that lets characters from other alphabets appear in a web address. Some of those characters are indistinguishable on screen from ordinary letters, which is how an address is made to look like one you recognise while being a different address entirely.",
      weight: "high",
      evidence: host,
    });
  } else if (/[^ -~]/.test(url.hostname)) {
    findings.push({
      id: "non-ascii-host",
      label: "The address contains unusual characters",
      detail:
        "The hostname contains characters outside the ordinary Latin alphabet. Some of them look identical to ordinary letters on screen.",
      weight: "high",
      evidence: host,
    });
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    findings.push({
      id: "raw-ip",
      label: "Link points to a raw address, not a name",
      detail:
        "Genuine services publish a domain name. A bare numeric address is used when there is no name to publish, or when the name would be blocked.",
      weight: "high",
      evidence: host,
    });
  }

  if (url.port && url.port !== "80" && url.port !== "443") {
    findings.push({
      id: "unusual-port",
      label: "Link uses an unusual port",
      detail: `Web addresses in ordinary use do not name a port. This one connects on ${url.port}, which is where something is being run outside the normal setup.`,
      weight: "medium",
      evidence: `${host}:${url.port}`,
    });
  }

  if (URL_SHORTENERS.includes(host)) {
    findings.push({
      id: "shortener",
      label: "Shortened link",
      detail:
        "A shortener hides the real destination until you have already opened it. Where this service could follow the link, the destination is reported below.",
      weight: "medium",
      evidence: host,
    });
  }

  if (!official) {
    const tld = host.split(".").pop() ?? "";

    if (SUSPICIOUS_TLDS.includes(tld)) {
      findings.push({
        id: "suspicious-tld",
        label: "Uncommon top-level domain",
        detail: `".${tld}" is cheap to register and carries a high share of abuse.`,
        weight: "medium",
        evidence: host,
      });
    }

    /*
     * A brand in the address that is not the brand's own domain. The check is
     * on the registrable domain rather than the whole host on purpose: the
     * common trick is a subdomain or a path that reads like the brand while
     * the part actually owned by somebody is entirely different.
     */
    const brand = IMPERSONATED_BRANDS.find((candidate) => host.includes(candidate));

    if (brand) {
      findings.push({
        id: "lookalike",
        label: "Lookalike domain",
        detail: `The address contains "${brand}" but "${domain}" is not an official address for it. Anyone can register a name containing a brand.`,
        weight: "high",
        evidence: domain,
      });
    } else {
      const inPath = IMPERSONATED_BRANDS.find((candidate) =>
        `${url.pathname}${url.search}`.toLowerCase().includes(candidate),
      );

      if (inPath) {
        findings.push({
          id: "brand-in-path",
          label: "A brand name appears after the real domain",
          detail: `"${inPath}" appears in the part of the address after the domain, where anybody can put anything. The part that decides where this goes is "${domain}".`,
          weight: "medium",
          evidence: domain,
        });
      }
    }

    if (!isAddress && host.split(".").length > 3) {
      findings.push({
        id: "deep-subdomain",
        label: "Deeply nested subdomain",
        detail:
          "Stacking subdomains pushes the real domain out of view on a phone, where a browser shows only the beginning of the address.",
        weight: "low",
        evidence: host,
      });
    }
  }

  /* A whole second URL inside a parameter: an open redirect, or a link that
     announces where it is really going and relies on nobody reading it. */
  const embedded = /[?&][^=]*=(https?(%3a|:)\/\/|https?%3A%2F%2F)([^&#]+)/i.exec(url.search);

  if (embedded) {
    let destination = embedded[0].slice(embedded[0].indexOf("=") + 1);

    try {
      destination = decodeURIComponent(destination);
    } catch {
      /* Leave it as written; it is still worth showing. */
    }

    findings.push({
      id: "embedded-url",
      label: "The link carries a second address inside it",
      detail:
        "One of this link's parameters is itself a web address. That is how a link on a domain you trust is used to send you somewhere else entirely — the first address is real, and it forwards you to the second.",
      weight: "high",
      evidence: destination.slice(0, 120),
    });
  }

  if (DOWNLOAD_EXTENSIONS.test(url.pathname)) {
    findings.push({
      id: "downloads-file",
      label: "The link downloads a file rather than opening a page",
      detail:
        "This address ends in a file type that is downloaded and opened rather than displayed. A notice, a bill or a message never needs to be delivered that way.",
      weight: "high",
      evidence: url.pathname.slice(-60),
    });
  }

  if (url.protocol === "http:") {
    findings.push({
      id: "insecure",
      label: "The link is not encrypted",
      detail:
        "This address uses plain http, so anything typed into the page travels unprotected. Organisations stopped publishing links like this years ago.",
      weight: "low",
      evidence: url.origin,
    });
  }

  report.summary = structuralSummary(report);

  return report;
}

function structuralSummary(report: LinkReport): string {
  const worst = report.findings.find((finding) => finding.weight === "high");

  if (worst) {
    return `This link goes to ${report.host}. ${worst.label}.`;
  }

  return `This link goes to ${report.host}. Nothing in how the address is written is out of the ordinary; that does not say what is at the other end.`;
}

/* ───────────────────────────── resolution pass ──────────────────────────── */

/** Where the resolver lives. Same origin, so the existing CSP covers it. */
const RESOLVER = "/api/inspect-link";

/** How long to wait for the whole resolution before giving up on a link. */
const RESOLVE_TIMEOUT_MS = 12_000;

/** Most links in one submission that will be followed. */
export const MAX_FOLLOWED = 5;

/**
 * Asks the service to follow one link and report what is there.
 *
 * Never throws and never blocks a verdict: a resolver that is unavailable
 * leaves `notFollowed` set with a reason, and the structural findings stand on
 * their own. That distinction is deliberate — "we followed it and it was fine"
 * and "we could not follow it" must never look the same in a report.
 */
export async function followLink(report: LinkReport): Promise<LinkReport> {
  if (!report.url || (report.scheme !== "http" && report.scheme !== "https")) {
    return { ...report, notFollowed: "Only web links can be followed." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RESOLVE_TIMEOUT_MS);

  try {
    const response = await fetch(RESOLVER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: report.url }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ...report,
        notFollowed: "This link could not be followed from here, so only its address was checked.",
      };
    }

    const resolution = (await response.json()) as LinkResolution;

    return withResolution(report, resolution);
  } catch {
    return {
      ...report,
      notFollowed:
        "This link could not be followed from here — the check timed out or the connection failed — so only its address was checked.",
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Folds what the resolver found into the report's findings and summary. */
export function withResolution(report: LinkReport, resolution: LinkResolution): LinkReport {
  const findings = [...report.findings];

  if (resolution.error) {
    findings.push({
      id: "unreachable",
      label: "The destination could not be reached",
      detail: `${resolution.error} A link that does not answer is not evidence either way — scam pages are taken down quickly, and so are pages that were never there.`,
      weight: "low",
      evidence: resolution.finalHost,
    });

    return {
      ...report,
      resolution,
      /* Carrying the array this branch just pushed to, not the one on `report`.
         Spreading the report kept its original findings and silently discarded
         the "could not be reached" note that had just been added. */
      findings,
      summary: `This link goes to ${report.host}, which did not respond when this service tried it.`,
    };
  }

  const redirects = resolution.hops.filter((hop) => hop.via !== "start");

  /* A plain-http address that lands on https is what every site does when it
     upgrades a visitor. Following the link is what turns the structural guess
     into an answer, so the guess is withdrawn rather than left standing. */
  const upgraded = report.scheme === "http" && resolution.finalUrl.startsWith("https://");
  const startDomain = report.domain ?? report.host ?? "";
  const endDomain = registrableDomain(resolution.finalHost);
  const crossed = Boolean(startDomain) && startDomain !== endDomain;

  if (crossed) {
    findings.push({
      id: "cross-site-redirect",
      label: "The link forwards you somewhere else",
      detail: `Following this link does not leave you on ${startDomain}. It forwards to ${endDomain}, which is a different site with a different owner. The address in the message tells you nothing about where you end up.`,
      weight: redirects.length > 0 ? "high" : "medium",
      evidence: `${startDomain} to ${endDomain}`,
    });
  } else if (redirects.length >= 3) {
    findings.push({
      id: "redirect-chain",
      label: "The link passes through several hops",
      detail: `Opening it moves through ${redirects.length} further addresses before arriving. Chains like this are used to break the trail and to serve different destinations to different visitors.`,
      weight: "medium",
      evidence: `${redirects.length} hops`,
    });
  }

  if (resolution.asksForPassword) {
    findings.push({
      id: "asks-for-password",
      label: "The destination asks for a password",
      detail: `The page at ${resolution.finalHost} contains a password field. If the message that carried this link claimed to be from an organisation you deal with, do not type anything here — open their site yourself instead.`,
      weight: "high",
      evidence: resolution.finalHost,
    });
  }

  if (resolution.asksForPayment) {
    findings.push({
      id: "asks-for-payment",
      label: "The destination asks for card or bank details",
      detail: `The page at ${resolution.finalHost} asks for card, account or security-code details.`,
      weight: "high",
      evidence: resolution.finalHost,
    });
  }

  /*
   * The destination's certificate is reported as a fact and scored as nothing.
   *
   * An earlier revision raised a finding when it was less than a fortnight
   * old, on the reasoning that a domain set up for one campaign has a
   * certificate as young as the campaign. Testing that against real sites
   * showed it to be wrong now rather than later: github.com came back at six
   * days and t.co at zero, because short-lived certificates have become the
   * norm and the industry is moving towards reissuing them every few days. A
   * check that fires on GitHub is not a check. The issuer and the date still
   * appear in the detail rows, where a reader can weigh them; what would
   * actually carry this signal is the age of the domain's registration, which
   * needs a registry lookup this service does not yet make.
   */

  /* Derived here rather than earlier, so it filters the findings this function
     has finished adding to rather than a copy taken before them. */
  const kept = upgraded ? findings.filter((finding) => finding.id !== "insecure") : findings;

  return { ...report, resolution, findings: kept, summary: resolutionSummary(report, resolution, crossed) };
}

function resolutionSummary(
  report: LinkReport,
  resolution: LinkResolution,
  crossed: boolean,
): string {
  const parts: string[] = [];

  parts.push(
    crossed
      ? `Clicking this opens ${report.host} and is forwarded to ${resolution.finalHost}.`
      : `Clicking this opens ${resolution.finalHost}.`,
  );

  if (resolution.title) {
    parts.push(`The page calls itself "${resolution.title}".`);
  }

  if (resolution.asksForPassword && resolution.asksForPayment) {
    parts.push("It asks for a password and for card or bank details.");
  } else if (resolution.asksForPassword) {
    parts.push("It asks for a password.");
  } else if (resolution.asksForPayment) {
    parts.push("It asks for card or bank details.");
  } else if (resolution.hasForm) {
    parts.push("It presents a form to fill in.");
  } else if (resolution.contentType && !/html/i.test(resolution.contentType)) {
    parts.push(`It serves ${resolution.contentType.split(";")[0]} rather than a web page.`);
  }

  return parts.join(" ");
}

/* ──────────────────────────────── indicators ────────────────────────────── */

/**
 * Turns link reports into the indicators the score is built from.
 *
 * Every URL rule lives here now. They used to sit in the analyser beside the
 * text rules, which meant a link was scored on its spelling and described
 * somewhere else entirely, and the two could not refer to each other. One
 * link, one report, one set of reasons.
 */
export function linkIndicators(reports: LinkReport[]): Indicator[] {
  const indicators: Indicator[] = [];

  for (const report of reports) {
    const official =
      report.host !== undefined &&
      OFFICIAL_SUFFIXES.some((suffix) => report.host!.endsWith(suffix));

    for (const finding of report.findings) {
      /*
       * An official Australian government or council domain cannot be
       * registered by a scammer, so the host-shape rules do not apply to it.
       * What was actually found by following the link still does — an official
       * domain hosting an open redirect is a real finding.
       */
      if (official && STRUCTURAL_ONLY.includes(finding.id)) {
        continue;
      }

      indicators.push({
        id: `link-${finding.id}-${report.host ?? report.raw}`,
        label: finding.label,
        detail: finding.detail,
        weight: finding.weight,
        evidence: finding.evidence ?? report.raw,
      });
    }
  }

  return indicators;
}

/** Findings that describe the address rather than the destination. */
const STRUCTURAL_ONLY: LinkFindingId[] = [
  "suspicious-tld",
  "lookalike",
  "brand-in-path",
  "deep-subdomain",
  "shortener",
  "insecure",
];

/**
 * Inspects every link, and follows as many of them as the budget allows.
 *
 * The cap exists because following a link is a real network round trip and a
 * message can carry a dozen of them; five is enough to cover any message a
 * person would actually be asking about. Links past the cap are still inspected
 * structurally and say so, rather than silently coming back clean.
 *
 * Followed one at a time rather than in parallel: the resolver is one small
 * function, and a burst of concurrent chains from one submission is a load
 * pattern this service has no reason to create.
 */
export async function resolveLinks(
  urls: string[],
  onProgress?: (url: string, index: number, total: number) => void,
): Promise<LinkReport[]> {
  const reports = urls.map(inspectStructure);
  const followable = reports.filter(
    (report) => report.url && (report.scheme === "http" || report.scheme === "https"),
  );
  const budget = followable.slice(0, MAX_FOLLOWED);

  for (const [index, report] of reports.entries()) {
    if (!budget.includes(report)) {
      if (report.url) {
        reports[index] = {
          ...report,
          notFollowed:
            report.scheme === "http" || report.scheme === "https"
              ? `Only the first ${MAX_FOLLOWED} links in a submission are followed. This one was checked by its address only.`
              : `Links of type "${report.scheme}" are not followed.`,
        };
      }
      continue;
    }

    onProgress?.(report.raw, budget.indexOf(report) + 1, budget.length);
    reports[index] = await followLink(report);
  }

  return reports;
}
