import { cn } from "@/lib/cn";

/**
 * One placeholder block.
 *
 * The sweep is a child element translated across the block rather than an
 * animated background-position: a gradient background would have to repaint the
 * block every frame, where a transform on a child composites.
 */
function Block({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-slate-300/70 dark:bg-white/[0.10]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/[0.09]"
        style={{ animation: "skeleton-sweep 1.6s ease-in-out infinite" }}
      />
    </div>
  );
}

/** Four placeholder cells on a row, used by the tracker and the alert rails. */
function Row({ cells, className }: { cells: number; className?: string }) {
  return (
    <div className={cn("flex gap-4", className)}>
      {Array.from({ length: cells }, (_, index) => (
        <Block key={index} className="h-full flex-1" />
      ))}
    </div>
  );
}

/**
 * Wireframe of the real page, shown beneath the boot dial.
 *
 * It mirrors the actual composition — masthead, hero column, device, tracker
 * row, alert rails — so the interface appears to be assembling itself into the
 * shape it will occupy, rather than a generic grey placeholder being swapped for
 * an unrelated layout.
 */
export function PageSkeleton() {
  return (
    <div aria-hidden="true" className="min-h-viewport pointer-events-none select-none">
      {/* Masthead */}
      <div className="flex h-20 items-center justify-between px-6 lg:px-10">
        <Block className="h-7 w-36" />
        <div className="hidden items-center gap-8 lg:flex">
          {Array.from({ length: 5 }, (_, index) => (
            <Block key={index} className="h-3.5 w-16" />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Block className="h-9 w-9 rounded-full" />
          <Block className="h-10 w-32 rounded-full" />
        </div>
      </div>

      {/* Hero column */}
      <div className="container flex flex-col items-center gap-5 pt-16 sm:pt-24">
        <Block className="h-7 w-56 rounded-full" />
        <Block className="h-3.5 w-64" />
        <Block className="h-12 w-full max-w-2xl sm:h-16" />
        <Block className="h-12 w-full max-w-md sm:h-16" />
        <Block className="mt-2 h-4 w-full max-w-xl" />
        <Block className="h-4 w-full max-w-lg" />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <Block className="h-12 w-48 rounded-full" />
          <Block className="h-12 w-40 rounded-full" />
        </div>
      </div>

      {/* Device */}
      <div className="container mt-16">
        <Block className="mx-auto h-64 w-full rounded-[2rem] sm:h-80 lg:w-4/5" />
      </div>

      {/* Step tracker */}
      <div className="container mt-24 flex flex-col gap-6">
        <Block className="h-7 w-32 rounded-full" />
        <Block className="h-10 w-full max-w-lg" />
        <Row cells={4} className="mt-4 h-28" />
      </div>

      {/* Alert rails */}
      <div className="mt-24 flex flex-col gap-4 overflow-hidden px-6">
        <Row cells={6} className="h-44" />
        <Row cells={6} className="h-44" />
      </div>
    </div>
  );
}
