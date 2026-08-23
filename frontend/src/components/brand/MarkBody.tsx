import type { CSSProperties } from "react";
import {
  MARK_BLADE_PATH,
  MARK_BLADE_TRANSFORM,
  MARK_CREASE_PATH,
  MARK_FACET_PATH,
} from "@/components/brand/markGeometry";

/**
 * One blade's worth of tone, as the eight values the shading needs.
 *
 * Passed only where the mark is embedded in a drawing that owns its own light
 * — the boot dial's core well, which is lit teal and would swallow the site
 * palette. Everywhere else the values come from the `--mark-*` custom
 * properties in `index.css`, so the mark follows the theme without the
 * component knowing which theme is on.
 */
export interface MarkTone {
  upper: BladeTone;
  lower: BladeTone;
  /** Colour and strength of the cast shadow. */
  cast: string;
  castOpacity: number;
}

export interface BladeTone {
  /** Lit face, at the blade's tip end. */
  light: string;
  /** The body of the surface. */
  mid: string;
  /** Where the surface turns away — also the occlusion in the curl. */
  deep: string;
  /** The reverse face at the tail: two stops, so it reads as a plane. */
  facetFrom: string;
  facetTo: string;
  /** The fold itself, drawn as a hairline along the crease. */
  crease: string;
  creaseOpacity: number;
}

interface MarkBodyProps {
  /** Unique per instance — gradient and clip ids are document-scoped. */
  uid: string;
  tone?: MarkTone;
  /**
   * Base class for the two blade groups, for the hover choreography. Each also
   * gets a `--lower` / `--upper` modifier, so the two can be moved in
   * opposition without the CSS having to count children — the glint is a
   * sibling, and a positional selector would catch it instead.
   */
  bladeClassName?: string;
  /** Adds the ambient glint that travels across both blades. */
  glint?: boolean;
}

function toneVars(tone: MarkTone): CSSProperties {
  return {
    "--mark-upper-light": tone.upper.light,
    "--mark-upper-mid": tone.upper.mid,
    "--mark-upper-deep": tone.upper.deep,
    "--mark-upper-facet-from": tone.upper.facetFrom,
    "--mark-upper-facet-to": tone.upper.facetTo,
    "--mark-upper-crease": tone.upper.crease,
    "--mark-upper-crease-opacity": tone.upper.creaseOpacity,
    "--mark-lower-light": tone.lower.light,
    "--mark-lower-mid": tone.lower.mid,
    "--mark-lower-deep": tone.lower.deep,
    "--mark-lower-facet-from": tone.lower.facetFrom,
    "--mark-lower-facet-to": tone.lower.facetTo,
    "--mark-lower-crease": tone.lower.crease,
    "--mark-lower-crease-opacity": tone.lower.creaseOpacity,
    "--mark-cast": tone.cast,
    "--mark-cast-opacity": tone.castOpacity,
  } as CSSProperties;
}

/**
 * The mark's drawing, without a viewport of its own.
 *
 * Separate from `LogoMark` because the mark also has to appear inside drawings
 * that already own an `<svg>` — the boot dial and the deck's cover emblem —
 * and a nested viewport there would have to be positioned against two
 * coordinate systems instead of one transform.
 *
 * ## How the depth is built
 *
 * The master is a lit 3D render, and flattening it to two solid fills threw
 * away the thing that made it a form rather than a silhouette. Measuring the
 * render's luminance back out gave the four terms rebuilt here — every one of
 * them a real feature of the surface, not a decoration:
 *
 * 1. **The lengthwise ramp.** Both blades run bright at the tip and fall away
 *    toward the tail: one key light, from above. The ramp is per-blade rather
 *    than across the whole mark, which is what keeps the two halves reading as
 *    the same object lit once rather than as a gradient laid over a shape.
 * 2. **The sheen**, along the convex outer contour — a wide, soft, in-hue
 *    highlight rather than a white rim. The master never goes near white; the
 *    roundness comes from lightness varying within the hue, and a white stroke
 *    reads as glass instead.
 * 3. **The occlusion**, along the concave inner contour, where the curl turns
 *    back on itself and light stops reaching.
 * 4. **The reverse face** at the tail, with the fold drawn as a hairline. It
 *    is the one hard edge in the drawing, and the strongest single cue that
 *    the blade is a ribbon with two sides rather than a flat shape.
 *
 * Because the key light is fixed in the world and the lower blade is the upper
 * one turned a half turn, the two blades' facets are lit oppositely: the lower
 * blade's fold faces up into the light, the upper blade's faces away. That is
 * the asymmetry in the master, and reproducing it is what stops the shading
 * looking applied.
 */
export function MarkBody({ uid, tone, bladeClassName, glint = false }: MarkBodyProps) {
  const id = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;

  return (
    <g style={tone ? toneVars(tone) : undefined}>
      <defs>
        <path id={id("blade")} d={MARK_BLADE_PATH} />
        <path id={id("facet")} d={MARK_FACET_PATH} />
        <path id={id("crease")} d={MARK_CREASE_PATH} fill="none" />

        <clipPath id={id("clip-upper")}>
          <use href={`#${id("blade")}`} />
        </clipPath>
        <clipPath id={id("clip-lower")}>
          <use href={`#${id("blade")}`} transform={MARK_BLADE_TRANSFORM} />
        </clipPath>
        <clipPath id={id("clip-both")}>
          <use href={`#${id("blade")}`} />
          <use href={`#${id("blade")}`} transform={MARK_BLADE_TRANSFORM} />
        </clipPath>

        {/* Lengthwise ramp. Object-bounding-box, so the lower blade's copy is
            turned along with its geometry and both run bright at the tip. */}
        <linearGradient id={id("base-upper")} x1="0.12" y1="0" x2="0.62" y2="1">
          <stop offset="0" stopColor="var(--mark-upper-light)" />
          <stop offset="0.38" stopColor="var(--mark-upper-mid)" />
          <stop offset="1" stopColor="var(--mark-upper-deep)" />
        </linearGradient>
        <linearGradient id={id("base-lower")} x1="0.12" y1="0" x2="0.62" y2="1">
          <stop offset="0" stopColor="var(--mark-lower-light)" />
          <stop offset="0.38" stopColor="var(--mark-lower-mid)" />
          <stop offset="1" stopColor="var(--mark-lower-deep)" />
        </linearGradient>

        <linearGradient id={id("sheen-upper")} x1="0" y1="0.25" x2="1" y2="0.75">
          <stop offset="0.45" stopColor="var(--mark-upper-light)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--mark-upper-light)" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={id("sheen-lower")} x1="0" y1="0.25" x2="1" y2="0.75">
          <stop offset="0.45" stopColor="var(--mark-lower-light)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--mark-lower-light)" stopOpacity="0.95" />
        </linearGradient>

        <linearGradient id={id("ao-upper")} x1="1" y1="0.8" x2="0" y2="0.2">
          <stop offset="0.4" stopColor="var(--mark-upper-deep)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--mark-upper-deep)" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={id("ao-lower")} x1="1" y1="0.8" x2="0" y2="0.2">
          <stop offset="0.4" stopColor="var(--mark-lower-deep)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--mark-lower-deep)" stopOpacity="0.9" />
        </linearGradient>

        <linearGradient id={id("facet-upper")} x1="0" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="var(--mark-upper-facet-from)" />
          <stop offset="1" stopColor="var(--mark-upper-facet-to)" />
        </linearGradient>
        <linearGradient id={id("facet-lower")} x1="0" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="var(--mark-lower-facet-from)" />
          <stop offset="1" stopColor="var(--mark-lower-facet-to)" />
        </linearGradient>

        {glint ? (
          <linearGradient id={id("glint")} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        ) : null}

        {/* Wide enough that the sheen and the occlusion read as light falling
            across a curve rather than as two strokes following an outline. */}
        <filter id={id("soften")} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>

        {/* In user units, so the shadow scales with the mark. A CSS
            drop-shadow would be in screen pixels and would swamp the mark at
            favicon size while vanishing on the deck. */}
        <filter id={id("cast")} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow
            dx="1"
            dy="2.6"
            stdDeviation="2.6"
            floodColor="var(--mark-cast)"
            floodOpacity="var(--mark-cast-opacity)"
          />
        </filter>
      </defs>

      <g filter={url("cast")}>
        {/* Lower blade first: it sits behind where the two pass. */}
        <g className={bladeClassName ? `${bladeClassName} ${bladeClassName}--lower` : undefined}>
          <g clipPath={url("clip-lower")}>
            <use href={`#${id("blade")}`} transform={MARK_BLADE_TRANSFORM} fill={url("base-lower")} />
            <use href={`#${id("facet")}`} transform={MARK_BLADE_TRANSFORM} fill={url("facet-lower")} />
            <use
              href={`#${id("blade")}`}
              transform={MARK_BLADE_TRANSFORM}
              fill="none"
              stroke={url("ao-lower")}
              strokeWidth="11"
              filter={url("soften")}
            />
            <use
              href={`#${id("blade")}`}
              transform={MARK_BLADE_TRANSFORM}
              fill="none"
              stroke={url("sheen-lower")}
              strokeWidth="7"
              filter={url("soften")}
            />
            <use
              href={`#${id("crease")}`}
              transform={MARK_BLADE_TRANSFORM}
              stroke="var(--mark-lower-crease)"
              strokeOpacity="var(--mark-lower-crease-opacity)"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          </g>
        </g>

        <g className={bladeClassName ? `${bladeClassName} ${bladeClassName}--upper` : undefined}>
          <g clipPath={url("clip-upper")}>
            <use href={`#${id("blade")}`} fill={url("base-upper")} />
            <use href={`#${id("facet")}`} fill={url("facet-upper")} />
            <use
              href={`#${id("blade")}`}
              fill="none"
              stroke={url("ao-upper")}
              strokeWidth="11"
              filter={url("soften")}
            />
            <use
              href={`#${id("blade")}`}
              fill="none"
              stroke={url("sheen-upper")}
              strokeWidth="7"
              filter={url("soften")}
            />
            <use
              href={`#${id("crease")}`}
              stroke="var(--mark-upper-crease)"
              strokeOpacity="var(--mark-upper-crease-opacity)"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          </g>
        </g>

        {glint ? (
          <g clipPath={url("clip-both")} aria-hidden="true">
            {/* Rotated by a wrapper rather than on the band itself: the sweep
                animates the band's own transform, and a CSS transform replaces
                the attribute rather than composing with it. */}
            <g transform="rotate(18 32.5 50)">
              <rect
                className="mark-glint"
                x="-34"
                y="-26"
                width="15"
                height="152"
                fill={url("glint")}
              />
            </g>
          </g>
        ) : null}
      </g>
    </g>
  );
}
