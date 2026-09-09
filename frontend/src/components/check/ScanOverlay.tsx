import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ScanGlobe } from "@/components/globe/ScanGlobe";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * What the check is doing, in the order it does it.
 *
 * Every line names a step that genuinely runs in `@/lib/scam/analyse` — the
 * point of holding the reader here is to show the work, and inventing stages
 * to fill the time would make the wait a lie rather than an explanation.
 */
const SCAN_STAGES = [
  "Reading the message structure",
  "Checking links, numbers and addresses",
  "Matching indicators reported in Hume",
  "Scoring what was found",
] as const;

export const SCAN_STAGE_MS = 620;
/** Total hold, sized so every stage is legible before the verdict lands. */
export const SCAN_DURATION_MS = SCAN_STAGES.length * SCAN_STAGE_MS;

/**
 * Full-page takeover for the duration of a check.
 *
 * The globe is the whole point: an analysis that returns in under a
 * millisecond reads as though nothing was examined, so the wait is spent
 * showing what is being examined instead of spinning a token.
 *
 * It is `aria-hidden` as a whole and announces progress through one polite
 * live region — a screen reader should hear four short stages, not a
 * description of a rotating sphere.
 */
export function ScanOverlay({ active }: { active: boolean }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!active) {
      setStage(0);
      return;
    }

    const timer = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, SCAN_STAGES.length - 1));
    }, SCAN_STAGE_MS);

    return () => window.clearInterval(timer);
  }, [active]);

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="scan-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          aria-busy="true"
          className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-6 bg-slate-50/80 backdrop-blur-md dark:bg-[#050505]/85"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            aria-hidden="true"
            className="h-[min(62vh,30rem)] w-[min(88vw,30rem)]"
          >
            <ScanGlobe scanning className="h-full w-full" />
          </motion.div>

          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <p
              role="status"
              aria-live="polite"
              className="font-mono text-caption uppercase tracking-[0.2em] text-indigo-600 dark:text-cyan-400"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={stage}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.24 }}
                  className="inline-block"
                >
                  {SCAN_STAGES[stage]}
                </motion.span>
              </AnimatePresence>
            </p>

            {/* Progress, so the hold reads as bounded rather than hung. */}
            <div
              aria-hidden="true"
              className="h-1 w-56 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10"
            >
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: SCAN_DURATION_MS / 1000, ease: "linear" }}
                style={{ transformOrigin: "left" }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400"
              />
            </div>

            <p className="max-w-xs text-caption text-slate-500 dark:text-slate-400">
              Checked on your own device. The message and any file stay on it; only a link's
              address is sent, so CyberKent opens it instead of you.
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
