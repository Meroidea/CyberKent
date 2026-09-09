import type { Indicator, MediaDescriptor, MediaKind } from "@/lib/scam/types";
import { fileTypeMismatch } from "@/lib/scam/metadata";
import { assessOrigin } from "@/lib/scam/origin";

/**
 * Rules that read a file's envelope rather than its contents.
 *
 * A scam delivered as an attachment usually gives itself away before anything
 * is opened: the thing claiming to be an invoice is an installer, or is named
 * so that the part of the name a phone shows is not the part that matters.
 * None of this requires reading the file, which is what makes it honest — the
 * rules below state exactly what they looked at.
 */

/** Opening one of these runs code. */
const EXECUTABLE_EXTENSIONS = [
  "exe", "scr", "com", "pif", "bat", "cmd", "msi", "apk", "dmg", "app", "jar",
  "vbs", "vbe", "jse", "wsf", "wsh", "ps1", "lnk", "reg", "hta", "gadget",
];

/** Office formats that can carry macros, which are code by another name. */
const MACRO_EXTENSIONS = ["docm", "xlsm", "pptm", "dotm", "xltm", "xlam", "ppam"];

/** Containers whose contents cannot be seen until they are opened. */
const ARCHIVE_EXTENSIONS = ["zip", "rar", "7z", "gz", "bz2", "tar", "cab", "ace", "iso", "img"];

/** Extensions a message is likely to claim, used to spot a second one after. */
const DOCUMENT_EXTENSIONS = [
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "rtf",
  "jpg", "jpeg", "png", "gif", "webp", "heic", "mp3", "wav", "m4a",
];

/**
 * Characters that reorder how a filename is displayed.
 *
 * The trick they enable is old and still works: a file named
 * "photo_‮gnp.exe" is shown by most systems as "photo_exe.png". There is
 * no legitimate reason for one of these to appear in an attachment's name.
 */
const BIDI_OVERRIDE = /[‪-‮⁦-⁩]/;

/** Extension as lowercase, without the dot. Empty string when there is none. */
export function extensionOf(name: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(name.trim());
  return match ? match[1]!.toLowerCase() : "";
}

/** Which of the four broad kinds a file falls into. */
export function kindOf(type: string, name: string): MediaKind {
  const extension = extensionOf(name);

  if (type.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "bmp", "heic"].includes(extension)) {
    return "image";
  }

  if (type.startsWith("audio/") || ["mp3", "wav", "m4a", "aac", "ogg", "amr", "opus"].includes(extension)) {
    return "audio";
  }

  if (type.startsWith("video/") || ["mp4", "mov", "avi", "mkv", "webm"].includes(extension)) {
    return "video";
  }

  return "document";
}

/**
 * What the declared MIME type implies the extension should look like.
 *
 * Only the families worth contradicting are listed. A mismatch inside a family
 * — `image/jpeg` named `.png` — is a re-save, not a disguise, so the check is
 * deliberately coarse: it fires when a file declares one *kind* and is named
 * as another.
 */
function familyOf(type: string): string {
  return type.split("/")[0] ?? "";
}

/** FR21 by analogy — the same evidence-first treatment, applied to files. */
export function analyseMedia(media: MediaDescriptor[]): Indicator[] {
  const indicators: Indicator[] = [];

  for (const file of media) {
    const extension = extensionOf(file.name);

    /*
     * The bytes disagree with the name. Read from the metadata pass rather than
     * re-sniffed here, because there should be exactly one answer in the report
     * to "what is this file", and two sniffers eventually give two.
     */
    const mismatch = file.metadata ? fileTypeMismatch(file.metadata) : null;

    if (mismatch) {
      indicators.push({
        id: `file-bytes-mismatch-${file.name}`,
        label: "File is not the type it claims",
        detail: `${mismatch} A file that is one thing and announces itself as another is the oldest way of getting something opened that would not be opened otherwise.`,
        weight: "high",
        evidence: file.name,
      });
    }

    if (BIDI_OVERRIDE.test(file.name)) {
      indicators.push({
        id: `file-bidi-${file.name}`,
        label: "Filename is disguised",
        detail:
          "The name contains a character that reverses how the rest of it is displayed, so what you see is not what the file is. This is only ever done deliberately.",
        weight: "high",
        evidence: file.name.replace(BIDI_OVERRIDE, "␣"),
      });
    }

    if (EXECUTABLE_EXTENSIONS.includes(extension)) {
      indicators.push({
        id: `file-executable-${file.name}`,
        label: "Attachment is a program",
        detail: `A ".${extension}" file runs code when it is opened. A genuine invoice, receipt or notice is never sent as one.`,
        weight: "high",
        evidence: file.name,
      });
    }

    if (MACRO_EXTENSIONS.includes(extension)) {
      indicators.push({
        id: `file-macro-${file.name}`,
        label: "Macro-enabled document",
        detail: `".${extension}" can carry macros, which run when the document is opened. Enabling them is the step most document-borne attacks depend on.`,
        weight: "high",
        evidence: file.name,
      });
    }

    /*
     * A second extension after a plausible first one. "statement.pdf.exe" is
     * the whole trick: a mail client shows an icon for the last extension, a
     * hurried reader reads the first.
     */
    const doubled = new RegExp(`\\.(${DOCUMENT_EXTENSIONS.join("|")})\\.[a-z0-9]{2,5}$`, "i");

    if (doubled.test(file.name)) {
      indicators.push({
        id: `file-double-extension-${file.name}`,
        label: "Two file extensions",
        detail:
          "The name ends in one file type after another, which is how a program is made to look like a document.",
        weight: "high",
        evidence: file.name,
      });
    }

    if (ARCHIVE_EXTENSIONS.includes(extension)) {
      indicators.push({
        id: `file-archive-${file.name}`,
        label: "Archive attachment",
        detail:
          "What is inside cannot be seen until it is extracted, which is why archives are used to carry things that would otherwise be caught in transit.",
        weight: "medium",
        evidence: file.name,
      });
    }

    if (file.type && extension) {
      const declared = familyOf(file.type);
      const named = kindOf("", file.name);
      const namedFamily = named === "document" ? "application" : named;

      if (declared !== "application" && declared !== namedFamily && namedFamily !== "application") {
        indicators.push({
          id: `file-mismatch-${file.name}`,
          label: "File type does not match its name",
          detail: `The file declares itself as "${file.type}" but is named as a ${named} file.`,
          weight: "medium",
          evidence: file.name,
        });
      }
    }

    if (!extension) {
      indicators.push({
        id: `file-no-extension-${file.name}`,
        label: "File has no extension",
        detail: "There is nothing in the name to say what the file is or what will open it.",
        weight: "low",
        evidence: file.name,
      });
    }

    indicators.push(...imageOriginIndicators(file));
    indicators.push(...contentsIndicators(file));
  }

  return indicators;
}

/**
 * Indicators drawn from how an image says — or appears — to have been made.
 *
 * Two things this function does not do, both on purpose.
 *
 * It never scores an absence. An image with no Content Credentials is the
 * overwhelmingly normal case, because every mainstream platform strips metadata
 * on upload; treating that as suspicion would raise a flag on nearly every
 * genuine screenshot the service is sent.
 *
 * And it never lets the classifier alone reach the top weight. A signed
 * declaration is close to proof and is weighted as such; a statistical read of
 * the pixels is a guess from a model that was trained before whichever
 * generator made this image existed. Telling a resident their photograph is
 * fake on that basis is a harm the service has no business risking, so the
 * strongest thing the model can do by itself is ask for a second opinion.
 */
function imageOriginIndicators(file: MediaDescriptor): Indicator[] {
  if (file.kind !== "image") {
    return [];
  }

  const indicators: Indicator[] = [];
  const { provenance } = file;

  if (provenance?.status === "declared-ai") {
    indicators.push({
      id: `image-declared-ai-${file.name}`,
      label: "Image declares itself AI-generated",
      detail: provenance.detail,
      weight: "high",
      evidence: provenance.generator ?? file.name,
    });
  }

  /*
   * An unsigned tag naming a generator used to raise its own indicator here.
   * It no longer does, because the origin assessment below already weighs that
   * exact fact — and weighs it alongside everything that contradicts it. Two
   * indicators from one finding is double-counting, and it was pushing images
   * into a band on the strength of a single forgeable string.
   */

  if (provenance?.status === "untrusted") {
    indicators.push({
      id: `image-untrusted-manifest-${file.name}`,
      label: "Content Credentials do not validate",
      detail: provenance.detail,
      weight: "medium",
      evidence: file.name,
    });
  }

  /*
   * The one number, rather than the model's raw score.
   *
   * This used to raise an indicator whenever the classifier alone crossed a
   * threshold, which meant the score could move on a single statistical read
   * of the pixels while the report next to it hedged about that same read.
   * Now the combined assessment decides — the classifier still cannot get
   * there by itself, by construction, but when it is joined by anything else
   * the finding is the assessment's and says so.
   */
  /* Computed here when the pipeline did not attach one, so the rule set gives
     the same answer whether it is handed a described file or a bare one. The
     assessment is pure, so doing it twice costs nothing and guarantees the
     score and the panel are reading the same verdict. */
  const origin = file.origin ?? assessOrigin(file);

  if (origin && origin.answer !== "generated" && (origin.answer === "likely-generated" || origin.answer === "leaning-generated")) {
    indicators.push({
      id: `image-origin-${file.name}`,
      label:
        origin.answer === "likely-generated"
          ? "Image was probably generated rather than photographed"
          : "Image may have been generated rather than photographed",
      detail: `${origin.detail} Weighing everything that could be read, this service puts it at ${Math.round(origin.probability * 100)}% generated.`,
      weight: origin.answer === "likely-generated" ? "medium" : "low",
      evidence: file.name,
    });
  }

  /*
   * Edit findings carry their own weights and are passed through as they are.
   *
   * Deliberately not folded into the origin verdict above. "Where did this come
   * from" and "has it been altered since" are separate questions with separate
   * answers, and the case that matters most to this service — a real photograph
   * of a real document with one number painted over — scores nothing at all on
   * the first and is the whole finding on the second.
   */
  for (const finding of file.edits?.findings ?? []) {
    indicators.push({
      id: `image-edit-${finding.id}-${file.name}`,
      label: finding.label,
      detail: finding.detail,
      weight: finding.weight,
      evidence: finding.evidence ?? file.name,
    });
  }

  return indicators;
}

/**
 * What a non-image file turned out to contain.
 *
 * The container and hidden-content passes produce findings in the same shape
 * as everything else here, so they are passed through with their own weights
 * rather than being re-judged. A macro project, a program inside an archive
 * and a payload appended past the end of a picture are all facts about the
 * file, established by reading its own tables — none of them is an inference
 * that needs softening on the way to the score.
 */
function contentsIndicators(file: MediaDescriptor): Indicator[] {
  const meta = file.metadata;

  if (!meta) {
    return [];
  }

  const findings = [...(meta.container?.findings ?? []), ...(meta.hidden?.findings ?? [])];

  return findings.map((finding) => ({
    id: `file-${finding.id}-${file.name}`,
    label: finding.label,
    detail: finding.detail,
    weight: finding.weight,
    evidence: finding.evidence ?? file.name,
  }));
}
