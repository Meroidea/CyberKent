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
    const metadata = file.metadata;

    /*
     * The strongest finding available about any upload, and the reason the
     * metadata read was moved to the front of the pipeline: the file's own
     * bytes contradict its name. Every other rule in this function reasons
     * about the name, which the sender chose; this one reasons about the
     * contents, which they had to actually produce.
     */
    if (metadata?.disguised && metadata.actualType) {
      const program = /^application\/x-(msdownload|elf|mach-binary)$/.test(metadata.actualType);

      indicators.push({
        id: `file-disguised-${file.name}`,
        label: program ? "Attachment is a program wearing a document's name" : "File is not what its name says",
        detail: program
          ? `"${file.name}" is named as a document but its opening bytes are an executable program. Opening it runs code. There is no innocent way for a file to end up in this state.`
          : `"${file.name}" is named as one kind of file and its contents are a ${metadata.actualType}. A mismatch this broad is deliberate.`,
        weight: "critical",
        evidence: `${file.name} → ${metadata.actualType}`,
      });
    }

    /* An archive or PDF that carries something which runs on opening. */
    const activeContent = metadata?.fields.filter(
      (field) =>
        /^Contains (javascript|open action|launch action|embedded file)$/i.test(field.label) &&
        field.value === "Yes",
    );

    if (activeContent && activeContent.length > 0) {
      indicators.push({
        id: `file-active-content-${file.name}`,
        label: "Document carries active content",
        detail: `${activeContent
          .map((field) => field.label.replace(/^Contains /i, ""))
          .join(", ")} found inside "${file.name}". A document that acts on its own when opened is doing something a document has no reason to do.`,
        weight: "high",
        evidence: file.name,
      });
    }

    if (metadata?.fields.some((field) => field.label === "Macros" && field.value === "Present")) {
      indicators.push({
        id: `file-macro-project-${file.name}`,
        label: "Document contains a macro project",
        detail:
          "Read from inside the file rather than guessed from its extension: there is code packaged in this document, which runs if macros are enabled.",
        weight: "critical",
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
  }

  return indicators;
}
