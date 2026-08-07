import type { Transition, Variants } from "framer-motion";

/**
 * One motion vocabulary for the whole marketing surface.
 * Micro-interactions 150–250ms · component transitions 300–500ms ·
 * cinematic reveals 700–1300ms · ambient loops 2–6s.
 */

export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

export const REVEAL_VIEWPORT = { once: true, margin: "-100px" } as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
};

/** Staggered list entrance; children use `fadeUp`. */
export const staggerParent = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/** Shared spring shape, usable both as a transition and as `useSpring` options. */
export const SPRING_SOFT_OPTIONS = { stiffness: 180, damping: 22 } as const;

export const springSoft: Transition = { type: "spring", ...SPRING_SOFT_OPTIONS };
export const springSnappy: Transition = { type: "spring", stiffness: 320, damping: 28 };

/** Cross-fade used by every `AnimatePresence mode="wait"` swap. */
export const blurSwap: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -16, filter: "blur(8px)" },
};
