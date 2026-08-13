import { Suspense, lazy, useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { GLOBE_PALETTES } from "@/components/globe/globeData";
import { useTheme } from "@/theme/useTheme";
import { cn } from "@/lib/cn";

const World = lazy(() =>
  import("@/components/globe/World").then((module) => ({ default: module.World })),
);

/**
 * Whether this browser can give us a WebGL context at all.
 *
 * Evaluated once at module scope: creating throwaway contexts is not free, and
 * the answer cannot change within a session. A machine with WebGL disabled, a
 * blocked GPU driver or a locked-down council SOE all land here, and every one
 * of them needs the page to still work.
 */
export const HAS_WEBGL = (() => {
  if (typeof document === "undefined") {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
})();

/**
 * The still frame shown wherever the globe cannot or should not animate:
 * no WebGL, reduced motion, or the moment before the chunk arrives. It is a
 * plain gradient disc with a graticule, so the column is never empty and never
 * jumps in height when the real globe replaces it.
 */
function GlobeFallback({ spin }: { spin: boolean }) {
  return (
    <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 200 200" className={cn("h-[86%] w-[86%]", spin && "animate-[spin_38s_linear_infinite]")}>
        <defs>
          <radialGradient id="scan-globe-body" cx="35%" cy="30%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="70%" stopColor="#101c46" />
            <stop offset="100%" stopColor="#070f2a" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="72" fill="url(#scan-globe-body)" />
        <circle cx="100" cy="100" r="72" fill="none" stroke="#38bdf8" strokeWidth="0.75" opacity="0.5" />
        <g fill="none" stroke="#7dd3fc" strokeWidth="0.6" opacity="0.35">
          <circle cx="100" cy="100" r="72" />
          <ellipse cx="100" cy="100" rx="24" ry="72" />
          <ellipse cx="100" cy="100" rx="50" ry="72" />
          <line x1="28" y1="100" x2="172" y2="100" />
          <ellipse cx="100" cy="100" rx="72" ry="30" />
          <ellipse cx="100" cy="100" rx="72" ry="56" />
        </g>
      </svg>
    </div>
  );
}

export interface ScanGlobeProps {
  /** Runs the arcs and rings hot, for the moment a check is being made. */
  scanning?: boolean;
  className?: string;
}

/**
 * The globe, with every reason it might not render handled in one place.
 *
 * `three` and `three-globe` are a large dependency, so `World` is behind a
 * `lazy` boundary and never enters the main bundle — a visitor who only reads
 * the landing page never downloads it.
 */
export function ScanGlobe({ scanning = false, className }: ScanGlobeProps) {
  const { theme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const palette = useMemo(() => GLOBE_PALETTES[theme], [theme]);

  if (!HAS_WEBGL || prefersReducedMotion) {
    return (
      <div className={className}>
        <GlobeFallback spin={false} />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className={className}>
          <GlobeFallback spin />
        </div>
      }
    >
      <World
        palette={palette}
        scanning={scanning}
        autoRotateSpeed={scanning ? 0.32 : 0.09}
        className={className}
      />
    </Suspense>
  );
}
