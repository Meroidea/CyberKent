import { type RefObject, useEffect } from "react";

/**
 * Reveals injected figures as they come into view.
 *
 * The document body is generated HTML, so its figures cannot be motion
 * components: they carry `data-reveal`, and this adds `is-visible` once each
 * one has entered the viewport. It is added once and never removed — a chart
 * that re-animates every time it scrolls past is a chart that fights the
 * reader for attention.
 *
 * Without an observer, everything is revealed immediately. The animation is
 * the enhancement; the figure is the content, and it must never depend on it.
 */
export function useRevealOnScroll(container: RefObject<HTMLElement>, ready: boolean) {
  useEffect(() => {
    const root = container.current;

    if (!ready || !root) {
      return;
    }

    const figures = [...root.querySelectorAll<HTMLElement>("[data-reveal]")];

    if (!("IntersectionObserver" in window)) {
      for (const figure of figures) {
        figure.classList.add("is-visible");
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      /* A little before the edge, so a figure is already filling in by the
         time it is fully on screen rather than starting once it arrives. */
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );

    for (const figure of figures) {
      observer.observe(figure);
    }

    return () => observer.disconnect();
  }, [container, ready]);
}
