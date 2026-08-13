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
  const start = markdown.search(new RegExp(`^#{2,4}\\s+${sectionHeading}\\s*$`, "m"));

  if (start === -1) {
    return null;
  }

  /* From the end of the heading's own line: slicing one character in leaves
     the rest of that heading at the start of the string, where `^` in a
     multiline search matches it and closes the section before it opens. */
  const rest = markdown.slice(markdown.indexOf("\n", start) + 1);
  const end = rest.search(/^#{1,3}\s+/m);
  const section = end === -1 ? rest : rest.slice(0, end);
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

/** The count of `##` sub-headings under a named section. */
export function subheadings(markdown, sectionHeading) {
  const start = markdown.search(new RegExp(`^#\\s+${sectionHeading}\\s*$`, "m"));

  if (start === -1) {
    return null;
  }

  const rest = markdown.slice(markdown.indexOf("\n", start) + 1);
  const end = rest.search(/^#\s+/m);
  const section = end === -1 ? rest : rest.slice(0, end);

  return [...section.matchAll(/^##\s+(.+)$/gm)].map((match) => cell(match[1]));
}

/** Leading number in a phrase like "16 of 72 (22%)", for a headline figure. */
export function leadingNumber(value) {
  const match = /^([\d,]+(?:\s*of\s*[\d,]+)?)/.exec(value.trim());
  return match ? match[1].replace(/\s*of\s*/, " / ") : null;
}
