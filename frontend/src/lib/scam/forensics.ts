import type { EditFinding, EditRead } from "@/lib/scam/types";
import type { TagRead } from "@/lib/scam/tags";
import { tagNumber } from "@/lib/scam/tags";

/**
 * Asking whether an image has been edited since it was created.
 *
 * This is a different question from the one `synthetic.ts` asks, and the
 * distinction matters more than it looks. A photograph can be entirely real and
 * still be a lie: a genuine bank statement with the balance painted over, a real
 * driver's licence with someone else's face on it, a screenshot of a message
 * that was never sent. A generator detector is blind to all of it, because the
 * base image is a real photograph.
 *
 * Everything here runs on the file's own bytes and on a canvas, so it holds the
 * same promise the rest of the checker makes: the image is never transmitted.
 * That rules out the published forensic frameworks — TruFor and its relatives
 * need a server and are licensed for non-commercial use besides — and leaves
 * the classical structural checks, which are weaker but honest about it.
 *
 * The weighting throughout reflects what each check can actually establish.
 * Structure is close to fact: a JPEG that carries two quantisation tables was
 * written twice, and that is arithmetic rather than inference. Error level
 * analysis is the opposite — widely reproduced, widely misread, and capable of
 * lighting up on nothing more than a sharp edge. It is included because a
 * reader asked to trust a verdict deserves to see the working, and excluded
 * from ever raising a verdict on its own.
 */

/** Longest edge the analysis works at. Larger images are drawn down to it. */
const WORK_EDGE = 1024;

/** Quality the re-encode uses. 0.9 is the conventional ELA setting. */
const ELA_QUALITY = 0.9;

/** Cell size the error map is summarised over, in working pixels. */
const CELL = 16;

/**
 * How much brighter than the image's own median a cell must be before it is
 * called out. Relative rather than absolute, because a noisy photograph and a
 * flat screenshot have completely different error floors and a fixed threshold
 * would flag every photograph and no screenshot.
 */
const CELL_ANOMALY_RATIO = 3.2;

/* ────────────────────────────── byte helpers ────────────────────────────── */

function u16(bytes: Uint8Array, at: number): number {
  return (bytes[at]! << 8) | bytes[at + 1]!;
}

const isJpeg = (b: Uint8Array) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8;
const isPng = (b: Uint8Array) =>
  b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;

/** Reads an ASCII run, for the marker payloads that identify their writer. */
function ascii(bytes: Uint8Array, at: number, length: number): string {
  let out = "";
  for (let i = at; i < Math.min(at + length, bytes.length); i += 1) {
    const code = bytes[i]!;
    out += code >= 0x20 && code < 0x7f ? String.fromCharCode(code) : " ";
  }
  return out;
}

/* ─────────────────────────── JPEG segment structure ─────────────────────── */

interface JpegStructure {
  /**
   * DQT segment count.
   *
   * Read but deliberately **not** scored. An earlier revision raised "saved
   * more than once" whenever this exceeded one, on the reasoning that a camera
   * writes a single table. Testing against real files showed that to be wrong:
   * an ordinary single-save JPEG carries two, one for luminance and one for
   * chrominance, and some encoders split them across two segments while others
   * put both in one. The rule fired on a freshly written file that had never
   * been edited, which would have meant telling most people with an ordinary
   * photograph that it had been tampered with.
   *
   * Genuine double-compression detection needs DCT coefficient histograms,
   * which is a different order of work from reading segment headers. Until
   * that exists this service does not claim to detect re-saving, because a
   * check that is wrong about the common case is worse than no check.
   */
  quantTables: number;
  /** Sum of the luminance table, a coarse stand-in for the quality setting. */
  luminanceSum: number | null;
  /** Application segments present, by their identifier. */
  apps: string[];
  /** Bytes after the end-of-image marker, which nothing should need. */
  trailingBytes: number;
  /** Scans. Progressive JPEGs legitimately have several; baseline has one. */
  scans: number;
  /** True where an embedded thumbnail was found in the EXIF segment. */
  hasThumbnail: boolean;
  /** Frame dimensions as the start-of-frame header declares them. */
  width: number | null;
  height: number | null;
}

/**
 * Walks the JPEG marker chain.
 *
 * A JPEG is a sequence of segments, each announcing its own length, so this is
 * a parse rather than a search — no scanning for byte patterns that might occur
 * inside compressed data by chance. The walk stops at the start of scan, since
 * everything past it is entropy-coded and has no segment structure to read.
 */
function readJpeg(bytes: Uint8Array): JpegStructure | null {
  if (!isJpeg(bytes)) {
    return null;
  }

  const out: JpegStructure = {
    quantTables: 0,
    luminanceSum: null,
    apps: [],
    trailingBytes: 0,
    scans: 0,
    hasThumbnail: false,
    width: null,
    height: null,
  };

  let at = 2;

  while (at < bytes.length - 1) {
    if (bytes[at] !== 0xff) {
      at += 1;
      continue;
    }

    const marker = bytes[at + 1]!;

    /* Padding and standalone markers carry no length field. */
    if (marker === 0xff || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      at += 2;
      continue;
    }

    const length = u16(bytes, at + 2);

    if (length < 2 || at + 2 + length > bytes.length) {
      break;
    }

    const body = at + 4;

    if (marker === 0xdb) {
      out.quantTables += 1;

      /* The first table in the first DQT is luminance. Its coefficients sum
         roughly inversely with quality, which is enough to tell a camera's
         table from an editor's without claiming to name the software. */
      if (out.luminanceSum === null) {
        const precision = bytes[body]! >> 4;
        let sum = 0;
        for (let i = 0; i < 64; i += 1) {
          sum += precision === 0 ? bytes[body + 1 + i]! : u16(bytes, body + 1 + i * 2);
        }
        out.luminanceSum = sum;
      }
    } else if (marker >= 0xe0 && marker <= 0xef) {
      const id = ascii(bytes, body, 6).trim().replace(/\s+$/, "");
      out.apps.push(id || `APP${marker - 0xe0}`);

      /* IFD1 in an Exif segment is the thumbnail directory. Its presence is
         what makes the thumbnail comparison below possible. */
      if (id.startsWith("Exif") && length > 64) {
        out.hasThumbnail = true;
      }
    } else if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      /* Start of frame, in any of its baseline and progressive flavours. The
         dimensions the decoder will actually use are declared here. */
      out.height ??= u16(bytes, body + 1);
      out.width ??= u16(bytes, body + 3);
    } else if (marker === 0xda) {
      out.scans += 1;
      /* Past here the data is entropy-coded; the next marker is found by the
         decoder, not by this walk. Stop unless more scans are expected. */
      break;
    }

    at += 2 + length;
  }

  /* Anything after the final EOI. A handful of padding bytes is ordinary; a
     large tail is a file carrying something the image does not need. */
  for (let i = bytes.length - 2; i >= 2; i -= 1) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xd9) {
      out.trailingBytes = bytes.length - (i + 2);
      break;
    }
  }

  return out;
}

/** PNG text chunks, which is where editors leave their name. */
function readPngSoftware(bytes: Uint8Array): string[] {
  if (!isPng(bytes)) {
    return [];
  }

  const found: string[] = [];
  let at = 8;

  while (at + 8 < bytes.length) {
    const length = (bytes[at]! << 24) | (bytes[at + 1]! << 16) | (bytes[at + 2]! << 8) | bytes[at + 3]!;
    const type = ascii(bytes, at + 4, 4);

    if (type === "IDAT" || type === "IEND") {
      break;
    }

    if (type === "tEXt" || type === "iTXt") {
      const text = ascii(bytes, at + 8, Math.min(length, 160)).replace(/\s+/g, " ").trim();
      if (text) {
        found.push(text);
      }
    }

    at += 12 + length;

    if (length < 0 || at <= 0) {
      break;
    }
  }

  return found;
}

/**
 * The dimensions the camera recorded at the moment of capture.
 *
 * Taken from the one shared parse rather than opened again here. This function
 * used to run its own `exifr` call, which meant the resize check could see a
 * different set of tags from the description shown beside it on the same
 * screen — two answers to one question, and no way for a reader to tell which
 * had been used.
 */
function capturedDimensions(tags: TagRead): { width: number; height: number } | null {
  const width = tagNumber(tags, "ExifImageWidth") ?? tagNumber(tags, "PixelXDimension");
  const height = tagNumber(tags, "ExifImageHeight") ?? tagNumber(tags, "PixelYDimension");

  return typeof width === "number" && typeof height === "number" && width > 0 && height > 0
    ? { width, height }
    : null;
}

/* ───────────────────────────── error level analysis ─────────────────────── */

interface ElaResult {
  /** Data URL of the amplified difference map, for display. */
  heatmap: string;
  /** Share of cells whose mean error sits far above the image's own median. */
  anomalousCells: number;
  totalCells: number;
  /** True where those cells sit together rather than being scattered noise. */
  clustered: boolean;
}

async function decode(file: File): Promise<ImageBitmap | null> {
  try {
    return await createImageBitmap(file);
  } catch {
    return null;
  }
}

function context(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] | null {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return ctx ? [canvas, ctx] : null;
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

/**
 * Re-compresses the image and measures where it changed.
 *
 * The premise is that a region already saved at a given quality is close to a
 * fixed point of that compression and barely moves, while a region pasted in
 * from elsewhere — or painted, or generated — has a different compression
 * history and moves further. In practice the signal is weak and edges,
 * gradients and text all produce error of their own, which is why the result
 * below is expressed against the image's own median rather than an absolute
 * threshold, and why nothing here is allowed to conclude anything alone.
 */
async function errorLevels(bitmap: ImageBitmap): Promise<ElaResult | null> {
  const scale = Math.min(1, WORK_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const original = context(width, height);
  if (!original) {
    return null;
  }

  const [originalCanvas, originalCtx] = original;
  originalCtx.drawImage(bitmap, 0, 0, width, height);

  const recompressed = await toBlob(originalCanvas, ELA_QUALITY);
  if (!recompressed) {
    return null;
  }

  const second = await decode(new File([recompressed], "recompressed.jpg", { type: "image/jpeg" }));
  if (!second) {
    return null;
  }

  const compare = context(width, height);
  if (!compare) {
    return null;
  }

  const [, compareCtx] = compare;
  compareCtx.drawImage(second, 0, 0, width, height);

  const a = originalCtx.getImageData(0, 0, width, height).data;
  const b = compareCtx.getImageData(0, 0, width, height).data;

  /* The difference, amplified to be visible, and the same values summarised
     per cell so the map can be reasoned about rather than only looked at. */
  const map = originalCtx.createImageData(width, height);
  const cols = Math.ceil(width / CELL);
  const rows = Math.ceil(height / CELL);
  const cellTotal = new Float64Array(cols * rows);
  const cellCount = new Uint32Array(cols * rows);

  let peak = 1;

  for (let i = 0; i < a.length; i += 4) {
    const diff =
      Math.abs(a[i]! - b[i]!) + Math.abs(a[i + 1]! - b[i + 1]!) + Math.abs(a[i + 2]! - b[i + 2]!);
    peak = Math.max(peak, diff);

    const pixel = i / 4;
    const cell = Math.floor(pixel / width / CELL) * cols + Math.floor((pixel % width) / CELL);
    cellTotal[cell] = (cellTotal[cell] ?? 0) + diff;
    cellCount[cell] = (cellCount[cell] ?? 0) + 1;
  }

  const gain = Math.min(24, 255 / peak * 6);

  for (let i = 0; i < a.length; i += 4) {
    const diff =
      Math.abs(a[i]! - b[i]!) + Math.abs(a[i + 1]! - b[i + 1]!) + Math.abs(a[i + 2]! - b[i + 2]!);
    const value = Math.min(255, diff * gain);
    map.data[i] = value;
    map.data[i + 1] = value;
    map.data[i + 2] = value;
    map.data[i + 3] = 255;
  }

  const [heatCanvas, heatCtx] = context(width, height)!;
  heatCtx.putImageData(map, 0, 0);

  const means = Array.from(cellTotal, (total, i) => (cellCount[i] ? total / cellCount[i]! : 0));
  const sorted = [...means].sort((x, y) => x - y);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const threshold = Math.max(median * CELL_ANOMALY_RATIO, 6);

  const flagged = means.map((mean) => mean > threshold);
  const anomalousCells = flagged.filter(Boolean).length;

  /* Scattered bright cells are texture. Bright cells with bright neighbours are
     a region, which is the only shape worth mentioning to a reader. */
  let adjacent = 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (!flagged[r * cols + c]) {
        continue;
      }
      const right = c + 1 < cols && flagged[r * cols + c + 1];
      const below = r + 1 < rows && flagged[(r + 1) * cols + c];
      if (right || below) {
        adjacent += 1;
      }
    }
  }

  return {
    heatmap: heatCanvas.toDataURL("image/png"),
    anomalousCells,
    totalCells: cols * rows,
    clustered: anomalousCells > 0 && adjacent / anomalousCells > 0.4,
  };
}

/**
 * Whether this browser hands back the pixels that were drawn.
 *
 * A known pattern is drawn and read straight back. On a faithful canvas the
 * values return exactly; on a browser that perturbs canvas reads to resist
 * fingerprinting they come back shifted by a small, varying amount. The result
 * is cached for the page because it is a property of the browser rather than
 * of the file, and it is computed rather than sniffed from a user-agent string
 * because the browsers that do this are precisely the ones that lie about who
 * they are.
 */
let faithful: boolean | null = null;

function canvasIsFaithful(): boolean {
  if (faithful !== null) {
    return faithful;
  }

  try {
    const probe = context(16, 1);

    if (!probe) {
      faithful = false;
      return faithful;
    }

    const [, ctx] = probe;
    const pattern = ctx.createImageData(16, 1);

    for (let i = 0; i < 16; i += 1) {
      pattern.data[i * 4] = i * 16;
      pattern.data[i * 4 + 1] = 255 - i * 16;
      pattern.data[i * 4 + 2] = 128;
      pattern.data[i * 4 + 3] = 255;
    }

    ctx.putImageData(pattern, 0, 0);
    const back = ctx.getImageData(0, 0, 16, 1).data;

    faithful = true;

    for (let i = 0; i < pattern.data.length; i += 1) {
      if (back[i] !== pattern.data[i]) {
        faithful = false;
        break;
      }
    }

    return faithful;
  } catch {
    faithful = false;
    return faithful;
  }
}

/* ──────────────────────────────── the pass ──────────────────────────────── */

/**
 * Runs the structural and pixel checks over one image.
 *
 * Never throws. Every branch that cannot complete reports itself as a gap, for
 * the same reason the other passes do: a check that silently did not run must
 * not be indistinguishable from a check that ran and found nothing.
 */
export async function readEdits(file: File, tags: TagRead, bytes: Uint8Array): Promise<EditRead> {
  const findings: EditFinding[] = [];
  let heatmap: string | undefined;
  let examined = "";

  if (bytes.length === 0) {
    return { findings: [], unavailable: "This image could not be read on this device." };
  }

  const jpeg = readJpeg(bytes);

  if (jpeg) {
    examined = "JPEG segment structure";

    const editorApps = jpeg.apps.filter((app) => /photoshop|adobe|ducky|xmp/i.test(app));

    if (editorApps.length > 0) {
      findings.push({
        id: "jpeg-editor-marker",
        label: "Written by image-editing software",
        detail:
          "The file carries a marker that editing software adds when it saves. That is not proof of a deceptive edit — cropping and colour correction leave the same trace — but it does mean this is not the file the camera produced.",
        weight: "medium",
        evidence: [...new Set(editorApps)].join(", "),
      });
    }

    /*
     * The frame is smaller than the camera said it captured.
     *
     * EXIF records the sensor's own dimensions at the moment of capture. If the
     * frame the decoder will draw is materially smaller, the picture was
     * resized after the camera wrote it — which is ordinary when a messaging
     * app shrinks an attachment, and is also what happens on the way to a
     * doctored copy. Reported as a low weight for exactly that reason.
     */
    const declared = capturedDimensions(tags);

    if (declared && jpeg.width && jpeg.height) {
      const shrunk = declared.width > jpeg.width * 1.2 || declared.height > jpeg.height * 1.2;

      if (shrunk) {
        findings.push({
          id: "jpeg-resized",
          label: "Resized after it was captured",
          detail:
            "The camera's own metadata records a larger picture than the one in this file, so it was scaled down after capture. Messaging apps do this to every photograph that passes through them, so on its own it means very little — it matters only alongside something else.",
          weight: "low",
          evidence: `${declared.width}×${declared.height} captured, ${jpeg.width}×${jpeg.height} here`,
        });
      }
    }

    if (jpeg.trailingBytes > 512) {
      findings.push({
        id: "jpeg-trailing-data",
        label: "Extra data after the image ends",
        detail: `${jpeg.trailingBytes.toLocaleString()} bytes follow the end-of-image marker. The picture does not need them, and appending data to an image is a known way of moving something else inside one.`,
        weight: "high",
        evidence: `${jpeg.trailingBytes.toLocaleString()} bytes`,
      });
    }
  } else if (isPng(bytes)) {
    examined = "PNG chunk structure";

    const text = readPngSoftware(bytes);
    const editor = text.find((entry) => /photoshop|gimp|paint|figma|canva|snapseed|adobe/i.test(entry));

    if (editor) {
      findings.push({
        id: "png-editor-chunk",
        label: "Written by image-editing software",
        detail:
          "The file names the software that wrote it, and it is an image editor rather than a camera or a screenshot tool.",
        weight: "medium",
        evidence: editor.slice(0, 80),
      });
    }
  } else {
    examined = "container structure";
  }

  /*
   * The pixel pass. Attempted only where a canvas is available — which excludes
   * no browser this service supports, but does exclude a test runner — and only
   * where reading a canvas back gives the same answer twice.
   *
   * That second condition is the fix for a real complaint. Several browsers
   * add per-session noise to canvas reads to defeat fingerprinting, and error
   * level analysis is a measurement of exactly the kind of small pixel
   * difference that noise swamps. On those browsers the same image checked
   * twice produced two different error maps and, at the margin, two different
   * answers about whether it had been edited. A check that cannot be repeated
   * is not a check, so where the probe fails the pass reports itself as
   * unavailable rather than returning a number it cannot stand behind.
   */
  if (typeof document !== "undefined" && typeof createImageBitmap === "function") {
    if (!canvasIsFaithful()) {
      return {
        findings,
        examined: examined || undefined,
        unavailable:
          "This browser alters the pixels an image reads back as, which it does to prevent fingerprinting. The structural checks above still ran, but the pixel comparison would give a different answer every time it was run, so it was not.",
      };
    }

    const bitmap = await decode(file);

    if (bitmap) {
      try {
        const ela = await errorLevels(bitmap);

        if (ela) {
          heatmap = ela.heatmap;
          examined += examined ? " and pixel error levels" : "pixel error levels";

          const share = ela.anomalousCells / Math.max(1, ela.totalCells);

          /*
           * Reported only where the bright cells form a region. Scattered ones
           * are what every photograph of a detailed scene produces, and raising
           * them would mean telling most people with a real picture that it had
           * been tampered with.
           */
          if (ela.clustered && share > 0.02 && share < 0.5) {
            findings.push({
              id: "ela-region",
              label: "One area compresses unlike the rest",
              detail:
                "Re-compressing the image moved one connected area much more than the rest of it, which can happen when part of a picture has a different history from the whole — a pasted region, or an area that was painted over. It also happens on legitimate sharp edges and overlaid text, so this is a prompt to look closely rather than a finding of tampering.",
              weight: "low",
              evidence: `${Math.round(share * 100)}% of the image, in a connected region`,
            });
          }
        }
      } finally {
        bitmap.close?.();
      }
    }
  }

  return { findings, heatmap, examined: examined || undefined };
}
