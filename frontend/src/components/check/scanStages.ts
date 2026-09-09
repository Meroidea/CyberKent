import { useEffect, useState } from "react";

/**
 * What the check is doing, in the order it does it.
 *
 * Every line names a step that genuinely runs in `@/lib/scam/analyse` — the
 * point of holding the reader here is to show the work, and inventing stages to
 * fill the time would make the wait a lie rather than an explanation. This is
 * why the two surfaces below stretch the *pace* of the list rather than adding
 * entries to it when they need a longer hold.
 */
export const SCAN_STAGES = [
  "Reading the message and any file attached",
  "Following where each link actually goes",
  "Matching indicators reported in Hume",
  "Scoring what was found",
] as const;

/** Pace for the page's full-screen takeover. */
export const SCAN_STAGE_MS = 620;
export const SCAN_DURATION_MS = SCAN_STAGES.length * SCAN_STAGE_MS;

/**
 * Pace for the modal, where the globe is the reason to stay rather than an
 * interruption on the way to a result: the same four steps, held long enough
 * that the sphere is watched rather than glimpsed.
 */
export const MODAL_SCAN_STAGE_MS = 1300;
export const MODAL_SCAN_DURATION_MS = SCAN_STAGES.length * MODAL_SCAN_STAGE_MS;

/**
 * The beat used where there is no globe to watch — no WebGL, or a reader who
 * has asked for less motion. Long enough that the result reads as considered,
 * short enough that it is not five seconds of staring at a still image.
 */
export const SCAN_STILL_MS = 1400;

/** Advances through `SCAN_STAGES` while a check is running. */
export function useScanStage(active: boolean, stageMs: number): number {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!active) {
      setStage(0);
      return;
    }

    const timer = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, SCAN_STAGES.length - 1));
    }, stageMs);

    return () => window.clearInterval(timer);
  }, [active, stageMs]);

  return stage;
}
