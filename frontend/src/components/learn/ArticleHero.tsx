import { CalendarDays, Clock3, Users } from "lucide-react";
import type { LearnArticle } from "@/content/learn";
import { ARTICLE_ACCENTS, coverFor, ARTICLE_KIND_ICONS } from "@/components/learn/articleArt";
import { cn } from "@/lib/cn";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * The masthead of a guide: the same cover and the same frosted shelf as the
 * card that was clicked, at page scale.
 *
 * Deliberately identical in construction rather than merely similar. The card
 * is the door and this is the room behind it, and a reader should recognise
 * on arrival that they got where they were aiming — which is what a redrawn,
 * differently-styled header quietly costs.
 */
export function ArticleHero({ article }: { article: LearnArticle }) {
  const accent = ARTICLE_ACCENTS[article.accent];
  const cover = coverFor(article);
  const KindIcon = ARTICLE_KIND_ICONS[article.kind];

  return (
    <header className="relative flex min-h-[24rem] flex-col justify-end overflow-hidden rounded-3xl border border-slate-900/10 shadow-xl shadow-slate-900/10 dark:border-white/10 dark:shadow-black/50 sm:min-h-[30rem]">
      {cover ? (
        <img
          src={cover}
          alt=""
          /* The one image on the page that is above the fold on every screen,
             so it is not deferred. */
          decoding="async"
          /* The banner is far wider than the artwork, so a centred crop takes a
             band out of its middle and loses the top of the subject. Biasing the
             crop above centre keeps the whole motif in frame at every width. */
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[center_38%]"
        />
      ) : (
        <span aria-hidden="true" className="absolute inset-0 bg-slate-900" />
      )}

      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -top-48 left-1/2 h-96 w-[140%] -translate-x-1/2 bg-gradient-to-br opacity-30 blur-3xl",
          accent.gradient,
        )}
      />

      <span className="absolute left-5 top-5 z-20 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/45 px-3.5 py-1.5 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md">
        <KindIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {article.kind}
      </span>

      <div className="relative z-10">
        <span
          aria-hidden="true"
          className="pointer-events-none block h-28 bg-gradient-to-t from-white/[0.78] via-white/35 to-transparent dark:from-black/60 dark:via-black/25"
        />

        <div className="frost-shelf px-6 pb-7 pt-5 sm:px-9 sm:pb-9 sm:pt-7">
          <p
            className={cn(
              "font-mono text-[0.6875rem] font-bold uppercase tracking-[0.2em]",
              accent.text,
            )}
          >
            {article.category}
          </p>

          <h1 className="display-depth mt-3 max-w-3xl text-balance font-display text-display-2 font-bold text-slate-900 dark:text-white">
            {article.title}
          </h1>

          <p className="mt-4 max-w-2xl text-lede text-slate-700 dark:text-slate-200/90">
            {article.summary}
          </p>

          <dl className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-900/10 pt-4 text-caption text-slate-600 dark:border-white/15 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
              <dt className="sr-only">Reading time</dt>
              <dd>{article.readingTime} read</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
              <dt className="sr-only">Last reviewed</dt>
              <dd>
                Reviewed <time dateTime={article.updated}>{formatDate(article.updated)}</time>
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
              <dt className="sr-only">Written for</dt>
              <dd>{article.audience}</dd>
            </div>
          </dl>
        </div>
      </div>
    </header>
  );
}
