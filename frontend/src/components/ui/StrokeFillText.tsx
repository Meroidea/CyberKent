import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface StrokeFillTextProps {
  children: ReactNode;
  /**
   * Set once the words inside are final. Until then the line is held as an
   * outline, so the fill lands on the headline the reader keeps rather than on
   * one still resolving underneath it.
   */
  start?: boolean;
  /**
   * Milliseconds after which the fill runs whether or not `start` arrived.
   * Set beyond the slowest reveal a loaded page produces, so it is the safety
   * net for a cue that never comes rather than a second, competing schedule.
   */
  fallbackMs?: number;
  className?: string;
}

/**
 * A headline that is drawn before it is filled.
 *
 * The line paints first as an outline — the glyphs stroked in the accent with
 * no fill at all — and the ink then flows into it as the stroke fades away,
 * leaving exactly the headline the page would otherwise have rendered. Nothing
 * moves and nothing reflows: the type occupies its final box from the first
 * frame, so the section beneath it never shifts.
 *
 * The animation itself is CSS (`.stroke-fill` in `index.css`); what this adds
 * is the cue. A time-based delay was the obvious way to sequence this behind
 * the headline's own decryption and the wrong one — that reveal is driven by an
 * interval, and an interval on a page also painting a globe and a particle
 * field runs long on a slow device, by enough that a fixed delay inks a
 * headline still made of gibberish. Waiting for the words instead makes the
 * order hold on any device.
 *
 * The fallback is not optional. An outline with no fill is decoration, not
 * text, and a headline must never be left as one because a cue that was
 * supposed to arrive did not.
 */
export function StrokeFillText({
  children,
  start = true,
  fallbackMs = 6000,
  className,
}: StrokeFillTextProps) {
  const [inking, setInking] = useState(false);

  useEffect(() => {
    if (start) {
      setInking(true);
      return;
    }

    const timer = window.setTimeout(() => setInking(true), fallbackMs);

    return () => window.clearTimeout(timer);
  }, [start, fallbackMs]);

  return <span className={cn("stroke-fill", inking && "is-inking", className)}>{children}</span>;
}
