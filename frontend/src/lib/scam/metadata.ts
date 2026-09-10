/**
 * Reads what a file actually is, from its bytes.
 *
 * The first version of the checker decided what an upload was from two things
 * the sender controls: the name and the MIME type the browser derives from the
 * name. The Lecturer's feedback was that image metadata must be read reliably
 * and consistently, and neither source is either. A HEIC photo arrives with an
 * empty type on most browsers; a program renamed `invoice.jpg` arrives declared
 * as `image/jpeg`; the same screenshot saved twice under different names was
 * treated as two different files.
 *
 * This module reads the file itself. The first bytes of every common format are
 * a fixed signature, the dimensions sit at fixed offsets, and camera metadata is
 * a documented structure (EXIF/TIFF). Reading them gives the same answer for the
 * same file every time, whatever it is called — which is the definition of
 * consistent the feedback asked for.
 *
 * Nothing here throws. A structure that cannot be parsed yields fewer fields,
 * not an error, because a malformed file is exactly what a scam sends.
 */

/** What the bytes say the file is. */
export type ContentFamily = "image" | "audio" | "video" | "document" | "archive" | "executable" | "web";

export interface DetectedType {
  mime: string;
  /** Human name for the report, e.g. "PNG image". */
  label: string;
  family: ContentFamily;
  /** Extensions a file of this type legitimately carries. */
  extensions: string[];
}

export interface ExifSummary {
  make?: string;
  model?: string;
  software?: string;
  /** As recorded — EXIF dates carry no time zone. */
  takenAt?: string;
  orientation?: number;
  /** Whether the file records where it was taken. Never the coordinates. */
  hasLocation: boolean;
}

export interface FileMetadata {
  /** Hex SHA-256 of the whole file. Identity by content, not by name. */
  sha256: string;
  sizeBytes: number;
  declaredType: string;
  extension: string;
  detected: DetectedType | null;
  width?: number;
  height?: number;
  exif?: ExifSummary;
}

/** Enough of the file for every header this module reads, including a large EXIF block. */
const HEADER_BYTES = 256 * 1024;

const ascii = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.subarray(start, start + length));

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((value, index) => bytes[offset + index] === value);

const type = (
  mime: string,
  label: string,
  family: ContentFamily,
  extensions: string[],
): DetectedType => ({ mime, label, family, extensions });

/**
 * File signatures, checked in order.
 *
 * Only the families the checker has a reason to distinguish are listed. The
 * point is not to identify every format that exists; it is to catch the file
 * that is not what its name says.
 */
export function detectType(bytes: Uint8Array): DetectedType | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return type("image/png", "PNG image", "image", ["png"]);
  }

  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return type("image/jpeg", "JPEG image", "image", ["jpg", "jpeg", "jfif"]);
  }

  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") {
    return type("image/gif", "GIF image", "image", ["gif"]);
  }

  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    return type("image/webp", "WebP image", "image", ["webp"]);
  }

  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WAVE") {
    return type("audio/wav", "WAV audio", "audio", ["wav"]);
  }

  if (ascii(bytes, 0, 2) === "BM" && bytes.length > 26) {
    return type("image/bmp", "BMP image", "image", ["bmp"]);
  }

  /* ISO base media: the brand after `ftyp` separates a phone photo from a video. */
  if (ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4);

    if (["heic", "heix", "hevc", "heim", "heis", "mif1", "msf1"].includes(brand)) {
      return type("image/heic", "HEIC photo", "image", ["heic", "heif"]);
    }

    if (brand === "avif") {
      return type("image/avif", "AVIF image", "image", ["avif"]);
    }

    if (brand.startsWith("M4A")) {
      return type("audio/mp4", "M4A audio", "audio", ["m4a", "mp4"]);
    }

    if (brand === "qt  ") {
      return type("video/quicktime", "QuickTime video", "video", ["mov", "mp4"]);
    }

    return type("video/mp4", "MP4 video", "video", ["mp4", "m4v", "mov"]);
  }

  if (ascii(bytes, 0, 4) === "%PDF") {
    return type("application/pdf", "PDF document", "document", ["pdf"]);
  }

  /* ZIP is also the container for every modern Office format. */
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) {
    return type("application/zip", "ZIP container", "archive", [
      "zip", "docx", "xlsx", "pptx", "docm", "xlsm", "pptm", "odt", "ods", "jar", "apk",
    ]);
  }

  if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    return type("application/x-ole-storage", "Legacy Office document", "document", ["doc", "xls", "ppt", "msg"]);
  }

  if (ascii(bytes, 0, 4) === "Rar!") {
    return type("application/vnd.rar", "RAR archive", "archive", ["rar"]);
  }

  if (startsWith(bytes, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) {
    return type("application/x-7z-compressed", "7-Zip archive", "archive", ["7z"]);
  }

  if (startsWith(bytes, [0x1f, 0x8b])) {
    return type("application/gzip", "GZIP archive", "archive", ["gz", "tgz"]);
  }

  if (ascii(bytes, 0, 2) === "MZ") {
    return type("application/x-msdownload", "Windows program", "executable", ["exe", "dll", "scr", "com", "msi", "sys"]);
  }

  if (startsWith(bytes, [0x7f, 0x45, 0x4c, 0x46])) {
    return type("application/x-elf", "Linux or Android program", "executable", ["so", "elf", "bin"]);
  }

  if (
    startsWith(bytes, [0xcf, 0xfa, 0xed, 0xfe]) ||
    startsWith(bytes, [0xce, 0xfa, 0xed, 0xfe]) ||
    startsWith(bytes, [0xfe, 0xed, 0xfa, 0xcf])
  ) {
    return type("application/x-mach-binary", "macOS program", "executable", ["app", "dylib", "bin"]);
  }

  if (ascii(bytes, 0, 3) === "ID3" || startsWith(bytes, [0xff, 0xfb]) || startsWith(bytes, [0xff, 0xf3])) {
    return type("audio/mpeg", "MP3 audio", "audio", ["mp3"]);
  }

  if (ascii(bytes, 0, 4) === "OggS") {
    return type("audio/ogg", "Ogg audio", "audio", ["ogg", "oga", "opus"]);
  }

  if (ascii(bytes, 0, 5) === "#!AMR") {
    return type("audio/amr", "AMR voice recording", "audio", ["amr"]);
  }

  if (ascii(bytes, 0, 5) === "{\\rtf") {
    return type("application/rtf", "RTF document", "document", ["rtf", "doc"]);
  }

  /* Text formats have no signature; the opening of the markup is the tell. */
  const head = ascii(bytes, 0, 512).replace(/^﻿/, "").trimStart().toLowerCase();

  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) {
    return type("image/svg+xml", "SVG image", "web", ["svg"]);
  }

  if (head.startsWith("<!doctype html") || head.startsWith("<html") || head.startsWith("<head") || head.startsWith("<script")) {
    return type("text/html", "Web page (HTML)", "web", ["html", "htm", "shtml"]);
  }

  return null;
}

/* ── Dimensions ─────────────────────────────────────────────────────────── */

function view(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

/** Width and height from the header of each image format, without decoding it. */
export function readDimensions(bytes: Uint8Array, mime: string): { width: number; height: number } | undefined {
  const data = view(bytes);

  try {
    switch (mime) {
      case "image/png":
        return { width: data.getUint32(16), height: data.getUint32(20) };

      case "image/gif":
        return { width: data.getUint16(6, true), height: data.getUint16(8, true) };

      case "image/bmp":
        return { width: data.getInt32(18, true), height: Math.abs(data.getInt32(22, true)) };

      case "image/webp": {
        const chunk = ascii(bytes, 12, 4);

        if (chunk === "VP8 ") {
          return { width: data.getUint16(26, true) & 0x3fff, height: data.getUint16(28, true) & 0x3fff };
        }

        if (chunk === "VP8L") {
          const bits = data.getUint32(21, true);
          return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
        }

        if (chunk === "VP8X") {
          const width = 1 + (bytes[24]! | (bytes[25]! << 8) | (bytes[26]! << 16));
          const height = 1 + (bytes[27]! | (bytes[28]! << 8) | (bytes[29]! << 16));
          return { width, height };
        }

        return undefined;
      }

      case "image/jpeg":
        return jpegDimensions(bytes);

      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
}

/** Walks JPEG segments to the start-of-frame marker, which carries the size. */
function jpegDimensions(bytes: Uint8Array): { width: number; height: number } | undefined {
  const data = view(bytes);
  let offset = 2;

  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      return undefined;
    }

    const marker = bytes[offset + 1]!;

    /* SOF0–SOF15, excluding DHT (C4), JPG (C8) and DAC (CC), which share the range. */
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: data.getUint16(offset + 5), width: data.getUint16(offset + 7) };
    }

    offset += 2 + data.getUint16(offset + 2);
  }

  return undefined;
}

/* ── EXIF ───────────────────────────────────────────────────────────────── */

const TAG = {
  make: 0x010f,
  model: 0x0110,
  orientation: 0x0112,
  software: 0x0131,
  dateTime: 0x0132,
  exifPointer: 0x8769,
  gpsPointer: 0x8825,
  dateTimeOriginal: 0x9003,
} as const;

interface IfdEntry {
  tag: number;
  type: number;
  count: number;
  valueOffset: number;
}

/**
 * Reads the TIFF structure EXIF is stored in.
 *
 * Only the handful of tags a reviewer would want are read: what made the image,
 * what edited it, when, and whether it records a location. Coordinates are
 * never read at all — the service has no use for them, so it does not hold them
 * even transiently (data minimisation, ETH-6).
 */
export function readExif(tiff: Uint8Array): ExifSummary | undefined {
  if (tiff.length < 8) {
    return undefined;
  }

  const order = ascii(tiff, 0, 2);

  if (order !== "II" && order !== "MM") {
    return undefined;
  }

  const little = order === "II";
  const data = view(tiff);
  const u16 = (at: number) => data.getUint16(at, little);
  const u32 = (at: number) => data.getUint32(at, little);

  const entriesAt = (ifdOffset: number): IfdEntry[] => {
    if (ifdOffset <= 0 || ifdOffset + 2 > tiff.length) {
      return [];
    }

    const count = Math.min(u16(ifdOffset), 256);
    const entries: IfdEntry[] = [];

    for (let index = 0; index < count; index += 1) {
      const at = ifdOffset + 2 + index * 12;

      if (at + 12 > tiff.length) {
        break;
      }

      entries.push({ tag: u16(at), type: u16(at + 2), count: u32(at + 4), valueOffset: at + 8 });
    }

    return entries;
  };

  const text = (entry: IfdEntry | undefined): string | undefined => {
    if (!entry || entry.type !== 2 || entry.count === 0) {
      return undefined;
    }

    const start = entry.count <= 4 ? entry.valueOffset : u32(entry.valueOffset);

    if (start + entry.count > tiff.length) {
      return undefined;
    }

    /* EXIF strings are NUL-terminated; cut at the first terminator. */
    const raw = ascii(tiff, start, entry.count);
    const end = raw.indexOf(String.fromCharCode(0));
    const value = (end >= 0 ? raw.slice(0, end) : raw).trim();
    return value.length > 0 ? value.slice(0, 80) : undefined;
  };

  try {
    const ifd0 = entriesAt(u32(4));
    const find = (entries: IfdEntry[], tag: number) => entries.find((entry) => entry.tag === tag);

    const exifPointer = find(ifd0, TAG.exifPointer);
    const exifIfd = exifPointer ? entriesAt(u32(exifPointer.valueOffset)) : [];

    const gpsPointer = find(ifd0, TAG.gpsPointer);
    const gpsIfd = gpsPointer ? entriesAt(u32(gpsPointer.valueOffset)) : [];

    const orientation = find(ifd0, TAG.orientation);

    const summary: ExifSummary = {
      make: text(find(ifd0, TAG.make)),
      model: text(find(ifd0, TAG.model)),
      software: text(find(ifd0, TAG.software)),
      takenAt: text(find(exifIfd, TAG.dateTimeOriginal)) ?? text(find(ifd0, TAG.dateTime)),
      orientation: orientation ? u16(orientation.valueOffset) : undefined,
      /* A GPS directory with a latitude tag in it (tag 2) records a position. */
      hasLocation: gpsIfd.some((entry) => entry.tag === 2),
    };

    return Object.values(summary).some((value) => value !== undefined && value !== false)
      ? summary
      : undefined;
  } catch {
    return undefined;
  }
}

/** The TIFF block inside a JPEG (APP1 "Exif") or a PNG (`eXIf` chunk). */
function exifBlock(bytes: Uint8Array, mime: string): Uint8Array | undefined {
  const data = view(bytes);

  try {
    if (mime === "image/jpeg") {
      let offset = 2;

      while (offset + 4 < bytes.length && bytes[offset] === 0xff) {
        const marker = bytes[offset + 1]!;
        const length = data.getUint16(offset + 2);

        if (marker === 0xe1 && ascii(bytes, offset + 4, 6) === "Exif\0\0") {
          return bytes.subarray(offset + 10, offset + 2 + length);
        }

        /* Start of scan: image data follows, and no metadata comes after it. */
        if (marker === 0xda) {
          return undefined;
        }

        offset += 2 + length;
      }
    }

    if (mime === "image/png") {
      let offset = 8;

      while (offset + 12 <= bytes.length) {
        const length = data.getUint32(offset);
        const chunk = ascii(bytes, offset + 4, 4);

        if (chunk === "eXIf") {
          return bytes.subarray(offset + 8, offset + 8 + length);
        }

        if (chunk === "IDAT" || chunk === "IEND") {
          return undefined;
        }

        offset += 12 + length;
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}

/** PNG `tEXt` Software, which is where screenshot tools sign their output. */
function pngSoftware(bytes: Uint8Array): string | undefined {
  const data = view(bytes);
  let offset = 8;

  try {
    while (offset + 12 <= bytes.length) {
      const length = data.getUint32(offset);
      const chunk = ascii(bytes, offset + 4, 4);

      if (chunk === "tEXt") {
        const body = ascii(bytes, offset + 8, Math.min(length, 200));
        const [keyword, value] = body.split("\0");

        if (keyword === "Software" && value) {
          return value.slice(0, 80);
        }
      }

      if (chunk === "IDAT") {
        return undefined;
      }

      offset += 12 + length;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

async function sha256(file: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function extensionOf(name: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(name.trim());
  return match ? match[1]!.toLowerCase() : "";
}

/** Everything this module can establish about one file. */
export async function readMetadata(file: File): Promise<FileMetadata> {
  const bytes = new Uint8Array(await file.slice(0, HEADER_BYTES).arrayBuffer());
  const detected = detectType(bytes);

  const metadata: FileMetadata = {
    sha256: await sha256(file),
    sizeBytes: file.size,
    declaredType: file.type,
    extension: extensionOf(file.name),
    detected,
  };

  if (detected?.family === "image") {
    Object.assign(metadata, readDimensions(bytes, detected.mime) ?? {});

    const block = exifBlock(bytes, detected.mime);
    const exif = block ? readExif(block) : undefined;
    const software = detected.mime === "image/png" ? pngSoftware(bytes) : undefined;

    if (exif || software) {
      metadata.exif = { hasLocation: false, ...exif, software: exif?.software ?? software };
    }
  }

  return metadata;
}
