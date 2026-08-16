import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BookOpen } from "lucide-react";
import { LEARN_ARTICLES } from "@/content/learn";
import { ROUTES, SECTION_IDS } from "@/config/site";
import { ArticleCard } from "@/components/learn/ArticleCard";
import { ActionLink } from "@/components/ui/ActionLink";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp, REVEAL_VIEWPORT, staggerParent } from "@/lib/motion";

/**
 * Scroll-snap rail below `lg`, grid above. Parallax is driven off this
 * section's own progress rather than the page scroll.
 *
 * The cards are the library's own card component rather than a copy of it, so
 * a guide looks the same here as it does on `/learn` and cannot drift from it.
 */
export function Awareness() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section id={SECTION_IDS.learn} ref={sectionRef} className="relative z-10 py-section">
      <div className="container">
        <SectionHeading
          icon={BookOpen}
          title="Know what to do"
          accent="before it happens."
          lede="Short, practical guides written for residents, small businesses and volunteer-run organisations — not for security specialists."
        />

        {/*
         * Parallax is translation only. The cards carry frosted panels, and
         * `backdrop-filter` inside a continuously scaling ancestor resamples
         * its blur every frame — the text under it visibly breathes.
         */}
        <motion.ul
          style={{ y }}
          variants={staggerParent(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={REVEAL_VIEWPORT}
          className="no-scrollbar mt-section-gap flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible"
        >
          {LEARN_ARTICLES.map((article) => (
            <motion.li
              key={article.id}
              variants={fadeUp}
              className="w-[78%] shrink-0 snap-start sm:w-[48%] lg:w-auto"
            >
              <ArticleCard article={article} />
            </motion.li>
          ))}
        </motion.ul>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={REVEAL_VIEWPORT}
          className="mt-10 flex justify-center"
        >
          <ActionLink href={ROUTES.learn} variant="secondary">
            Browse the awareness library
          </ActionLink>
        </motion.div>
      </div>
    </section>
  );
}
