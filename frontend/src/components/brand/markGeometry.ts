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
 * Coordinates are in a 65 × 100 box with the artwork bled to the edges. Any
 * padding is the caller's — an icon needs it, a lockup beside the wordmark
 * does not, and baking it in here would make the two impossible to reconcile.
 */
export const MARK_BLADE_PATH =
  "M32.43 0C38.25 6.84 64.94 36.55 64.94 43.16C64.94 57.77 55.25 61.44 43.16 70.78C41.25 68.48 32.63 59.71 32.63 56.97C32.63 52.68 43.09 48.39 43.09 44.91C43.09 39.13 24.99 28.01 24.99 13.81C24.99 5.01 29.81 3.49 32.43 0Z";

export const MARK_VIEW_BOX = "0 0 65 100";

/** Turns the blade into its counterpart about the centre of the box. */
export const MARK_BLADE_TRANSFORM = "rotate(180 32.5 50)";

/** Box dimensions, for callers placing the mark inside a larger drawing. */
export const MARK_WIDTH = 65;
export const MARK_HEIGHT = 100;
