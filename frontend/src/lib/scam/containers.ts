import { ascii, asciiRaw, bytesOf, indexOfBytes, u16le, u32le } from "@/lib/scam/bytes";

/**
 * Reading the files that are not images.
 *
 * The checker could describe a JPEG in detail and had nothing to say about a
 * PDF or a Word document beyond its name and size — which is backwards, since
 * an invoice attached to a scam is far more often one of those. The questions
 * a reader asks are the same ones either way: who wrote this, on what, has it
 * been changed since, and is there anything in it that does not belong.
 *
 * Everything here is a structural parse of the container's own tables. Nothing
 * is rendered, no script is evaluated, and no embedded object is opened —
 * opening the attachment is the exact risk the check exists to avoid. The
 * structure is enough on its own: a PDF records how many times it has been
 * saved, and a `.docx` is a zip whose table of contents names its macro
 * project without anything having to run.
 */

export interface ContainerPerson {
  /** Who the document names as its author. */
  author?: string;
  /** Who it names as having saved it last, where the format records that. */
  lastEditedBy?: string;
  /** The application that produced it. */
  creatorTool?: string;
  /** The library or driver that actually wrote the bytes. */
  producer?: string;
  /** An organisation, where the format has a field for one. */
  company?: string;
}

export interface ContainerFinding {
  id: string;
  label: string;
  detail: string;
  weight: "high" | "medium" | "low";
  evidence?: string;
}

export interface ContainerRead {
  /** Human-readable container name, e.g. "PDF 1.7" or "Word document". */
  format?: string;
  /** Documents: pages. Archives: entries. The unit is in `countLabel`. */
  count?: number;
  countLabel?: string;
  /** Named creators, as the file records them. Unsigned in every format here. */
  people: ContainerPerson;
  created?: string;
  modified?: string;
  /** How many times the file has been written, where the format records it. */
  revisions?: number;
  /** Anything the container holds that a reader would not expect. */
  findings: ContainerFinding[];
  /** Entries or objects worth naming, capped. */
  entries?: string[];
  /** Links the document itself carries, which the link pass then inspects. */
  urls?: string[];
  /** Set where the container could not be parsed at all. */
  unavailable?: string;
}

const MAX_ENTRIES = 40;
const MAX_URLS = 25;

/* ──────────────────────────────────  PDF  ───────────────────────────────── */

/** Dictionary keys that mean the document can act without being asked. */
const PDF_ACTIONS: {
  key: string;
  id: string;
  label: string;
  detail: string;
  weight: ContainerFinding["weight"];
}[] = [
  {
    key: "/JavaScript",
    id: "pdf-javascript",
    label: "The document carries JavaScript",
    detail:
      "A PDF can hold script that runs when it is opened. Legitimate forms occasionally use it to validate a field, but it is also how a document is made to do something the reader never asked for.",
    weight: "high",
  },
  {
    key: "/OpenAction",
    id: "pdf-openaction",
    label: "Something is set to happen on opening",
    detail:
      "The document declares an action to perform the moment it is opened, before the reader has done anything at all.",
    weight: "high",
  },
  {
    key: "/Launch",
    id: "pdf-launch",
    label: "The document can start another program",
    detail:
      "A launch action tells the reader application to run an external file. A statement or an invoice has no reason to contain one.",
    weight: "high",
  },
  {
    key: "/EmbeddedFile",
    id: "pdf-embedded-file",
    label: "Another file is stored inside this one",
    detail:
      "The PDF carries an attachment of its own. What is inside cannot be seen without extracting it — the same reason archives are used to move things past filters.",
    weight: "medium",
  },
  {
    key: "/XFA",
    id: "pdf-xfa",
    label: "Uses an XFA form",
    detail:
      "XFA is a form technology most readers no longer support well and which carries scripting of its own. It is uncommon in documents sent to the public.",
    weight: "low",
  },
];

/** Reads a PDF's structure without rendering a page of it. */
function readPdf(bytes: Uint8Array): ContainerRead {
  const findings: ContainerFinding[] = [];
  const version = /%PDF-(\d\.\d)/.exec(ascii(bytes, 0, 9))?.[1];

  /*
   * Latin-1 rather than UTF-8, so every byte maps to exactly one character and
   * a regex offset is a byte offset. Decoding as UTF-8 would merge bytes and
   * shift everything after the first non-ASCII sequence.
   */
  const text = asciiRaw(bytes, 0, bytes.length);

  const out: ContainerRead = {
    format: version ? `PDF ${version}` : "PDF",
    people: {},
    findings,
  };

  /*
   * A PDF records an edit by appending a new cross-reference section and
   * another end marker rather than rewriting itself, so this count is the
   * number of times the document has been written. More than one means it
   * changed after it was first produced — ordinary for a form somebody filled
   * in, and also exactly what a doctored statement looks like. Reported either
   * way, with the ambiguity spelled out rather than resolved.
   */
  const revisions = (text.match(/%%EOF/g) ?? []).length;

  if (revisions > 0) {
    out.revisions = revisions;
  }

  if (revisions > 1) {
    findings.push({
      id: "pdf-incremental-update",
      label: "Saved more than once after it was created",
      detail:
        "This PDF carries more than one revision, and because PDFs record edits by appending, the earlier version is still inside the file. Filling in a form does this; so does altering a figure after the fact. It means the document you are reading is not the one first produced.",
      weight: "medium",
      evidence: `${revisions} revisions`,
    });
  }

  const pages = (text.match(/\/Type\s*\/Page[^s]/g) ?? []).length;

  if (pages > 0) {
    out.count = pages;
    out.countLabel = pages === 1 ? "page" : "pages";
  }

  if (/\/Encrypt\b/.test(text)) {
    findings.push({
      id: "pdf-encrypted",
      label: "The document is encrypted",
      detail:
        "Parts of this PDF are encrypted, so its contents could not be described. That is ordinary for a document a sender chose to protect, and it also means nothing inside it has been checked here.",
      weight: "low",
    });
  }

  for (const action of PDF_ACTIONS) {
    if (text.includes(action.key)) {
      findings.push({
        id: action.id,
        label: action.label,
        detail: action.detail,
        weight: action.weight,
        evidence: action.key,
      });
    }
  }

  /* The document information dictionary. Uncompressed in the great majority of
     real PDFs, which is what makes a byte-level read worth doing. */
  out.people = {
    author: pdfString(text, "Author"),
    creatorTool: pdfString(text, "Creator"),
    producer: pdfString(text, "Producer"),
  };

  out.created = pdfDate(pdfString(text, "CreationDate"));
  out.modified = pdfDate(pdfString(text, "ModDate"));

  const urls = new Set<string>();

  for (const match of text.matchAll(/\/URI\s*\(([^)]{4,400})\)/g)) {
    const value = match[1]!.replace(/\\([()\\])/g, "$1").trim();

    if (/^(https?|ftp|mailto|file|javascript):/i.test(value)) {
      urls.add(value);
    }

    if (urls.size >= MAX_URLS) {
      break;
    }
  }

  if (urls.size > 0) {
    out.urls = [...urls];
  }

  return out;
}

/** One value from the document information dictionary, in either encoding. */
function pdfString(text: string, key: string): string | undefined {
  const literal = new RegExp(`/${key}\\s*\\(((?:\\\\.|[^\\\\)])*)\\)`).exec(text);

  if (literal) {
    return decodePdfLiteral(literal[1]!);
  }

  const hex = new RegExp(`/${key}\\s*<([0-9A-Fa-f\\s]+)>`).exec(text);

  if (hex) {
    return decodePdfHex(hex[1]!.replace(/\s+/g, ""));
  }

  return undefined;
}

const PDF_ESCAPES: Record<string, string> = {
  n: "\n",
  r: "\r",
  t: "\t",
  b: "\b",
  f: "\f",
};

function decodePdfLiteral(raw: string): string | undefined {
  const unescaped = raw.replace(
    /\\([nrtbf()\\])/g,
    (_, character: string) => PDF_ESCAPES[character] ?? character,
  );

  return fromUtf16OrLatin1([...unescaped].map((character) => character.charCodeAt(0)));
}

function decodePdfHex(hex: string): string | undefined {
  const pairs = hex.match(/../g) ?? [];
  return fromUtf16OrLatin1(pairs.map((pair) => Number.parseInt(pair, 16)));
}

/** A PDF text string is UTF-16BE when it opens with a byte-order mark. */
function fromUtf16OrLatin1(codes: number[]): string | undefined {
  if (codes[0] === 0xfe && codes[1] === 0xff) {
    let out = "";
    for (let i = 2; i + 1 < codes.length; i += 2) {
      out += String.fromCharCode((codes[i]! << 8) | codes[i + 1]!);
    }
    return clean(out);
  }

  return clean(codes.map((code) => String.fromCharCode(code)).join(""));
}

/**
 * Trims a recovered string, dropping the control bytes padding leaves behind.
 *
 * Stripping the control class is the point: these strings come out of a binary
 * container, where a field is NUL-padded or newline-terminated and the
 * remainder is not text at all. Matched by Unicode category rather than by a
 * literal range, so nothing in this source file is itself a control character.
 */
function clean(value: string): string | undefined {
  const trimmed = value.replace(/\p{Cc}+/gu, " ").trim();
  return trimmed.length > 0 && trimmed.length < 200 ? trimmed : undefined;
}

/** PDF dates are `D:YYYYMMDDHHmmSS` followed by an optional zone offset. */
function pdfDate(raw: string | undefined): string | undefined {
  const match = /D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?/.exec(raw ?? "");

  if (!match) {
    return undefined;
  }

  const [, year, month = "01", day = "01", hour = "00", minute = "00", second = "00"] = match;
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/* ─────────────────────────────  ZIP and Office  ─────────────────────────── */

interface ZipEntry {
  name: string;
  compressedSize: number;
  size: number;
  method: number;
  encrypted: boolean;
  offset: number;
  modified?: string;
}

/**
 * The end-of-central-directory record, found by scanning back from the tail.
 *
 * Backwards rather than forwards because a zip's index lives at the end, which
 * is also what lets a zip be appended to another file — the polyglot case the
 * hidden-content pass looks for.
 */
function findEocd(bytes: Uint8Array): number {
  /* The trailing comment is at most 65,535 bytes, so the record cannot sit
     further back than that plus its own 22. */
  const earliest = Math.max(0, bytes.length - 65_557);

  for (let at = bytes.length - 22; at >= earliest; at -= 1) {
    if (
      bytes[at] === 0x50 &&
      bytes[at + 1] === 0x4b &&
      bytes[at + 2] === 0x05 &&
      bytes[at + 3] === 0x06
    ) {
      return at;
    }
  }

  return -1;
}

/** Reads the central directory, naming every entry without inflating one. */
function readZipEntries(bytes: Uint8Array): ZipEntry[] | null {
  const eocd = findEocd(bytes);

  if (eocd < 0) {
    return null;
  }

  const total = u16le(bytes, eocd + 10);
  let at = u32le(bytes, eocd + 16);
  const entries: ZipEntry[] = [];

  for (let i = 0; i < total && at + 46 <= bytes.length; i += 1) {
    if (u32le(bytes, at) !== 0x02014b50) {
      break;
    }

    const flags = u16le(bytes, at + 8);
    const nameLength = u16le(bytes, at + 28);
    const extraLength = u16le(bytes, at + 30);
    const commentLength = u16le(bytes, at + 32);

    entries.push({
      name: asciiRaw(bytes, at + 46, nameLength),
      method: u16le(bytes, at + 10),
      compressedSize: u32le(bytes, at + 20),
      size: u32le(bytes, at + 24),
      encrypted: (flags & 0x01) === 1,
      offset: u32le(bytes, at + 42),
      modified: dosDate(u16le(bytes, at + 12), u16le(bytes, at + 14)),
    });

    at += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

function dosDate(time: number, date: number): string | undefined {
  const year = ((date >> 9) & 0x7f) + 1980;
  const month = (date >> 5) & 0x0f;
  const day = date & 0x1f;

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return undefined;
  }

  const value = new Date(
    Date.UTC(year, month - 1, day, (time >> 11) & 0x1f, (time >> 5) & 0x3f, (time & 0x1f) * 2),
  );

  return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
}

/**
 * Inflates one entry, so the Office property files can actually be read.
 *
 * `DecompressionStream` is the browser's own inflate and needs no dependency.
 * Where it is missing — older Safari — the properties go unreported and the
 * rest of the read stands. That is the right degradation: a missing author
 * line is a gap a reader can see, and a guessed one is not.
 */
async function inflate(bytes: Uint8Array, entry: ZipEntry): Promise<string | null> {
  if (entry.encrypted || entry.size > 2_000_000) {
    return null;
  }

  const local = entry.offset;

  if (local + 30 > bytes.length || u32le(bytes, local) !== 0x04034b50) {
    return null;
  }

  const start = local + 30 + u16le(bytes, local + 26) + u16le(bytes, local + 28);
  const body = bytes.subarray(start, start + entry.compressedSize);

  if (entry.method === 0) {
    return asciiRaw(body, 0, body.length);
  }

  if (entry.method !== 8 || typeof DecompressionStream === "undefined") {
    return null;
  }

  try {
    /* Copied into its own buffer: `body` is a view onto the whole file, and
       `Blob` will not take a view whose buffer might be shared. */
    const stream = new Blob([new Uint8Array(body)])
      .stream()
      .pipeThrough(new DecompressionStream("deflate-raw"));
    return await new Response(stream).text();
  } catch {
    return null;
  }
}

/** One XML element's text content, by tag name. */
function xmlText(xml: string, tag: string): string | undefined {
  const match = new RegExp(`<${tag}[^>]*>([^<]{1,200})</${tag}>`).exec(xml);
  return match ? clean(match[1]!) : undefined;
}

/** Which format a set of entry names describes, where it describes one. */
function officeFormat(names: Set<string>): string | undefined {
  if (names.has("word/document.xml")) return "Word document (Office Open XML)";
  if (names.has("xl/workbook.xml")) return "Excel workbook (Office Open XML)";
  if (names.has("ppt/presentation.xml")) return "PowerPoint presentation (Office Open XML)";
  if (names.has("content.xml") && names.has("meta.xml")) return "OpenDocument";
  if (names.has("META-INF/MANIFEST.MF")) return "Java archive";
  return undefined;
}

async function readZip(bytes: Uint8Array): Promise<ContainerRead> {
  const entries = readZipEntries(bytes);

  if (!entries) {
    return {
      format: "ZIP container",
      people: {},
      findings: [],
      unavailable: "This archive's table of contents could not be read.",
    };
  }

  const findings: ContainerFinding[] = [];
  const names = new Set(entries.map((entry) => entry.name));

  const out: ContainerRead = {
    format: officeFormat(names) ?? "ZIP archive",
    count: entries.length,
    countLabel: entries.length === 1 ? "entry" : "entries",
    people: {},
    findings,
    entries: entries.slice(0, MAX_ENTRIES).map((entry) => entry.name),
  };

  const macro = entries.find((entry) => /vbaproject\.bin$/i.test(entry.name));

  if (macro) {
    findings.push({
      id: "office-macro",
      label: "The document contains a macro project",
      detail:
        "This file carries VBA macros — code that runs if the reader enables content. Enabling macros is the step most document-borne attacks depend on, and an ordinary letter, invoice or statement has no need of them.",
      weight: "high",
      evidence: macro.name,
    });
  }

  const executables = entries.filter((entry) =>
    /\.(exe|scr|com|pif|bat|cmd|msi|vbs|jse|wsf|ps1|lnk|hta|jar|dll)$/i.test(entry.name),
  );

  if (executables.length > 0) {
    findings.push({
      id: "zip-executable-entry",
      label: "The archive contains a program",
      detail:
        "One or more entries inside this archive run code when they are opened. An archive is used to carry them because the program on its own would be stopped in transit.",
      weight: "high",
      evidence: executables
        .slice(0, 4)
        .map((entry) => entry.name)
        .join(", "),
    });
  }

  const traversal = entries.filter(
    (entry) => entry.name.startsWith("/") || entry.name.includes(".."),
  );

  if (traversal.length > 0) {
    findings.push({
      id: "zip-traversal",
      label: "An entry would write outside the folder",
      detail:
        "One entry's path escapes the folder it should extract into, which is how an archive overwrites a file elsewhere on the machine. There is no legitimate reason for one.",
      weight: "high",
      evidence: traversal[0]!.name,
    });
  }

  if (entries.some((entry) => entry.encrypted)) {
    findings.push({
      id: "zip-encrypted",
      label: "The archive is password-protected",
      detail:
        "Its contents cannot be read without the password, so nothing inside has been checked. A password sent in the same message as the file protects it from scanners rather than from anybody else.",
      weight: "medium",
    });
  }

  /* Core and extended properties, which is where Office records who wrote it. */
  const core = entries.find((entry) => entry.name === "docProps/core.xml");
  const app = entries.find((entry) => entry.name === "docProps/app.xml");
  const meta = entries.find((entry) => entry.name === "meta.xml");

  if (core) {
    const xml = await inflate(bytes, core);

    if (xml) {
      out.people.author = xmlText(xml, "dc:creator");
      out.people.lastEditedBy = xmlText(xml, "cp:lastModifiedBy");
      out.created = isoOrUndefined(xmlText(xml, "dcterms:created"));
      out.modified = isoOrUndefined(xmlText(xml, "dcterms:modified"));

      const revision = Number.parseInt(xmlText(xml, "cp:revision") ?? "", 10);

      if (Number.isFinite(revision) && revision > 0) {
        out.revisions = revision;
      }
    }
  }

  if (app) {
    const xml = await inflate(bytes, app);

    if (xml) {
      out.people.creatorTool = xmlText(xml, "Application");
      out.people.company = xmlText(xml, "Company");

      const pages = Number.parseInt(xmlText(xml, "Pages") ?? "", 10);

      if (Number.isFinite(pages) && pages > 0) {
        out.count = pages;
        out.countLabel = pages === 1 ? "page" : "pages";
      }
    }
  }

  if (!core && meta) {
    const xml = await inflate(bytes, meta);

    if (xml) {
      out.people.author = xmlText(xml, "dc:creator") ?? xmlText(xml, "meta:initial-creator");
      out.people.creatorTool = xmlText(xml, "meta:generator");
      out.created = isoOrUndefined(xmlText(xml, "meta:creation-date"));
      out.modified = isoOrUndefined(xmlText(xml, "dc:date"));
    }
  }

  return out;
}

function isoOrUndefined(raw: string | undefined): string | undefined {
  if (!raw) {
    return undefined;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/* ─────────────────────────────────  entry  ──────────────────────────────── */

/**
 * Reads whatever container the bytes turn out to be. Never throws.
 *
 * Returns `null` for formats handled elsewhere — images have their own reader
 * — so the caller can tell "nothing to add here" from "read, and empty".
 */
export async function readContainer(
  bytes: Uint8Array,
  sniffedType?: string,
): Promise<ContainerRead | null> {
  try {
    if (sniffedType === "application/pdf") {
      return readPdf(bytes);
    }

    if (sniffedType === "application/zip" || indexOfBytes(bytes, bytesOf("PK"), 0) === 0) {
      return await readZip(bytes);
    }

    return null;
  } catch {
    return {
      people: {},
      findings: [],
      unavailable: "This file's structure could not be read on this device.",
    };
  }
}
