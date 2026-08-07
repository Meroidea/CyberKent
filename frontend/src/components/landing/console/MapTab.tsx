import { motion } from "framer-motion";
import { Chip, Panel } from "@/components/landing/console/primitives";

/**
 * Suburb clusters live in a fixed 320×180 coordinate space so the SVG blips and
 * the surrounding layout stay locked together at every screen size.
 */
const CLUSTERS = [
  { suburb: "Broadmeadows", x: 138, y: 118, reports: 46, severity: "high" as const },
  { suburb: "Craigieburn", x: 196, y: 62, reports: 38, severity: "high" as const },
  { suburb: "Sunbury", x: 58, y: 44, reports: 21, severity: "medium" as const },
  { suburb: "Roxburgh Park", x: 172, y: 92, reports: 18, severity: "medium" as const },
  { suburb: "Campbellfield", x: 210, y: 132, reports: 12, severity: "low" as const },
];

const SEVERITY_FILL = {
  high: "fill-rose-500",
  medium: "fill-amber-500",
  low: "fill-emerald-500",
} as const;

const SEVERITY_ACCENT = { high: "rose", medium: "amber", low: "emerald" } as const;

export function MapTab({ animated }: { animated: boolean }) {
  return (
    <div className="grid grid-cols-[1.35fr_1fr] gap-3">
      <Panel title="Reports by suburb" meta="de-identified · rolling 30 days">
        <div className="relative overflow-hidden rounded-lg bg-slate-100/70 dark:bg-black/40">
          <svg viewBox="0 0 320 180" className="h-full w-full" role="img" aria-label="Map of scam report clusters across Hume">
            <defs>
              <pattern id="map-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M20 0H0V20" fill="none" strokeWidth="0.5" className="stroke-slate-300/60 dark:stroke-white/10" />
              </pattern>
            </defs>
            <rect width="320" height="180" fill="url(#map-grid)" />

            {/* Simplified municipality outline. */}
            <path
              d="M40 34 L118 16 L214 30 L268 74 L246 146 L150 164 L74 138 Z"
              className="fill-indigo-500/10 stroke-indigo-500/40 dark:fill-cyan-400/10 dark:stroke-cyan-400/30"
              strokeWidth="1.5"
            />

            {CLUSTERS.map((cluster, index) => (
              <g key={cluster.suburb}>
                {animated ? (
                  <motion.circle
                    cx={cluster.x}
                    cy={cluster.y}
                    r={5}
                    className={SEVERITY_FILL[cluster.severity]}
                    initial={{ opacity: 0.5, scale: 0.6 }}
                    animate={{ opacity: 0, scale: 3 }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      delay: index * 0.45,
                      ease: "easeOut",
                    }}
                    style={{ originX: `${cluster.x}px`, originY: `${cluster.y}px` }}
                  />
                ) : null}
                <circle cx={cluster.x} cy={cluster.y} r={4} className={SEVERITY_FILL[cluster.severity]} />
              </g>
            ))}
          </svg>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip accent="rose">30+ reports</Chip>
          <Chip accent="amber">10–29 reports</Chip>
          <Chip accent="emerald">under 10</Chip>
        </div>
      </Panel>

      <div className="flex flex-col gap-3">
        <Panel title="Top clusters" meta="this month">
          <ul className="flex flex-col gap-1.5">
            {CLUSTERS.map((cluster) => (
              <li
                key={cluster.suburb}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/70 px-2 py-1.5 dark:border-white/5"
              >
                <span className="truncate text-[11px] text-slate-800 dark:text-slate-200">
                  {cluster.suburb}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-400">{cluster.reports}</span>
                  <Chip accent={SEVERITY_ACCENT[cluster.severity]}>{cluster.severity}</Chip>
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="What the map does not show" meta="privacy by design">
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
            Locations are aggregated to suburb level only. No address, name or
            contact detail from a report is ever plotted, and suburbs with too
            few reports to be anonymous are withheld until the count rises.
          </p>
        </Panel>
      </div>
    </div>
  );
}
