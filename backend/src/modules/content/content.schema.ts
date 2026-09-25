import { z } from "zod";

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens.").min(3).max(60);

const articleFields = {
  title: z.string().trim().min(5, "Give the guide a title.").max(120),
  category: z.string().trim().min(2).max(40),
  summary: z.string().trim().min(10, "Write a one-line summary for the card.").max(280),
  kind: z.enum(["Article", "Tutorial", "Tips & tricks", "Checklist"]),
  accent: z.enum(["amber", "indigo", "cyan", "emerald"]),
  audience: z.string().trim().max(160).default(""),
  lede: z.string().trim().max(1200).default(""),
  takeaways: z.array(z.string().trim().min(1).max(200)).max(8).default([]),
  markup: z.string().max(40_000),
};

export const createArticleSchema = z.object({ slug: slug.optional(), ...articleFields }).strict();

export const updateArticleSchema = z
  .object(Object.fromEntries(Object.entries({ slug, ...articleFields }).map(([key, value]) => [key, (value as z.ZodTypeAny).optional()])) as Record<string, z.ZodTypeAny>)
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Change something.");

export const importSchema = z.object({ articles: z.array(z.object({ slug, ...articleFields }).strict()).min(1).max(20) }).strict();

const url = z.string().trim().max(300).refine((value) => value.startsWith("/") || /^https:\/\/[^\s]+$/.test(value), "Use a site path like /alerts or a full https:// address.");

const noticeFields = {
  title: z.string().trim().min(3, "Give the notice a headline.").max(100),
  body: z.string().trim().max(400).default(""),
  tone: z.enum(["INFO", "WARNING", "CRITICAL"]).default("INFO"),
  linkUrl: url.nullable().optional(),
  linkLabel: z.string().trim().max(40).nullable().optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().nullable().optional(),
};

export const createNoticeSchema = z.object(noticeFields).strict();
export const updateNoticeSchema = z
  .object({ ...Object.fromEntries(Object.entries(noticeFields).map(([k, v]) => [k, (v as z.ZodTypeAny).optional()])), archived: z.boolean().optional() } as Record<string, z.ZodTypeAny>)
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Change something.");
