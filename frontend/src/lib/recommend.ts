import { LEARN_ARTICLES, type LearnArticle } from "@/content/learn";

/**
 * FR59 — which guides to put in front of someone, given the kind of scam.
 *
 * A plain table rather than anything cleverer: the library is small, the
 * mapping is an editorial judgement a Council officer should be able to read
 * and change, and a recommendation nobody can explain is not one to act on.
 */
const GUIDES_FOR: Record<string, string[]> = {
  "payment-redirection": ["small-business", "not-for-profit"],
  "family-impersonation": ["older-residents"],
  "bank-impersonation": ["older-residents", "first-hour"],
  "remote-access": ["older-residents", "first-hour"],
  "government-impersonation": ["first-hour"],
  investment: ["first-hour"],
  romance: ["older-residents"],
};

export function recommendedGuides(categorySlug: string | null | undefined, limit = 2): LearnArticle[] {
  const ids = [...(categorySlug ? (GUIDES_FOR[categorySlug] ?? []) : []), "first-hour"];
  const unique = [...new Set(ids)];
  return unique.map((id) => LEARN_ARTICLES.find((article) => article.id === id)).filter((article): article is LearnArticle => Boolean(article)).slice(0, limit);
}
