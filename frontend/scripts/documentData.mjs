/**
 * Where the figures get their numbers.
 *
 * Every figure in a published document is derived from that document's own
 * Markdown — its tables, its requirement identifiers, its section headings —
 * and never from a hand-kept copy alongside it. A chart that disagrees with the
 * paragraph beneath it is worse than no chart, and on a document that is
 * revised as often as this specification is, a hand-kept copy is not a risk of
 * disagreement but a certainty of it.
 *
 * Every extractor returns `null` when the shape it expects is not there, and a
 * figure with no data is dropped rather than drawn empty.
 */

/** Strips the Markdown a table cell may carry, leaving the words. */
function cell(value) {
  return value
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Every GFM table in the document, each tagged with the heading it sits under.
 *
 * A table is recognised by a run of pipe-delimited lines whose second line is
 * the alignment separator, which is what distinguishes a table from prose that
 * happens to contain a pipe.
 */
export function tables(markdown) {
  const lines = markdown.split("\n");
  const found = [];
  let heading = "";
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const headingMatch = /^#{1,6}\s+(.*)$/.exec(line);

    if (headingMatch) {
      heading = cell(headingMatch[1]);
      index += 1;
      continue;
    }

    const isSeparator = /^\s*\|[\s:|-]+\|\s*$/.test(lines[index + 1] ?? "");

    if (!line.trim().startsWith("|") || !isSeparator) {
      index += 1;
      continue;
    }

    const split = (row) => row.trim().replace(/^\||\|$/g, "").split("|").map(cell);
    const headers = split(line);
    const rows = [];

    index += 2;

    while (index < lines.length && lines[index].trim().startsWith("|")) {
      rows.push(split(lines[index]));
      index += 1;
    }

    found.push({ heading, headers, rows });
  }

  return found;
}

/** The first table whose heading and columns both match what a figure needs. */
export function findTable(markdown, { heading, columns }) {
  return (
    tables(markdown).find((table) => {
      const headingMatches = !heading || table.heading.toLowerCase().includes(heading.toLowerCase());
      const columnsMatch = (columns ?? []).every((column) =>
        table.headers.some((header) => header.toLowerCase().includes(column.toLowerCase())),
      );
      return headingMatches && columnsMatch;
    }) ?? null
  );
}

/** Reads one column out of a table by its header name. */
export function column(table, name) {
  const index = table.headers.findIndex((header) => header.toLowerCase().includes(name.toLowerCase()));
  return index === -1 ? null : table.rows.map((row) => row[index] ?? "");
}

/**
 * Groups a column's values into counts, in first-seen order.
 *
 * `normalise` exists because these tables qualify their statuses in prose —
 * "Delivered (indicator matching pending)" is one status, not a new one — and a
 * chart that treats each qualification as its own category has as many slices
 * as rows.
 */
export function tally(values, normalise = (value) => value) {
  const counts = new Map();

  for (const value of values) {
    const key = normalise(value);
    if (!key) { continue; }
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts].map(([label, value]) => ({ label, value }));
}

/** Every distinct requirement identifier, in numeric order. */
export function requirementIds(markdown) {
  const ids = new Set();

  for (const match of markdown.matchAll(/\bFR(\d{1,3})\b/g)) {
    ids.add(Number(match[1]));
  }

  return [...ids].sort((first, second) => first - second);
}

/**
 * The bullet counts under each `####` sub-heading of a named section.
 *
 * Used for the non-functional requirements, which the requirements document
 * groups by quality attribute and numbers continuously across the groups.
 */
export function bulletsBySubheading(markdown, sectionHeading) {
  const section = sectionUnder(markdown, sectionHeading);

  if (!section) {
    return null;
  }

  const groups = [];

  for (const block of section.split(/^####\s+/m).slice(1)) {
    const [title, ...body] = block.split("\n");
    const count = body.filter((line) => /^\s*[*-]\s+/.test(line)).length;

    if (count > 0) {
      groups.push({ label: cell(title), value: count });
    }
  }

  return groups.length > 0 ? groups : null;
}

/**
 * The section of a document that sits under a named heading.
 *
 * Ends at the next heading of the same level or shallower, so a section keeps
 * its own sub-headings and stops at its sibling. Shared by every extractor that
 * reads part of a document rather than all of it.
 */
function sectionUnder(markdown, heading) {
  const opening = new RegExp(`^(#{1,6})\\s+${heading}\\s*$`, "m");
  const match = opening.exec(markdown);

  if (!match) {
    return null;
  }

  /* From the end of the heading's own line: slicing one character in leaves
     the rest of that heading at the start of the string, where `^` in a
     multiline search matches it and closes the section before it opens. */
  const rest = markdown.slice(markdown.indexOf("\n", match.index) + 1);
  const end = rest.search(new RegExp(`^#{1,${match[1].length}}\\s+`, "m"));

  return end === -1 ? rest : rest.slice(0, end);
}

/**
 * The functional requirements of a document, grouped by the module owning them.
 *
 * The requirements are authored as a bold module line followed by its bullets,
 * which is the structure this reads back — module number, module name, and each
 * requirement's identifier separated from its wording. Returns `null` if that
 * shape is not found, so a restructured document falls back to its own list
 * rather than being drawn as an empty table.
 */
export function requirementModules(markdown, heading = "Functional Requirements") {
  const section = sectionUnder(markdown, heading);

  if (!section) {
    return null;
  }

  const heads = [...section.matchAll(/^\*\*\s*Module\s+(\d+)\s*[:.–—-]\s*(.+?)\s*\*\*\s*$/gm)];
  const groups = [];

  for (const [position, head] of heads.entries()) {
    const from = head.index + head[0].length;
    const to = position + 1 < heads.length ? heads[position + 1].index : section.length;

    const items = [...section.slice(from, to).matchAll(/^\s*[*-]\s+(FR\d+)\s*[:.–—-]\s*(.+?)\s*$/gm)].map(
      (item) => ({ id: item[1], label: cell(item[2]) }),
    );

    if (items.length > 0) {
      groups.push({ index: Number(head[1]), name: cell(head[2]), items });
    }
  }

  return groups.length > 0 ? groups : null;
}

/** The count of `##` sub-headings under a named section. */
export function subheadings(markdown, sectionHeading) {
  const section = sectionUnder(markdown, sectionHeading);

  if (!section) {
    return null;
  }

  return [...section.matchAll(/^##\s+(.+)$/gm)].map((match) => cell(match[1]));
}

/** Leading number in a phrase like "16 of 72 (22%)", for a headline figure. */
export function leadingNumber(value) {
  const match = /^([\d,]+(?:\s*of\s*[\d,]+)?)/.exec(value.trim());
  return match ? match[1].replace(/\s*of\s*/, " / ") : null;
}
