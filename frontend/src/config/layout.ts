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
 * Space a scroll target is left clear of the fixed masthead.
 *
 * The bar itself is 4rem; the remaining 2rem is so a heading lands *under* the
 * header rather than against it. `:target { scroll-margin-top }` in `index.css`
 * and the heading offset in `styles/document.css` are the same distance
 * expressed for the browser's own jump, which is what runs on a cold load with
 * a hash in the address bar — keep the three in step.
 */
export const HEADER_CLEARANCE = 96;

/**
 * Viewport height the console's per-tier rest positions were tuned against.
 *
 * The reserved zone scales with the viewport but the device does not, so a
 * rest position that is correct on a laptop leaves the frame almost fully
 * exposed on a tall desktop. The console corrects for the difference from this
 * reference; see `ConsoleShowcase`.
 */
export const REFERENCE_VIEWPORT_HEIGHT = 880;

/**
 * The width at which a document reader gains its contents rail.
 *
 * Named here because two places need it and only one of them is CSS: Tailwind's
 * `rail` screen is built from this value, and `DocumentPage` reads the same
 * number to decide whether the contents belong in a rail beside the measure or
 * in a drawer over it. Written twice, the two would disagree eventually — and
 * the failure would be silent: a width with the rail hidden and the drawer
 * disabled, so the contents are simply unreachable.
 */
export const RAIL_BREAKPOINT = 1180;

/** The width at which a second rail fits on the other side of the measure. */
export const RAILS_BREAKPOINT = 1400;

/**
 * Narrowest viewport the presentation deck is offered on.
 *
 * A slide is a fixed 1280×720 composition scaled whole to the screen, which is
 * what keeps a rehearsed layout identical on a projector. The same property is
 * why it cannot be offered on a phone: scaled into 375px the stage runs at 0.29,
 * and type set at 10px inside it lands under 3px. There is no reflow to fall back
 * on by design, so below this width the deck is not offered at all rather than
 * offered unreadable — the document itself is the mobile reading surface.
 */
export const DECK_MIN_WIDTH = 1024;
