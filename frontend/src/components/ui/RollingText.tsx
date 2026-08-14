import { motion, useReducedMotion, type Variants } from "framer-motion";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { cn } from "@/lib/cn";

/**
 * A label whose characters roll over on hover.
 *
 * Two copies of the word sit in a clipped box, one above the other. On hover
 * both climb by exactly their own height, so the top copy leaves as the bottom
 * copy arrives in its place. The per-character delay is what makes it read as a
 * mechanical flap board rather than a block of text sliding — the effect is in
 * the stagger, not the movement.
 *
 * The parent supplies `rest` / `hover` through its own `whileHover`; framer
 * propagates variant names down, so nothing here needs to know it is hovered.
 */

/** Kept short: this fires under a pointer that is on its way somewhere. */
const CHARACTER_STAGGER = 0.018;
const DURATION = 0.42;

const outgoing: Variants = {
  rest: { y: "0%" },
  hover: { y: "-105%" },
};

const incoming: Variants = {
  rest: { y: "105%" },
  hover: { y: "0%" },
};

interface RollingTextProps {
  text: string;
  className?: string;
}

export function RollingText({ text, className }: RollingTextProps) {
  const prefersReducedMotion = useReducedMotion();
  const characters = [...text];

  if (prefersReducedMotion) {
    return <span className={className}>{text}</span>;
  }

  const row = (variants: Variants, hidden: boolean) => (
    <span aria-hidden={hidden || undefined} className={cn("flex", hidden && "absolute inset-0")}>
      {characters.map((character, index) => (
        <motion.span
          key={`${character}-${index}`}
          variants={variants}
          transition={{
            duration: DURATION,
            ease: EASE_OUT_EXPO,
            delay: index * CHARACTER_STAGGER,
          }}
          className="inline-block whitespace-pre"
        >
          {character === " " ? " " : character}
        </motion.span>
      ))}
    </span>
  );

  return (
    /*
     * `overflow-hidden` is the whole trick, and it needs a block box to clip
     * against — an inline span would let the descenders of the incoming copy
     * show above the outgoing one.
     */
    <span className={cn("relative block overflow-hidden", className)}>
      {/* The readable copy. The one below it is decorative, so a screen reader
          hears the label once rather than twice. */}
      {row(outgoing, false)}
      {row(incoming, true)}
    </span>
  );
}
