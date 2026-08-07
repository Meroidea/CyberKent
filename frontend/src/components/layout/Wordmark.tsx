import { motion, type Variants } from "framer-motion";
import { ROUTES, SITE } from "@/config/site";
import { cn } from "@/lib/cn";
import { springSoft } from "@/lib/motion";

const letterVariants: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: springSoft },
};

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/**
 * Two-typeface wordmark: `cyber` in the display face under a drifting clipped
 * gradient, `KENT` in the sans at extrabold. The gradient animates
 * background-position only, so it never competes with framer's transforms on
 * the same node.
 */
export function Wordmark({ className }: { className?: string }) {
  const lead = SITE.wordmarkLead.split("");
  const tail = SITE.wordmarkTail.split("");

  return (
    <a
      href={ROUTES.home}
      className={cn("group relative inline-flex flex-col", className)}
      aria-label={`${SITE.name} home`}
    >
      <motion.span
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative flex items-baseline overflow-hidden text-2xl leading-none"
      >
        <span className="flex" aria-hidden="true">
          {lead.map((letter, index) => (
            <motion.span
              key={`${letter}-${index}`}
              variants={letterVariants}
              whileHover={{ y: -3, rotate: -4 }}
              className="logo-shimmer animate-gradient-drift bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-600 bg-clip-text font-display font-bold text-transparent"
            >
              {letter}
            </motion.span>
          ))}
        </span>

        <span className="flex" aria-hidden="true">
          {tail.map((letter, index) => (
            <motion.span
              key={`${letter}-${index}`}
              variants={letterVariants}
              whileHover={{ y: -3, rotate: 4 }}
              className="font-display font-extrabold tracking-tight text-slate-900 dark:text-white"
            >
              {letter}
            </motion.span>
          ))}
        </span>

        <span className="sr-only">{SITE.name}</span>

        {/* Shine sweep across the whole mark. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-6 w-8 animate-shine-sweep bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/25"
        />
      </motion.span>

      <span className="mt-1 block h-0.5 w-0 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 transition-all duration-300 group-hover:w-full dark:from-indigo-400 dark:to-cyan-400" />
    </a>
  );
}
