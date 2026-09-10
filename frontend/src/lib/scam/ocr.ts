import type { MediaDescriptor } from "@/lib/scam/types";
import { kindOf } from "@/lib/scam/media";
import { readProvenance } from "@/lib/scam/provenance";
import { readSynthetic } from "@/lib/scam/synthetic";
import { readEdits } from "@/lib/scam/forensics";
import { readMetadata, signatureOf } from "@/lib/scam/metadata";
import type { FileMetadata } from "@/lib/scam/types";

/**
 * Reading an uploaded image, in the browser: its metadata, its text and any QR
 * code in it.
 *
 * This is what makes a screenshot genuinely checkable rather than nominally
 * accepted. Most people do not paste a scam text — they screenshot it — and
 * the words in that screenshot are the same words the rule set already knows
 * how to read. Recognise them and the whole existing engine applies unchanged.
 *
 * Revised after the Lecturer's feedback on reliability and consistency:
 *
 * - The kind of file is decided by its bytes (`metadata.ts`), not its name.
 * - The image is normalised before recognition — rotated upright from its EXIF
 *   orientation, scaled into the range Tesseract reads best, and inverted when
 *   it is a dark-mode screenshot, which is the single largest cause of phone
 *   screenshots failing to read.
 * - Results are cached by content hash, so checking the same screenshot twice
 *   gives the same answer twice, under any filename.
 * - One recogniser is shared across every file in a check instead of one being
 *   started and torn down per image.
 */

/**
 * `tesseract.js` is several megabytes of WebAssembly and it is only ever needed
 * once someone actually attaches an image, so it is imported at that moment
 * rather than bundled — the same treatment `World` gets for `three`. A visitor
 * who only pastes text never downloads any of it.
 */
async function recogniser() {
  const { createWorker } = await import("tesseract.js");
  return createWorker("eng");
}

type Recogniser = Awaited<ReturnType<typeof recogniser>>;

/**
 * Recognition below this confidence is discarded rather than analysed.
 *
 * Tesseract returns something for any image, and on a photograph of no text it
 * returns punctuation soup. Feeding that to the rule set would produce
 * indicators drawn from noise — evidence quoted back to the reader that is not
 * in their message at all.
 */
const MINIMUM_CONFIDENCE = 45;

/** Shortest recognised string worth treating as a message rather than a stray. */
const MINIMUM_TEXT = 8;

/** Longest side, in pixels, an image is scaled to before recognition. */
const MAX_SIDE = 2200;

/** Narrow screenshots are enlarged; Tesseract reads text best at ~30px cap height. */
const MIN_WIDTH = 1000;

/** Mean luminance below which an image is treated as dark mode and inverted. */
const DARK_THRESHOLD = 0.45;

export interface ReadResult {
  text?: string;
  unreadable?: string;
  qrCodes?: string[];
}

/**
 * What has already been read, by content hash.
 *
 * Module-level so it lasts for the visit: the common case is someone checking,
 * adding a line of context, and checking again — and the verdict must not move
 * because recognition happened to run a second time.
 */
const readCache = new Map<string, ReadResult>();

/** Draws the image upright and to a readable size. Null where the browser cannot decode it. */
async function normalise(file: File): Promise<{ canvas: HTMLCanvasElement; pixels: ImageData } | null> {
  let bitmap: ImageBitmap;

  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return null;
  }

  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = bitmap.width < MIN_WIDTH ? MIN_WIDTH / bitmap.width : Math.min(1, MAX_SIDE / longest);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    bitmap.close();
    return null;
  }

  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const pixels = context.getImageData(0, 0, width, height);
  return { canvas, pixels };
}

/**
 * Greyscale, and inverted when the image is predominantly dark.
 *
 * Tesseract is trained on dark text on a light page. A dark-mode message
 * thread is the opposite, and reads as noise until it is flipped.
 */
function prepareForRecognition(canvas: HTMLCanvasElement, pixels: ImageData): HTMLCanvasElement {
  const data = new Uint8ClampedArray(pixels.data);
  let total = 0;

  for (let index = 0; index < data.length; index += 4) {
    total += (0.2126 * data[index]! + 0.7152 * data[index + 1]! + 0.0722 * data[index + 2]!) / 255;
  }

  const invert = total / (data.length / 4) < DARK_THRESHOLD;

  for (let index = 0; index < data.length; index += 4) {
    const grey = 0.2126 * data[index]! + 0.7152 * data[index + 1]! + 0.0722 * data[index + 2]!;
    const value = invert ? 255 - grey : grey;
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
  }

  const output = document.createElement("canvas");
  output.width = canvas.width;
  output.height = canvas.height;
  output.getContext("2d")?.putImageData(new ImageData(data, canvas.width, canvas.height), 0, 0);
  return output;
}

/** Any QR code in the image, decoded to the text it carries. */
async function readQrCodes(pixels: ImageData): Promise<string[]> {
  try {
    const { default: jsQR } = await import("jsqr");
    const code = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: "attemptBoth" });
    return code?.data ? [code.data.trim()] : [];
  } catch {
    return [];
  }
}

/** Reads one image. Never throws: a failure is a reported gap, not an error. */
async function readImage(file: File, metadata: FileMetadata, worker: () => Promise<Recogniser>): Promise<ReadResult> {
  /* The digest where the browser could compute one; otherwise name and size,
     which is weaker but still stable for the visit. */
  const key = metadata.sha256 ?? `${file.name}:${file.size}:${file.lastModified}`;
  const cached = readCache.get(key);

  if (cached) {
    return cached;
  }

  const drawn = await normalise(file);

  if (!drawn) {
    const result: ReadResult = {
      unreadable:
        metadata.sniffedType === "image/heic"
          ? "HEIC photos cannot be decoded in this browser. Take a screenshot of it (PNG) and attach that instead."
          : "This image could not be decoded on this device.",
    };
    readCache.set(key, result);
    return result;
  }

  const qrCodes = await readQrCodes(drawn.pixels);
  let result: ReadResult;

  try {
    const { data } = await (await worker()).recognize(prepareForRecognition(drawn.canvas, drawn.pixels));
    const text = data.text.trim();

    if (text.length < MINIMUM_TEXT) {
      result = { unreadable: "No readable text was found in this image.", qrCodes };
    } else if (data.confidence < MINIMUM_CONFIDENCE) {
      result = {
        unreadable:
          "Text was found but could not be read reliably enough to check. A sharper or straighter screenshot usually reads.",
        qrCodes,
      };
    } else {
      result = { text, qrCodes };
    }
  } catch {
    result = { unreadable: "This image could not be read on this device.", qrCodes };
  }

  readCache.set(key, result);
  return result;
}

/** Why a non-image was not read. Stated plainly rather than left implied. */
const NOT_READ: Record<string, string> = {
  audio:
    "Audio is not transcribed on this device. Type what was said into the message box and it will be checked as a call transcript.",
  video:
    "Video is not examined. If there is a message shown in it, screenshot that frame and attach the image instead.",
  document:
    "The contents of this file were not opened — only its name, type and file signature were checked. Opening an attachment to inspect it is the risk the check is meant to avoid.",
};

/**
 * Turns picked files into what the analyser reasons about.
 *
 * `onProgress` reports which file is being worked through so the wait can name
 * it: reading three screenshots takes long enough that a single unchanging
 * "analysing" would look stuck.
 */
export async function describeFiles(
  files: File[],
  onProgress?: (index: number, name: string) => void,
): Promise<MediaDescriptor[]> {
  const described: MediaDescriptor[] = [];

  /* Started on first need and shared by every image in this check. */
  const shared: { pending: Promise<Recogniser> | null } = { pending: null };
  const worker = () => (shared.pending ??= recogniser());

  try {
    for (const [index, file] of files.entries()) {
      onProgress?.(index, file.name);

      /*
       * Read for every file, image or not. It is the one pass that always has
       * something to say, and a submission that produced no verdict must still
       * come back having described what it was handed. Its signature — not the
       * name — then decides what kind of file this is.
       */
      const metadata = await readMetadata(file);
      const signature = signatureOf(metadata);
      const kind = kindOf(file.type, file.name, signature);
      const base = { name: file.name, size: file.size, type: file.type, kind, metadata };

      /* SVG is an image to the eye and a document to the checker: it is not
         rasterised, because rendering it is what would run anything inside. */
      if (kind === "image" && signature?.family !== "web") {
        /*
         * Four passes over the same image, cheapest and most certain first.
         * Provenance is metadata and costs nothing; the forensic pass reads the
         * file's own structure and one canvas re-encode; the classifier is a
         * model and costs a download; OCR is the one that feeds the existing
         * rule set, and decodes any QR code on the way. None of them can fail
         * the others — each returns its own gap.
         *
         * They answer three different questions, and keeping them apart is the
         * point: where did this come from, has it been altered since, and what
         * does it say. An image can be a real photograph, edited, and carrying
         * a scam, and a reader is entitled to see all three answers separately.
         */
        const provenance = await readProvenance(file);
        const edits = await readEdits(file);
        const synthetic = await readSynthetic(file);
        const { text, unreadable, qrCodes } = await readImage(file, metadata, worker);

        described.push({ ...base, extractedText: text, unreadable, qrCodes, provenance, synthetic, edits });
        continue;
      }

      described.push({ ...base, unreadable: NOT_READ[kind] ?? NOT_READ.document });
    }
  } finally {
    if (shared.pending) {
      await (await shared.pending).terminate();
    }
  }

  return described;
}
