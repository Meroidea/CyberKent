/**
 * Byte-level readers shared by every pass that opens a file.
 *
 * These existed three times over — once in the metadata reader, once in the
 * forensic pass, once inside the provenance scan — with small differences in
 * each. That is how the same file came back described two ways: two parsers
 * over the same bytes eventually disagree, and when they do, the report shows
 * whichever one ran. One copy, used everywhere, is the fix.
 */

/** Big-endian 16-bit. Out of range reads 0 rather than NaN. */
export function u16be(bytes: Uint8Array, at: number): number {
  return ((bytes[at] ?? 0) << 8) | (bytes[at + 1] ?? 0);
}

/** Little-endian 16-bit. */
export function u16le(bytes: Uint8Array, at: number): number {
  return ((bytes[at + 1] ?? 0) << 8) | (bytes[at] ?? 0);
}

/** Big-endian 32-bit, unsigned. */
export function u32be(bytes: Uint8Array, at: number): number {
  return (
    (((bytes[at] ?? 0) << 24) |
      ((bytes[at + 1] ?? 0) << 16) |
      ((bytes[at + 2] ?? 0) << 8) |
      (bytes[at + 3] ?? 0)) >>> 0
  );
}

/** Little-endian 32-bit, unsigned. */
export function u32le(bytes: Uint8Array, at: number): number {
  return (
    (((bytes[at + 3] ?? 0) << 24) |
      ((bytes[at + 2] ?? 0) << 16) |
      ((bytes[at + 1] ?? 0) << 8) |
      (bytes[at] ?? 0)) >>> 0
  );
}

/**
 * A run of bytes as text, with unprintables dropped rather than replaced.
 *
 * Dropping rather than substituting matters for the identifier reads: a
 * marker payload is `Exif\0\0`, and a substitution character in place of the
 * NUL would leave every comparison against `"Exif"` to guess at trailing
 * junk.
 */
export function ascii(bytes: Uint8Array, at: number, length: number): string {
  let out = "";
  const end = Math.min(at + length, bytes.length);

  for (let i = Math.max(0, at); i < end; i += 1) {
    const code = bytes[i]!;
    if (code >= 0x20 && code < 0x7f) {
      out += String.fromCharCode(code);
    }
  }

  return out;
}

/** The same run, keeping NULs as terminators so identifiers can be split. */
export function asciiRaw(bytes: Uint8Array, at: number, length: number): string {
  let out = "";
  const end = Math.min(at + length, bytes.length);

  for (let i = Math.max(0, at); i < end; i += 1) {
    out += String.fromCharCode(bytes[i]!);
  }

  return out;
}

/** Index of the first occurrence of `needle` at or after `from`, or -1. */
export function indexOfBytes(haystack: Uint8Array, needle: number[], from = 0): number {
  const last = haystack.length - needle.length;

  outer: for (let i = Math.max(0, from); i <= last; i += 1) {
    for (let j = 0; j < needle.length; j += 1) {
      if (haystack[i + j] !== needle[j]) {
        continue outer;
      }
    }
    return i;
  }

  return -1;
}

/** The bytes of an ASCII string, for use with {@link indexOfBytes}. */
export function bytesOf(text: string): number[] {
  return [...text].map((character) => character.charCodeAt(0));
}
