import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Adds a soft accent bloom in the top-right corner. */
  glow?: boolean;
}

/** The one glass card definition — every surface on the page composes it. */
export function GlassPanel({ children, glow = false, className, ...rest }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "glass-surface relative overflow-hidden rounded-2xl transition-colors duration-300",
        className,
      )}
      {...rest}
    >
      {glow ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl dark:bg-cyan-400/20"
        />
      ) : null}
      {children}
    </div>
  );
}
