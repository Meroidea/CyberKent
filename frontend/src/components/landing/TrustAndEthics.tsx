import { motion } from "framer-motion";
import { Scale as ScaleIcon } from "lucide-react";
import { IMPACT_STATS, TRUST_POINTS } from "@/content/landing";
import { SECTION_IDS } from "@/config/site";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp, REVEAL_VIEWPORT, staggerParent } from "@/lib/motion";

/**
 * States the service's limits plainly. This is a product requirement, not
 * marketing garnish: results are advisory guidance, never certification.
 */
export function TrustAndEthics() {
  return (
    <section id={SECTION_IDS.trust} className="relative z-10 py-section">
      <div className="container">
        <SectionHeading
          icon={ScaleIcon}
          title="What this service is, and what it"
          accent="is not."
          lede="A risk score is a prompt to look closer, not a verdict. Being clear about that is part of the service working properly."
        />

        <motion.dl
          variants={staggerParent(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={REVEAL_VIEWPORT}
          className="mt-section-gap grid gap-5 md:grid-cols-2"
        >
          {TRUST_POINTS.map((point) => (
            <motion.div key={point.title} variants={fadeUp} className="h-full">
              <GlassPanel className="card-lift h-full p-7">
                <dt className="text-balance font-display text-display-3 font-semibold text-slate-900 dark:text-white">
                  {point.title}
                </dt>
                <dd className="mt-3 text-copy text-slate-600 dark:text-slate-400">
                  {point.body}
                </dd>
              </GlassPanel>
            </motion.div>
          ))}
        </motion.dl>

        <motion.ul
          variants={staggerParent(0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={REVEAL_VIEWPORT}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {IMPACT_STATS.map((stat) => (
            <motion.li
              key={stat.label}
              variants={fadeUp}
              className="card-lift rounded-2xl border border-gray-200/80 bg-white/50 p-6 text-center backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03]"
            >
              {/*
               * Display face with tabular figures, not the mono face. Mono set
               * "262,000+" far wider than "14" and the four tiles lost their
               * shared optical weight; tabular-nums keeps the digits aligned
               * without paying that width penalty.
               */}
              <p className="font-display text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-medium text-indigo-600 dark:text-cyan-400">
                {stat.label}
              </p>
              <p className="mt-1.5 text-caption text-slate-500 dark:text-slate-400">
                {stat.caption}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
