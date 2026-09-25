import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The block between a console screen's title and its first card: a tinted
 * tile and a sentence about what the screen is for. The same shape the
 * assistant and placeholder screens draw inline.
 */
export function ConsoleHero({
  icon: Icon,
  tint = "bg-gradient-to-br from-indigo-600 to-cyan-500",
  tile,
  children,
}: {
  icon?: ComponentType<{ className?: string }>;
  tint?: string;
  /** Replaces the icon — initials, a reference number. */
  tile?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="ck-card relative flex items-center gap-4 overflow-hidden rounded-[1.25rem] bg-ui-card p-4 sm:gap-5 sm:p-5">
      {/* A wash of the tile's colour across the card, so the lede reads as the
          screen's own rather than one more grey row. */}
      <span aria-hidden="true" className={cn("pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full opacity-[0.14] blur-3xl", tint)} />
      <span
        aria-hidden="true"
        className={cn(
          "ck-float relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-indigo-500/25 sm:h-16 sm:w-16",
          tint,
        )}
      >
        {tile ?? (Icon ? <Icon className="h-7 w-7 sm:h-8 sm:w-8" /> : null)}
      </span>
      {children ? (
        <div className="relative min-w-0 flex-1 text-[0.9375rem] leading-relaxed text-ui-label-2">{children}</div>
      ) : null}
    </header>
  );
}
