import { ascii, asciiRaw, u32be, indexOfBytes, bytesOf } from "@/lib/scam/bytes";

/**
 * The one metadata read.
 *
 * Three passes used to parse a file's tags independently — the descriptive
 * pass, the provenance pass and the resize check — each with its own `exifr`
 * options and its own idea of what counted as present. They could and did
 * disagree about the same file, and because each swallowed its own failures,
 * a pass that had silently not run was indistinguishable from one that ran and
 * found nothing. That is the whole of the "same image, different answers"
 * complaint: the report showed whichever parse happened to win.
 *
 * So the file is parsed exactly once, into this shape, and every pass reads
 * from the result. Where the parse fails it says so in {@link TagRead.failed}
 * rather than returning an empty object that reads like an honest absence.
 */

export interface TagRead {
  /** Set when the parse itself could not run. Absence of tags is not this. */
  failed?: string;
  /** TIFF IFD0 — the camera and the writer. */
  ifd0: Record<string, unknown>;
  /** The EXIF sub-IFD — exposure, capture time, the sensor's own dimensions. */
  exif: Record<string, unknown>;
  /** GPS IFD, untranslated. */
  gps: Record<string, unknown>;
  /** IPTC, where a newsroom or a stock library writes its credit. */
  iptc: Record<string, unknown>;
  /** XMP, parsed. Adobe and most generators write here. */
  xmp: Record<string, unknown>;
  /** ICC profile tags, which is where the colour profile's own name lives. */
  icc: Record<string, unknown>;
  /** True where an embedded thumbnail IFD was found. */
  thumbnail: boolean;
  /** Raw XMP packet, kept because generators write prompts it cannot model. */
  xmpRaw?: string;
}

const EMPTY: TagRead = {
  ifd0: {},
  exif: {},
  gps: {},
  iptc: {},
  xmp: {},
  icc: {},
  thumbnail: false,
};

/**
 * Loads `exifr` and hands back the object that actually carries `parse`.
 *
 * `exifr` ships a single default export, so `await import("exifr")` resolves
 * to a namespace whose only key is `default` and whose `parse` is `undefined`.
 * Every EXIF read in this codebase was originally written against the
 * namespace, every one of them threw, and every one of them caught its own
 * throw and reported "no metadata" — on files that had plenty.
 */
export async function loadExifr(): Promise<{
  parse: (input: unknown, options?: unknown) => Promise<Record<string, unknown> | undefined>;
}> {
  const module = await import("exifr");
  const candidate = (module as unknown as { default?: unknown }).default ?? module;

  if (typeof (candidate as { parse?: unknown }).parse !== "function") {
    throw new Error("exifr exposes no parse function");
  }

  return candidate as {
    parse: (input: unknown, options?: unknown) => Promise<Record<string, unknown> | undefined>;
  };
}

function block(source: unknown): Record<string, unknown> {
  return source && typeof source === "object" ? (source as Record<string, unknown>) : {};
}

/**
 * Parses every metadata segment the file carries, in one pass over the bytes.
 *
 * `mergeOutput: false` is deliberate. Merged output cannot tell "the camera
 * wrote a Software tag" from "Photoshop wrote an XMP CreatorTool", and those
 * are different claims with different authority — collapsing them is how an
 * unsigned string ends up quoted with a camera's credibility.
 *
 * Bytes rather than the `File`: `exifr`'s File path goes through `FileReader`,
 * which exists only in a browser and re-reads the whole file for tags the
 * caller already has in hand.
 */
export async function readTags(bytes: Uint8Array): Promise<TagRead> {
  let exifr: Awaited<ReturnType<typeof loadExifr>>;

  try {
    exifr = await loadExifr();
  } catch {
    return { ...EMPTY, failed: "The metadata reader could not be loaded on this device." };
  }

  try {
    const parsed = await exifr.parse(bytes, {
      mergeOutput: false,
      translateKeys: true,
      translateValues: true,
      reviveValues: true,
      sanitize: true,
      tiff: true,
      ifd0: true,
      ifd1: true,
      exif: true,
      gps: true,
      interop: true,
      iptc: true,
      xmp: true,
      icc: true,
      jfif: true,
      ihdr: true,
    });

    const output = block(parsed);

    return {
      ifd0: block(output.ifd0),
      exif: block(output.exif),
      gps: block(output.gps),
      iptc: block(output.iptc),
      xmp: block(output.xmp),
      icc: block(output.icc),
      thumbnail: Object.keys(block(output.ifd1)).length > 0 || Boolean(output.thumbnail),
      xmpRaw: xmpPacket(bytes),
    };
  } catch {
    /* A file with no metadata at all is not a parse failure — `exifr` throws
       for both, so the packet scan below settles which happened. A file whose
       bytes contain no XMP and no Exif marker genuinely has nothing. */
    const hasMarker =
      indexOfBytes(bytes, bytesOf("Exif\0\0"), 0) >= 0 || indexOfBytes(bytes, bytesOf("<x:xmpmeta"), 0) >= 0;

    return hasMarker
      ? { ...EMPTY, failed: "This file carries metadata that could not be parsed on this device." }
      : { ...EMPTY, xmpRaw: undefined };
  }
}

/** The raw XMP packet, which carries strings no tag model represents. */
function xmpPacket(bytes: Uint8Array): string | undefined {
  const start = indexOfBytes(bytes, bytesOf("<x:xmpmeta"), 0);

  if (start < 0) {
    return undefined;
  }

  const end = indexOfBytes(bytes, bytesOf("</x:xmpmeta>"), start);
  const stop = end < 0 ? Math.min(bytes.length, start + 65536) : end + 12;

  return asciiRaw(bytes, start, stop - start);
}

/* ─────────────────────────────── derived values ─────────────────────────── */

/** A tag as trimmed text, from whichever block carries it. */
export function tagText(tags: TagRead, key: string): string | undefined {
  for (const source of [tags.ifd0, tags.exif, tags.xmp, tags.iptc, tags.icc]) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

/** A tag as a finite number, from whichever block carries it. */
export function tagNumber(tags: TagRead, key: string): number | undefined {
  for (const source of [tags.exif, tags.ifd0, tags.xmp]) {
    const value = source[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
}

/** A tag as an ISO timestamp, accepting the several shapes EXIF dates arrive in. */
export function tagDate(tags: TagRead, key: string): string | undefined {
  for (const source of [tags.exif, tags.ifd0, tags.xmp]) {
    const value = source[key];

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }

    if (typeof value === "string" && value.trim()) {
      /* EXIF writes "2026:09:08 14:22:31", which `Date` will not parse. */
      const normalised = value.trim().replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");
      const parsed = new Date(normalised);

      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
  }

  return undefined;
}

/**
 * Latitude and longitude, computed here rather than taken from a merged parse.
 *
 * `exifr` only synthesises the composite `latitude`/`longitude` pair in merged
 * output, and merged output is what this module exists to avoid. The
 * degrees-minutes-seconds conversion is four lines, so it is done here and the
 * single parse stands.
 */
export function coordinates(tags: TagRead): { lat: number; lon: number } | null {
  const lat = degrees(tags.gps.GPSLatitude, tags.gps.GPSLatitudeRef);
  const lon = degrees(tags.gps.GPSLongitude, tags.gps.GPSLongitudeRef);

  if (lat === null || lon === null || (lat === 0 && lon === 0)) {
    return null;
  }

  return { lat, lon };
}

function degrees(value: unknown, ref: unknown): number | null {
  let magnitude: number | null = null;

  if (typeof value === "number" && Number.isFinite(value)) {
    magnitude = Math.abs(value);
  } else if (Array.isArray(value) && value.length >= 2) {
    const [d, m, s] = value as number[];
    if ([d, m].every((part) => typeof part === "number" && Number.isFinite(part))) {
      magnitude = Math.abs(d!) + m! / 60 + (typeof s === "number" ? s / 3600 : 0);
    }
  }

  if (magnitude === null) {
    return null;
  }

  const south = typeof ref === "string" && /^[SW]/i.test(ref.trim());
  const signed = typeof value === "number" && value < 0;

  return south || signed ? -magnitude : magnitude;
}

/**
 * The colour profile's own name — "Display P3", "sRGB IEC61966-2.1".
 *
 * This is the field a desktop file inspector shows, and its absence was one of
 * the reasons this service's description of an image did not match the one the
 * reader could see on their own machine. `exifr` supplies it when it parses
 * the profile; the raw scan is the fallback for the files where it does not,
 * because the profile description sits in plain bytes in a JPEG's APP2 segment
 * and is worth two dozen lines to recover.
 */
export function colourProfileName(tags: TagRead, bytes: Uint8Array): string | undefined {
  const named =
    tags.icc.ProfileDescription ?? tags.icc.desc ?? tags.icc.DeviceModel ?? tags.icc.ProfileName;

  if (typeof named === "string" && named.trim()) {
    return named.trim();
  }

  return rawIccDescription(bytes);
}

/**
 * Pulls the `desc` tag out of an embedded ICC profile by walking its tag table.
 *
 * The profile header is 128 bytes, then a count, then that many 12-byte
 * entries of signature/offset/size. `desc` is either a `desc` type (ASCII,
 * length-prefixed) or a `mluc` type (UTF-16BE records); both are handled
 * because Apple writes the second and almost everything else writes the first.
 */
function rawIccDescription(bytes: Uint8Array): string | undefined {
  const marker = indexOfBytes(bytes, bytesOf("ICC_PROFILE\0"), 0);

  if (marker < 0) {
    return undefined;
  }

  /* APP2 payload: "ICC_PROFILE\0" then a chunk number and a chunk count. */
  const profile = marker + 12 + 2;
  const count = u32be(bytes, profile + 128);

  if (count <= 0 || count > 256) {
    return undefined;
  }

  for (let i = 0; i < count; i += 1) {
    const entry = profile + 132 + i * 12;

    if (ascii(bytes, entry, 4) !== "desc") {
      continue;
    }

    const at = profile + u32be(bytes, entry + 4);
    const size = u32be(bytes, entry + 8);

    if (at < 0 || size <= 12 || at + size > bytes.length) {
      return undefined;
    }

    const type = ascii(bytes, at, 4);

    if (type === "desc") {
      const length = u32be(bytes, at + 8);
      /* The payload is NUL-padded to its declared length, so the first NUL
         terminates the name. Split rather than matched, to keep a control
         character out of this source file. */
      const name = ascii(bytes, at + 12, Math.min(length, 128)).split(String.fromCharCode(0))[0];
      return name?.trim() || undefined;
    }

    if (type === "mluc") {
      const records = u32be(bytes, at + 8);
      if (records < 1) {
        return undefined;
      }
      const length = u32be(bytes, at + 20);
      const offset = u32be(bytes, at + 24);
      let out = "";
      for (let j = 0; j + 1 < Math.min(length, 256); j += 2) {
        const code = (bytes[at + offset + j]! << 8) | bytes[at + offset + j + 1]!;
        if (code >= 0x20) {
          out += String.fromCharCode(code);
        }
      }
      return out.trim() || undefined;
    }
  }

  return undefined;
}
