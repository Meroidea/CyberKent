import { BookOpen, GraduationCap, Lightbulb, ListChecks, type LucideIcon } from "lucide-react";
import type { ArticleAccent, ArticleKind } from "@/content/learn";
import firstHourCover from "@/assets/learn/first-hour.svg";
import paymentRedirectionCover from "@/assets/learn/payment-redirection.svg";
import phoneScamsCover from "@/assets/learn/phone-scams.svg";
import volunteerOrganisationCover from "@/assets/learn/volunteer-organisation.svg";

/**
 * Cover art, keyed by article id.
 *
 * Held here rather than in `content/learn` for the same reason the capability
 * photography is: the content module stays plain data any renderer can consume,
 * and the bundler-resolved asset URLs stay beside the components that paint
 * them.
 *
 * Every cover is decorative — it restates the heading in pictures and carries
 * nothing the title and summary do not — so it is rendered with `alt=""` rather
 * than making a screen reader sit through a description of a drawing.
 */
export const ARTICLE_COVERS: Record<string, string> = {
  "first-hour": firstHourCover,
  "small-business": paymentRedirectionCover,
  "older-residents": phoneScamsCover,
  "not-for-profit": volunteerOrganisationCover,
};

/* Guides written in the admin panel borrow the built-in art that shares their accent. */
const COVER_BY_ACCENT: Record<ArticleAccent, string> = {
  amber: firstHourCover,
  indigo: paymentRedirectionCover,
  cyan: phoneScamsCover,
  emerald: volunteerOrganisationCover,
};

export function coverFor(article: { id: string; accent: ArticleAccent }): string {
  return ARTICLE_COVERS[article.id] ?? COVER_BY_ACCENT[article.accent];
}

/**
 * The badge on a cover says what the reader is opening, because the four are
 * read differently: a checklist is worked through, an article is read, a
 * tutorial is followed at a desk.
 */
export const ARTICLE_KIND_ICONS: Record<ArticleKind, LucideIcon> = {
  Article: BookOpen,
  Tutorial: GraduationCap,
  "Tips & tricks": Lightbulb,
  Checklist: ListChecks,
};

interface AccentTokens {
  /** Eyebrow, meta and link colour. */
  text: string;
  /** The wash bled through the top of the cover, and rules drawn under headings. */
  gradient: string;
  /** Border of the small chip that carries the category. */
  chip: string;
}

/**
 * Four accents, one per guide, so a reader who has been in the library before
 * recognises a card before they have read its title.
 *
 * Colour is never the only carrier: the category is always written out beside
 * it (WCAG 1.4.1), and the accents differ in lightness as well as hue so they
 * remain distinguishable without colour vision.
 */
export const ARTICLE_ACCENTS: Record<ArticleAccent, AccentTokens> = {
  amber: {
    text: "text-amber-700 dark:text-amber-300",
    gradient: "from-amber-500 to-rose-500",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  },
  indigo: {
    text: "text-indigo-700 dark:text-indigo-300",
    gradient: "from-indigo-500 to-violet-500",
    chip: "border-indigo-500/30 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200",
  },
  cyan: {
    text: "text-cyan-700 dark:text-cyan-300",
    gradient: "from-cyan-500 to-teal-400",
    chip: "border-cyan-500/30 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200",
  },
  emerald: {
    text: "text-emerald-700 dark:text-emerald-300",
    gradient: "from-emerald-500 to-cyan-400",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  },
};
