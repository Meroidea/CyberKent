import { AlertTriangle, Check, Info, Quote, ShieldCheck } from "lucide-react";
import type { ArticleBlock, ArticleSection } from "@/content/learn";
import { ARTICLE_ACCENTS } from "@/components/learn/articleArt";
import type { ArticleAccent } from "@/content/learn";
import { cn } from "@/lib/cn";

/**
 * Tone is carried by an icon and a heading as well as by colour, so a callout
 * still reads as a warning in greyscale (WCAG 1.4.1).
 */
const CALLOUT_TONES = {
  do: {
    Icon: ShieldCheck,
    ring: "border-emerald-500/30 bg-emerald-500/[0.07]",
    mark: "text-emerald-600 dark:text-emerald-400",
  },
  avoid: {
    Icon: AlertTriangle,
    ring: "border-rose-500/30 bg-rose-500/[0.07]",
    mark: "text-rose-600 dark:text-rose-400",
  },
  note: {
    Icon: Info,
    ring: "border-slate-400/30 bg-slate-500/[0.06]",
    mark: "text-slate-500 dark:text-slate-300",
  },
} as const;

function Block({ block, accent }: { block: ArticleBlock; accent: ArticleAccent }) {
  const tokens = ARTICLE_ACCENTS[accent];

  switch (block.type) {
    case "paragraph":
      return (
        <p className="mt-5 text-[0.9375rem] leading-[1.85] text-slate-600 dark:text-slate-300">
          {block.text}
        </p>
      );

    case "list":
      /*
       * Ordered lists are numbered because the order is the instruction —
       * "call the bank, then change the password" is wrong the other way round.
       * Unordered ones take a tick, because in every guide here the items are
       * things to do rather than things to consider.
       */
      return block.ordered ? (
        <ol className="mt-5 flex flex-col gap-3">
          {block.items.map((item, index) => (
            <li key={item} className="flex gap-3.5">
              <span
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-mono text-[0.6875rem] font-bold text-white",
                  tokens.gradient,
                )}
              >
                {index + 1}
              </span>
              <span className="text-[0.9375rem] leading-[1.75] text-slate-600 dark:text-slate-300">
                {item}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {block.items.map((item) => (
            <li key={item} className="flex gap-3.5">
              <Check
                className={cn("mt-1.5 h-4 w-4 shrink-0", tokens.text)}
                aria-hidden="true"
              />
              <span className="text-[0.9375rem] leading-[1.75] text-slate-600 dark:text-slate-300">
                {item}
              </span>
            </li>
          ))}
        </ul>
      );

    case "steps":
      return (
        <ol className="mt-6 flex flex-col gap-3">
          {block.items.map((step, index) => (
            <li
              key={step.title}
              className="glass-surface rounded-2xl p-5 transition-colors duration-200 hover:border-indigo-300 dark:hover:border-cyan-400/40"
            >
              <div className="flex items-baseline gap-3">
                <span
                  className={cn(
                    "bg-gradient-to-br bg-clip-text font-mono text-sm font-bold tabular-nums text-transparent",
                    tokens.gradient,
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-[1.0625rem] font-semibold leading-snug text-slate-900 dark:text-white">
                  {step.title}
                </h3>
              </div>
              <p className="mt-2 pl-9 text-[0.9375rem] leading-[1.75] text-slate-600 dark:text-slate-300">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      );

    case "callout": {
      const tone = CALLOUT_TONES[block.tone];

      return (
        <aside className={cn("mt-6 flex gap-4 rounded-2xl border p-5", tone.ring)}>
          <tone.Icon className={cn("mt-0.5 h-5 w-5 shrink-0", tone.mark)} aria-hidden="true" />
          <div>
            <p className="font-display text-[0.9375rem] font-bold leading-snug text-slate-900 dark:text-white">
              {block.title}
            </p>
            <p className="mt-1.5 text-[0.9375rem] leading-[1.75] text-slate-600 dark:text-slate-300">
              {block.body}
            </p>
          </div>
        </aside>
      );
    }

    case "quote":
      return (
        <figure className="mt-8 border-l-2 border-slate-900/15 pl-6 dark:border-white/20">
          <Quote className={cn("h-5 w-5", tokens.text)} aria-hidden="true" />
          <blockquote className="mt-2 font-display text-[1.125rem] font-medium leading-[1.6] text-slate-800 dark:text-slate-100">
            {block.text}
          </blockquote>
          {block.attribution ? (
            <figcaption className="mt-2 text-caption text-slate-500 dark:text-slate-400">
              {block.attribution}
            </figcaption>
          ) : null}
        </figure>
      );
  }
}

/**
 * The body of a guide.
 *
 * Every section is an anchored `<section>` with its own `<h2>`, because the
 * contents rail, the scroll spy and a shared link into the middle of a guide
 * all address headings by id — and because a reader arriving at
 * `/learn/first-hour#report-it` should land on the part they were sent to.
 */
export function ArticleBody({
  sections,
  accent,
}: {
  sections: ArticleSection[];
  accent: ArticleAccent;
}) {
  return (
    <>
      {sections.map((section, index) => (
        <section key={section.id} className="mt-12 first:mt-0">
          <h2
            id={section.id}
            className="scroll-mt-28 font-display text-[1.5rem] font-bold leading-tight text-slate-900 dark:text-white"
          >
            <span
              className={cn(
                "mr-2.5 bg-gradient-to-br bg-clip-text font-mono text-sm font-bold tabular-nums text-transparent",
                ARTICLE_ACCENTS[accent].gradient,
              )}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            {section.heading}
          </h2>

          {/* Each block sets its own top margin, so the first one in a section
              would otherwise stack its gap on this one. */}
          <div className="mt-4 [&>*:first-child]:mt-0">
            {section.blocks.map((block, blockIndex) => (
              <Block key={`${section.id}-${blockIndex}`} block={block} accent={accent} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
