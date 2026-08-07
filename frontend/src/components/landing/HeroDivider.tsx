import { motion } from "framer-motion";

const PULSE = {
  animate: { opacity: [0.55, 1, 0.55], scale: [0.9, 1.12, 0.9] },
  transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" as const },
};

/**
 * Hairline rule with a four-layer focal point at its exact centre.
 * The centring lives on the static wrapper and the pulse on an inner motion
 * node, so the animated transform never clobbers the translate.
 */
export function HeroDivider() {
  return (
    <div aria-hidden="true" className="relative h-px w-full max-w-2xl">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent blur-sm dark:via-cyan-400/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-white/20" />

      <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
        <motion.span
          {...PULSE}
          className="absolute left-1/2 top-1/2 block h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/15 blur-2xl dark:bg-cyan-400/15"
        />
        <motion.span
          {...PULSE}
          className="absolute left-1/2 top-1/2 block h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/30 blur-lg dark:bg-cyan-400/30"
        />
        <motion.span
          {...PULSE}
          className="absolute left-1/2 top-1/2 block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500 dark:bg-cyan-400"
        />
        <span className="absolute left-1/2 top-1/2 block h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      </div>
    </div>
  );
}
