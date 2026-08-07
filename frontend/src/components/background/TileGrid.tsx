import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

const COLUMNS = 40;
const ROWS = 18;
const TILES = Array.from({ length: COLUMNS * ROWS }, (_, index) => index);

/**
 * Hairline grid whose cells fill with `--tile` on hover.
 *
 * Deliberately plain DOM nodes with a CSS-only hover: an equivalent grid of
 * motion components with per-tile handlers costs far more than the effect is
 * worth on a page that already runs several scroll-driven scenes.
 */
export function TileGrid({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute inset-0 grid opacity-60 dark:opacity-40",
        "[grid-template-columns:repeat(var(--tile-columns),minmax(0,1fr))]",
        "[grid-template-rows:repeat(var(--tile-rows),minmax(0,1fr))]",
        className,
      )}
      style={
        {
          "--tile-columns": COLUMNS,
          "--tile-rows": ROWS,
        } as CSSProperties
      }
    >
      {TILES.map((tile) => (
        <div
          key={tile}
          className="border-b border-r border-slate-900/[0.04] transition-colors duration-700 hover:bg-[var(--tile)] hover:duration-0 dark:border-white/[0.04]"
        />
      ))}
    </div>
  );
}
