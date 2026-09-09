import type { FileMetadata } from "@/lib/scam/types";
import { ascii, asciiRaw, u16be, u16le, u32be, u32le } from "@/lib/scam/bytes";
import { readContainer } from "@/lib/scam/containers";
import { readHidden } from "@/lib/scam/hidden";
import {
  colourProfileName,
  coordinates,
  orientationFlag,
  readTags,
  tagDate,
  tagNumber,
  tagText,
  type TagRead,
} from "@/lib/scam/tags";

/**
 * Everything the file will say about itself.
 *
 * The other passes each answer a judgement question — was this generated, was
 * it altered, does it read like a scam. This one answers none of them. It
 * describes: how big, what shape, written by what, in what colour space, with
 * what camera, carrying what. Description is not the lesser job here. A reader
 * handed "not enough to assess" and nothing else has been told their file was
 * ignored, and somebody deciding whether to forward a photograph needs to know
 * it carries the coordinates of the house it was taken in, whatever the risk
 * score says.
 *
 * Two properties this module is held to, both of them things it previously
 * failed at.
 *
 * **It is deterministic.** Given the same bytes it produces the same
 * description, every time. It used to not be: the tags were parsed
 * independently by three passes with three sets of options, each swallowing
 * its own failures, so a transient failure in one of them was indistinguishable
 * from an honest absence and the report showed whichever parse happened to
 * win. There is now exactly one parse — {@link readTags} — and every pass reads
 * its result. Nothing in this file touches a canvas, a network or a clock.
 *
 * **It agrees with the reader's own machine.** A file inspector shows the
 * dimensions after the orientation flag has been applied, and the colour
 * profile by its name. Reporting the raw frame and "embedded" instead is how
 * this service described an image in terms its owner could not match against
 * what they were looking at.
 *
 * All of it is parsed from the bytes on the reader's own device.
 */

/* ─────────────────────────────── signatures ─────────────────────────────── */

/** Magic-byte signatures, so the file's own bytes settle what it is. */
const SIGNATURES: { type: string; label: string; test: (b: Uint8Array) => boolean }[] = [
  { type: "image/jpeg", label: "JPEG", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: "image/png", label: "PNG", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { type: "image/gif", label: "GIF", test: (b) => ascii(b, 0, 3) === "GIF" },
  { type: "image/webp", label: "WebP", test: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP" },
  { type: "image/heic", label: "HEIC/HEIF", test: (b) => ascii(b, 4, 4) === "ftyp" && /hei|mif1|msf1/.test(ascii(b, 8, 4)) },
  { type: "image/avif", label: "AVIF", test: (b) => ascii(b, 4, 4) === "ftyp" && /avif|avis/.test(ascii(b, 8, 4)) },
  { type: "image/bmp", label: "BMP", test: (b) => b[0] === 0x42 && b[1] === 0x4d },
  { type: "image/tiff", label: "TIFF", test: (b) => (b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a) || (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0x00) },
  { type: "application/pdf", label: "PDF", test: (b) => ascii(b, 0, 4) === "%PDF" },
  { type: "application/zip", label: "ZIP container", test: (b) => b[0] === 0x50 && b[1] === 0x4b && (b[2] === 0x03 || b[2] === 0x05) },
  { type: "application/x-msdownload", label: "Windows executable", test: (b) => b[0] === 0x4d && b[1] === 0x5a },
  { type: "application/x-elf", label: "Linux executable", test: (b) => b[0] === 0x7f && ascii(b, 1, 3) === "ELF" },
  { type: "application/rtf", label: "Rich Text", test: (b) => asciiRaw(b, 0, 5) === "{\\rtf" },
];

/* ──────────────────────────────── JPEG ──────────────────────────────────── */

/**
 * The standard luminance quantisation table from the JPEG specification.
 *
 * Every encoder scales this by a quality factor, so comparing a file's table
 * against it recovers roughly what quality it was saved at. Roughly is the
 * honest word: encoders differ, and a table that matches nothing standard is
 * reported as a custom table rather than forced onto the scale.
 */
const STANDARD_LUMA = [
  16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55,
  14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51, 87, 80, 62,
  18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92,
  49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99,
];

const SOF_NAMES: Record<number, string> = {
  0xc0: "baseline", 0xc1: "extended sequential", 0xc2: "progressive",
  0xc3: "lossless", 0xc5: "differential sequential", 0xc6: "differential progressive",
  0xc9: "arithmetic sequential", 0xca: "arithmetic progressive",
};

const COMPONENTS: Record<number, string> = { 1: "greyscale", 3: "YCbCr colour", 4: "CMYK / YCCK" };

function subsampling(h: number, v: number): string {
  if (h === 1 && v === 1) return "4:4:4 (no chroma subsampling)";
  if (h === 2 && v === 1) return "4:2:2";
  if (h === 2 && v === 2) return "4:2:0";
  if (h === 1 && v === 2) return "4:4:0";
  return `${h}x${v}`;
}

function readJpeg(bytes: Uint8Array, out: FileMetadata): void {
  const segments = new Set<string>();
  let at = 2;
  let luma: number[] | null = null;

  while (at < bytes.length - 1) {
    if (bytes[at] !== 0xff) { at += 1; continue; }
    const marker = bytes[at + 1]!;

    if (marker === 0xff || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) { at += 2; continue; }

    const length = u16be(bytes, at + 2);
    if (length < 2 || at + 2 + length > bytes.length) break;
    const body = at + 4;

    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      out.format = `JPEG, ${SOF_NAMES[marker] ?? "unknown mode"}`;
      out.progressive = marker === 0xc2 || marker === 0xc6 || marker === 0xca;
      out.bitDepth = bytes[body];
      out.height = u16be(bytes, body + 1);
      out.width = u16be(bytes, body + 3);

      const count = bytes[body + 5]!;
      out.colour = COMPONENTS[count] ?? `${count} components`;

      if (count > 0) {
        const sampling = bytes[body + 7]!;
        out.subsampling = subsampling(sampling >> 4, sampling & 0x0f);
      }
    } else if (marker === 0xdb && !luma) {
      const precision = bytes[body]! >> 4;
      luma = [];
      for (let i = 0; i < 64; i += 1) {
        luma.push(precision === 0 ? bytes[body + 1 + i]! : u16be(bytes, body + 1 + i * 2));
      }
    } else if (marker >= 0xe0 && marker <= 0xef) {
      const id = asciiRaw(bytes, body, 12).split(String.fromCharCode(0))[0]!.trim();
      const n = marker - 0xe0;
      if (/^Exif/.test(id)) segments.add("Exif (APP1)");
      else if (/^http|^XMP|ns\.adobe/.test(id)) segments.add("XMP (APP1)");
      else if (/^ICC_PROFILE/.test(id)) segments.add("ICC colour profile (APP2)");
      else if (/^Photoshop/.test(id)) segments.add("Photoshop resources (APP13)");
      else if (/^Adobe/.test(id)) segments.add("Adobe (APP14)");
      else if (/^JFIF/.test(id)) segments.add("JFIF (APP0)");
      else if (/^Ducky/.test(id)) segments.add("Ducky (APP12)");
      else if (n === 11) segments.add("JUMBF / C2PA (APP11)");
      else segments.add(`APP${n}`);

      /* JFIF carries the pixel density a file inspector reports as DPI. */
      if (/^JFIF/.test(id) && length >= 14) {
        const units = bytes[body + 7];
        const x = u16be(bytes, body + 8);
        if (units === 1 && x > 0) out.dpi = x;
        if (units === 2 && x > 0) out.dpi = Math.round(x * 2.54);
      }
    } else if (marker === 0xfe) {
      segments.add("Comment");
    } else if (marker === 0xda) {
      break;
    }

    at += 2 + length;
  }

  if (luma) {
    /* Scale factor recovered against the standard table, then the conventional
       inverse of the IJG quality curve. Only reported where the table actually
       resembles a scaled standard one. */
    let total = 0;
    for (let i = 0; i < 64; i += 1) total += (luma[i]! * 100) / STANDARD_LUMA[i]!;
    const scale = total / 64;
    const quality = scale <= 100 ? Math.round((200 - scale) / 2) : Math.round(5000 / scale);
    out.quality = quality > 0 && quality <= 100 ? quality : null;
  }

  out.segments = [...segments];
}

/* ───────────────────────────────── PNG ──────────────────────────────────── */

const PNG_COLOUR: Record<number, { label: string; alpha: boolean }> = {
  0: { label: "greyscale", alpha: false },
  2: { label: "RGB", alpha: false },
  3: { label: "indexed palette", alpha: false },
  4: { label: "greyscale + alpha", alpha: true },
  6: { label: "RGB + alpha", alpha: true },
};

function readPng(bytes: Uint8Array, out: FileMetadata): void {
  const chunks = new Set<string>();
  let at = 8;

  while (at + 8 < bytes.length) {
    const length = u32be(bytes, at);
    const type = ascii(bytes, at + 4, 4);

    if (type === "IHDR") {
      out.width = u32be(bytes, at + 8);
      out.height = u32be(bytes, at + 12);
      out.bitDepth = bytes[at + 16];
      const colour = PNG_COLOUR[bytes[at + 17]!];
      out.colour = colour?.label ?? `type ${bytes[at + 17]}`;
      out.hasAlpha = colour?.alpha;
      out.interlaced = bytes[at + 20] === 1;
      out.format = "PNG";
    } else if (type === "iCCP") {
      chunks.add("ICC colour profile");
    } else if (type === "sRGB") {
      chunks.add("sRGB declaration");
    } else if (type === "tEXt" || type === "iTXt" || type === "zTXt") {
      chunks.add("Text metadata");
    } else if (type === "eXIf") {
      chunks.add("Exif");
    } else if (type === "tIME") {
      chunks.add("Modification time");
    } else if (type === "acTL") {
      chunks.add("Animation (APNG)");
    } else if (type === "tRNS") {
      chunks.add("Transparency");
      out.hasAlpha = true;
    } else if (type === "pHYs") {
      /* Pixels per metre, which is what a file inspector converts to DPI. */
      const perMetre = u32be(bytes, at + 8);
      if (bytes[at + 16] === 1 && perMetre > 0) {
        out.dpi = Math.round(perMetre * 0.0254);
      }
    } else if (type === "caBX") {
      chunks.add("C2PA Content Credentials");
    }

    if (type === "IDAT" || type === "IEND") break;

    const next = at + 12 + length;
    if (length < 0 || next <= at) break;
    at = next;
  }

  out.segments = [...chunks];
}

/* ──────────────────────── GIF, WebP and the rest ────────────────────────── */

function readGif(bytes: Uint8Array, out: FileMetadata): void {
  out.format = `GIF${ascii(bytes, 3, 3) === "89a" ? " 89a" : " 87a"}`;
  out.width = (bytes[7]! << 8) | bytes[6]!;
  out.height = (bytes[9]! << 8) | bytes[8]!;
  out.colour = "indexed palette";
  out.hasAlpha = true;
}

function readWebp(bytes: Uint8Array, out: FileMetadata): void {
  const form = ascii(bytes, 12, 4);
  out.format = `WebP (${form.trim() || "unknown"})`;

  if (form === "VP8X") {
    out.width = 1 + (((bytes[26]! << 16) | (bytes[25]! << 8) | bytes[24]!) & 0xffffff);
    out.height = 1 + (((bytes[29]! << 16) | (bytes[28]! << 8) | bytes[27]!) & 0xffffff);
    out.hasAlpha = ((bytes[20] ?? 0) & 0x10) !== 0;
  } else if (form === "VP8L") {
    /* One 32-bit little-endian word after the signature byte, packing
       width-1 and height-1 as 14 bits each and the alpha flag above them. */
    const packed = u32le(bytes, 21);
    out.width = 1 + (packed & 0x3fff);
    out.height = 1 + ((packed >>> 14) & 0x3fff);
    out.hasAlpha = ((packed >>> 28) & 1) === 1;
  } else if (form === "VP8 ") {
    out.width = u16le(bytes, 26) & 0x3fff;
    out.height = u16le(bytes, 28) & 0x3fff;
  }
}

/* ─────────────────────────── orientation and dates ──────────────────────── */

/**
 * What each EXIF orientation value means, and whether it turns the picture.
 *
 * Values 5 to 8 involve a quarter turn, so the frame stored in the file is
 * the transpose of the picture as anyone sees it. Every file inspector and
 * photo viewer reports the turned dimensions; reporting the stored frame was
 * the single largest reason this service's description of an image did not
 * match the one its owner was looking at on their own machine.
 */
const ORIENTATIONS: Record<number, { label: string; turned: boolean }> = {
  1: { label: "upright, as stored", turned: false },
  2: { label: "mirrored left to right", turned: false },
  3: { label: "rotated 180°", turned: false },
  4: { label: "mirrored top to bottom", turned: false },
  5: { label: "mirrored and rotated 90° anticlockwise", turned: true },
  6: { label: "rotated 90° clockwise", turned: true },
  7: { label: "mirrored and rotated 90° clockwise", turned: true },
  8: { label: "rotated 90° anticlockwise", turned: true },
};

/* ──────────────────────────────── the pass ──────────────────────────────── */

/** SHA-256 of the file, so a reader can quote it or match it elsewhere. */
async function digest(bytes: Uint8Array): Promise<string | undefined> {
  try {
    if (typeof crypto === "undefined" || !crypto.subtle) return undefined;
    /* A fresh buffer: `crypto.subtle` will not accept a view whose underlying
       buffer is shared, and `bytes` may be a subarray by the time it gets here. */
    const copy = new Uint8Array(bytes);
    const hash = await crypto.subtle.digest("SHA-256", copy.buffer);
    return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return undefined;
  }
}

/**
 * Everything one pass over a file produces, kept together.
 *
 * The tags are handed back alongside the description so the provenance and
 * forensic passes can read the same parse rather than starting their own.
 * That is the mechanism, not an optimisation: two parses of one file are two
 * chances to disagree about it.
 */
export interface FileRead {
  metadata: FileMetadata;
  tags: TagRead;
  bytes: Uint8Array;
}

/** Describes one file. Never throws; an unreadable file returns what is known. */
export async function readFile(file: File): Promise<FileRead> {
  const out: FileMetadata = {
    name: file.name,
    declaredType: file.type || "not declared",
    sizeBytes: file.size,
    lastModified: file.lastModified || undefined,
  };

  let bytes: Uint8Array;

  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    return {
      metadata: out,
      tags: { ifd0: {}, exif: {}, gps: {}, iptc: {}, xmp: {}, icc: {}, thumbnail: false, failed: "The file could not be read." },
      bytes: new Uint8Array(0),
    };
  }

  const signature = SIGNATURES.find((candidate) => candidate.test(bytes));

  out.sniffedType = signature?.type;
  out.sniffedLabel = signature?.label;
  out.sha256 = await digest(bytes);

  /* Declared and actual are compared on the family, not the exact spelling: a
     JPEG served as `image/jpg` is a spelling difference, a JPEG served as
     `image/png` is a re-save, and an executable named `.jpg` is the thing
     worth catching. */
  if (signature && file.type) {
    out.typeMatches = signature.type === file.type
      || (signature.type === "image/jpeg" && /jpe?g/i.test(file.type))
      || (signature.type === "image/heic" && /hei[cf]/i.test(file.type));
  }

  switch (signature?.type) {
    case "image/jpeg": readJpeg(bytes, out); break;
    case "image/png": readPng(bytes, out); break;
    case "image/gif": readGif(bytes, out); break;
    case "image/webp": readWebp(bytes, out); break;
    default:
      if (signature) {
        out.format = signature.label;
      }
  }

  /* One parse, for every pass. */
  const tags = await readTags(bytes);
  applyTags(out, tags, bytes);

  const container = await readContainer(bytes, signature?.type);

  if (container) {
    out.container = container;
    out.format = container.format ?? out.format;

    /* A container states its own authorship, which is the same question the
       EXIF device fields answer for a photograph. Kept in one place so the
       report has one "where did this come from" section, not two. */
    out.author ??= container.people.author;
    out.software ??= container.people.creatorTool ?? container.people.producer;
  }

  out.hidden = readHidden(bytes, signature?.type);

  return { metadata: out, tags, bytes };
}

/** Folds the single tag parse into the description. */
function applyTags(out: FileMetadata, tags: TagRead, bytes: Uint8Array): void {
  const counts = {
    exif: Object.keys(tags.exif).length + Object.keys(tags.ifd0).length,
    gps: Object.keys(tags.gps).length,
    xmp: Object.keys(tags.xmp).length,
    iptc: Object.keys(tags.iptc).length,
    icc: Object.keys(tags.icc).length,
  };

  out.tagCounts = counts;
  out.metadataUnreadable = tags.failed;

  const profile = colourProfileName(tags, bytes);

  if (profile) {
    out.iccProfile = profile;
  } else if (out.segments?.some((segment) => /ICC/i.test(segment))) {
    out.iccProfile = "embedded, unnamed";
  } else if (out.segments?.includes("sRGB declaration")) {
    out.iccProfile = "sRGB (declared, no profile embedded)";
  } else {
    out.iccProfile = null;
  }

  const total = counts.exif + counts.gps + counts.xmp + counts.iptc;

  /*
   * The orientation flag, applied. This is the number a reader can check
   * against their own machine, so the raw frame is kept beside it rather than
   * replaced — a description that quietly substitutes one for the other is how
   * two people looking at the same file end up disagreeing about its size.
   */
  const orientation = orientationFlag(tags);
  const turn = orientation ? ORIENTATIONS[orientation] : undefined;

  if (out.width && out.height) {
    out.displayWidth = turn?.turned ? out.height : out.width;
    out.displayHeight = turn?.turned ? out.width : out.height;
  }

  if (orientation) {
    out.orientation = orientation;
    out.orientationLabel = turn?.label ?? `flag ${orientation}`;
  }

  if (!out.dpi) {
    const x = tagNumber(tags, "XResolution");
    const unit = tagNumber(tags, "ResolutionUnit");
    if (x && x > 0) {
      out.dpi = unit === 3 ? Math.round(x * 2.54) : Math.round(x);
    }
  }

  out.author ??= tagText(tags, "Artist") ?? tagText(tags, "creator") ?? tagText(tags, "By-line");
  out.copyright = tagText(tags, "Copyright") ?? tagText(tags, "rights");
  out.software ??= tagText(tags, "Software") ?? tagText(tags, "CreatorTool");
  out.description = tagText(tags, "ImageDescription") ?? tagText(tags, "description") ?? tagText(tags, "Caption");

  const gps = coordinates(tags);

  out.exif = {
    present: total > 0,
    fields: total,
    make: tagText(tags, "Make"),
    model: tagText(tags, "Model"),
    lens: tagText(tags, "LensModel") ?? tagText(tags, "LensInfo"),
    serial: tagText(tags, "SerialNumber") ?? tagText(tags, "BodySerialNumber"),
    software: out.software,
    taken: tagDate(tags, "DateTimeOriginal"),
    digitised: tagDate(tags, "CreateDate") ?? tagDate(tags, "DateTimeDigitized"),
    changed: tagDate(tags, "ModifyDate"),
    offset: tagText(tags, "OffsetTimeOriginal") ?? tagText(tags, "OffsetTime"),
    orientation,
    capturedWidth: tagNumber(tags, "ExifImageWidth") ?? tagNumber(tags, "PixelXDimension"),
    capturedHeight: tagNumber(tags, "ExifImageHeight") ?? tagNumber(tags, "PixelYDimension"),
    exposure: exposureLine(tags),
    thumbnail: tags.thumbnail,
    gps: gps ? { ...gps, altitude: tagNumber(tags, "GPSAltitude") } : null,
  };
}

/** The exposure triple, as a camera would print it on a contact sheet. */
function exposureLine(tags: TagRead): string | undefined {
  const parts: string[] = [];
  const aperture = tagNumber(tags, "FNumber");
  const shutter = tagNumber(tags, "ExposureTime");
  const iso = tagNumber(tags, "ISO") ?? tagNumber(tags, "ISOSpeedRatings");
  const focal = tagNumber(tags, "FocalLength");

  if (typeof aperture === "number") parts.push(`f/${aperture}`);
  if (typeof shutter === "number") {
    parts.push(shutter >= 1 ? `${shutter}s` : `1/${Math.round(1 / shutter)}s`);
  }
  if (typeof iso === "number") parts.push(`ISO ${iso}`);
  if (typeof focal === "number") parts.push(`${Math.round(focal)}mm`);

  return parts.length > 0 ? parts.join(" · ") : undefined;
}

/** Kept for callers that only want the description. */
export async function readMetadata(file: File): Promise<FileMetadata> {
  return (await readFile(file)).metadata;
}

/**
 * The one thing in this module the rule set is allowed to see.
 *
 * Everything else here describes. This judges, because a file whose bytes are
 * one thing and whose name and declared type are another is not a description,
 * it is the oldest trick there is.
 */
export function fileTypeMismatch(meta: FileMetadata): string | null {
  if (!meta.sniffedType || meta.typeMatches !== false) {
    return null;
  }

  return `The name and type say ${meta.declaredType}, but the file's own bytes are ${meta.sniffedLabel}.`;
}

export { loadExifr } from "@/lib/scam/tags";
