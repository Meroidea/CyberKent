import { mkdir, readFile, rm, writeFile, copyFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import { buildFigure } from "./figures.mjs";
import { figuresFor } from "./documentFigures.mjs";

/**
 * Publishes the project documents into `public/documents/`.
 *
 * The documents are authored as Markdown in `Documents/` at the repository
 * root, which is outside the Vite project and therefore not served. Each one is
 * rendered here into a content fragment — HTML, a contents outline and a
 * reading estimate — which `pages/DocumentPage.tsx` fetches and lays out inside
 * the app, so a document is read under the site's own header and footer rather
 * than on an island of its own.
 *
 * Fetched rather than bundled: the specification alone is a quarter of a
 * megabyte of HTML, and putting it in the app bundle would make every visitor
 * to the home page download every word of it.
 *
 * The register is `src/content/documents.register.json` — the same file the app
 * reads for its cards and its navigation — so a document is described once.
 *
 * Run with `npm run docs:build`.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const FRONTEND = resolve(HERE, "..");
const SOURCE = resolve(FRONTEND, "..", "Documents");
const OUTPUT = join(FRONTEND, "public", "documents");
const DATA = join(OUTPUT, "data");
const REGISTER = join(FRONTEND, "src", "content", "documents.register.json");

/** Average adult reading speed for technical prose, in words per minute. */
const WORDS_PER_MINUTE = 220;

/* ------------------------------------------------------------------ text -- */

/** Strips tags so heading text can be used as a label and as an id. */
function stripTags(html) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Non-alphanumerics collapse to a single dash and the index is appended, so two
 * sections that legitimately share a heading still get distinct, stable ids.
 */
function slugify(text, index) {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "section"}-${index}`;
}

function readingTime(html) {
  const words = stripTags(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/* -------------------------------------------------------------- markdown -- */

/**
 * Removes the document's own title block.
 *
 * Every source file opens with a run of headings naming the system, the client
 * and the document. The reader page renders all of that as front matter, so
 * leaving it in the body prints the title twice and puts entries at the head of
 * the contents rail that scroll to a place the reader is already at.
 *
 * The run ends at the first heading that actually introduces prose — that one
 * is a section, not a title, and it stays. Which is why this is a scan rather
 * than a fixed number of lines: the four documents open with between one and
 * three title headings each.
 */
function stripTitleBlock(markdown) {
  const lines = markdown.split("\n");
  const isHeading = (line) => /^#{1,3}\s+\S/.test(line ?? "");
  const isBlank = (line) => (line ?? "").trim() === "";
  const isRule = (line) => /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line ?? "");

  let cut = 0;
  let index = 0;

  while (index < lines.length && (isHeading(lines[index]) || isBlank(lines[index]))) {
    if (isBlank(lines[index])) {
      index += 1;
      continue;
    }

    /* Look past the blank lines to whatever follows this heading. */
    let next = index + 1;
    while (next < lines.length && isBlank(lines[next])) {
      next += 1;
    }

    /* A heading followed by another heading, or closed off by a rule, is part
       of the title block. A heading followed by prose is a section, and the
       run ends before it. */
    if (!isHeading(lines[next]) && !isRule(lines[next])) {
      break;
    }

    index = next;
    cut = next;
  }

  /* Consume the rule that closed the block; left behind it prints as a stray
     divider above the document's first real line. */
  while (cut < lines.length && (isBlank(lines[cut]) || isRule(lines[cut]))) {
    cut += 1;
  }

  return lines.slice(cut).join("\n").replace(/^\n+/, "");
}

/**
 * Drops sections the reader page does not carry.
 *
 * A published document and its reader page are not the same artefact. The
 * document is a submitted deliverable and keeps every section it was signed off
 * with — a sign-off block, a reference list, a table of contents. The page has a
 * contents rail down its left edge, front matter above the body, and no signature
 * to collect, so those sections are duplication or dead weight on screen.
 *
 * Cutting them here rather than in `Documents/` is the point: the Markdown stays
 * the document of record, and what the page leaves out is declared in the
 * register beside everything else about that document.
 *
 * A named section runs from its heading to the next heading at the same level or
 * shallower, and takes with it the blank lines and horizontal rules that closed
 * it — a rule left behind prints as a divider introducing nothing.
 */
function omitSections(markdown, titles) {
  if (!titles?.length) {
    return markdown;
  }

  const wanted = new Set(titles.map((title) => title.toLowerCase()));
  const lines = markdown.split("\n");
  const kept = [];

  for (let index = 0; index < lines.length; index += 1) {
    const heading = /^(#{1,6})\s+(.*\S)\s*$/.exec(lines[index] ?? "");

    if (!heading || !wanted.has(stripTags(heading[2]).toLowerCase())) {
      kept.push(lines[index]);
      continue;
    }

    const level = heading[1].length;
    let end = index + 1;

    while (end < lines.length) {
      const next = /^(#{1,6})\s+\S/.exec(lines[end] ?? "");

      if (next && next[1].length <= level) {
        break;
      }

      end += 1;
    }

    /* One blank line stands in for the removed span, so the heading that follows
       cannot end up appended to the paragraph that preceded it. */
    kept.push("");
    index = end - 1;
  }

  const missing = titles.filter((title) => !markdown.toLowerCase().includes(title.toLowerCase()));

  if (missing.length > 0) {
    console.warn(`    ! omit list names sections not in the source: ${missing.join(", ")}`);
  }

  return kept.join("\n");
}

/**
 * Gives every heading an id and returns the contents outline alongside the
 * rewritten HTML.
 *
 * Done on the rendered HTML rather than through a `marked` renderer because the
 * two must agree exactly — the rail's links and the headings they scroll to are
 * generated from one pass over one string, so they cannot drift.
 *
 * Every heading gets an id, so a deep link into any subsection works, but the
 * rail carries only the top two levels *each document actually uses*: these
 * files do not agree on where their outline starts — one opens at `#`, another
 * at `###` — so a fixed level would give one document a rail of everything and
 * another a rail of nothing. Depth below that is left out on purpose: the
 * largest document here has over 170 headings, and a rail listing all of them
 * is a second document rather than a way through the first.
 */
function outline(html) {
  const headings = [];
  let index = 0;

  const rewritten = html.replace(/<h([1-4])>([\s\S]*?)<\/h\1>/g, (_match, level, inner) => {
    const text = stripTags(inner);
    const id = slugify(text, index);
    index += 1;

    headings.push({ id, text, level: Number(level) });

    return `<h${level} id="${id}">${inner}</h${level}>`;
  });

  const shallowest = headings.reduce((found, heading) => Math.min(found, heading.level), 6);
  const entries = headings
    .filter((heading) => heading.level <= shallowest + 1)
    /* Normalised so the rail indents by relative depth, not by tag name. */
    .map((heading) => ({ ...heading, level: heading.level - shallowest + 1 }));

  return { html: rewritten, entries };
}

/**
 * Pushes an appended document one level down the outline.
 *
 * An appendix is added under a heading of its own, and the file it is built
 * from opens at the top level too — so without this the appendix's first
 * section is a *sibling* of the appendix rather than part of it. The outline
 * then reads as though the document simply carried on, and any numbering
 * derived from it says the same thing.
 *
 * Fence-aware: a `#` opening a line inside a code block is a comment or a
 * colour, not a heading, and gaining a level would change what it says.
 */
function demoteHeadings(markdown) {
  let fenced = false;

  return markdown
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        fenced = !fenced;
        return line;
      }

      return fenced ? line : line.replace(/^(#{1,5})(\s+\S)/, "$1#$2");
    })
    .join("\n");
}

/* ------------------------------------------------------------- numbering -- */

/** A number a document already gives a heading — the "5.1" in "5.1 Module 1". */
const AUTHORED_NUMBER = /^\s*(\d+(?:\.\d+)*)\.?\s+/;

/** The word an appendix heading opens with, which its label then replaces. */
const APPENDIX_PREFIX = /^\s*appendix\s*[:—–-]*\s*/i;

/** Appendix letters: 1 → A. Past Z the series continues as a number. */
function appendixLetter(position) {
  return position <= 26 ? String.fromCharCode(64 + position) : String(position);
}

/** "1" prints as "1.", "1.2" prints as itself — a top-level number needs the
    stop to read as a section number rather than as a stray digit. */
function printed(path) {
  return path.includes(".") ? path : `${path}.`;
}

/**
 * The numbers a document already carries, kept exactly as authored.
 *
 * A specification that numbers its own sections also refers to them in its
 * prose — "Section 4 is the conformance check", "see 5.3" — and a table of
 * contents inside the document lists them. Renumbering it would make every one
 * of those references wrong, so a document that numbers itself is left to.
 */
function authoredNumbers(headings) {
  const numbers = new Map();

  for (const heading of headings) {
    const match = AUTHORED_NUMBER.exec(heading.text);

    if (match) {
      numbers.set(heading.id, { label: printed(match[1]), strip: AUTHORED_NUMBER });
    }
  }

  return numbers;
}

/**
 * Hierarchical numbers for a document that has none.
 *
 * Assigned from the heading levels the document actually uses rather than from
 * the tag names: these files do not agree on where their outline starts — one
 * opens at `#`, another at `###` — and a heading is a subsection because it
 * sits under another heading, not because it is an `h3`. A run of headings with
 * nothing above them therefore numbers 1, 2, 3 whatever level it is set at,
 * which is also what keeps a document whose first sections are set deeper than
 * its later ones from numbering them 0.0.1.
 *
 * Appendices are lettered, as they are in every specification the project
 * hands over: the appendix itself is "Appendix A" and its sections are A.1,
 * A.2 — so a reader can tell a cross-reference to an appendix from one to a
 * numbered section without following it.
 */
function assignedNumbers(headings) {
  const numbers = new Map();
  const open = [];
  let sections = 0;
  let appendices = 0;

  for (const heading of headings) {
    while (open.length > 0 && open[open.length - 1].level >= heading.level) {
      open.pop();
    }

    if (open.length === 0) {
      /* Once the appendices have begun, everything after them is one: a
         numbered section cannot follow Appendix A and still be section 8. */
      if (appendices > 0 || APPENDIX_PREFIX.test(heading.text)) {
        appendices += 1;
        const letter = appendixLetter(appendices);
        open.push({ level: heading.level, children: 0, path: letter, label: `Appendix ${letter}` });
        numbers.set(heading.id, { label: `Appendix ${letter}`, strip: APPENDIX_PREFIX });
        continue;
      }

      sections += 1;
      open.push({ level: heading.level, children: 0, path: String(sections), label: printed(String(sections)) });
    } else {
      const parent = open[open.length - 1];
      parent.children += 1;
      const path = `${parent.path}.${parent.children}`;
      open.push({ level: heading.level, children: 0, path, label: path });
    }

    numbers.set(heading.id, { label: open[open.length - 1].label });
  }

  return numbers;
}

/**
 * Numbers every heading, and tells the contents outline what each one is.
 *
 * Run after the figures are placed, because a figure is anchored by the text of
 * the heading it belongs under and this rewrites that text.
 *
 * The number is emitted in its own span rather than as part of the heading, so
 * it can be set in the accent and in tabular figures without the title
 * inheriting either, and so the outline can print it as a locator beside the
 * title rather than as the first word of it.
 */
function numberHeadings(html, entries) {
  const pattern = /<h([1-4]) id="([^"]*)">([\s\S]*?)<\/h\1>/g;
  const headings = [...html.matchAll(pattern)].map((match) => ({
    level: Number(match[1]),
    id: match[2],
    text: stripTags(match[3]),
  }));

  const carried = headings.filter((heading) => AUTHORED_NUMBER.test(heading.text)).length;
  const selfNumbered = headings.length > 0 && carried / headings.length >= 0.5;
  const numbers = selfNumbered ? authoredNumbers(headings) : assignedNumbers(headings);

  const rewritten = html.replace(pattern, (_match, level, id, inner) => {
    const number = numbers.get(id);
    const title = number?.strip ? inner.replace(number.strip, "") : inner;
    const label = number ? `<span class="heading-number">${number.label}</span>` : "";

    return `<h${level} id="${id}">${label}${title}</h${level}>`;
  });

  const updated = entries.map((entry) => {
    const number = numbers.get(entry.id);

    return {
      ...entry,
      ...(number ? { number: number.label } : {}),
      text: number?.strip ? entry.text.replace(number.strip, "") : entry.text,
    };
  });

  return { html: rewritten, entries: updated };
}

/**
 * Wraps every table so a wide one scrolls itself rather than the page.
 *
 * The column count travels with the wrapper because the width a table needs is a
 * function of how many columns it has, and CSS cannot count them. These documents
 * run from two-column glossaries to nine-column matrices: one floor for all of
 * them either makes the glossary scroll for no reason or squeezes the matrix into
 * columns four words wide. `data-columns` lets the stylesheet set a floor per
 * shape, so a table scrolls only where scrolling is the better trade.
 */
function wrapTables(html) {
  return html.replace(/<table>[\s\S]*?<\/table>/g, (table) => {
    const header = /<tr>([\s\S]*?)<\/tr>/.exec(table);
    const columns = header ? (header[1].match(/<th[\s>]/g) ?? []).length : 0;

    return `<div class="table-scroll" data-columns="${columns}" tabindex="0" role="region" aria-label="Table">${table}</div>`;
  });
}

/* --------------------------------------------------------------- figures -- */

/**
 * The pipelines these documents already draw, promoted to diagrams.
 *
 * The architecture document expresses every pipeline as a fenced block of stage
 * names chained with a down-arrow. That is a diagram someone drew in text
 * because they had no better tool to hand — so it is read back as the diagram
 * it always was, rather than being re-authored beside the original and left to
 * disagree with it.
 */
function pipelineFigures(html) {
  const found = [];
  const pattern = /<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g;

  for (const match of html.matchAll(pattern)) {
    const steps = stripTags(match[1])
      .split(/[↓→]/)
      .map((step) => step.trim())
      .filter(Boolean);

    if (steps.length < 3) {
      continue; // Not a pipeline; leave it as the code block it is.
    }

    found.push({
      start: match.index,
      end: match.index + match[0].length,
      spec: {
        kind: "flow",
        caption: "The sequence set out in this section, drawn in the order it is given.",
        steps: steps.map((label) => ({ label })),
      },
    });
  }

  return found;
}

/**
 * Where an authored figure lands, as a range in the document.
 *
 * By default: after the first paragraph under its heading, so the section
 * introduces itself in words before it is drawn. With `place: "end"`: at the
 * close of the section, which is where a figure belongs when it summarises
 * something the section spends its length setting out — put at the top, it
 * would answer a question the reader has not been asked yet. With
 * `place: "replace"`: the same span, taken over rather than added to, for a
 * figure that *is* the section's content in another arrangement.
 *
 * The section ends at the next heading, or at the rule that closes it where
 * there is one — so a figure placed at the end of a section stays inside it
 * rather than landing under the divider that separates it from the next.
 */
function anchorRange(html, anchor, place = "prose") {
  const pattern = new RegExp(`<h[1-4] id="[^"]*">\\s*${escapeRegExp(anchor)}`, "i");
  const heading = pattern.exec(html);

  if (!heading) {
    return null;
  }

  const after = heading.index + heading[0].length;
  const nextHeading = html.slice(after).search(/<h[1-4] id=/);
  const sectionEnd = nextHeading === -1 ? html.length : after + nextHeading;
  const closingRule = /<hr\s*\/?>\s*$/.exec(html.slice(after, sectionEnd));
  const limit = closingRule ? after + closingRule.index : sectionEnd;

  if (place === "end") {
    return { start: limit, end: limit };
  }

  const paragraph = html.indexOf("</p>", after);
  const afterIntro = paragraph !== -1 && paragraph < limit ? paragraph + 4 : limit;

  return place === "replace" ? { start: afterIntro, end: limit } : { start: afterIntro, end: afterIntro };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Places every figure in one pass.
 *
 * Positions are resolved against the original string first and applied from the
 * end backwards, so an earlier insertion cannot shift a later one's index. The
 * numbering follows the same sorted order, which is what makes "Figure 4" the
 * fourth figure a reader meets rather than the fourth one this file happened to
 * build.
 */
function placeFigures(html, authored) {
  const edits = [...pipelineFigures(html)];

  for (const entry of authored) {
    const range = anchorRange(html, entry.anchor, entry.place);

    if (range === null) {
      console.warn(`    ! no anchor for figure "${entry.anchor}" — figure dropped`);
      continue;
    }

    edits.push({ ...range, spec: entry.spec });
  }

  edits.sort((first, second) => first.start - second.start);

  let output = html;

  for (let index = edits.length - 1; index >= 0; index -= 1) {
    const edit = edits[index];
    const markup = buildFigure(edit.spec, index + 1);
    output = output.slice(0, edit.start) + markup + output.slice(edit.end);
  }

  return { html: output, count: edits.length };
}

/* ----------------------------------------------------------------- build -- */

async function render(document) {
  const raw = await readFile(join(SOURCE, document.build.source), "utf8");
  let markdown = omitSections(stripTitleBlock(raw), document.build.omit);

  for (const appendix of document.build.appendices ?? []) {
    const extra = await readFile(join(SOURCE, appendix.source), "utf8");
    markdown += `\n\n---\n\n# ${appendix.heading}\n\n${demoteHeadings(stripTitleBlock(extra))}`;
  }

  const parsed = await marked.parse(markdown, { gfm: true, breaks: false });
  const withIds = outline(parsed);
  const placed = placeFigures(withIds.html, figuresFor(document.id, markdown));
  const numbered = numberHeadings(placed.html, withIds.entries);
  const html = wrapTables(numbered.html);

  const target = join(DATA, `${document.id}.json`);

  await writeFile(
    target,
    JSON.stringify({
      id: document.id,
      title: document.title,
      subtitle: document.build.subtitle,
      minutes: readingTime(html),
      /* The abstract heads the contents for the same reason it heads the page:
         it is the first thing to read, so it is the first thing to return to. */
      entries: [{ id: "abstract", text: "Abstract", level: 1 }, ...numbered.entries],
      html,
    }),
    "utf8",
  );

  const { size } = await stat(target);
  return {
    slug: document.id,
    bytes: size,
    note: `${numbered.entries.length} in contents · ${placed.count} figures`,
  };
}

async function main() {
  const register = JSON.parse(await readFile(REGISTER, "utf8")).documents;

  await rm(OUTPUT, { recursive: true, force: true });
  await mkdir(DATA, { recursive: true });

  const built = [];

  for (const document of register) {
    if (document.build.copy) {
      /* Already in its final format; copied rather than rendered. */
      const target = join(OUTPUT, document.href.replace("/documents/", ""));
      await copyFile(join(SOURCE, document.build.copy), target);
      const { size } = await stat(target);
      built.push({ slug: document.id, bytes: size, note: "copied" });
      continue;
    }

    built.push(await render(document));
  }

  for (const { slug, bytes, note } of built) {
    console.log(`  ${slug.padEnd(38)} ${(bytes / 1024).toFixed(0).padStart(5)} KB  ${note}`);
  }

  /* Guard: every document in the register must have been produced. A card or a
     menu entry that links nowhere is worse than one that is absent, because
     these pages exist to make the documents reachable. */
  const missing = [];

  for (const document of register) {
    const expected = document.build.copy
      ? join(OUTPUT, document.href.replace("/documents/", ""))
      : join(DATA, `${document.id}.json`);

    try {
      await stat(expected);
    } catch {
      missing.push(document.id);
    }
  }

  if (missing.length > 0) {
    console.error(`\nMissing output for documents in the register:\n  ${missing.join("\n  ")}`);
    process.exit(1);
  }

  console.log(`\n${built.length} documents published to public/documents/`);
}

await main();
