import { useId } from "react";
import {
  MARK_BLADE_PATH,
  MARK_BLADE_TRANSFORM,
  MARK_VIEW_BOX,
} from "@/components/brand/markGeometry";
import { SITE } from "@/config/site";

interface LogoMarkProps {
  className?: string;
  /**
   * Accessible name. Omit wherever the mark sits beside the wordmark or any
   * other rendering of the brand name — a second announcement of "CyberKent"
   * is noise, so the mark goes decorative instead.
   */
  title?: string;
}

/**
 * The CyberKent mark: two blades turning about a shared centre.
 *
 * Both halves are the same path, one of them rotated, so the symmetry is a
 * property of the drawing rather than something two hand-tuned outlines have
 * to keep agreeing on.
 *
 * Colour comes from the four `--mark-*` custom properties in `index.css`
 * rather than from literals, which is what lets one component serve both
 * themes: the light pair is indigo-600→cyan-500 to match the accent gradient
 * the rest of the site is built on, and the dark pair lifts to the -300/-400
 * steps so the mark stays lit against near-black instead of sinking into it.
 *
 * Both blades take the same gradient axis and let the rotation carry it, so
 * the shading turns with the geometry: light at the top of the upper blade,
 * light at the foot of the lower one, deepening where the two pass. A single
 * light source would have meant reversing one of them, and on a mark whose
 * entire read is a half-turn about its centre, shading that breaks the
 * symmetry costs more than the realism buys.
 */
export function LogoMark({ className, title }: LogoMarkProps) {
  const id = useId();
  const upper = `${id}-upper`;
  const lower = `${id}-lower`;

  return (
    <svg
      viewBox={MARK_VIEW_BOX}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...(title ? { role: "img" } : { "aria-hidden": true, focusable: false })}
    >
      {title ? <title>{title}</title> : null}

      <defs>
        <linearGradient id={upper} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="var(--mark-upper-from, #22d3ee)" />
          <stop offset="100%" stopColor="var(--mark-upper-to, #0891b2)" />
        </linearGradient>
        <linearGradient id={lower} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="var(--mark-lower-from, #6366f1)" />
          <stop offset="100%" stopColor="var(--mark-lower-to, #4338ca)" />
        </linearGradient>
      </defs>

      <path d={MARK_BLADE_PATH} transform={MARK_BLADE_TRANSFORM} fill={`url(#${lower})`} />
      <path d={MARK_BLADE_PATH} fill={`url(#${upper})`} />
    </svg>
  );
}

/** The name the mark carries when it is standing in for the brand on its own. */
export const MARK_LABEL = `${SITE.name} logo`;
