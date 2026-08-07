import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import { AWARENESS_RESOURCES } from "@/content/landing";
import { ROUTES, SECTION_IDS } from "@/config/site";
import { ActionLink } from "@/components/ui/ActionLink";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp, REVEAL_VIEWPORT, staggerParent } from "@/lib/motion";

/**
 * Scroll-snap rail below `lg`, grid above. Parallax is driven off this
 * section's own progress rather than the page scroll.
 */
export function Awareness() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.97, 1, 0.97]);

  return (
    <section id={SECTION_IDS.learn} ref={sectionRef} className="relative z-10 py-section">
      <div className="container">
        <SectionHeading
          icon={BookOpen}
          title="Know what to do"
          accent="before it happens."
          lede="Short, practical guides written for residents, small businesses and volunteer-run organisations — not for security specialists."
        />

        <motion.ul
          style={{ y, scale }}
          variants={staggerParent(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={REVEAL_VIEWPORT}
          className="no-scrollbar mt-section-gap flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible"
        >
          {AWARENESS_RESOURCES.map((resource) => (
            <motion.li
              key={resource.id}
              variants={fadeUp}
              className="w-[85%] shrink-0 snap-start sm:w-[55%] lg:w-auto"
            >
              <a
                href={`${ROUTES.learn}#${resource.id}`}
                className="glass-surface card-lift group flex h-full flex-col gap-3 rounded-2xl p-6 hover:border-indigo-300 dark:hover:border-cyan-400/40"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-cyan-400">
                  {resource.category}
                </span>

                <h3 className="text-balance font-display text-display-3 font-semibold text-slate-900 dark:text-white">
                  {resource.title}
                </h3>

                <p className="text-copy text-slate-600 [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)] dark:text-slate-400">
                  {resource.summary}
                </p>

                <span className="mt-auto flex items-center justify-between pt-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5 font-mono">
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                    {resource.readingTime}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-indigo-600 transition-all duration-200 group-hover:gap-2.5 dark:text-cyan-400">
                    Read
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </span>
              </a>
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
