import type { Variants } from "framer-motion";

/**
 * The underline shared by every item in the bar.
 *
 * Declared once rather than inline in each: the links and the dropdown triggers
 * sit in the same row and have to draw the same line, and two copies of a
 * `scaleX` and a transform origin drift apart the first time either is touched.
 */
export const UNDERLINE: Variants = {
  rest: { scaleX: 0, opacity: 0 },
  hover: { scaleX: 1, opacity: 1 },
};
