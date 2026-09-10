import { readFileSync } from "node:fs";
import { analyse } from "@/lib/scam/analyse";
import { kindOf } from "@/lib/scam/media";
import { readMetadata } from "@/lib/scam/metadata";
import type { MediaDescriptor } from "@/lib/scam/types";

/**
 * Verifies the metadata reader against real files — the Lecturer's first point
 * of feedback: image metadata must be read reliably and consistently.
 *
 *   tsx src/lib/scam/__check__/metadata.ts
 *
 * "Reliably" is tested by giving it files whose names and declared types lie.
 * "Consistently" is tested by giving it the same bytes under two names and two
 * declared types, and requiring identical answers.
 */

const FIXTURES = new URL("./fixtures/", import.meta.url);

function load(file: string, name = file, type = ""): File {
  return new File([readFileSync(new URL(file, FIXTURES))], name, { type });
}

let failures = 0;

function expect(label: string, condition: boolean, detail: string) {
  console.log(`${condition ? "PASS" : "FAIL"}  ${label.padEnd(58)} ${detail}`);
  failures += condition ? 0 : 1;
}

async function describe(file: File): Promise<MediaDescriptor> {
  const metadata = await readMetadata(file);
  return { name: file.name, size: file.size, type: file.type, kind: kindOf(file.type, file.name, metadata.detected), metadata };
}

const png = await readMetadata(load("screenshot.png", "screenshot.png", "image/png"));
expect("PNG identified from its signature", png.detected?.mime === "image/png", `${png.detected?.label}`);
expect("PNG dimensions read from IHDR", Boolean(png.width && png.height), `${png.width} × ${png.height}`);

const photo = await readMetadata(load("phone-photo-with-gps.jpg", "IMG_0412.jpg", "image/jpeg"));
expect("JPEG identified from its signature", photo.detected?.mime === "image/jpeg", `${photo.detected?.label}`);
expect("JPEG dimensions read from SOF marker", Boolean(photo.width && photo.height), `${photo.width} × ${photo.height}`);
expect("EXIF camera make and model read", photo.exif?.make === "Apple" && photo.exif?.model === "iPhone 15", `${photo.exif?.make} ${photo.exif?.model}`);
expect("EXIF capture date read", photo.exif?.takenAt === "2026:09:01 09:31:12", `${photo.exif?.takenAt}`);
expect("GPS presence detected (coordinates never read)", photo.exif?.hasLocation === true, `hasLocation=${photo.exif?.hasLocation}`);

/* Consistency: same bytes, different name, missing declared type. */
const renamed = await readMetadata(load("phone-photo-with-gps.jpg", "photo (1).heic", ""));
expect("Same bytes under another name → same fingerprint", renamed.sha256 === photo.sha256, renamed.sha256.slice(0, 16));
expect("Same bytes under another name → same type", renamed.detected?.mime === photo.detected?.mime, `${renamed.detected?.label}`);
expect("Kind decided by content, not by an empty MIME type", kindOf("", "photo (1).heic", renamed.detected) === "image", "image");

/* Reliability: names and declared types that lie. */
const disguised = await describe(load("invoice.jpg", "invoice.jpg", "image/jpeg"));
const disguisedResult = analyse({ text: "", channel: "email", media: [disguised] });
expect("Program named invoice.jpg detected as a program", disguised.metadata?.detected?.family === "executable", `${disguised.metadata?.detected?.label}`);
expect("…and flagged high risk", disguisedResult.band === "high", `band=${disguisedResult.band} · ${disguisedResult.indicators.map((i) => i.label).join("; ")}`);

const html = await describe(load("statement.pdf", "statement.pdf", "application/pdf"));
const htmlResult = analyse({ text: "", channel: "email", media: [html] });
expect("HTML page named statement.pdf detected as HTML", html.metadata?.detected?.mime === "text/html", `${html.metadata?.detected?.label}`);
expect("…and flagged", htmlResult.band === "high" || htmlResult.band === "medium", `band=${htmlResult.band}`);

console.log(`\n${failures === 0 ? "All" : `${failures} failed of`} metadata checks ${failures === 0 ? "passed" : ""}`);
process.exitCode = failures === 0 ? 0 : 1;
