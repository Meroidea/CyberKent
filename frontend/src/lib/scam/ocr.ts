import type { MediaDescriptor } from "@/lib/scam/types";
import { kindOf } from "@/lib/scam/media";

/**
 * Reading the text out of an uploaded image, in the browser.
 *
 * This is what makes a screenshot genuinely checkable rather than nominally
 * accepted. Most people do not paste a scam text — they screenshot it — and
 * the words in that screenshot are the same words the rule set already knows
 * how to read. Recognise them and the whole existing engine applies unchanged.
 *
 * The alternative was to accept images and score them on filename alone, which
 * would produce a verdict with the confident shape of an analysis and none of
 * the substance. This module is the difference between the two.
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

export interface ReadResult {
  text?: string;
  unreadable?: string;
}

/** Reads one image. Never throws: a failure is a reported gap, not an error. */
export async function readImage(file: File): Promise<ReadResult> {
  let worker: Awaited<ReturnType<typeof recogniser>> | null = null;

  try {
    worker = await recogniser();
    const { data } = await worker.recognize(file);
    const text = data.text.trim();

    if (text.length < MINIMUM_TEXT) {
      return { unreadable: "No readable text was found in this image." };
    }

    if (data.confidence < MINIMUM_CONFIDENCE) {
      return {
        unreadable:
          "Text was found but could not be read reliably enough to check. A sharper or straighter screenshot usually reads.",
      };
    }

    return { text };
  } catch {
    return { unreadable: "This image could not be read on this device." };
  } finally {
    await worker?.terminate();
  }
}

/** Why a non-image was not read. Stated plainly rather than left implied. */
const NOT_READ: Record<string, string> = {
  audio:
    "Audio is not transcribed on this device. Type what was said into the message box and it will be checked as a call transcript.",
  video:
    "Video is not examined. If there is a message shown in it, screenshot that frame and attach the image instead.",
  document:
    "The contents of this file were not opened — only its name and type were checked. Opening an attachment to inspect it is the risk the check is meant to avoid.",
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

  for (const [index, file] of files.entries()) {
    onProgress?.(index, file.name);

    const kind = kindOf(file.type, file.name);
    const base = { name: file.name, size: file.size, type: file.type, kind };

    if (kind === "image") {
      const { text, unreadable } = await readImage(file);
      described.push({ ...base, extractedText: text, unreadable });
      continue;
    }

    described.push({ ...base, unreadable: NOT_READ[kind] });
  }

  return described;
}
