import { useEffect, useRef, useState } from "react";

/**
 * A number that counts up to its value the first time it arrives, and glides
 * to any new value after. A figure that animates in reads as live; one that
 * pops in reads as a page loading. Skipped entirely for readers who ask for
 * reduced motion.
 */
export function CountUp({ value, duration = 900, format = (n: number) => Math.round(n).toLocaleString("en-AU") }: { value: number; duration?: number; format?: (n: number) => string }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(2, -10 * t);
      setShown(origin + (value - origin) * (t === 1 ? 1 : eased));
      if (t < 1) frame = requestAnimationFrame(step);
      else from.current = value;
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span className="tabular-nums">{format(shown)}</span>;
}
