import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { fadeUp, REVEAL_VIEWPORT, staggerParent } from "@/lib/motion";
import { GradientText } from "@/components/ui/GradientText";
import { DecryptedText } from "@/components/ui/DecryptedText";

interface SectionHeadingProps {
  icon: LucideIcon;
  /** Plain opening of the headline. */
  title: string;
  /** Closing phrase, rendered in the accent gradient. */
  accent: string;
  lede: string;
  align?: "left" | "center";
  className?: string;
}

/**
 * Shared section header: icon tile → headline with a gradient tail →
 * lede → gradient underline. Repeated verbatim by every section.
 *
 * The four elements are spaced individually rather than by one uniform gap.
 * An even gap reads as four unrelated items; tightening headline-to-lede and
 * opening up the rule beneath binds them into a single block with a clear
 * entry point and a clear end.
 */
export function SectionHeading({
  icon: Icon,
  title,
  accent,
  lede,
  align = "center",
  className,
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <motion.header
      variants={staggerParent(0.1)}
      initial="hidden"
      whileInView="visible"
      viewport={REVEAL_VIEWPORT}
      className={cn(
        "flex max-w-3xl flex-col",
        centered ? "mx-auto items-center text-center" : "items-start text-left",
        className,
      )}
    >
      <motion.span
        variants={fadeUp}
        className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white/70 text-indigo-600 backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-white/5 dark:text-cyan-400"
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </motion.span>

      <motion.h2
        variants={fadeUp}
        className="display-depth mt-7 text-balance font-display text-display-2 font-bold text-slate-900 dark:text-white"
      >
        <DecryptedText text={title} />{" "}
        <GradientText>
          <DecryptedText text={accent} delay={220} />
        </GradientText>
      </motion.h2>

      <motion.p
        variants={fadeUp}
        className="mt-5 max-w-2xl text-balance text-lede text-slate-600 dark:text-slate-400"
      >
        {lede}
      </motion.p>

      <motion.span
        variants={fadeUp}
        aria-hidden="true"
        className="mt-9 h-1 w-24 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400"
      />
    </motion.header>
  );
}
