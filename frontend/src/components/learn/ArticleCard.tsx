import { Link } from "react-router-dom";
import { ArrowRight, Clock3 } from "lucide-react";
import { articleHref, type LearnArticle } from "@/content/learn";
import { ARTICLE_ACCENTS, ARTICLE_COVERS, ARTICLE_KIND_ICONS } from "@/components/learn/articleArt";
import { cn } from "@/lib/cn";

interface ArticleCardProps {
  article: LearnArticle;
  /** Raises the card to two columns and lets the summary run to three lines. */
  wide?: boolean;
  className?: string;
}

/**
 * A guide, as a cover with a frosted shelf across the foot of it.
 *
 * The shelf is the load-bearing part. Cover art is dark and its tone varies,
 * so title copy is not set on the artwork — it is set on a frosted panel that
 * blurs and lightens whatever is behind it, painted in the page's own colour
 * in each theme. That is what lets one card carry black text in the light theme
 * and white text in the dark one over the same image.
 *
 * The summary is clamped and masked rather than cut: two lines fading out say
 * "there is more of this" in a way an ellipsis does not, and it keeps four
 * cards of different summary lengths the same height.
 *
 * The whole card is one link. Not a card with a link inside it — a reader
 * tabbing through gets one stop rather than three, and a reader on a phone gets
 * the whole card as the target rather than a "Read" phrase at the bottom of it.
 */
export function ArticleCard({ article, wide = false, className }: ArticleCardProps) {
  const accent = ARTICLE_ACCENTS[article.accent];
  const cover = ARTICLE_COVERS[article.id];
  const KindIcon = ARTICLE_KIND_ICONS[article.kind];

  return (
    <Link
      to={articleHref(article)}
      aria-label={`${article.title} — ${article.kind}, ${article.readingTime} read`}
      className={cn(
        "card-lift group relative flex h-full flex-col justify-end overflow-hidden rounded-3xl border border-slate-900/10 shadow-lg shadow-slate-900/5 hover:border-slate-900/20 dark:border-white/10 dark:shadow-black/40 dark:hover:border-white/20",
        /* Tall enough that the shelf leaves the cover room to be a picture. At
           the four-column width the art is only about 250px of a 400px card,
           and anything shorter crops the subject out from under the reader. */
        wide ? "min-h-[24rem]" : "min-h-[21rem] sm:min-h-[23rem] lg:min-h-[25rem]",
        className,
      )}
    >
      {cover ? (
        <img
          src={cover}
          alt=""
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.07]"
        />
      ) : (
        <span aria-hidden="true" className="absolute inset-0 bg-slate-900" />
      )}

      {/* The guide's accent, bled through the top of the artwork so the card is
          recognisable before any of it has been read. Held low: past about a
          quarter opacity the wash stops tinting the cover and starts replacing
          it, and four cards become four gradients. */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -top-32 left-1/2 h-56 w-[140%] -translate-x-1/2 bg-gradient-to-br opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-40",
          accent.gradient,
        )}
      />

      {/* Cover art is dark in both themes, so the badge over it is set light in
          both rather than following the theme. */}
      <span className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/45 px-3 py-1.5 font-mono text-[0.625rem] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md">
        <KindIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {article.kind}
      </span>

      <div className="relative z-10 mt-auto">
        {/* The artwork does not stop at the shelf edge — it is carried into it
            over a short ramp, so the frost reads as sitting on the image rather
            than as a second card stacked on top of one. */}
        <span
          aria-hidden="true"
          className="pointer-events-none block h-20 bg-gradient-to-t from-white/[0.78] via-white/35 to-transparent dark:from-black/60 dark:via-black/25"
        />

        <div className="frost-shelf px-5 pb-5 pt-4">
          <div className="flex items-center justify-between gap-3">
            <span
              className={cn(
                "font-mono text-[0.625rem] font-bold uppercase tracking-[0.18em]",
                accent.text,
              )}
            >
              {article.category}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[0.625rem] text-slate-600 dark:text-slate-300">
              <Clock3 className="h-3 w-3" aria-hidden="true" />
              {article.readingTime}
            </span>
          </div>

          <h3 className="mt-2.5 text-balance font-display text-display-3 font-semibold text-slate-900 transition-colors duration-200 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-cyan-300">
            {article.title}
          </h3>

          <p
            className={cn(
              "mt-2 text-[0.8125rem] leading-relaxed text-slate-700 [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)] dark:text-slate-200/85",
              wide ? "line-clamp-3" : "line-clamp-2",
            )}
          >
            {article.summary}
          </p>

          <span
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold transition-all duration-200 group-hover:gap-3",
              accent.text,
            )}
          >
            Read the guide
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}
