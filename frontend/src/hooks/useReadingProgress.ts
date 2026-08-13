import { type RefObject, useEffect, useState } from "react";

/**
 * How far through an element the reader has scrolled, 0 to 1.
 *
 * Measured across one element rather than the page, because on a document the
 * front matter, the contents and the read-next block are not things anyone is
 * "part way through" — only the body is, and counting them makes a reader who
 * has read every word finish at eighty per cent.
 *
 * Two values come back: the continuous fraction, for the spine, and the whole
 * percentage, for the label. The label is state and the spine is not, so a full
 * read re-renders this component at most a hundred times rather than once per
 * scroll frame.
 */
export function useReadingProgress(target: RefObject<HTMLElement>) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;

      const element = target.current;

      if (!element) {
        return;
      }

      const start = element.getBoundingClientRect().top + window.scrollY;
      const span = element.offsetHeight - window.innerHeight;
      const raw = span <= 0 ? (window.scrollY >= start ? 1 : 0) : (window.scrollY - start) / span;
      const value = Math.min(1, Math.max(0, raw));

      document.documentElement.style.setProperty("--reading-progress", String(value));
      setPercent((current) => {
        const whole = Math.round(value * 100);
        return whole === current ? current : whole;
      });
    };

    const schedule = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(measure);
      }
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [target]);

  return percent;
}
