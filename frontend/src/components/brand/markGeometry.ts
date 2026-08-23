/**
 * The CyberKent mark, as geometry.
 *
 * The mark is two interlocking blades with 180° rotational symmetry, so only
 * one blade is described here — the second is the same path turned about the
 * centre of the box. Keeping it to a single path is not just brevity: it is
 * what guarantees the two halves stay identical if the curve is ever redrawn,
 * which is the whole read of the mark.
 *
 * Six cubic segments, traced from the master artwork and refitted with the
 * tangents pinned vertical at each extreme, so the silhouette tracks the
 * original to within 0.7% of its height while the handles stay well behaved
 * enough to hint cleanly at favicon sizes.
 *
 * The blade occupies a 65 × 100 box. The view box around it is larger, because
 * the mark casts a shadow and a filter cannot paint outside the viewport it is
 * rendered in. Padding is deliberately symmetric about the blade box so the
 * centre of rotation is also the centre of the view box, which is what lets
 * every animation use a plain `transform-origin: 50% 50%`.
 */
export const MARK_BLADE_PATH =
  "M32.43 0C38.25 6.84 64.94 36.55 64.94 43.16C64.94 57.77 55.25 61.44 43.16 70.78C41.25 68.48 32.63 59.71 32.63 56.97C32.63 52.68 43.09 48.39 43.09 44.91C43.09 39.13 24.99 28.01 24.99 13.81C24.99 5.01 29.81 3.49 32.43 0Z";

/**
 * The ribbon's reverse face, at the blade's tail.
 *
 * Where the blade turns over, the surface the light was falling on rotates
 * away and its underside comes into view — a real edge, not a gradient. The
 * master artwork shows it as a hard colour break, and the arc below is that
 * break, measured off the render: it runs the full width of the blade at
 * y≈58 and bows 2.5 units lower through the middle.
 *
 * Drawn as a wedge running off past the blade's tip rather than as a closed
 * facet, so it only ever appears where the blade clips it — the crease has to
 * meet the silhouette exactly, and a second outline tracing the same curve is
 * a second thing to keep in agreement.
 */
export const MARK_FACET_PATH = "M32.8 58.3Q46.1 63.15 59.4 57.4L72 96 20 96Z";

/** The crease alone, for the lit edge drawn along the fold. */
export const MARK_CREASE_PATH = "M32.8 58.3Q46.1 63.15 59.4 57.4";

/** Turns the blade into its counterpart about the centre of the box. */
export const MARK_BLADE_TRANSFORM = "rotate(180 32.5 50)";

/**
 * The drawing's own box, inside the padded view box. Callers placing the mark
 * inside a larger drawing size against these, not against the view box.
 */
export const MARK_WIDTH = 65;
export const MARK_HEIGHT = 100;
export const MARK_CENTRE_X = 32.5;
export const MARK_CENTRE_Y = 50;

/** Padding around the blade box, for the cast shadow. */
const MARK_PAD_X = 5;
const MARK_PAD_Y = 6.5;

export const MARK_VIEW_BOX = `${-MARK_PAD_X} ${-MARK_PAD_Y} ${MARK_WIDTH + MARK_PAD_X * 2} ${MARK_HEIGHT + MARK_PAD_Y * 2}`;

/** View box dimensions — what a rendered `height` actually buys. */
export const MARK_VIEW_WIDTH = MARK_WIDTH + MARK_PAD_X * 2;
export const MARK_VIEW_HEIGHT = MARK_HEIGHT + MARK_PAD_Y * 2;
