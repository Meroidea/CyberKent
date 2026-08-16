import { useEffect, useMemo, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ListTree, Sparkles } from "lucide-react";
import { articleHref, findArticle, LEARN_ARTICLES } from "@/content/learn";
import { ROUTES, SITE } from "@/config/site";
import { ContentsRail, OutlineLabel } from "@/components/documents/ContentsRail";
import { ArticleBody } from "@/components/learn/ArticleBody";
import { ArticleHero } from "@/components/learn/ArticleHero";
import { ARTICLE_ACCENTS, ARTICLE_COVERS } from "@/components/learn/articleArt";
import { ActionLink } from "@/components/ui/ActionLink";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { smoothScrollTo } from "@/lib/smoothScroll";
import { cn } from "@/lib/cn";
import { NotFoundPage } from "@/pages/NotFoundPage";

/**
 * One awareness guide, read in full.
 *
 * The body is bundled rather than fetched, unlike a project document: the four
 * guides together are a few kilobytes of structured text, and a reader who
 * clicked a card has already decided to read one — a spinner here would be a
 * loading state invented for its own sake.
 */
export function LearnArticlePage() {
  const { slug } = useParams();
  const article = findArticle(slug);

  const body = useRef<HTMLDivElement>(null);
  const percent = useReadingProgress(body);

  const entries = useMemo(
    () =>
      (article?.sections ?? []).map((section, index) => ({
        id: section.id,
        text: section.heading,
        level: 1,
        number: String(index + 1).padStart(2, "0"),
      })),
    [article],
  );

  const ids = useMemo(() => entries.map((entry) => entry.id), [entries]);
  const [active, setActive] = useScrollSpy(ids, article !== undefined);

  /*
   * A shared link into the middle of a guide. The page is scrolled to the top
   * on every route change and the smoothing suppresses the browser's own hash
   * jump, so the target has to be followed here or it is never reached.
   */
  useEffect(() => {
    if (!article || !window.location.hash) {
      return;
    }

    const frame = window.requestAnimationFrame(() =>
      scrollToHeading(window.location.hash.slice(1)),
    );

    return () => window.cancelAnimationFrame(frame);
  }, [article]);

  if (!article) {
    return <NotFoundPage />;
  }

  const accent = ARTICLE_ACCENTS[article.accent];
  const index = LEARN_ARTICLES.findIndex((entry) => entry.id === article.id);
  const next = LEARN_ARTICLES[(index + 1) % LEARN_ARTICLES.length];
  const others = LEARN_ARTICLES.filter((entry) => entry.id !== article.id);

  const navigate = (id: string) => {
    scrollToHeading(id);
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <section className="relative z-10 pb-section pt-24 sm:pt-28">
      <div className="container max-w-5xl">
        <Link
          to={ROUTES.learn}
          className="inline-flex items-center gap-2 text-caption font-semibold text-slate-500 transition-colors duration-200 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-cyan-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Awareness library
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5"
        >
          <ArticleHero article={article} />
        </motion.div>
      </div>

      {/* The rails are additive: they take the dead space either side on a wide
          screen and never reflow the 48rem measure. */}
      <div className="mx-auto mt-12 grid max-w-[100rem] gap-x-8 px-4 sm:px-6 lg:px-8 rail:grid-cols-[14rem_minmax(0,48rem)] rail:justify-center rails:grid-cols-[14rem_minmax(0,48rem)_17rem]">
        <aside className="hidden rail:block">
          <div className="sticky top-24">
            <ContentsRail
              entries={entries}
              active={active}
              percent={percent}
              onNavigate={navigate}
            />
          </div>
        </aside>

        <div className="w-full min-w-0 max-w-3xl">
          <p className="text-lede text-slate-700 dark:text-slate-200">{article.lede}</p>

          <section
            aria-labelledby="takeaways"
            className="glass-surface mt-8 rounded-2xl p-6 shadow-sm"
          >
            <h2
              id="takeaways"
              className="flex items-center gap-2 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
            >
              <Sparkles className={cn("h-3.5 w-3.5", accent.text)} aria-hidden="true" />
              What you leave with
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {article.takeaways.map((point) => (
                <li key={point} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br",
                      accent.gradient,
                    )}
                  />
                  <span className="text-[0.9375rem] leading-[1.75] text-slate-600 dark:text-slate-300">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* A phone gets the contents as a panel it can open rather than a rail
              there is no room for. */}
          <details className="glass-surface mt-6 rounded-2xl rail:hidden">
            <summary className="flex cursor-pointer items-center gap-2 px-4 py-3.5 font-mono text-caption font-bold uppercase tracking-[0.16em] text-slate-900 dark:text-white">
              <ListTree className="h-4 w-4" aria-hidden="true" />
              In this guide
            </summary>
            <ol className="px-4 pb-4">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <a
                    href={`#${entry.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      navigate(entry.id);
                      event.currentTarget.closest("details")?.removeAttribute("open");
                    }}
                    className="block py-1 text-copy text-slate-600 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-cyan-300"
                  >
                    <OutlineLabel entry={entry} />
                  </a>
                </li>
              ))}
            </ol>
          </details>

          {/* Progress is measured across the body alone: the hero, the contents
              and the read-next block are not things anyone is part way through. */}
          <div ref={body} className="mt-12">
            <ArticleBody sections={article.sections} accent={article.accent} />
          </div>

          <section className="mt-14 border-t border-slate-900/[0.08] pt-8 dark:border-white/10">
            <h2 className="font-display text-[1.125rem] font-bold text-slate-900 dark:text-white">
              Check something, or tell Council about it
            </h2>
            <p className="mt-2 text-[0.9375rem] leading-[1.75] text-slate-600 dark:text-slate-300">
              If a message prompted you to read this, put it through the checker — it takes a few
              seconds and you do not need an account. If it has already cost you something, a report
              is what puts a verified warning in front of the rest of Hume.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <ActionLink href={ROUTES.checkMessage}>Check a message</ActionLink>
              <ActionLink href={ROUTES.reportScam} variant="secondary">
                Report a scam
              </ActionLink>
            </div>
          </section>

          {/* Absent only if this is the sole guide in the library, where "read
              next" would point back at the page already open. */}
          {next && next.id !== article.id ? (
            <section className="mt-12">
              <Link
                to={articleHref(next)}
                className="glass-surface card-lift group flex items-center gap-4 rounded-2xl p-5 hover:border-indigo-300 dark:hover:border-cyan-400/40"
              >
                <span
                  aria-hidden="true"
                  className="hidden h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-900/10 dark:border-white/10 sm:block"
                >
                  <img
                    src={ARTICLE_COVERS[next.id]}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-[0.625rem] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-cyan-400">
                    Read next
                  </span>
                  <span className="mt-1 block font-display text-display-3 font-bold text-slate-900 transition-colors duration-200 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-cyan-300">
                    {next.title}
                  </span>
                </span>
                <ArrowRight
                  className="ml-auto h-5 w-5 shrink-0 text-indigo-600 transition-transform duration-200 group-hover:translate-x-1 dark:text-cyan-400"
                  aria-hidden="true"
                />
              </Link>
            </section>
          ) : null}

          <p className="mt-10 border-t border-slate-900/[0.08] pt-6 text-caption leading-relaxed text-slate-400 dark:border-white/10 dark:text-slate-500">
            Published by {SITE.owner} — {SITE.program}. General guidance based on scams reported in
            Hume; it is not a professional cybersecurity assessment and does not replace advice from
            your bank, your insurer or the police.
          </p>
        </div>

        <aside className="hidden rails:block">
          <div className="sticky top-24 flex flex-col gap-3">
            <p className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              More from the library
            </p>

            {others.map((other) => {
              const tokens = ARTICLE_ACCENTS[other.accent];

              return (
                <Link
                  key={other.id}
                  to={articleHref(other)}
                  className="glass-surface group rounded-xl p-3.5 transition-colors duration-200 hover:border-indigo-300 dark:hover:border-cyan-400/40"
                >
                  <span
                    className={cn(
                      "font-mono text-[0.625rem] font-bold uppercase tracking-[0.16em]",
                      tokens.text,
                    )}
                  >
                    {other.category}
                  </span>
                  <span className="mt-1 block text-[0.8125rem] font-semibold leading-snug text-slate-900 transition-colors duration-200 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-cyan-300">
                    {other.title}
                  </span>
                  <span className="mt-1 block font-mono text-[0.625rem] text-slate-400 dark:text-slate-500">
                    {other.readingTime}
                  </span>
                </Link>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}

/** Scrolls a heading clear of the fixed header, without a second native jump. */
function scrollToHeading(id: string) {
  const target = document.getElementById(id);

  if (target) {
    smoothScrollTo(target);
  }
}
