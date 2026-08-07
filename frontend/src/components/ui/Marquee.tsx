import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  /** Run right-to-left instead of left-to-right. */
  reverse?: boolean;
  pauseOnHover?: boolean;
  /**
   * Copies of the child set laid end to end.
   *
   * Every copy slides left by one copy-width per cycle, so at the far end of a
   * cycle the rail is only `(repeat - 1) x copyWidth` wide. That has to still
   * cover the viewport or a gap opens at the trailing edge — three copies of a
   * roughly screen-wide set covers displays up to about 2800px, where two would
   * tear on anything wider than a single copy. Each extra copy is real DOM that
   * stays composited, so this is the smallest number that holds.
   */
  repeat?: number;
}

/**
 * Continuously scrolling row.
 *
 * The animation translates one copy's width plus one gap, which is why the
 * children are rendered `repeat` times: at the moment the first copy has fully
 * left, the second is exactly where the first began and the reset is invisible.
 *
 * Under reduced motion the track stops and the rail becomes an ordinary
 * horizontal scroller, so the content stays reachable rather than being frozen
 * mid-row with the remainder unreachable.
 */
export function Marquee({
  children,
  className,
  reverse = false,
  pauseOnHover = false,
  repeat = 3,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        "group flex flex-row items-stretch overflow-hidden [--duration:48s] [--gap:1.25rem] [gap:var(--gap)]",
        "motion-reduce:overflow-x-auto motion-reduce:[scrollbar-width:none]",
        className,
      )}
    >
      {Array.from({ length: repeat }, (_, index) => (
        <div
          key={index}
          aria-hidden={index > 0}
          className={cn(
            "flex shrink-0 flex-row items-stretch [gap:var(--gap)]",
            "animate-marquee will-change-transform motion-reduce:animate-none",
            reverse && "[animation-direction:reverse]",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
