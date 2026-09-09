import { lookup } from "node:dns/promises";
import { request as httpRequest, type IncomingMessage } from "node:http";
import { request as httpsRequest } from "node:https";
import type { TLSSocket } from "node:tls";

/**
 * Following a link so that nobody has to click it.
 *
 * This is the one part of the checker that leaves the reader's device, and the
 * reason is unavoidable: a browser cannot be told where a link goes without
 * going there. Cross-origin redirect chains are invisible to page JavaScript by
 * design, so a check that runs only in the browser can describe a URL's spelling
 * and nothing about its destination — which is precisely the half that matters,
 * because the whole purpose of a shortener is that the spelling tells you
 * nothing.
 *
 * What leaves the device is the URL and only the URL. No attachment, no message
 * text, no identifier of the person asking. The request is made from this
 * service rather than from the reader's own address, which is the second reason
 * to do it here: opening a scam link from your own phone tells the operator
 * that a real person read the message, and this hop is what stops that
 * happening. The user interface says all of this before the check runs.
 *
 * Two rules govern the fetch itself, both of them about not becoming a weapon.
 * The destination is never rendered and never executed — the response is read
 * as bytes, capped, and searched with string matches. And every address is
 * resolved and checked against the private ranges before a connection is
 * opened, and again after, so this endpoint cannot be aimed at anything inside
 * the network it runs in.
 */

/** Hard stop on redirects. A chain longer than this is itself the finding. */
const MAX_HOPS = 8;

/** Total time allowed for the whole chain. */
const TOTAL_TIMEOUT_MS = 9_000;

/** Per-request connect and response timeout. */
const HOP_TIMEOUT_MS = 5_000;

/** How much of the destination to read. Enough for a title and a form. */
const MAX_BYTES = 192 * 1024;

/**
 * A browser-shaped user agent.
 *
 * Sites that serve scams routinely serve something harmless to anything that
 * announces itself as a scanner, so a truthful bot identifier would produce a
 * clean report on a page that is not clean. This is a deliberate, documented
 * choice; the request still honours robots-level courtesy by reading one page,
 * once, and never following anything but the redirect chain.
 */
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

interface Hop {
  url: string;
  status: number;
  /** How the hop was made: an HTTP redirect, a meta refresh, or a script. */
  via: "start" | "http-redirect" | "meta-refresh" | "script";
}

interface Resolution {
  finalUrl: string;
  finalHost: string;
  status: number;
  hops: Hop[];
  contentType?: string;
  server?: string;
  title?: string;
  /** True where the destination page contains a password field. */
  asksForPassword?: boolean;
  /** True where it asks for card or bank details. */
  asksForPayment?: boolean;
  /** True where it is a login form of any kind. */
  hasForm?: boolean;
  /** Where the final host resolved to, and whether the connection was secure. */
  ip?: string;
  tls?: { issuer?: string; subject?: string; validFrom?: string; validTo?: string; daysOld?: number };
  /** Set instead of the rest when the destination could not be reached. */
  error?: string;
}

/* ─────────────────────────────── address safety ─────────────────────────── */

/**
 * Address ranges this endpoint must never connect to.
 *
 * A service that fetches a URL on request is a request forgery primitive
 * unless it refuses to reach inside its own network. Checked against the
 * resolved address rather than the hostname, because a hostname can resolve
 * wherever its owner points it, and checked again after the socket connects,
 * because between the two an attacker's DNS can change its answer.
 */
function isPrivateAddress(ip: string): boolean {
  if (ip.includes(":")) {
    const lower = ip.toLowerCase();
    /* Loopback, unspecified, unique-local, link-local, and v4-mapped forms. */
    return (
      lower === "::1" ||
      lower === "::" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe80") ||
      lower.startsWith("::ffff:")
    );
  }

  const parts = ip.split(".").map(Number);

  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b] = parts as [number, number, number, number];

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 192 && b === 0) ||
    a >= 224
  );
}

/** Resolves a hostname and refuses anything that lands inside the network. */
async function safeAddress(hostname: string): Promise<string> {
  const addresses = await lookup(hostname, { all: true });

  if (addresses.length === 0) {
    throw new Error("That address does not resolve to anything.");
  }

  for (const entry of addresses) {
    if (isPrivateAddress(entry.address)) {
      throw new Error("That address points inside a private network and was not followed.");
    }
  }

  return addresses[0]!.address;
}

/* ──────────────────────────────── one hop ───────────────────────────────── */

interface HopResult {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: string;
  ip?: string;
  tls?: Resolution["tls"];
}

/**
 * Fetches one URL without following anything.
 *
 * Written against `node:https` rather than `fetch` for three things `fetch`
 * will not give up: the peer certificate, the address actually connected to,
 * and the ability to stop reading at a byte count rather than after the body
 * has already arrived.
 */
function fetchOnce(target: URL, address: string): Promise<HopResult> {
  const secure = target.protocol === "https:";
  const send = secure ? httpsRequest : httpRequest;

  return new Promise((resolve, reject) => {
    const req = send(
      {
        protocol: target.protocol,
        /* Connect to the address that was checked, and carry the real name in
           the Host header and SNI so virtual hosting and TLS still work. This
           is what closes the window between resolving a name and using it. */
        host: address,
        servername: secure ? target.hostname : undefined,
        port: target.port || (secure ? 443 : 80),
        path: `${target.pathname}${target.search}`,
        method: "GET",
        timeout: HOP_TIMEOUT_MS,
        headers: {
          Host: target.host,
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
          "Accept-Language": "en-AU,en;q=0.9",
        },
      },
      (res: IncomingMessage) => {
        const chunks: Buffer[] = [];
        let read = 0;

        res.on("data", (chunk: Buffer) => {
          read += chunk.length;

          if (read <= MAX_BYTES) {
            chunks.push(chunk);
          } else {
            res.destroy();
          }
        });

        const finish = () => {
          const socket = res.socket as TLSSocket | undefined;
          let tls: Resolution["tls"];

          if (secure && socket && typeof socket.getPeerCertificate === "function") {
            const cert = socket.getPeerCertificate();

            if (cert && cert.subject) {
              const from = cert.valid_from ? new Date(cert.valid_from) : undefined;
              tls = {
                issuer: cert.issuer?.O ?? cert.issuer?.CN,
                subject: cert.subject.CN,
                validFrom: from && !Number.isNaN(from.getTime()) ? from.toISOString() : undefined,
                validTo: cert.valid_to,
                daysOld:
                  from && !Number.isNaN(from.getTime())
                    ? Math.floor((Date.now() - from.getTime()) / 86_400_000)
                    : undefined,
              };
            }
          }

          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: Buffer.concat(chunks).toString("utf8"),
            ip: res.socket?.remoteAddress ?? address,
            tls,
          });
        };

        res.on("end", finish);
        res.on("close", finish);
        res.on("error", () => finish());
      },
    );

    req.on("timeout", () => {
      req.destroy(new Error("The destination did not respond in time."));
    });

    req.on("error", (error: Error) => reject(error));
    req.end();
  });
}

/* ────────────────────────── redirects beyond HTTP ───────────────────────── */

/** A `<meta http-equiv="refresh">` destination, which is a redirect by another name. */
function metaRefresh(body: string, base: URL): string | null {
  const match =
    /<meta[^>]+http-equiv=["']?refresh["']?[^>]*content=["'][^"']*url=([^"';>\s]+)/i.exec(body);

  return match ? absolute(match[1]!, base) : null;
}

/**
 * A destination assigned by script in the page's own source.
 *
 * Only the plainest forms are read — an assignment to `location` with a
 * literal string. Anything more elaborate is left alone rather than guessed at,
 * and the report says the page redirects by script without claiming to know
 * where. Nothing on the page is executed to find out.
 */
function scriptRedirect(body: string, base: URL): string | null {
  const match =
    /(?:window\.)?location(?:\.href|\.replace\(|\s*=\s*)\s*["']([^"']{4,300})["']/i.exec(body);

  return match ? absolute(match[1]!, base) : null;
}

function absolute(href: string, base: URL): string | null {
  try {
    return new URL(href.trim().replace(/^['"]|['"]$/g, ""), base).toString();
  } catch {
    return null;
  }
}

/* ─────────────────────────── reading the destination ────────────────────── */

const PASSWORD_FIELD = /<input[^>]+type=["']?password["']?/i;
const PAYMENT_FIELD =
  /\b(card ?number|cardnumber|cc-number|credit ?card|cvv|cvc|security code|expiry|expiration|bsb|sort ?code|account ?number|iban)\b/i;
const ANY_FORM = /<form[\s>]/i;

function pageTitle(body: string): string | undefined {
  const match = /<title[^>]*>([\s\S]{1,300}?)<\/title>/i.exec(body);

  if (!match) {
    return undefined;
  }

  return match[1]!
    .replace(/\s+/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .trim()
    .slice(0, 160);
}

function headerOf(headers: HopResult["headers"], key: string): string | undefined {
  const value = headers[key];
  return Array.isArray(value) ? value[0] : value;
}

/* ──────────────────────────────── the chain ─────────────────────────────── */

async function follow(start: URL): Promise<Resolution> {
  const hops: Hop[] = [];
  const deadline = Date.now() + TOTAL_TIMEOUT_MS;

  let current = start;
  let via: Hop["via"] = "start";
  let last: HopResult | null = null;

  for (let i = 0; i < MAX_HOPS; i += 1) {
    if (Date.now() > deadline) {
      break;
    }

    const address = await safeAddress(current.hostname);
    const result = await fetchOnce(current, address);

    /* Re-checked after connecting: between the resolve above and the socket, a
       hostile resolver can change its answer. */
    if (result.ip && isPrivateAddress(result.ip)) {
      throw new Error("That address connected to a private network address and was dropped.");
    }

    hops.push({ url: current.toString(), status: result.status, via });
    last = result;

    const location = headerOf(result.headers, "location");

    if (result.status >= 300 && result.status < 400 && location) {
      const next = absolute(location, current);

      if (!next) {
        break;
      }

      current = new URL(next);
      via = "http-redirect";
      continue;
    }

    const meta = metaRefresh(result.body, current);

    if (meta && meta !== current.toString()) {
      current = new URL(meta);
      via = "meta-refresh";
      continue;
    }

    const script = scriptRedirect(result.body, current);

    if (script && script !== current.toString() && new URL(script).host !== current.host) {
      current = new URL(script);
      via = "script";
      continue;
    }

    break;
  }

  if (!last) {
    throw new Error("The destination could not be reached.");
  }

  const contentType = headerOf(last.headers, "content-type");
  const html = /html/i.test(contentType ?? "");

  return {
    finalUrl: current.toString(),
    finalHost: current.hostname,
    status: last.status,
    hops,
    contentType,
    server: headerOf(last.headers, "server"),
    title: html ? pageTitle(last.body) : undefined,
    hasForm: html ? ANY_FORM.test(last.body) : undefined,
    asksForPassword: html ? PASSWORD_FIELD.test(last.body) : undefined,
    asksForPayment: html ? PAYMENT_FIELD.test(last.body) : undefined,
    ip: last.ip,
    tls: last.tls,
  };
}

/* ───────────────────────────────── handler ──────────────────────────────── */

interface VercelRequest {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  setHeader: (key: string, value: string) => void;
  json: (body: unknown) => void;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Send a POST with a url." });
    return;
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body;
  const raw = (body as { url?: unknown } | null)?.url;

  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2048) {
    res.status(400).json({ error: "Send a single url as a string." });
    return;
  }

  let target: URL;

  try {
    target = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
  } catch {
    res.status(400).json({ error: "That is not a URL that can be followed." });
    return;
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    res.status(400).json({ error: `Links of type "${target.protocol}" are not followed.` });
    return;
  }

  /* Credentials in a URL are a finding the browser reports on its own; sending
     them onward from this service would be handing them to the destination. */
  target.username = "";
  target.password = "";

  try {
    const resolution = await follow(target);
    res.status(200).json(resolution);
  } catch (error) {
    res.status(200).json({
      finalUrl: target.toString(),
      finalHost: target.hostname,
      status: 0,
      hops: [],
      error:
        error instanceof Error && error.message
          ? error.message
          : "The destination could not be reached.",
    } satisfies Resolution);
  }
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
