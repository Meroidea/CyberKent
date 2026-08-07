import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { HERO_LINES } from "@/content/landing";
import { GradientText } from "@/components/ui/GradientText";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { useInterval } from "@/hooks/useInterval";

const ROTATION_MS = 10_000;

function pickNextIndex(current: number, length: number): number {
  if (length < 2) {
    return 0;
  }

  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * length);
  }
  return next;
}

/**
 * Two-line advisory that swaps every 10s.
 *
 * Deliberately not a live region: the lines are decorative reinforcement, and
 * announcing a new one every ten seconds would interrupt a screen-reader user
 * mid-page. Rotation stops entirely under reduced-motion.
 */
export function RotatingLine() {
  const [index, setIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  const advance = useCallback(() => {
    setIndex((current) => pickNextIndex(current, HERO_LINES.length));
  }, []);

  useInterval(advance, prefersReducedMotion ? null : ROTATION_MS);

  const line = HERO_LINES[index] ?? HERO_LINES[0];

  if (!line) {
    return null;
  }

  return (
    /* The reserved height only has to stop the two-line variants from shifting
       the layout as they swap; beyond that it is dead space the console needs. */
    <div className="flex min-h-[3.5rem] items-center justify-center px-2 text-center">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 24, scale: 0.96, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -24, scale: 0.96, filter: "blur(8px)" }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          className="max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl dark:text-slate-400"
        >
          {line.lead}{" "}
          <GradientText className="font-display font-semibold">{line.emphasis}</GradientText>
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
