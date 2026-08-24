import type { MediaKind } from "@/lib/scam/types";

/**
 * Reading a file's own account of itself, before anything else is done with it.
 *
 * The checker used to take an upload at its word: an image went straight to
 * text recognition, and anything else was judged on its name and its declared
 * MIME type — both of which are supplied by whoever sent the file and neither
 * of which is evidence. A `.pdf` that is really an executable declares itself
 * `application/pdf` and is named `invoice.pdf`, and nothing in that pipeline
 * ever disagreed with it.
 *
 * So the first thing that happens to any upload now is that its opening bytes
 * are read and compared with what it claims to be. That ordering is the point:
 * every later step — recognition, the wording rules, the score — is reasoning
 * about a file whose type has already been established rather than assumed.
 *
 * Everything is read in the browser with `FileReader`/`ArrayBuffer`. Nothing is
 * uploaded; the service's promise that what you paste stays on your device
 * covers what you attach as well, and a metadata check that phoned home would
 * break it.
 */

/** One fact read out of a file, for display and for the rules to reason about. */
export interface MetadataField {
  label: string;
  value: string;
  /** Set when this fact is itself a finding rather than context. */
  note?: string;
}

export interface FileMetadata {
  /** What the opening bytes say it is, independent of name and MIME type. */
  actualType: string | null;
  /** The extension in the name, which anyone can write. */
  declaredExtension: string;
  /** The MIME type the browser reported, which comes from the extension. */
  declaredType: string;
  /** True when the bytes and the name disagree about what this file is. */
  disguised: boolean;
  /** Image dimensions where they could be read from the header. */
  dimensions?: { width: number; height: number };
  /** Everything worth showing the reader, in the order it should be read. */
  fields: MetadataField[];
  /** Why a fact could not be established, where that matters. */
  gaps: string[];
}

/**
 * Signatures, longest first so a longer match is preferred.
 *
 * Only the families that actually turn up in a scam report are listed. The
 * point is not to identify every format in existence — it is to be able to say
 * "this is not what it says it is" with certainty, and for that a confident
 * answer on the common types beats a guess on all of them.
 */
const SIGNATURES: { type: string; label: string; bytes: number[]; offset?: number }[] = [
  { type: "image/jpeg", label: "JPEG image", bytes: [0xff, 0xd8, 0xff] },
  { type: "image/png", label: "PNG image", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { type: "image/gif", label: "GIF image", bytes: [0x47, 0x49, 0x46, 0x38] },
  { type: "image/webp", label: "WebP image", bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
  { type: "image/bmp", label: "BMP image", bytes: [0x42, 0x4d] },
  { type: "image/heic", label: "HEIC image", bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
  { type: "application/pdf", label: "PDF document", bytes: [0x25, 0x50, 0x44, 0x46] },
  { type: "application/zip", label: "ZIP archive", bytes: [0x50, 0x4b, 0x03, 0x04] },
  { type: "application/x-rar", label: "RAR archive", bytes: [0x52, 0x61, 0x72, 0x21] },
  { type: "application/x-7z", label: "7-Zip archive", bytes: [0x37, 0x7a, 0xbc, 0xaf] },
  { type: "application/gzip", label: "GZIP archive", bytes: [0x1f, 0x8b] },
  { type: "application/x-msdownload", label: "Windows program", bytes: [0x4d, 0x5a] },
  { type: "application/x-elf", label: "Linux program", bytes: [0x7f, 0x45, 0x4c, 0x46] },
  { type: "application/x-mach-binary", label: "macOS program", bytes: [0xcf, 0xfa, 0xed, 0xfe] },
  { type: "application/rtf", label: "RTF document", bytes: [0x7b, 0x5c, 0x72, 0x74, 0x66] },
  { type: "application/x-ole", label: "Legacy Office document", bytes: [0xd0, 0xcf, 0x11, 0xe0] },
  { type: "audio/mpeg", label: "MP3 audio", bytes: [0x49, 0x44, 0x33] },
  { type: "video/mp4", label: "MP4 video", bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
];

/** Which broad kind a sniffed type belongs to, for comparing with the name. */
function kindOfType(type: string): MediaKind {
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("audio/")) return "audio";
  if (type.startsWith("video/")) return "video";
  return "document";
}

function matches(bytes: Uint8Array, signature: (typeof SIGNATURES)[number]): boolean {
  const offset = signature.offset ?? 0;

  if (bytes.length < offset + signature.bytes.length) {
    return false;
  }

  return signature.bytes.every((byte, index) => bytes[offset + index] === byte);
}

function sniff(bytes: Uint8Array): (typeof SIGNATURES)[number] | null {
  /* ZIP first among equals: a .docx is a ZIP, and the Office check below
     refines it. Longest signature wins so PNG beats nothing and WebP's
     offset match beats a bare RIFF. */
  return (
    [...SIGNATURES]
      .sort((a, b) => b.bytes.length + (b.offset ?? 0) - (a.bytes.length + (a.offset ?? 0)))
      .find((signature) => matches(bytes, signature)) ?? null
  );
}

const decoder = new TextDecoder("latin1");

/** JPEG is a chain of segments; this walks it to find what the camera wrote. */
function readJpegSegments(bytes: Uint8Array): { fields: MetadataField[]; gaps: string[] } {
  const fields: MetadataField[] = [];
  const gaps: string[] = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  let offset = 2;
  let sawExif = false;
  let sawXmp = false;
  let sawC2pa = false;
  const comments: string[] = [];

  while (offset + 4 < bytes.length) {
    if (view.getUint8(offset) !== 0xff) {
      break;
    }

    const marker = view.getUint8(offset + 1);

    /* Start of scan — image data from here, no more metadata. */
    if (marker === 0xda) {
      break;
    }

    const length = view.getUint16(offset + 2);

    if (length < 2) {
      break;
    }

    const body = bytes.subarray(offset + 4, offset + 2 + length);
    const head = decoder.decode(body.subarray(0, 32));

    if (marker === 0xe1 && head.startsWith("Exif")) {
      sawExif = true;
    }
    if (marker === 0xe1 && head.includes("xmpmeta")) {
      sawXmp = true;
    }
    if (marker === 0xe1 && head.includes("http://ns.adobe.com/xap")) {
      sawXmp = true;
    }
    if (marker === 0xeb || head.includes("c2pa") || head.includes("jumb")) {
      sawC2pa = true;
    }
    if (marker === 0xfe) {
      comments.push(decoder.decode(body).trim());
    }

    offset += 2 + length;
  }

  fields.push({
    label: "Camera metadata (EXIF)",
    value: sawExif ? "Present" : "Absent",
    note: sawExif
      ? "The file carries the block a camera or phone writes. Its presence is ordinary; it can also be written by anything, so it is not proof of origin."
      : "No EXIF block. This is what a screenshot looks like, and also what any image re-saved or sent through a messaging app looks like — every major platform strips it. Absence means nothing on its own.",
  });

  if (sawXmp) {
    fields.push({
      label: "Editing metadata (XMP)",
      value: "Present",
      note: "An editing history block is attached. Anyone can write one, so treat what it says as a claim rather than a record.",
    });
  }

  if (sawC2pa) {
    fields.push({
      label: "Content credentials (C2PA)",
      value: "Present",
      note: "The file carries a provenance manifest. This checker records that it is there but does not validate its signature, so it cannot tell you whether the claim inside it is true.",
    });
  }

  for (const comment of comments.filter(Boolean).slice(0, 2)) {
    fields.push({
      label: "Embedded comment",
      value: comment.slice(0, 120),
      note: "Text written into the file itself, which sometimes names the tool that produced it.",
    });
  }

  if (!sawExif) {
    gaps.push(
      "No EXIF meant no capture time, device or location could be read — none of those could be checked for this file.",
    );
  }

  return { fields, gaps };
}

/** PNG is a chain of chunks; the text ones carry the generator's name. */
function readPngChunks(bytes: Uint8Array): { fields: MetadataField[]; dimensions?: { width: number; height: number } } {
  const fields: MetadataField[] = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  let dimensions: { width: number; height: number } | undefined;
  const texts: string[] = [];

  while (offset + 8 < bytes.length) {
    const length = view.getUint32(offset);
    const type = decoder.decode(bytes.subarray(offset + 4, offset + 8));

    if (type === "IHDR" && offset + 16 < bytes.length) {
      dimensions = { width: view.getUint32(offset + 8), height: view.getUint32(offset + 12) };
    }

    if (type === "tEXt" || type === "iTXt") {
      const body = decoder.decode(bytes.subarray(offset + 8, offset + 8 + Math.min(length, 200)));
      /* A PNG text chunk is "keyword\0value"; split rather than regex-replace,
         because a NUL in a character class is what the linter objects to and
         the string form says what is happening more plainly anyway. */
      texts.push(body.split("\u0000").join(": ").trim());
    }

    if (type === "IEND" || length > bytes.length) {
      break;
    }

    offset += 12 + length;
  }

  for (const text of texts.slice(0, 3)) {
    fields.push({
      label: "Embedded text",
      value: text.slice(0, 120),
      note: "PNG text chunks usually name the software that wrote the file. They are trivially editable, so this is a claim, not a record.",
    });
  }

  if (texts.length === 0) {
    fields.push({
      label: "Embedded text",
      value: "None",
      note: "No generator or description chunk, which is normal for a screenshot.",
    });
  }

  return { fields, dimensions };
}

/** What a PDF says about itself, and whether it carries anything that runs. */
function readPdf(bytes: Uint8Array): { fields: MetadataField[]; risky: string[] } {
  const text = decoder.decode(bytes.subarray(0, Math.min(bytes.length, 400_000)));
  const fields: MetadataField[] = [];
  const risky: string[] = [];

  const version = /^%PDF-(\d\.\d)/.exec(text)?.[1];
  if (version) {
    fields.push({ label: "PDF version", value: version });
  }

  const producer = /\/Producer\s*\(([^)]{1,120})\)/.exec(text)?.[1];
  const creator = /\/Creator\s*\(([^)]{1,120})\)/.exec(text)?.[1];

  if (producer || creator) {
    fields.push({
      label: "Produced by",
      value: [creator, producer].filter(Boolean).join(" · "),
      note: "Written into the file by whatever generated it. Editable, so treat it as a claim.",
    });
  }

  const markers: { pattern: RegExp; label: string; why: string }[] = [
    { pattern: /\/JavaScript|\/JS\b/, label: "JavaScript", why: "A PDF carrying script can act when the document is opened." },
    { pattern: /\/OpenAction/, label: "Open action", why: "Something is set to happen automatically on opening, without a click." },
    { pattern: /\/Launch/, label: "Launch action", why: "The document can start another program." },
    { pattern: /\/EmbeddedFile/, label: "Embedded file", why: "Another file is packed inside this one." },
    { pattern: /\/AcroForm/, label: "Fillable form", why: "The document collects typed input, which is how a PDF harvests details." },
    { pattern: /\/URI\s*\(/, label: "Outbound link", why: "The document contains at least one web link." },
  ];

  for (const marker of markers) {
    if (marker.pattern.test(text)) {
      fields.push({ label: `Contains ${marker.label.toLowerCase()}`, value: "Yes", note: marker.why });

      if (marker.label !== "Outbound link" && marker.label !== "Fillable form") {
        risky.push(marker.label);
      }
    }
  }

  return { fields, risky };
}

/** How many bytes of the head are enough for every check above. */
const HEAD_BYTES = 512 * 1024;

/**
 * Reads a file's metadata. Never throws — a failure is a reported gap.
 *
 * Only the head of the file is read. Every signature and every metadata block
 * examined here lives near the start, and pulling a 40MB video wholly into
 * memory on a phone to read twelve bytes of it is how a check becomes the
 * reason someone's browser tab dies.
 */
export async function readMetadata(file: File): Promise<FileMetadata> {
  const declaredExtension = /\.([a-z0-9]+)$/i.exec(file.name)?.[1]?.toLowerCase() ?? "";
  const declaredType = file.type || "not declared";

  const fields: MetadataField[] = [
    { label: "Name", value: file.name },
    { label: "Size", value: formatBytes(file.size) },
    {
      label: "Type the file claims",
      value: declaredType,
      note: "Supplied by the sending device from the file's extension. It is a label, not a fact.",
    },
  ];

  const gaps: string[] = [];

  let head: Uint8Array;

  try {
    head = new Uint8Array(await file.slice(0, HEAD_BYTES).arrayBuffer());
  } catch {
    return {
      actualType: null,
      declaredExtension,
      declaredType,
      disguised: false,
      fields,
      gaps: ["The file could not be read on this device, so none of its contents were examined."],
    };
  }

  const signature = sniff(head);
  let dimensions: { width: number; height: number } | undefined;

  fields.push({
    label: "Type its contents say",
    value: signature ? signature.label : "Not recognised",
    note: signature
      ? "Read from the file's opening bytes, which the sender cannot fake without changing what the file actually is."
      : "The opening bytes match none of the formats this checker knows. That is common for plain text and for uncommon formats, and it is also what a file with a deliberately corrupted header looks like.",
  });

  if (!signature) {
    gaps.push("The format could not be identified from the file's contents, so name and type could not be verified against it.");
  }

  /* The disagreement that matters: the bytes and the name are different kinds
     of thing entirely. A .jpg that is really a .png is a re-save; a .pdf that
     is really a Windows program is an attack. */
  const namedKind = kindFromExtension(declaredExtension);
  const actualKind = signature ? kindOfType(signature.type) : null;
  const disguised = Boolean(
    signature && namedKind && actualKind && namedKind !== actualKind,
  );

  if (disguised) {
    fields.push({
      label: "Name against contents",
      value: "Disagree",
      note: `Named as a ${namedKind} file but its contents are a ${signature!.label.toLowerCase()}. A file does not end up like this by accident.`,
    });
  } else if (signature) {
    fields.push({
      label: "Name against contents",
      value: "Consistent",
      note: "The extension matches what the bytes actually are.",
    });
  }

  if (signature?.type === "image/jpeg") {
    const jpeg = readJpegSegments(head);
    fields.push(...jpeg.fields);
    gaps.push(...jpeg.gaps);
  }

  if (signature?.type === "image/png") {
    const png = readPngChunks(head);
    fields.push(...png.fields);
    dimensions = png.dimensions;

    if (dimensions) {
      fields.push({
        label: "Dimensions",
        value: `${dimensions.width} × ${dimensions.height}`,
        note: "Read from the image header.",
      });
    }
  }

  if (signature?.type === "application/pdf") {
    const pdf = readPdf(head);
    fields.push(...pdf.fields);
  }

  if (signature?.type === "application/zip" && /^(docx|xlsx|pptx|docm|xlsm|pptm)$/.test(declaredExtension)) {
    const text = decoder.decode(head);
    const hasMacro = /vbaProject\.bin|word\/vbaData/.test(text);

    fields.push({
      label: "Macros",
      value: hasMacro ? "Present" : "None found in the first part of the file",
      note: hasMacro
        ? "The document carries a macro project, which is code that runs when macros are enabled."
        : "No macro project seen in the portion read. Not a guarantee for a large document.",
    });
  }

  return { actualType: signature?.type ?? null, declaredExtension, declaredType, disguised, dimensions, fields, gaps };
}

function kindFromExtension(extension: string): MediaKind | null {
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "heic"].includes(extension)) return "image";
  if (["mp3", "wav", "m4a", "aac", "ogg", "amr", "opus"].includes(extension)) return "audio";
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(extension)) return "video";
  if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "rtf", "zip", "rar", "7z"].includes(extension)) {
    return "document";
  }
  return null;
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} bytes`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
