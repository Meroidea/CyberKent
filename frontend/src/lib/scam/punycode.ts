/**
 * Just enough of RFC 3492 to turn a punycode label back into what it displays as.
 *
 * A browser shows `xn--pypal-4ve.com` in the address bar as `pýpal.com`, and the
 * whole point of registering it is that the second reads as PayPal at a glance.
 * A report that quotes only the encoded form is describing the disguise rather
 * than the trick — the reader has to see both to understand what happened, so
 * the decoder is worth the forty lines.
 *
 * Decoding only. Encoding is never needed here, and the halves of the algorithm
 * share nothing but constants.
 */

const BASE = 36;
const T_MIN = 1;
const T_MAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;
const DELIMITER = "-";

function digitOf(code: number): number {
  if (code >= 0x30 && code <= 0x39) return code - 0x30 + 26; // 0-9
  if (code >= 0x61 && code <= 0x7a) return code - 0x61; // a-z
  if (code >= 0x41 && code <= 0x5a) return code - 0x41; // A-Z
  return BASE;
}

function adapt(delta: number, numPoints: number, firstTime: boolean): number {
  let value = firstTime ? Math.floor(delta / DAMP) : delta >> 1;
  value += Math.floor(value / numPoints);

  let k = 0;
  while (value > ((BASE - T_MIN) * T_MAX) >> 1) {
    value = Math.floor(value / (BASE - T_MIN));
    k += BASE;
  }

  return k + Math.floor(((BASE - T_MIN + 1) * value) / (value + SKEW));
}

/** Decodes one label's payload. Returns null on anything malformed. */
function decodeLabel(encoded: string): string | null {
  const delimiterAt = encoded.lastIndexOf(DELIMITER);
  const basic = delimiterAt > 0 ? encoded.slice(0, delimiterAt) : "";
  const output = [...basic].map((character) => character.codePointAt(0)!);

  let n = INITIAL_N;
  let bias = INITIAL_BIAS;
  let i = 0;
  let index = delimiterAt > 0 ? delimiterAt + 1 : 0;

  while (index < encoded.length) {
    const previous = i;
    let w = 1;

    for (let k = BASE; ; k += BASE) {
      if (index >= encoded.length) {
        return null;
      }

      const digit = digitOf(encoded.charCodeAt(index));
      index += 1;

      if (digit >= BASE) {
        return null;
      }

      i += digit * w;

      const t = k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias;

      if (digit < t) {
        break;
      }

      w *= BASE - t;
    }

    bias = adapt(i - previous, output.length + 1, previous === 0);
    n += Math.floor(i / (output.length + 1));
    i %= output.length + 1;

    if (n > 0x10ffff) {
      return null;
    }

    output.splice(i, 0, n);
    i += 1;
  }

  try {
    return String.fromCodePoint(...output);
  } catch {
    return null;
  }
}

/**
 * Decodes every `xn--` label in a host. Labels that are not punycode, and
 * labels that fail to decode, are passed through unchanged — a partial decode
 * is still more informative than none.
 */
export function decodeHost(host: string): string {
  return host
    .split(".")
    .map((label) => {
      if (!/^xn--/i.test(label)) {
        return label;
      }

      return decodeLabel(label.slice(4)) ?? label;
    })
    .join(".");
}

/** True when the host carries at least one punycode label. */
export function isPunycode(host: string): boolean {
  return host.split(".").some((label) => /^xn--/i.test(label));
}

/**
 * Scripts that are worth naming when they turn up mixed into a Latin host.
 *
 * Not a general Unicode confusables table — that is a large data file and most
 * of it never appears in a domain. These are the ranges that carry the letters
 * actually used for this: Cyrillic а/е/о/р/с, Greek ο/ν, and the Latin
 * accented forms that read as their unaccented cousins at small sizes.
 */
const SCRIPTS: { name: string; pattern: RegExp }[] = [
  { name: "Cyrillic", pattern: /[Ѐ-ӿ]/ },
  { name: "Greek", pattern: /[Ͱ-Ͽ]/ },
  { name: "Armenian", pattern: /[԰-֏]/ },
  { name: "Hebrew", pattern: /[֐-׿]/ },
  { name: "Arabic", pattern: /[؀-ۿ]/ },
];

/**
 * Which non-Latin scripts a decoded host mixes into Latin letters.
 *
 * Mixing is the signal, not the presence of the script itself: a wholly
 * Cyrillic domain is ordinary in the places that use Cyrillic, whereas
 * `pаypal.com` with one Cyrillic `а` exists for exactly one reason.
 */
export function mixedScripts(decoded: string): string[] {
  const letters = decoded.replace(/[^\p{L}]/gu, "");

  if (!/[a-z]/i.test(letters)) {
    return [];
  }

  return SCRIPTS.filter((script) => script.pattern.test(letters)).map((script) => script.name);
}

/** Latin letters carrying diacritics, which read as their plain form at a glance. */
export function hasLatinLookalikes(decoded: string): boolean {
  return /[À-ɏ]/.test(decoded);
}
