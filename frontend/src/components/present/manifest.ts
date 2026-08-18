/**
 * The deck's running order, and which document carries it.
 *
 * Held apart from `slides.tsx` on purpose: the document page needs to know that
 * a deck exists and how long it is in order to offer it, and importing the
 * slides to find that out would pull the whole deck — fifteen compositions and
 * the content module behind them — into the bundle every reader downloads, for a
 * button most of them will not press. This module is the part that is cheap to
 * know; the slides themselves load on the click (G6).
 *
 * The order follows the assessment brief's criteria rather than the report's own
 * section order: a marker works down that list, and a deck that answers it out
 * of sequence makes them hunt. Fifteen is the brief's ceiling, and thirteen
 * criteria do not fit in ten without one of them being a bullet.
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
  { id: "problem", name: "Background & problem" },
  { id: "objectives", name: "Objectives & purpose" },
  { id: "scope", name: "Scope & deliverables" },
  { id: "team", name: "Team & performance" },
  { id: "wbs", name: "WBS & schedule" },
  { id: "usecases", name: "Use-case model" },
  { id: "requirements", name: "Requirements" },
  { id: "enhanced", name: "Enhanced & conformance" },
  { id: "architecture", name: "Architecture, ERD & DFD" },
  { id: "storyboard", name: "User storyboard" },
  { id: "testing", name: "Test plan & cases" },
  { id: "budget", name: "Budget & finance" },
  { id: "risks", name: "Risks & communication" },
  { id: "close", name: "Position & feedback" },
];
