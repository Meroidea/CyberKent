import type { ArticleBlock, ArticleSection } from "@/content/learn";

/**
 * The guide markup the content editor writes, and its translation to and from
 * the structured blocks every guide renders from.
 *
 *   ## Heading                  starts a section
 *   A paragraph of text.        blank lines separate blocks
 *   - item / - item             a list
 *   1. item / 2. item           a numbered list
 *   + Title: what and why       numbered steps, one per line
 *   !do Title: body             a callout — !do, !avoid or !note
 *   > A pull quote              optionally ending "> — Who said it"
 *
 * Never HTML: the renderer sets text only, so nothing typed here can become
 * markup or script on the public site.
 */

function slug(text: string, taken: Set<string>): string {
  const base = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "section";
  let id = base;
  for (let n = 2; taken.has(id); n += 1) id = `${base}-${n}`;
  taken.add(id);
  return id;
}

function splitTitle(text: string): { title: string; body: string } {
  const at = text.indexOf(":");
  return at > 0 ? { title: text.slice(0, at).trim(), body: text.slice(at + 1).trim() } : { title: text.trim(), body: "" };
}

function block(lines: string[]): ArticleBlock | null {
  if (lines.length === 0) return null;
  if (lines.every((l) => /^[-*]\s+/.test(l))) return { type: "list", items: lines.map((l) => l.replace(/^[-*]\s+/, "")) };
  if (lines.every((l) => /^\d+[.)]\s+/.test(l))) return { type: "list", ordered: true, items: lines.map((l) => l.replace(/^\d+[.)]\s+/, "")) };
  if (lines.every((l) => /^\+\s+/.test(l))) return { type: "steps", items: lines.map((l) => splitTitle(l.replace(/^\+\s+/, ""))).map(({ title, body }) => ({ title, body })) };
  const callout = /^!(do|avoid|note)\s+(.*)$/i.exec(lines.join(" "));
  if (callout) {
    const { title, body } = splitTitle(callout[2]!);
    return { type: "callout", tone: callout[1]!.toLowerCase() as "do" | "avoid" | "note", title, body };
  }
  if (lines.every((l) => l.startsWith(">"))) {
    const text = lines.map((l) => l.replace(/^>\s?/, ""));
    const last = text[text.length - 1] ?? "";
    const attribution = /^[—-]\s*(.+)$/.exec(last);
    return { type: "quote", text: (attribution ? text.slice(0, -1) : text).join(" ").trim(), ...(attribution ? { attribution: attribution[1] } : {}) };
  }
  return { type: "paragraph", text: lines.join(" ").trim() };
}

export function parseMarkup(markup: string): ArticleSection[] {
  const sections: ArticleSection[] = [];
  const taken = new Set<string>();
  let current: ArticleSection | null = null;
  let buffer: string[] = [];

  const flush = () => {
    const made = block(buffer);
    buffer = [];
    if (!made) return;
    if (!current) {
      current = { id: slug("overview", taken), heading: "Overview", blocks: [] };
      sections.push(current);
    }
    current.blocks.push(made);
  };

  for (const raw of markup.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    const heading = /^##\s+(.+)$/.exec(line.trim());
    if (heading) {
      flush();
      current = { id: slug(heading[1]!, taken), heading: heading[1]!.trim(), blocks: [] };
      sections.push(current);
    } else if (line.trim() === "") {
      flush();
    } else {
      buffer.push(line.trim());
    }
  }
  flush();
  return sections.filter((s) => s.blocks.length > 0);
}

export function toMarkup(sections: ArticleSection[]): string {
  return sections
    .map((section) => [
      `## ${section.heading}`,
      ...section.blocks.map((b) => {
        switch (b.type) {
          case "paragraph": return b.text;
          case "list": return b.items.map((item, i) => (b.ordered ? `${i + 1}. ${item}` : `- ${item}`)).join("\n");
          case "steps": return b.items.map((item) => `+ ${item.title}: ${item.body}`).join("\n");
          case "callout": return `!${b.tone} ${b.title}: ${b.body}`;
          case "quote": return [`> ${b.text}`, ...(b.attribution ? [`> — ${b.attribution}`] : [])].join("\n");
        }
      }),
    ].join("\n\n"))
    .join("\n\n");
}

export const MARKUP_HELP = [
  ["## Heading", "Starts a section, listed in the contents rail"],
  ["- item", "A bulleted list (one item per line)"],
  ["1. item", "A numbered list"],
  ["+ Title: body", "Numbered steps, each with a title and reason"],
  ["!do / !avoid / !note Title: body", "A highlighted callout"],
  ["> quote", "A pull quote; end with “> — Who said it”"],
] as const;
