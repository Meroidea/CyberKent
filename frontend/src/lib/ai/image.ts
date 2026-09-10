/**
 * Prepares an image to be sent for AI analysis.
 *
 * Re-drawing the image onto a canvas and exporting a fresh JPEG is what removes
 * its metadata: a canvas holds pixels only, so EXIF — camera, timestamps and,
 * most importantly, GPS location — does not survive the trip (ER-5). It also
 * bounds the upload, because a modern phone photo is far larger than a vision
 * model needs to read a screenshot.
 */

/** Longest side sent to the model. Enough to read small print in a screenshot. */
const MAX_SIDE = 1600;

/** Quality for the re-encoded JPEG; text stays sharp well below 1.0. */
const QUALITY = 0.86;

export class ImagePreparationError extends Error {}

export async function toStrippedDataUrl(file: File): Promise<string> {
  let bitmap: ImageBitmap;

  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ImagePreparationError("This image could not be opened in the browser.");
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new ImagePreparationError("This browser cannot prepare images for analysis.");
  }

  /* White under any transparency — JPEG has no alpha, and black would make a
     transparent screenshot unreadable. */
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", QUALITY);
}
