import { useEffect, useRef } from "react";

interface EdgeSwipeOptions {
  /** Fired on a left-to-right swipe. */
  onOpen: () => void;
  /** Fired on a right-to-left swipe. */
  onClose: () => void;
  /** Off entirely when false, so a wide screen installs no listeners. */
  enabled: boolean;
}

/** Minimum horizontal travel, in pixels, before a drag counts as a swipe. */
const DISTANCE = 56;

/**
 * How much straighter than tall a swipe has to be.
 *
 * A document is a vertical surface: most gestures on it are scrolls, and a scroll
 * that drifts sideways must not open anything. Requiring the horizontal component
 * to be twice the vertical is what separates "swiped across" from "scrolled a bit
 * crookedly".
 */
const STRAIGHTNESS = 2;

/** Beyond this the gesture is a drag or a hesitation, not a swipe. */
const TIMEOUT_MS = 700;

/**
 * iOS reserves the outermost strip of the screen for its own back gesture.
 *
 * A drawer that also answered a touch starting there would be racing the
 * browser for the same swipe, and the browser wins — so the band is simply
 * ceded.
 */
const SYSTEM_EDGE = 28;

/**
 * Opens and closes something with a horizontal swipe.
 *
 * Listeners are passive: this never prevents a scroll, it only reads where one
 * went. That matters on the surface it is used on — the specification has
 * horizontally scrollable tables in it, and a swipe that begins inside one is
 * that table being scrolled, so those are ignored outright rather than
 * arbitrated after the fact.
 */
export function useEdgeSwipe({ onOpen, onClose, enabled }: EdgeSwipeOptions) {
  /* Held in a ref so a changing handler cannot re-install the listeners
     mid-gesture and lose the touch that started it. */
  const handlers = useRef({ onOpen, onClose });
  handlers.current = { onOpen, onClose };

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let startX = 0;
    let startY = 0;
    let startedAt = 0;
    let tracking = false;

    const scrollsHorizontally = (target: EventTarget | null) => {
      let node = target instanceof Element ? target : null;

      while (node) {
        if (node.scrollWidth > node.clientWidth + 1) {
          const overflow = window.getComputedStyle(node).overflowX;

          if (overflow === "auto" || overflow === "scroll") {
            return true;
          }
        }

        node = node.parentElement;
      }

      return false;
    };

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];

      tracking = false;

      if (!touch || event.touches.length > 1) {
        return;
      }

      if (touch.clientX < SYSTEM_EDGE || touch.clientX > window.innerWidth - SYSTEM_EDGE) {
        return;
      }

      if (scrollsHorizontally(event.target)) {
        return;
      }

      startX = touch.clientX;
      startY = touch.clientY;
      startedAt = event.timeStamp;
      tracking = true;
    };

    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0];

      if (!tracking || !touch) {
        return;
      }

      tracking = false;

      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      if (event.timeStamp - startedAt > TIMEOUT_MS) {
        return;
      }

      if (Math.abs(dx) < DISTANCE || Math.abs(dx) < Math.abs(dy) * STRAIGHTNESS) {
        return;
      }

      if (dx > 0) {
        handlers.current.onOpen();
      } else {
        handlers.current.onClose();
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled]);
}
