/**
 * FR32, Rule 6.5, ER-5 — what an uploaded file really is, and a copy of it
 * with the metadata that could locate someone removed.
 *
 * The type is read from the bytes, never from the name or the header the
 * browser sent, and must agree with the extension. Nothing uploaded is ever
 * executed, parsed as markup, or served with a type that a browser would run.
 */

export interface FileKind {
  mime: string;
  extensions: string[];
  label: string;
}

const KINDS: { kind: FileKind; test: (b: Buffer) => boolean }[] = [
  { kind: { mime: "image/jpeg", extensions: ["jpg", "jpeg"], label: "JPEG image" }, test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { kind: { mime: "image/png", extensions: ["png"], label: "PNG image" }, test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { kind: { mime: "image/gif", extensions: ["gif"], label: "GIF image" }, test: (b) => b.subarray(0, 4).toString("latin1") === "GIF8" },
  { kind: { mime: "image/webp", extensions: ["webp"], label: "WebP image" }, test: (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP" },
  { kind: { mime: "application/pdf", extensions: ["pdf"], label: "PDF document" }, test: (b) => b.subarray(0, 5).toString("latin1") === "%PDF-" },
  /* HEIC/HEIF, what iPhones save photos as. */
  { kind: { mime: "image/heic", extensions: ["heic", "heif"], label: "HEIC photo" }, test: (b) => b.subarray(4, 8).toString("latin1") === "ftyp" && /^(heic|heix|hevc|mif1|msf1)$/.test(b.subarray(8, 12).toString("latin1")) },
];

/* Plain text — pasted emails, exported chats — is accepted only if it really is text. */
const TEXT: FileKind = { mime: "text/plain", extensions: ["txt", "eml"], label: "Text" };

export const EVIDENCE_LIMITS = {
  /* Vercel functions accept request bodies up to 4.5 MB; the limit sits under it. */
  maxBytes: 4 * 1024 * 1024,
  maxFilesPerReport: 10,
  accepted: [...KINDS.map((k) => k.kind), TEXT],
};

function looksLikeText(bytes: Buffer): boolean {
  const sample = bytes.subarray(0, 4096);
  if (sample.includes(0)) return false;
  const text = sample.toString("utf8");
  /* Reject anything a browser or mail client might treat as active content. */
  if (/<\s*(script|html|svg|iframe|object)\b/i.test(text)) return false;
  const printable = text.replace(/[\x20-\x7E\t\r\n -￿]/g, "").length;
  return printable / Math.max(1, text.length) < 0.02;
}

export function sniff(bytes: Buffer): FileKind | null {
  for (const { kind, test } of KINDS) if (test(bytes)) return kind;
  return looksLikeText(bytes) ? TEXT : null;
}

export function extensionOf(name: string): string {
  const match = /\.([a-z0-9]{1,6})$/i.exec(name.trim());
  return match ? match[1]!.toLowerCase() : "";
}

/** A name safe to store and show: no path, no control characters, bounded. */
export function safeName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  return base.replace(/[\u0000-\u001f\u007f"<>|*?:]/g, "_").slice(0, 120) || "file";
}

/**
 * JPEG: drop APP1 (EXIF and XMP — GPS, camera serial, timestamps), APP13
 * (IPTC) and comment segments. The image data is untouched.
 */
function stripJpeg(bytes: Buffer): Buffer {
  const parts: Buffer[] = [bytes.subarray(0, 2)];
  let offset = 2;

  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return bytes; // not a clean marker stream: leave it alone
    const marker = bytes[offset + 1]!;
    if (marker === 0xda) {
      parts.push(bytes.subarray(offset)); // start of scan: the rest is image data
      return Buffer.concat(parts);
    }
    const length = bytes.readUInt16BE(offset + 2);
    const segment = bytes.subarray(offset, offset + 2 + length);
    if (!(marker === 0xe1 || marker === 0xed || marker === 0xfe)) parts.push(segment);
    offset += 2 + length;
  }
  return bytes;
}

/** PNG: drop text, EXIF and time chunks. Each chunk carries its own CRC, so removal is clean. */
function stripPng(bytes: Buffer): Buffer {
  const drop = new Set(["tEXt", "iTXt", "zTXt", "eXIf", "tIME"]);
  const parts: Buffer[] = [bytes.subarray(0, 8)];
  let offset = 8;

  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString("latin1");
    const chunk = bytes.subarray(offset, offset + 12 + length);
    if (!drop.has(type)) parts.push(chunk);
    offset += 12 + length;
    if (type === "IEND") break;
  }
  return Buffer.concat(parts);
}

/**
 * ER-5 — the copy Council's officers open. The original is kept, encrypted,
 * beside it (Avoid.md §9: evidence is never modified), but only this copy is
 * served. Formats this cannot clean safely are served as uploaded, and the
 * record says metadata was not stripped.
 */
export function stripMetadata(kind: FileKind, bytes: Buffer): { bytes: Buffer; stripped: boolean } {
  try {
    if (kind.mime === "image/jpeg") return { bytes: stripJpeg(bytes), stripped: true };
    if (kind.mime === "image/png") return { bytes: stripPng(bytes), stripped: true };
  } catch {
    /* A malformed file is served as uploaded rather than rejected: it may be the only evidence. */
  }
  return { bytes, stripped: false };
}
