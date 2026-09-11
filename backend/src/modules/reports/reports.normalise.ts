import type { IndicatorType } from "@prisma/client";

/**
 * FR21, FR24 — one artefact, one spelling.
 *
 * The registry is only useful if the fiftieth report of a domain lands on the
 * same row as the first, so every value is reduced to a canonical form before
 * it is looked up: lower-cased host, digits-only phone, trimmed address. A URL
 * also yields its domain, because the domain is what recurs — the path is often
 * unique per victim.
 *
 * Returns null for a value that does not parse as its declared type.
 */
export function normaliseIndicator(type: IndicatorType, raw: string): { type: IndicatorType; value: string }[] | null {
  const value = raw.trim();

  switch (type) {
    case "URL": {
      const url = parseUrl(value);
      if (!url) {
        return null;
      }
      const host = stripWww(url.hostname.toLowerCase());
      const path = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
      /* Query and fragment are dropped: they carry tracking identifiers that
         differ per recipient and would split one campaign into many rows. */
      return [
        { type: "URL", value: `${host}${path}`.slice(0, 500) },
        { type: "DOMAIN", value: host },
      ];
    }

    case "DOMAIN": {
      const url = parseUrl(value);
      return url ? [{ type: "DOMAIN", value: stripWww(url.hostname.toLowerCase()) }] : null;
    }

    case "PHONE": {
      let digits = value.replace(/\D/g, "");
      /* +61 4xx … and 04xx … are the same mobile. */
      if (digits.startsWith("61") && digits.length === 11) {
        digits = `0${digits.slice(2)}`;
      }
      return digits.length >= 6 && digits.length <= 15 ? [{ type: "PHONE", value: digits }] : null;
    }

    case "EMAIL": {
      const email = value.toLowerCase();
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? [{ type: "EMAIL", value: email }] : null;
    }

    case "BANK_ACCOUNT": {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 6 && digits.length <= 20 ? [{ type: "BANK_ACCOUNT", value: digits }] : null;
    }
  }
}

function parseUrl(value: string): URL | null {
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`);
    return url.hostname.includes(".") ? url : null;
  } catch {
    return null;
  }
}

function stripWww(host: string): string {
  return host.startsWith("www.") ? host.slice(4) : host;
}
