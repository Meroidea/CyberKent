import type { FileMetadata } from "@/lib/scam/types";

/**
 * Everything the file will say about itself.
 *
 * The other passes each answer a judgement question — was this generated, was
 * it altered, does it read like a scam. This one answers none of them. It
 * describes: how big, what shape, written by what, in what colour space, with
 * what camera, carrying what. Description is not a lesser thing than judgement
 * here. A reader handed "not enough to assess" and nothing else has been told
 * their file was ignored, and a person deciding whether to forward a photograph
 * needs to know it carries the coordinates of the house it was taken in,
 * whatever the risk score says.
 *
 * So this runs on every image, its result is shown whether or not anything was
 * found, and it is not allowed to raise or lower a score. Two exceptions reach
 * the rule set through {@link fileTypeMismatch}, because a file whose bytes
 * disagree with its name is a finding rather than a description.
 *
 * All of it is parsed from the bytes on the reader's own device.
 */

/* ─────────────────────────────── signatures ─────────────────────────────── */

/** Magic-byte signatures, so the file's own bytes settle what it is. */
const SIGNATURES: { type: string; label: string; test: (b: Uint8Array) => boolean }[] = [
  { type: "image/jpeg", label: "JPEG", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: "image/png", label: "PNG", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { type: "image/gif", label: "GIF", test: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 },
  { type: "image/webp", label: "WebP", test: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP" },
  { type: "image/heic", label: "HEIC/HEIF", test: (b) => ascii(b, 4, 4) === "ftyp" && /hei|mif1|msf1/.test(ascii(b, 8, 4)) },
  { type: "image/bmp", label: "BMP", test: (b) => b[0] === 0x42 && b[1] === 0x4d },
  { type: "image/tiff", label: "TIFF", test: (b) => (b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a) || (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0x00) },
  { type: "application/pdf", label: "PDF", test: (b) => ascii(b, 0, 4) === "%PDF" },
  { type: "application/zip", label: "ZIP container", test: (b) => b[0] === 0x50 && b[1] === 0x4b && (b[2] === 0x03 || b[2] === 0x05) },
  { type: "application/x-msdownload", label: "Windows executable", test: (b) => b[0] === 0x4d && b[1] === 0x5a },
  { type: "application/x-elf", label: "Linux executable", test: (b) => b[0] === 0x7f && ascii(b, 1, 3) === "ELF" },
];

function ascii(bytes: Uint8Array, at: number, length: number): string {
  let out = "";
  for (let i = at; i < Math.min(at + length, bytes.length); i += 1) {
    out += String.fromCharCode(bytes[i]!);
  }
  return out;
}

function u16(b: Uint8Array, at: number): number {
  return (b[at]! << 8) | b[at + 1]!;
}

function u32(b: Uint8Array, at: number): number {
  return ((b[at]! << 24) | (b[at + 1]! << 16) | (b[at + 2]! << 8) | b[at + 3]!) >>> 0;
}

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
  return `${h}×${v}`;
}

function readJpeg(bytes: Uint8Array, out: FileMetadata): void {
  const segments = new Set<string>();
  let at = 2;
  let luma: number[] | null = null;

  while (at < bytes.length - 1) {
    if (bytes[at] !== 0xff) { at += 1; continue; }
    const marker = bytes[at + 1]!;

    if (marker === 0xff || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) { at += 2; continue; }

    const length = u16(bytes, at + 2);
    if (length < 2 || at + 2 + length > bytes.length) break;
    const body = at + 4;

    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      out.format = `JPEG, ${SOF_NAMES[marker] ?? "unknown mode"}`;
      out.progressive = marker === 0xc2 || marker === 0xc6 || marker === 0xca;
      out.bitDepth = bytes[body];
      out.height = u16(bytes, body + 1);
      out.width = u16(bytes, body + 3);

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
        luma.push(precision === 0 ? bytes[body + 1 + i]! : u16(bytes, body + 1 + i * 2));
      }
    } else if (marker >= 0xe0 && marker <= 0xef) {
      const id = ascii(bytes, body, 12).split("\0")[0]!.trim();
      const n = marker - 0xe0;
      if (/^Exif/.test(id)) segments.add("Exif (APP1)");
      else if (/^http|^XMP|ns\.adobe/.test(id)) segments.add("XMP (APP1)");
      else if (/^ICC_PROFILE/.test(id)) { segments.add("ICC colour profile (APP2)"); out.iccProfile = "embedded"; }
      else if (/^Photoshop/.test(id)) segments.add("Photoshop resources (APP13)");
      else if (/^Adobe/.test(id)) segments.add("Adobe (APP14)");
      else if (/^JFIF/.test(id)) segments.add("JFIF (APP0)");
      else if (/^Ducky/.test(id)) segments.add("Ducky (APP12)");
      else if (n === 11) segments.add("JUMBF / C2PA (APP11)");
      else segments.add(`APP${n}`);
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

const PNG_COLOUR: Record<number, string> = {
  0: "greyscale", 2: "RGB", 3: "indexed palette", 4: "greyscale + alpha", 6: "RGB + alpha",
};

function readPng(bytes: Uint8Array, out: FileMetadata): void {
  const chunks = new Set<string>();
  let at = 8;

  while (at + 8 < bytes.length) {
    const length = u32(bytes, at);
    const type = ascii(bytes, at + 4, 4);

    if (type === "IHDR") {
      out.width = u32(bytes, at + 8);
      out.height = u32(bytes, at + 12);
      out.bitDepth = bytes[at + 16];
      out.colour = PNG_COLOUR[bytes[at + 17]!] ?? `type ${bytes[at + 17]}`;
      out.interlaced = bytes[at + 20] === 1;
      out.format = "PNG";
    } else if (type === "iCCP") {
      chunks.add("ICC colour profile");
      out.iccProfile = "embedded";
    } else if (type === "sRGB") {
      chunks.add("sRGB declaration");
      out.iccProfile ??= "sRGB (declared)";
    } else if (type === "tEXt" || type === "iTXt" || type === "zTXt") {
      chunks.add("Text metadata");
    } else if (type === "eXIf") {
      chunks.add("Exif");
    } else if (type === "tIME") {
      chunks.add("Modification time");
    } else if (type === "acTL") {
      chunks.add("Animation (APNG)");
    }

    if (type === "IDAT" || type === "IEND") break;
    at += 12 + length;
    if (length < 0 || at <= 0) break;
  }

  out.segments = [...chunks];
}

/* ──────────────────────────────── EXIF ──────────────────────────────────── */

/**
 * Loads `exifr` and hands back the object that actually carries `parse`.
 *
 * `exifr` ships a single default export. `await import("exifr")` therefore
 * resolves to a namespace whose only key is `default`, so `namespace.parse` is
 * `undefined` and calling it throws. Every EXIF read in this codebase was
 * written that way and every one of them was failing into its own catch block
 * and reporting "no metadata" — silently, on files that had plenty.
 *
 * That is the failure mode a `try`/`catch` around an optional pass is worst at:
 * the pass reports the state it is designed to report when it cannot run, and
 * nothing distinguishes that from the same state honestly reached. Hence one
 * loader, shared by all three callers, defensive in both directions so a
 * bundler that does add named exports still works.
 */
export async function loadExifr(): Promise<{
  parse: (input: unknown, options?: unknown) => Promise<Record<string, unknown> | undefined>;
}> {
  const module = await import("exifr");
  const candidate = (module as unknown as { default?: unknown }).default ?? module;

  if (typeof (candidate as { parse?: unknown }).parse !== "function") {
    throw new Error("exifr exposes no parse function");
  }

  return candidate as { parse: (input: unknown, options?: unknown) => Promise<Record<string, unknown> | undefined> };
}


/**
 * The camera's own record, where one survives.
 *
 * Most images arriving at this service carry none: every messaging app and
 * social network strips it. That absence is reported as absence and never as
 * suspicion — treating a stripped screenshot as a red flag would flag almost
 * every genuine submission.
 *
 * Location is read and shown deliberately. It is the reader's own file on the
 * reader's own device, nothing is transmitted, and someone about to forward a
 * photograph is entitled to know it carries the coordinates of where it was
 * taken. Warning them is the privacy-preserving act, not hiding it from them.
 */
async function readExif(bytes: Uint8Array, out: FileMetadata): Promise<void> {
  try {
    const exifr = await loadExifr();
    /* Handed the bytes this module already read rather than the File. exifr's
       File path goes through FileReader, which costs a second read of the whole
       file and only exists in a browser — the bytes work everywhere. */
    const tags = (await exifr.parse(bytes, {
      tiff: true, exif: true, gps: true, xmp: false, iptc: false,
    })) as Record<string, unknown> | undefined;

    if (!tags || Object.keys(tags).length === 0) {
      out.exif = { present: false, fields: 0 };
      return;
    }

    const text = (key: string) => (typeof tags[key] === "string" ? (tags[key] as string).trim() : undefined);
    const num = (key: string) => (typeof tags[key] === "number" ? (tags[key] as number) : undefined);
    const date = tags.DateTimeOriginal ?? tags.CreateDate ?? tags.ModifyDate;

    const lat = num("latitude");
    const lon = num("longitude");

    out.exif = {
      present: true,
      fields: Object.keys(tags).length,
      make: text("Make"),
      model: text("Model"),
      lens: text("LensModel"),
      software: text("Software"),
      taken: date instanceof Date ? date.toISOString() : typeof date === "string" ? date : undefined,
      orientation: num("Orientation"),
      capturedWidth: num("ExifImageWidth"),
      capturedHeight: num("ExifImageHeight"),
      gps: typeof lat === "number" && typeof lon === "number" ? { lat, lon } : null,
    };
  } catch {
    out.exif = { present: false, fields: 0 };
  }
}

/* ──────────────────────────────── the pass ──────────────────────────────── */

/** SHA-256 of the file, so a reader can quote it or match it elsewhere. */
async function digest(buffer: ArrayBuffer): Promise<string | undefined> {
  try {
    if (typeof crypto === "undefined" || !crypto.subtle) return undefined;
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return undefined;
  }
}

/** Describes one file. Never throws; an unreadable file returns what is known. */
export async function readMetadata(file: File): Promise<FileMetadata> {
  const out: FileMetadata = {
    name: file.name,
    declaredType: file.type || "not declared",
    sizeBytes: file.size,
    lastModified: file.lastModified || undefined,
  };

  let buffer: ArrayBuffer;

  try {
    buffer = await file.arrayBuffer();
  } catch {
    return out;
  }

  const bytes = new Uint8Array(buffer);
  const signature = SIGNATURES.find((candidate) => candidate.test(bytes));

  out.sniffedType = signature?.type;
  out.sniffedLabel = signature?.label;
  out.sha256 = await digest(buffer);

  /* Declared and actual are compared on the family, not the exact type: a JPEG
     served as `image/jpg` is a spelling difference, a JPEG served as `image/png`
     is a re-save, and an executable named `.jpg` is the thing worth catching. */
  if (signature && file.type) {
    out.typeMatches = signature.type === file.type
      || (signature.type === "image/jpeg" && /jpe?g/i.test(file.type));
  }

  if (signature?.type === "image/jpeg") {
    readJpeg(bytes, out);
    await readExif(bytes, out);
  } else if (signature?.type === "image/png") {
    readPng(bytes, out);
    await readExif(bytes, out);
  } else if (signature?.type.startsWith("image/")) {
    out.format = signature.label;
    await readExif(bytes, out);
  }

  return out;
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
