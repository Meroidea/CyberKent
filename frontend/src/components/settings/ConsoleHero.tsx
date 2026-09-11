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
    <header className="-mt-2 flex flex-col items-center pb-1 text-center">
      <span
        aria-hidden="true"
        className={cn("flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.375rem] text-white", tint)}
      >
        {tile ?? (Icon ? <Icon className="h-9 w-9" /> : null)}
      </span>
      {children ? (
        <div className="mt-4 max-w-[30rem] text-[0.9375rem] leading-relaxed text-ui-label-2">{children}</div>
      ) : null}
    </header>
  );
}
