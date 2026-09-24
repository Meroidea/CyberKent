import type { IndicatorType, RelationKind } from "@prisma/client";
import { AppError } from "@/lib/http";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { normaliseIndicator } from "@/modules/reports/reports.normalise";
import type { Actor } from "@/modules/council/council.service";

/**
 * Module 8 — duplicate and related report detection (FR43–FR48).
 *
 * Suggestions, never merges. Every candidate is shown to an officer with the
 * reasons it was suggested, and only an officer links two reports (FR48): two
 * residents describing the same campaign are related, not duplicates, and
 * folding one into the other would lose a victim's report.
 *
 * Signals, each explained on the result:
 *
 * - **Text similarity** (FR44) — cosine similarity over word and word-pair
 *   counts of title and description, after stop words are dropped. Cheap,
 *   explainable, and good at "the same message pasted twice".
 * - **Same phone, email or website** (FR45–FR47) — through the artefact
 *   registry, and also through artefacts mentioned only in the description
 *   text, which residents often do not list separately.
 * - **Same reporter, close in time** — the usual shape of a true duplicate:
 *   someone who was not sure their first report went through.
 */

const WINDOW_DAYS = 180;
const CANDIDATE_LIMIT = 600;

const STOP = new Set(
  "a an and are as at be been but by for from had has have he her his i if in is it its me my of on or our she so that the their them they this to was we were what when which who will with you your me said told then there just not no yes do did can could would should about into out up get got".split(" "),
);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9$ ]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP.has(word));
}

/** Word and adjacent-pair counts: pairs keep "safe account" apart from "account … safe". */
function vector(text: string): Map<string, number> {
  const words = tokens(text);
  const counts = new Map<string, number>();
  const bump = (key: string, by: number) => counts.set(key, (counts.get(key) ?? 0) + by);
  words.forEach((word, index) => {
    bump(word, 1);
    if (index > 0) bump(`${words[index - 1]} ${word}`, 1.5);
  });
  return counts;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [key, value] of a) {
    na += value * value;
    const other = b.get(key);
    if (other) dot += value * other;
  }
  for (const value of b.values()) nb += value * value;
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

const TEXT_PATTERNS: [IndicatorType, RegExp][] = [
  ["EMAIL", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi],
  ["PHONE", /(?:\+?61[\s-]?|\(?0)[2-478]\)?(?:[\s-]?\d){8}|\b1[38]00(?:[\s-]?\d){6}\b/g],
  ["URL", /\b(?:https?:\/\/)?(?:[a-z0-9-]+\.)+(?:com|net|org|au|info|top|xyz|online|site|help|shop|app|io|co|biz|click|link|live|vip|cc|me|test)(?:\/[^\s]*)?/gi],
];

/** Artefacts in free text, in the registry's canonical form. */
function artefactsIn(text: string): Set<string> {
  const found = new Set<string>();
  for (const [type, pattern] of TEXT_PATTERNS) {
    for (const match of text.match(pattern) ?? []) {
      for (const key of normaliseIndicator(type, match) ?? []) {
        if (key.type !== "URL") found.add(`${key.type}:${key.value}`);
      }
    }
  }
  return found;
}

const LABEL: Record<string, string> = { PHONE: "phone number", EMAIL: "email address", DOMAIN: "website", URL: "link", BANK_ACCOUNT: "bank account" };

async function load(reference: string) {
  const report = await prisma.report.findFirst({
    where: { reference, deletedAt: null },
    select: {
      id: true,
      reference: true,
      title: true,
      description: true,
      authorId: true,
      categoryId: true,
      submittedAt: true,
      createdAt: true,
      indicators: { select: { indicator: { select: { type: true, value: true } } } },
    },
  });
  if (!report) throw new AppError(404, "There is no report with that reference.");
  return report;
}

export const councilSimilarity = {
  /** FR43–FR47 — candidates for one report, strongest first. */
  async candidates(reference: string) {
    const report = await load(reference);
    const at = (report.submittedAt ?? report.createdAt).getTime();
    const since = new Date(at - WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const [others, links] = await Promise.all([
      prisma.report.findMany({
        where: { id: { not: report.id }, deletedAt: null, status: { not: "DRAFT" }, submittedAt: { gte: since } },
        select: {
          id: true,
          reference: true,
          title: true,
          description: true,
          status: true,
          authorId: true,
          categoryId: true,
          submittedAt: true,
          createdAt: true,
          indicators: { select: { indicator: { select: { type: true, value: true } } } },
        },
        orderBy: { submittedAt: "desc" },
        take: CANDIDATE_LIMIT,
      }),
      prisma.reportRelation.findMany({ where: { OR: [{ sourceId: report.id }, { targetId: report.id }] }, select: { sourceId: true, targetId: true, kind: true } }),
    ]);

    const linkedAs = new Map(links.map((link) => [link.sourceId === report.id ? link.targetId : link.sourceId, link.kind]));
    const mine = vector(`${report.title} ${report.description}`);
    const myArtefacts = new Set([...report.indicators.map(({ indicator }) => `${indicator.type}:${indicator.value}`), ...artefactsIn(report.description)]);

    const scored = others.map((other) => {
      const reasons: string[] = [];
      const text = cosine(mine, vector(`${other.title} ${other.description}`));
      const theirs = new Set([...other.indicators.map(({ indicator }) => `${indicator.type}:${indicator.value}`), ...artefactsIn(other.description)]);
      const shared = [...myArtefacts].filter((key) => theirs.has(key) && !key.startsWith("URL:"));
      const sameReporter = report.authorId !== null && report.authorId === other.authorId;
      const days = Math.abs(at - (other.submittedAt ?? other.createdAt).getTime()) / (24 * 60 * 60 * 1000);

      if (text >= 0.3) reasons.push(`Wording ${Math.round(text * 100)}% similar`);
      for (const key of shared.slice(0, 3)) {
        const [type, value] = [key.slice(0, key.indexOf(":")), key.slice(key.indexOf(":") + 1)];
        reasons.push(`Same ${LABEL[type] ?? type.toLowerCase()}: ${value}`);
      }
      if (sameReporter) reasons.push(days < 1 ? "Same reporter, same day" : `Same reporter, ${Math.round(days)} days apart`);
      if (report.categoryId && report.categoryId === other.categoryId && reasons.length) reasons.push("Same type of scam");

      /* A duplicate is one person reporting one thing twice; related is
         anyone reporting the same campaign. */
      const duplicate = (sameReporter && days <= 14 && (text >= 0.5 || shared.length > 0)) || text >= 0.85;
      const score = Math.min(1, text * 0.6 + Math.min(shared.length, 2) * 0.25 + (sameReporter && days <= 14 ? 0.2 : 0));

      return {
        reference: other.reference,
        title: other.title,
        status: other.status,
        submittedAt: (other.submittedAt ?? other.createdAt).toISOString(),
        similarity: Math.round(text * 100) / 100,
        score: Math.round(score * 100) / 100,
        suggestion: duplicate ? ("DUPLICATE" as const) : ("RELATED" as const),
        reasons,
        linked: linkedAs.get(other.id) ?? null,
        relevant: text >= 0.3 || shared.length > 0 || (sameReporter && days <= 14 && text >= 0.15),
      };
    });

    return {
      candidates: scored
        .filter((row) => row.relevant || row.linked)
        .sort((a, b) => Number(Boolean(b.linked)) - Number(Boolean(a.linked)) || b.score - a.score)
        .slice(0, 12)
        .map(({ relevant: _relevant, ...row }) => row),
      compared: others.length,
      windowDays: WINDOW_DAYS,
    };
  },

  /** FR48 — an officer's link between two reports; one row per pair, whichever way round. */
  async link(reference: string, targetReference: string, kind: RelationKind, actor: Actor) {
    if (reference === targetReference) throw new AppError(422, "A report cannot be linked to itself.");
    const [source, target] = await Promise.all([load(reference), load(targetReference)]);

    const existing = await prisma.reportRelation.findFirst({
      where: { OR: [{ sourceId: source.id, targetId: target.id }, { sourceId: target.id, targetId: source.id }] },
      select: { id: true },
    });

    const similarity = cosine(vector(`${source.title} ${source.description}`), vector(`${target.title} ${target.description}`));

    if (existing) {
      await prisma.reportRelation.update({ where: { id: existing.id }, data: { kind, similarity } });
    } else {
      await prisma.reportRelation.create({ data: { sourceId: source.id, targetId: target.id, kind, similarity } });
    }

    await audit({ userId: actor.id, action: "report.linked", entityType: "Report", entityId: source.id, ipAddress: actor.ipAddress, metadata: { to: target.reference, kind } });
  },

  async unlink(reference: string, targetReference: string, actor: Actor) {
    const [source, target] = await Promise.all([load(reference), load(targetReference)]);
    const removed = await prisma.reportRelation.deleteMany({ where: { OR: [{ sourceId: source.id, targetId: target.id }, { sourceId: target.id, targetId: source.id }] } });
    if (removed.count === 0) throw new AppError(404, "Those reports are not linked.");
    await audit({ userId: actor.id, action: "report.unlinked", entityType: "Report", entityId: source.id, ipAddress: actor.ipAddress, metadata: { from: target.reference } });
  },

  /** Every report this one is linked to, in either direction. */
  async links(reportId: string) {
    const rows = await prisma.reportRelation.findMany({
      where: { OR: [{ sourceId: reportId }, { targetId: reportId }] },
      select: {
        kind: true,
        similarity: true,
        createdAt: true,
        sourceId: true,
        source: { select: { reference: true, title: true, status: true } },
        target: { select: { reference: true, title: true, status: true } },
      },
    });
    return rows.map((row) => {
      const other = row.sourceId === reportId ? row.target : row.source;
      return { ...other, kind: row.kind, similarity: row.similarity, linkedAt: row.createdAt.toISOString() };
    });
  },
};
