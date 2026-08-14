import gsap from "gsap";
import Lenis from "lenis";
import { HEADER_CLEARANCE } from "@/config/layout";

/**
 * Site-wide smooth scrolling.
 *
 * Lenis rather than GSAP's ScrollSmoother, deliberately. ScrollSmoother works
 * by translating a wrapper element, which leaves the native scroll position
 * jumping instantly while the content eases along behind it — every
 * `useScroll` animation on this site reads that native position, so the
 * parallax would run ahead of the thing it is parallaxing. The fixed header and
 * the document rails' `position: sticky` would also be inside a transformed
 * ancestor, which is the one place neither works.
 *
 * Lenis instead interpolates and drives the *real* window scroll. Everything
 * that reads `scrollY`, measures a rect, or observes an intersection keeps
 * working untouched, and the smoothing is the only thing that changed.
 *
 * GSAP still owns the clock: one shared `gsap.ticker` loop drives Lenis rather
 * than a second `requestAnimationFrame` of its own, so a scroll frame and an
 * animation frame can never land out of step.
 */

/**
 * Interpolation strength per frame, not a duration.
 *
 * Lenis normalises this against frame time, so the glide lasts the same wall
 * time at 60Hz and at 120Hz. 0.11 settles in a little under a second: enough to
 * read as weighted, short enough that the page still stops roughly where the
 * hand expects it to.
 */
const WHEEL_LERP = 0.11;

/** Timed easing for programmatic jumps, where there is no input to track. */
const ANCHOR_DURATION = 1.05;

/** `EASE_OUT_EXPO` from `lib/motion`, as the scalar form Lenis wants. */
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

let lenis: Lenis | null = null;

/**
 * Outstanding reasons the page is being held still.
 *
 * Counted rather than boolean because the reasons overlap — the boot sequence
 * holds the page, and so does an open menu — and the last one to finish must
 * not release a hold the other still wants.
 */
let holds = 0;

/** The live instance, or null when smoothing is not running. */
export function getSmoothScroll(): Lenis | null {
  return lenis;
}

/**
 * Starts smoothing and returns the teardown.
 *
 * Safe to call again after teardown: nothing is left attached to the ticker or
 * the document, which is what makes React's double-invoked effects harmless.
 */
export function startSmoothScroll(): () => void {
  if (lenis) {
    return () => undefined;
  }

  const instance = new Lenis({
    lerp: WHEEL_LERP,
    smoothWheel: true,
    /*
     * Touch is left native. A finger already carries its own momentum, and
     * running that through a second interpolator is what makes "smooth scroll"
     * sites feel like they are lagging a phone rather than gliding on one.
     */
    syncTouch: false,
    /* A scrollable panel under the pointer scrolls itself. */
    allowNestedScroll: true,
    /* Inertia does not carry across a route change into the next page. */
    stopInertiaOnNavigate: true,
    /* Anchors are handled below instead, so they can clear the header. */
    anchors: false,
    /* The ticker below drives this; a second rAF loop would fight it. */
    autoRaf: false,
  });

  lenis = instance;

  const tick = (time: number) => {
    /* gsap counts in seconds, Lenis in milliseconds. */
    instance.raf(time * 1000);
  };

  gsap.ticker.add(tick);
  /*
   * GSAP normally absorbs a long frame by pretending less time passed, which
   * would desynchronise the scroll position from the scrollbar after any hitch
   * — a tab returning to the foreground, a heavy paint. Scrolling has to track
   * the input device exactly, so the smoothing is turned off.
   */
  gsap.ticker.lagSmoothing(0);

  document.addEventListener("click", onDocumentClick);

  if (holds > 0) {
    instance.stop();
  }

  /* A handle to step and inspect the scroll from the console. Development
     only — nothing in the app reads it. */
  if (import.meta.env.DEV) {
    (window as unknown as { __lenis?: Lenis }).__lenis = instance;
  }

  return () => {
    document.removeEventListener("click", onDocumentClick);
    gsap.ticker.remove(tick);
    gsap.ticker.lagSmoothing(500, 33);
    instance.destroy();
    lenis = null;
  };
}

/**
 * Returns the page to the top on navigation, without the glide.
 *
 * `force` because this also has to land while the page is held — the boot
 * sequence holds it, and arriving on a route half-way down is worse than
 * arriving on one that cannot yet be scrolled.
 */
export function jumpToTop() {
  if (lenis) {
    lenis.scrollTo(0, { immediate: true, force: true });
    refreshSmoothScroll();
    return;
  }

  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

/**
 * Re-measures the page.
 *
 * Lenis caches how far the document can scroll and watches for changes with a
 * `ResizeObserver`, but that observer is delivered with a frame — so a height
 * that changes while the tab is in the background, or in the same beat as a
 * route swap, can leave the cached limit behind. A stale limit is not a subtle
 * failure: the page simply refuses to scroll past a bottom that is no longer
 * there. This is called at the two points the height moves by a whole screen —
 * the boot screen handing over, and a navigation.
 */
export function refreshSmoothScroll() {
  lenis?.resize();
}

/** Glides to an element, stopping it clear of the fixed header. */
export function smoothScrollTo(target: HTMLElement | number, offset = -HEADER_CLEARANCE) {
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: ANCHOR_DURATION, easing: easeOutExpo });
    return;
  }

  const top =
    typeof target === "number"
      ? target + offset
      : target.getBoundingClientRect().top + window.scrollY + offset;

  window.scrollTo({ top, behavior: "smooth" });
}

/**
 * Holds the page still until the returned release is called.
 *
 * Both halves are needed: stopping Lenis is what ignores the wheel, and the
 * overflow is what covers the moment before smoothing has started — and the
 * reader who has reduced motion turned on, for whom it never does.
 */
export function holdScroll(): () => void {
  holds += 1;
  applyHold();

  let released = false;

  return () => {
    if (released) {
      return;
    }

    released = true;
    holds -= 1;
    applyHold();
  };
}

function applyHold() {
  const held = holds > 0;

  document.body.style.overflow = held ? "hidden" : "";

  if (!lenis) {
    return;
  }

  if (held) {
    lenis.stop();
    return;
  }

  lenis.start();
  /* Whatever was holding the page — the boot sequence, a menu — the page under
     it is a different height now than when the hold went on. */
  lenis.resize();
}

/**
 * Sends in-page links through the smoothing.
 *
 * Delegated at the document rather than bound per link, because the anchors
 * that matter are spread across the header, the footer, the contents rail and
 * the body of every published document.
 */
function onDocumentClick(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0) {
    return;
  }

  /* A modified click is a request for a new tab or a download, not a jump. */
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  const anchor = (event.target as Element | null)?.closest?.("a");

  if (!anchor?.href || anchor.target === "_blank" || anchor.hasAttribute("download")) {
    return;
  }

  const url = new URL(anchor.href);
  const here = new URL(window.location.href);

  /* Only a hash on the page already open — anything else is navigation. */
  if (url.host !== here.host || url.pathname !== here.pathname || !url.hash) {
    return;
  }

  const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));

  if (!target) {
    return;
  }

  event.preventDefault();
  window.history.pushState(null, "", url.hash);
  smoothScrollTo(target);

  /*
   * Preventing the default also drops the focus move the browser would have
   * made, which is the whole point of the skip link. Moving it here keeps the
   * keyboard behaviour and gains the one thing the native jump lacks: the
   * scroll is not undone by the browser re-centring the newly focused element.
   */
  if (!target.hasAttribute("tabindex")) {
    target.setAttribute("tabindex", "-1");
  }

  target.focus({ preventScroll: true });
}
