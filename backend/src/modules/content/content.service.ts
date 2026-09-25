import type { AwarenessResource, NoticeTone, Prisma, SiteNotice } from "@prisma/client";
import { audit } from "@/lib/audit";
import { AppError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import type { Actor } from "@/modules/council/council.service";

/**
 * Content management: the awareness library's guides and the site-wide
 * notice banner.
 *
 * A guide is written in the guide markup (parsed and rendered by the site,
 * never as HTML — nothing an editor types can become script) and is a draft
 * until published. Published guides join the library beside the built-in
 * ones, and a published guide with a built-in's slug takes its place, which is
 * how the built-ins become editable.
 */

export interface ArticleContent {
  kind: string;
  accent: string;
  audience: string;
  lede: string;
  takeaways: string[];
  markup: string;
}

type ArticleInput = Partial<ArticleContent> & { slug?: string; title?: string; category?: string; summary?: string };

function readingTime(content: ArticleContent): string {
  const words = `${content.lede} ${content.takeaways.join(" ")} ${content.markup}`.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}

function slugify(text: string): string {
  return text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "guide";
}

function toArticle(row: AwarenessResource & { author?: { fullName: string } | null }) {
  const content = (row.content as unknown as ArticleContent | null) ?? null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    summary: row.summary,
    readingTime: row.readingTime,
    status: row.archivedAt ? "archived" : row.publishedAt ? "published" : "draft",
    publishedAt: row.publishedAt?.toISOString() ?? null,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    author: row.author?.fullName ?? null,
    /* Rows seeded before the editor existed carry a plain body instead. */
    content: content ?? { kind: "Article", accent: "indigo", audience: "", lede: "", takeaways: [], markup: row.body },
    legacy: content === null,
  };
}

function toNotice(row: SiteNotice) {
  const now = Date.now();
  const live = !row.archivedAt && row.startsAt.getTime() <= now && (!row.endsAt || row.endsAt.getTime() > now);
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    tone: row.tone,
    linkUrl: row.linkUrl,
    linkLabel: row.linkLabel,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt?.toISOString() ?? null,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    status: row.archivedAt ? "archived" : live ? "live" : row.startsAt.getTime() > now ? "scheduled" : "ended",
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function findArticle(id: string) {
  const row = await prisma.awarenessResource.findUnique({ where: { id }, include: { author: { select: { fullName: true } } } });
  if (!row) throw new AppError(404, "There is no guide with that id.");
  return row;
}

export const contentService = {
  /* ── guides ─────────────────────────────────────────────────────────── */

  async articles() {
    const rows = await prisma.awarenessResource.findMany({ include: { author: { select: { fullName: true } } }, orderBy: [{ archivedAt: { sort: "asc", nulls: "first" } }, { updatedAt: "desc" }] });
    return { articles: rows.map(toArticle) };
  },

  async article(id: string) {
    return { article: toArticle(await findArticle(id)) };
  },

  async createArticle(input: Required<Omit<ArticleInput, "slug">> & { slug?: string }, actor: Actor) {
    let slug = input.slug ?? slugify(input.title);
    for (let n = 2; await prisma.awarenessResource.findUnique({ where: { slug }, select: { id: true } }); n += 1) {
      if (input.slug) throw new AppError(409, "Another guide already uses that address.", [{ field: "slug", message: "Choose a different address." }]);
      slug = `${slugify(input.title)}-${n}`;
    }
    const content: ArticleContent = { kind: input.kind, accent: input.accent, audience: input.audience, lede: input.lede, takeaways: input.takeaways, markup: input.markup };
    const row = await prisma.awarenessResource.create({
      data: { slug, title: input.title, category: input.category, summary: input.summary, body: input.markup, readingTime: readingTime(content), content: content as unknown as Prisma.InputJsonValue, authorId: actor.id },
      include: { author: { select: { fullName: true } } },
    });
    await audit({ userId: actor.id, action: "content.article_created", entityType: "AwarenessResource", entityId: row.id, ipAddress: actor.ipAddress, metadata: { slug } });
    return { article: toArticle(row) };
  },

  async updateArticle(id: string, input: ArticleInput, actor: Actor) {
    const row = await findArticle(id);
    const current = toArticle(row).content;
    const content: ArticleContent = {
      kind: input.kind ?? current.kind,
      accent: input.accent ?? current.accent,
      audience: input.audience ?? current.audience,
      lede: input.lede ?? current.lede,
      takeaways: input.takeaways ?? current.takeaways,
      markup: input.markup ?? current.markup,
    };
    if (input.slug && input.slug !== row.slug && (await prisma.awarenessResource.findUnique({ where: { slug: input.slug }, select: { id: true } }))) {
      throw new AppError(409, "Another guide already uses that address.", [{ field: "slug", message: "Choose a different address." }]);
    }
    const updated = await prisma.awarenessResource.update({
      where: { id },
      data: {
        ...(input.slug ? { slug: input.slug } : {}),
        ...(input.title ? { title: input.title } : {}),
        ...(input.category ? { category: input.category } : {}),
        ...(input.summary ? { summary: input.summary } : {}),
        body: content.markup,
        readingTime: readingTime(content),
        content: content as unknown as Prisma.InputJsonValue,
      },
      include: { author: { select: { fullName: true } } },
    });
    await audit({ userId: actor.id, action: "content.article_edited", entityType: "AwarenessResource", entityId: id, ipAddress: actor.ipAddress, metadata: { slug: updated.slug } });
    return { article: toArticle(updated) };
  },

  async setArticleState(id: string, state: "publish" | "unpublish" | "archive" | "restore", actor: Actor) {
    const row = await findArticle(id);
    if (state === "publish" && row.content === null) throw new AppError(409, "Open this guide in the editor and save it once before publishing.");
    const data: Prisma.AwarenessResourceUpdateInput =
      state === "publish" ? { publishedAt: row.publishedAt ?? new Date(), archivedAt: null }
      : state === "unpublish" ? { publishedAt: null }
      : state === "archive" ? { archivedAt: new Date(), publishedAt: null }
      : { archivedAt: null };
    const updated = await prisma.awarenessResource.update({ where: { id }, data, include: { author: { select: { fullName: true } } } });
    await audit({ userId: actor.id, action: `content.article_${state === "publish" ? "published" : state === "unpublish" ? "unpublished" : state === "archive" ? "archived" : "restored"}`, entityType: "AwarenessResource", entityId: id, ipAddress: actor.ipAddress, metadata: { slug: row.slug } });
    return { article: toArticle(updated) };
  },

  /** Brings the built-in guides under management, published, without touching one already edited. */
  async importBuiltIns(articles: (Required<Omit<ArticleInput, "slug">> & { slug: string })[], actor: Actor) {
    let imported = 0;
    for (const input of articles) {
      const existing = await prisma.awarenessResource.findUnique({ where: { slug: input.slug }, select: { id: true, content: true } });
      if (existing && existing.content !== null) continue;
      const content: ArticleContent = { kind: input.kind, accent: input.accent, audience: input.audience, lede: input.lede, takeaways: input.takeaways, markup: input.markup };
      const data = { title: input.title, category: input.category, summary: input.summary, body: input.markup, readingTime: readingTime(content), content: content as unknown as Prisma.InputJsonValue, publishedAt: new Date(), archivedAt: null, authorId: actor.id };
      if (existing) await prisma.awarenessResource.update({ where: { id: existing.id }, data });
      else await prisma.awarenessResource.create({ data: { slug: input.slug, ...data } });
      imported += 1;
    }
    await audit({ userId: actor.id, action: "content.builtins_imported", entityType: "AwarenessResource", ipAddress: actor.ipAddress, metadata: { imported } });
    return { imported, ...(await contentService.articles()) };
  },

  /** Public: the published guides, newest first. */
  async publishedArticles() {
    const rows = await prisma.awarenessResource.findMany({ where: { publishedAt: { not: null }, archivedAt: null }, orderBy: { publishedAt: "desc" } });
    return {
      articles: rows.filter((row) => row.content !== null).map((row) => {
        const article = toArticle(row);
        return { slug: article.slug, title: article.title, category: article.category, summary: article.summary, readingTime: article.readingTime, updated: article.updatedAt, content: article.content };
      }),
    };
  },

  /* ── notices ────────────────────────────────────────────────────────── */

  async notices() {
    const rows = await prisma.siteNotice.findMany({ orderBy: [{ archivedAt: { sort: "asc", nulls: "first" } }, { startsAt: "desc" }], take: 100 });
    return { notices: rows.map(toNotice) };
  },

  async createNotice(input: { title: string; body: string; tone: NoticeTone; linkUrl?: string | null; linkLabel?: string | null; startsAt?: Date; endsAt?: Date | null }, actor: Actor) {
    if (input.endsAt && input.endsAt.getTime() <= (input.startsAt ?? new Date()).getTime()) throw new AppError(422, "The notice must end after it starts.", [{ field: "endsAt", message: "Choose a later end." }]);
    const row = await prisma.siteNotice.create({ data: { ...input, linkUrl: input.linkUrl || null, linkLabel: input.linkLabel || null, startsAt: input.startsAt ?? new Date(), endsAt: input.endsAt ?? null, createdById: actor.id } });
    await audit({ userId: actor.id, action: "content.notice_created", entityType: "SiteNotice", entityId: row.id, ipAddress: actor.ipAddress, metadata: { tone: row.tone } });
    return { notice: toNotice(row) };
  },

  async updateNotice(id: string, input: { title?: string; body?: string; tone?: NoticeTone; linkUrl?: string | null; linkLabel?: string | null; startsAt?: Date; endsAt?: Date | null; archived?: boolean }, actor: Actor) {
    const row = await prisma.siteNotice.findUnique({ where: { id } });
    if (!row) throw new AppError(404, "There is no notice with that id.");
    const { archived, ...fields } = input;
    const updated = await prisma.siteNotice.update({
      where: { id },
      data: { ...fields, ...(archived !== undefined ? { archivedAt: archived ? new Date() : null } : {}) },
    });
    await audit({ userId: actor.id, action: archived === true ? "content.notice_archived" : "content.notice_edited", entityType: "SiteNotice", entityId: id, ipAddress: actor.ipAddress });
    return { notice: toNotice(updated) };
  },

  /** Public: what is showing now. At most three, most serious first. */
  async activeNotices() {
    const now = new Date();
    const rows = await prisma.siteNotice.findMany({
      where: { archivedAt: null, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      orderBy: { startsAt: "desc" },
      take: 10,
    });
    const rank: Record<NoticeTone, number> = { CRITICAL: 0, WARNING: 1, INFO: 2 };
    return {
      notices: rows
        .sort((a, b) => rank[a.tone] - rank[b.tone])
        .slice(0, 3)
        .map((row) => ({ id: row.id, title: row.title, body: row.body, tone: row.tone, linkUrl: row.linkUrl, linkLabel: row.linkLabel })),
    };
  },
};
