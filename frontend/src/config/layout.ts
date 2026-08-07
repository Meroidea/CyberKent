/**
 * Share of the first screen the hero reserves at its foot, and the exact amount
 * the console section is pulled up by.
 *
 * The two must stay identical or the device stops cresting the fold, so the
 * value lives here rather than being written into both components.
 */
export const HERO_PEEK_FRACTION = 0.3;

/*
 * The same reservation as a CSS length lives in `src/index.css` as
 * `.hero-peek-zone` / `.console-pull-up`, where it can carry a `vh` fallback
 * ahead of `svh` — a unit an older browser would otherwise drop entirely,
 * leaving no reserved zone at all. Keep the two in step with the fraction here.
 */

/**
 * Viewport height the console's per-tier rest positions were tuned against.
 *
 * The reserved zone scales with the viewport but the device does not, so a
 * rest position that is correct on a laptop leaves the frame almost fully
 * exposed on a tall desktop. The console corrects for the difference from this
 * reference; see `ConsoleShowcase`.
 */
export const REFERENCE_VIEWPORT_HEIGHT = 880;
