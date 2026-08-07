import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PillProps {
  children: ReactNode;
  className?: string;
  /** Renders a pulsing status dot before the label. */
  withDot?: boolean;
  dotClassName?: string;
}

/** Small blurred badge used above headlines and inside panels. */
export function Pill({ children, className, withDot = false, dotClassName }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/70 px-4 py-1.5 text-xs font-medium tracking-wide text-slate-600 backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
        className,
      )}
    >
      {withDot ? (
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/70",
              dotClassName,
            )}
          />
          <span
            className={cn("relative inline-flex h-2 w-2 rounded-full bg-emerald-500", dotClassName)}
          />
        </span>
      ) : null}
      {children}
    </span>
  );
}
