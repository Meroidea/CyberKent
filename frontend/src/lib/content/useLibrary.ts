import { useEffect, useState } from "react";
import { LEARN_ARTICLES, type LearnArticle } from "@/content/learn";
import { publicContentApi } from "@/lib/admin/api";
import type { PublicArticle } from "@/lib/admin/types";
import { parseMarkup } from "@/lib/content/markup";

/**
 * The awareness library as residents see it: the built-in guides, with any
 * guide published from the admin panel added — or, where it shares a
 * built-in's address, taking its place. Built-ins show at once; published
 * guides join when they arrive, and if the API is unreachable the built-ins
 * are still the whole library rather than an error.
 */

export function toLearnArticle(article: PublicArticle): LearnArticle {
  return {
    id: article.slug,
    kind: article.content.kind,
    category: article.category,
    accent: article.content.accent,
    title: article.title,
    summary: article.summary,
    readingTime: article.readingTime,
    updated: article.updated.slice(0, 10),
    audience: article.content.audience,
    lede: article.content.lede,
    takeaways: article.content.takeaways,
    sections: parseMarkup(article.content.markup),
  };
}

let shared: Promise<LearnArticle[]> | null = null;

function load(): Promise<LearnArticle[]> {
  shared ??= publicContentApi
    .articles()
    .then(({ articles }) => {
      const managed = new Map(articles.map((a) => [a.slug, toLearnArticle(a)]));
      const merged = LEARN_ARTICLES.map((builtIn) => managed.get(builtIn.id) ?? builtIn);
      for (const [slug, article] of managed) if (!LEARN_ARTICLES.some((b) => b.id === slug)) merged.push(article);
      return merged;
    })
    .catch(() => {
      shared = null;
      return LEARN_ARTICLES;
    });
  return shared;
}

export function useLibraryState(): { articles: LearnArticle[]; ready: boolean } {
  const [state, setState] = useState<{ articles: LearnArticle[]; ready: boolean }>({ articles: LEARN_ARTICLES, ready: false });
  useEffect(() => {
    let live = true;
    void load().then((articles) => live && setState({ articles, ready: true }));
    return () => {
      live = false;
    };
  }, []);
  return state;
}

export function useLibrary(): LearnArticle[] {
  return useLibraryState().articles;
}
