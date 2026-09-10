import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Link } from "react-router-dom";

/**
 * A router link that framer can animate, built once at module scope.
 *
 * The primary nav is mostly in-page anchors, but `Home` is a route — and a
 * plain `<a href="/">` there would reload the document, which on this site
 * means sitting through the 3.4-second boot sequence again to reach a page
 * that was one render away. Both the bar and the mobile sheet need it, so it
 * is created here rather than twice.
 */
export const MotionNavLink = motion(Link);

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
