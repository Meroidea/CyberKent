import type { DetectedType } from "@/lib/scam/metadata";
import type { Indicator, MediaDescriptor, MediaKind } from "@/lib/scam/types";

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

/**
 * Which of the four broad kinds a file falls into.
 *
 * `detected` — what the file's bytes say — wins over both the declared type and
 * the name whenever it is available. That is what makes the answer consistent:
 * the same screenshot is an image whether it is called `sms.png`, `sms.pdf` or
 * nothing at all, and whether or not the browser supplied a type for it.
 */
export function kindOf(type: string, name: string, detected?: DetectedType | null): MediaKind {
  if (detected) {
    if (detected.family === "image" || detected.family === "audio" || detected.family === "video") {
      return detected.family;
    }

    return "document";
  }

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

/** Extensions that claim a harmless kind of file. */
const HARMLESS_CLAIMS = ["jpg", "jpeg", "png", "gif", "webp", "heic", "bmp", "pdf", "txt", "mp3", "wav", "m4a", "mp4", "mov", "doc", "docx", "xls", "xlsx"];

/**
 * Rules that compare what a file *is* with what it is *called*.
 *
 * These are the rules the name-based checks could never be: a program renamed
 * `receipt.jpg` has a harmless name and a harmless declared type, and only its
 * first two bytes ("MZ") give it away.
 */
function contentRules(file: MediaDescriptor, extension: string): Indicator[] {
  const detected = file.metadata?.detected ?? null;
  const found: Indicator[] = [];
  const add = (id: string, label: string, detail: string, weight: Indicator["weight"], decisive = false) =>
    found.push({ id: `file-${id}-${file.name}`, label, detail, weight, decisive, evidence: `${file.name} → ${detected?.label ?? "unrecognised content"}` });

  if (!detected) {
    if (["jpg", "jpeg", "png", "gif", "webp", "heic", "bmp"].includes(extension)) {
      add(
        "not-an-image",
        "Named as an image, but is not one",
        "The file's contents do not begin the way any image format does. Something has been given a picture's name.",
        "medium",
      );
    }

    return found;
  }

  const claimedByName = extension.length > 0 && !detected.extensions.includes(extension);

  if (detected.family === "executable" && !EXECUTABLE_EXTENSIONS.includes(extension)) {
    add(
      "disguised-program",
      "A program disguised as another kind of file",
      `The name says ".${extension || "(none)"}", but the contents are a ${detected.label}. Opening it would run it.`,
      "high",
      true,
    );
  }

  if (detected.mime === "text/html") {
    add(
      "html",
      "Attachment is a web page",
      "An HTML attachment opens a page on your own device, outside any warning your email provider shows. It is a common way of delivering a fake sign-in form.",
      "high",
    );
  }

  if (detected.mime === "image/svg+xml") {
    add(
      "svg",
      "Image format that can carry code",
      "SVG images can contain scripts and links. A genuine screenshot or photo is not sent in this format.",
      "medium",
    );
  }

  if (detected.family === "archive" && claimedByName && HARMLESS_CLAIMS.includes(extension)) {
    add(
      "disguised-archive",
      "An archive disguised as a document or image",
      `The name says ".${extension}", but the contents are a ${detected.label}, which can hold anything.`,
      "high",
    );
  }

  /*
   * Everything else that disagrees across families — a PDF named `.jpg`, audio
   * named `.pdf`. A PNG saved as `.jpg` is a re-save, not a disguise, so a
   * disagreement inside the same family is deliberately not reported.
   */
  const namedKind = kindOf("", file.name);
  const detectedKind = kindOf("", "", detected);

  if (
    claimedByName &&
    found.length === 0 &&
    detected.family !== "archive" &&
    namedKind !== detectedKind
  ) {
    add(
      "content-mismatch",
      "Contents do not match the file name",
      `Named as a ${namedKind} file, but the contents are a ${detected.label}.`,
      "medium",
    );
  }

  return found;
}

/** FR21 by analogy — the same evidence-first treatment, applied to files. */
export function analyseMedia(media: MediaDescriptor[]): Indicator[] {
  const indicators: Indicator[] = [];

  for (const file of media) {
    const extension = extensionOf(file.name);

    if (BIDI_OVERRIDE.test(file.name)) {
      indicators.push({
        id: `file-bidi-${file.name}`,
        label: "Filename is disguised",
        detail:
          "The name contains a character that reverses how the rest of it is displayed, so what you see is not what the file is. This is only ever done deliberately.",
        weight: "high",
        evidence: file.name.replace(BIDI_OVERRIDE, "␣"),
        decisive: true,
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

    if (file.metadata) {
      indicators.push(...contentRules(file, extension));
    } else if (file.type && extension) {
      /* Without the bytes, the declared type is the only second opinion. */
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
  }

  return indicators;
}
