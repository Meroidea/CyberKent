import { asciiRaw, bytesOf, indexOfBytes } from "@/lib/scam/bytes";

/**
 * Looking for what a file carries that it has no reason to carry.
 *
 * "Is there anything hidden inside this?" is a question with an unglamorous
 * and largely reliable answer, because most of the ways of hiding something in
 * a file leave it plainly visible to anyone who reads the bytes rather than
 * opening the file. An image ends at a defined marker; anything after it is
 * not part of the picture. An archive's own header inside a photograph is not
 * a coincidence. A shell command in a metadata comment field was typed there.
 *
 * None of this detects a competent steganographer hiding a payload in the low
 * bits of the pixels, and the report says so rather than implying a clean
 * result means clean. What it does catch is the whole family of appended and
 * embedded payloads, which is what actually reaches an inbox.
 */

export interface HiddenFinding {
  id: string;
  label: string;
  detail: string;
  weight: "high" | "medium" | "low";
  evidence?: string;
}

export interface HiddenRead {
  findings: HiddenFinding[];
  /** Where the container's own data ends, when that could be established. */
  contentEnd?: number;
  /** Bytes past that end. Zero is a positive result, not an absent one. */
  trailingBytes?: number;
  /** Plain statement of what was searched, so a quiet result can be read. */
  examined: string;
}

/** Below this, a tail is padding or an alignment artefact rather than a payload. */
const TRAILING_THRESHOLD = 256;

/** Formats that have no business appearing inside another file. */
const FOREIGN_SIGNATURES: { id: string; label: string; bytes: number[] }[] = [
  { id: "zip", label: "a ZIP archive", bytes: [0x50, 0x4b, 0x03, 0x04] },
  { id: "rar", label: "a RAR archive", bytes: bytesOf("Rar!") },
  { id: "7z", label: "a 7-Zip archive", bytes: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c] },
  { id: "gzip", label: "a gzip stream", bytes: [0x1f, 0x8b, 0x08] },
  { id: "pdf", label: "a PDF document", bytes: bytesOf("%PDF-") },
  { id: "elf", label: "a Linux executable", bytes: [0x7f, 0x45, 0x4c, 0x46] },
  { id: "cab", label: "a Windows cabinet", bytes: bytesOf("MSCF") },
];

/**
 * Text that is a command, wherever it appears.
 *
 * Matched against the file's metadata regions rather than the whole file: a
 * compressed image's pixel data is effectively random bytes and will
 * eventually contain any short string by chance, so scanning all of it would
 * manufacture findings out of noise.
 */
const COMMAND_PATTERNS: { id: string; label: string; pattern: RegExp }[] = [
  { id: "script-tag", label: "an HTML script tag", pattern: /<script[\s>]/i },
  { id: "php", label: "PHP code", pattern: /<\?php/i },
  { id: "powershell", label: "a PowerShell command", pattern: /powershell(\.exe)?\s+-(e|enc|nop|w\s)/i },
  { id: "shell", label: "a shell command", pattern: /\b(curl|wget)\s+https?:\/\/\S+\s*\|\s*(ba)?sh\b/i },
  { id: "cmd", label: "a Windows command", pattern: /cmd(\.exe)?\s+\/c\s/i },
  { id: "eval", label: "an eval of decoded data", pattern: /eval\s*\(\s*(atob|base64_decode|unescape)\s*\(/i },
];

/**
 * The offset at which the container's own content ends.
 *
 * Returns `null` where the format has no defined end marker, so the caller
 * reports nothing rather than measuring a tail against a guess.
 */
function contentEnd(bytes: Uint8Array, sniffedType?: string): number | null {
  if (sniffedType === "image/jpeg") {
    /* Backwards from the tail: the last end-of-image marker is the real one,
       since a thumbnail carries its own earlier in the file. */
    for (let at = bytes.length - 2; at >= 2; at -= 1) {
      if (bytes[at] === 0xff && bytes[at + 1] === 0xd9) {
        return at + 2;
      }
    }
    return null;
  }

  if (sniffedType === "image/png") {
    const iend = lastIndexOfBytes(bytes, bytesOf("IEND"));
    /* IEND is followed by its own four-byte checksum. */
    return iend < 0 ? null : iend + 8;
  }

  if (sniffedType === "image/gif") {
    return bytes.length > 0 && bytes[bytes.length - 1] === 0x3b ? bytes.length : null;
  }

  if (sniffedType === "application/pdf") {
    const eof = lastIndexOfBytes(bytes, bytesOf("%%EOF"));
    return eof < 0 ? null : eof + 5;
  }

  return null;
}

function lastIndexOfBytes(haystack: Uint8Array, needle: number[]): number {
  outer: for (let i = haystack.length - needle.length; i >= 0; i -= 1) {
    for (let j = 0; j < needle.length; j += 1) {
      if (haystack[i + j] !== needle[j]) {
        continue outer;
      }
    }
    return i;
  }

  return -1;
}

/**
 * The regions of a file where text is text rather than compressed noise.
 *
 * For a JPEG that is its application and comment segments; for a PNG its
 * chunks before the image data. Restricting the command search to these is
 * what keeps it from firing on random bytes inside the picture itself.
 */
function metadataText(bytes: Uint8Array, sniffedType?: string): string {
  if (sniffedType === "image/jpeg") {
    let out = "";
    let at = 2;

    while (at < bytes.length - 1) {
      if (bytes[at] !== 0xff) {
        at += 1;
        continue;
      }

      const marker = bytes[at + 1]!;

      if (marker === 0xff || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
        at += 2;
        continue;
      }

      const length = ((bytes[at + 2] ?? 0) << 8) | (bytes[at + 3] ?? 0);

      if (length < 2 || at + 2 + length > bytes.length) {
        break;
      }

      /* Application segments and the comment segment, which is everything a
         writer can put arbitrary text into. */
      if ((marker >= 0xe0 && marker <= 0xef) || marker === 0xfe) {
        out += `${asciiRaw(bytes, at + 4, Math.min(length - 2, 65_536))}\n`;
      }

      if (marker === 0xda) {
        break;
      }

      at += 2 + length;
    }

    return out;
  }

  if (sniffedType === "image/png") {
    /* Everything before the first IDAT: the header and every ancillary chunk. */
    const idat = indexOfBytes(bytes, bytesOf("IDAT"), 0);
    const stop = idat < 0 ? Math.min(bytes.length, 262_144) : idat;
    return asciiRaw(bytes, 0, stop);
  }

  if (sniffedType === "application/pdf") {
    return asciiRaw(bytes, 0, Math.min(bytes.length, 1_048_576));
  }

  return "";
}

/** How large a metadata block has to be, relative to the file, to be odd. */
const BLOAT_SHARE = 0.5;
const BLOAT_MINIMUM = 128 * 1024;

/**
 * Searches one file for content that is present but not part of it.
 *
 * Never throws, and always reports what it looked at — a reader told "nothing
 * hidden" is entitled to know that means "no appended payload and no command
 * in the metadata", not "every possible hiding place was ruled out".
 */
export function readHidden(bytes: Uint8Array, sniffedType?: string): HiddenRead {
  const findings: HiddenFinding[] = [];
  const end = contentEnd(bytes, sniffedType);
  const looked: string[] = [];

  const out: HiddenRead = { findings, examined: "" };

  if (end !== null) {
    looked.push("the bytes after the file's own end marker");
    out.contentEnd = end;
    out.trailingBytes = Math.max(0, bytes.length - end);

    if (out.trailingBytes > TRAILING_THRESHOLD) {
      const tail = bytes.subarray(end, Math.min(bytes.length, end + 4096));
      const foreign = FOREIGN_SIGNATURES.find(
        (signature) => indexOfBytes(tail, signature.bytes, 0) >= 0,
      );

      findings.push({
        id: "trailing-payload",
        label: foreign ? "Another file is hidden after the end of this one" : "Extra data after the file ends",
        detail: foreign
          ? `Past the point where this file's own content stops there is ${foreign.label}. Appending one file to the end of another is a long-standing way of moving something past a filter that only inspects the first file — the picture still displays normally, and the second file is extracted from the same bytes.`
          : "There is data after the marker that ends this file's content. The file does not need it to display or open, and appending data is how something is carried inside a file that appears ordinary.",
        weight: foreign ? "high" : "medium",
        evidence: `${out.trailingBytes.toLocaleString()} bytes at offset ${end.toLocaleString()}`,
      });
    }
  }

  /*
   * A foreign container's header inside the file, past its own head. The
   * search starts at 64 so a file's own signature cannot match itself, and
   * skips the sniffed type so a PDF is not reported for containing a PDF.
   */
  if (sniffedType?.startsWith("image/")) {
    looked.push("the body of the file, for another container's header");

    for (const signature of FOREIGN_SIGNATURES) {
      const at = indexOfBytes(bytes, signature.bytes, 64);

      if (at < 0 || (end !== null && at >= end)) {
        continue;
      }

      findings.push({
        id: `embedded-${signature.id}`,
        label: "Another file is embedded inside this image",
        detail: `The header of ${signature.label} appears inside this image's data. An image that carries a second file inside it displays normally and delivers the second file to anything that knows where to look.`,
        weight: "high",
        evidence: `offset ${at.toLocaleString()}`,
      });
      break;
    }
  }

  /* Commands sitting in the metadata, where somebody put them deliberately. */
  const text = metadataText(bytes, sniffedType);

  if (text.length > 0) {
    looked.push("the metadata fields, for commands and script");

    for (const command of COMMAND_PATTERNS) {
      const match = command.pattern.exec(text);

      if (!match) {
        continue;
      }

      findings.push({
        id: `metadata-${command.id}`,
        label: "A command is stored in the file's metadata",
        detail: `One of this file's metadata fields contains ${command.label}. Metadata is meant for captions, camera settings and copyright; code in one was put there on purpose, and some viewers and web servers have been made to run it.`,
        weight: "high",
        evidence: match[0].slice(0, 80),
      });
      break;
    }

    if (text.length > BLOAT_MINIMUM && text.length > bytes.length * BLOAT_SHARE) {
      findings.push({
        id: "metadata-bloat",
        label: "Most of this file is metadata rather than content",
        detail:
          "The metadata blocks take up more of this file than the content does. That happens innocently with a large embedded colour profile or an editing history, and it is also the shape of a file being used to carry something in a field nothing displays.",
        weight: "low",
        evidence: `${Math.round((text.length / bytes.length) * 100)}% of ${bytes.length.toLocaleString()} bytes`,
      });
    }
  }

  out.examined = looked.length > 0 ? looked.join("; ") : "the file's leading bytes";

  return out;
}
