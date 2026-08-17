/**
 * The deck's running order, and which document carries it.
 *
 * Held apart from `slides.tsx` on purpose: the document page needs to know that
 * a deck exists and how long it is in order to offer it, and importing the
 * slides to find that out would pull the whole deck — ten compositions and the
 * content module behind them — into the bundle every reader downloads, for a
 * button most of them will not press. This module is the part that is cheap to
 * know; the slides themselves load on the click (G6).
 */

/** The one document with a deck. Others may gain one; the page checks by id. */
export const PRESENTABLE_DOCUMENT_ID = "final-srs-report";

export interface SlideEntry {
  id: string;
  /** Shown in the deck chrome and as the title of each progress target. */
  name: string;
}

export const DECK_OUTLINE: SlideEntry[] = [
  { id: "cover", name: "CyberKent" },
  { id: "problem", name: "The problem" },
  { id: "service", name: "What it does" },
  { id: "ethics", name: "Ethics as architecture" },
  { id: "conformance", name: "Conformance check" },
  { id: "baseline", name: "The baseline" },
  { id: "enhanced", name: "Enhanced requirements" },
  { id: "build", name: "How it is built" },
  { id: "position", name: "Delivery position" },
  { id: "decisions", name: "Decisions and verdict" },
];
