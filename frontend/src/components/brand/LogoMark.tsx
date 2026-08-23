import { useId } from "react";
import { MarkBody, type MarkTone } from "@/components/brand/MarkBody";
import { MARK_VIEW_BOX } from "@/components/brand/markGeometry";
import { cn } from "@/lib/cn";
import { SITE } from "@/config/site";

interface LogoMarkProps {
  className?: string;
  /**
   * Accessible name. Omit wherever the mark sits beside the wordmark or any
   * other rendering of the brand name — a second announcement of "CyberKent"
   * is noise, so the mark goes decorative instead.
   */
  title?: string;
  /**
   * Runs the light sweep across the blades. On by default at the sizes the
   * mark is normally used; pass `false` for a mark rendered small enough or
   * numerous enough that an ambient loop is a cost with nothing to show.
   */
  glint?: boolean;
  /** Overrides the theme tone. See `MarkTone`. */
  tone?: MarkTone;
}

/**
 * The CyberKent mark: two blades turning about a shared centre.
 *
 * Both halves are the same path, one of them rotated, so the symmetry is a
 * property of the drawing rather than something two hand-tuned outlines have
 * to keep agreeing on. The shading that makes it read as a form rather than a
 * silhouette is described in `MarkBody`.
 *
 * Colour comes from the `--mark-*` custom properties in `index.css`, which is
 * what lets one component serve both themes: the light pair is built on the
 * indigo-600 / cyan-500 accent the rest of the site uses, and the dark pair
 * lifts the same ramp so the mark stays lit against near-black instead of
 * sinking into it. The cast shadow swaps with them — a real shadow over a
 * white page, and over near-black a shadow no one can see, so there it becomes
 * a faint bloom of the mark's own colour instead.
 *
 * The view box carries padding around the drawing for the shadow. A rendered
 * height therefore buys a mark about 89% of it — worth knowing when sizing one
 * against type.
 */
export function LogoMark({ className, title, glint = true, tone }: LogoMarkProps) {
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      viewBox={MARK_VIEW_BOX}
      className={cn("logo-mark", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...(title ? { role: "img" } : { "aria-hidden": true, focusable: false })}
    >
      {title ? <title>{title}</title> : null}
      <MarkBody uid={uid} tone={tone} glint={glint} bladeClassName="logo-mark__blade" />
    </svg>
  );
}

/** The name the mark carries when it is standing in for the brand on its own. */
export const MARK_LABEL = `${SITE.name} logo`;
