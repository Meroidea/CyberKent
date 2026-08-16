import { motion } from "framer-motion";
import { BookOpen, Construction } from "lucide-react";
import { LEARN_ARTICLES } from "@/content/learn";
import { ROUTES } from "@/config/site";
import { ArticleCard } from "@/components/learn/ArticleCard";
import { ActionLink } from "@/components/ui/ActionLink";
import { GradientText } from "@/components/ui/GradientText";
import { Pill } from "@/components/ui/Pill";
import { fadeUp, REVEAL_VIEWPORT, staggerParent } from "@/lib/motion";

/**
 * The awareness library.
 *
 * Every guide the service has published, at two columns so the covers have room
 * to be looked at rather than scanned past. The landing page shows the same
 * four through the same card — this is where they live, and where the ones
 * still being written will appear.
 */
export function LearnPage() {
  return (
    <section className="relative z-10 pb-section pt-28 sm:pt-32">
      <div className="container">
        <motion.header
          variants={staggerParent(0.1)}
          initial="hidden"
          animate="visible"
          className="flex max-w-3xl flex-col items-start"
        >
          <motion.div variants={fadeUp}>
            <Pill>
              <BookOpen
                className="h-3.5 w-3.5 text-indigo-600 dark:text-cyan-400"
                aria-hidden="true"
              />
              Awareness library
            </Pill>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="display-depth mt-7 text-balance font-display text-display-2 font-bold text-slate-900 dark:text-white"
          >
            Know what to do{" "}
            <GradientText>before it happens.</GradientText>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-2xl text-lede text-slate-600 dark:text-slate-400"
          >
            Short, practical guides written for residents, small businesses and volunteer-run
            organisations — not for security specialists. Each one is written to be read in a sitting
            and acted on the same day.
          </motion.p>
        </motion.header>

        <motion.ul
          variants={staggerParent(0.09, 0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={REVEAL_VIEWPORT}
          className="mt-section-gap grid gap-6 md:grid-cols-2"
        >
          {LEARN_ARTICLES.map((article) => (
            <motion.li key={article.id} variants={fadeUp}>
              <ArticleCard article={article} wide />
            </motion.li>
          ))}
        </motion.ul>

        {/*
         * Avoid.md §14: the library is specified as searchable and grouped by
         * situation, and it is not yet. Saying so is what keeps the four guides
         * above readable as the whole of what exists today rather than as a
         * sample of something larger that cannot be found.
         */}
        <motion.aside
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={REVEAL_VIEWPORT}
          className="glass-surface mt-12 flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:gap-6"
        >
          <Construction
            className="h-5 w-5 shrink-0 text-amber-500"
            aria-hidden="true"
          />
          <p className="text-copy text-slate-600 dark:text-slate-400">
            Search, situation-based grouping and the rest of the library are still being built —
            these four are what is published today. Recovery checklists you can work through and
            tick off are a separate module, also in development.
          </p>
          <ActionLink href={ROUTES.recover} variant="secondary" className="shrink-0">
            Recovery checklists
          </ActionLink>
        </motion.aside>
      </div>
    </section>
  );
}
