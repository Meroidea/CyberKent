import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import { SegmentedControl, type Segment } from "@/components/settings/SegmentedControl";
import {
  CLUSTERS,
  SEVERITY_FILL,
  SEVERITY_LABEL,
  SEVERITY_STROKE,
  SEVERITY_TEXT,
  SEVERITY_TINT,
  type Severity,
} from "@/components/landing/console/deviceData";
import { ControlLabel, HeroRing } from "@/components/landing/console/paneParts";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { cn } from "@/lib/cn";

type MapFilter = Severity | "all";

const FILTERS: readonly Segment<MapFilter>[] = [
  { value: "all", label: "All" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Clear" },
];

const TOTAL_REPORTS = CLUSTERS.reduce((sum, cluster) => sum + cluster.reports, 0);

/**
 * The municipality, drawn in a fixed 320×180 space.
 *
 * The outline is deliberately schematic rather than a real boundary: at this
 * size a traced coastline is a smudge, and a map that looks surveyed invites
 * someone to read a street off it. What has to be legible is the clustering,
 * so that is all the drawing carries.
 */
function ClusterMap({ shown, animated }: { shown: typeof CLUSTERS; animated: boolean }) {
  return (
    <div className="relative w-[19rem] shrink-0 overflow-hidden rounded-ui bg-ui-card">
      <svg
        viewBox="0 0 320 180"
        className="h-full w-full"
        role="img"
        aria-label="Scam report clusters across Hume, aggregated to suburb level"
      >
        <defs>
          <pattern id="console-map-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" strokeWidth="0.5" className="stroke-ui-separator" />
          </pattern>
        </defs>
        <rect width="320" height="180" fill="url(#console-map-grid)" />

        {/* Painted from the palette rather than from `--ui-tint`: the accent
            token is a bare `var()`, so Tailwind cannot fold an opacity into it
            and `fill-ui-tint/10` resolves to black. These are the two colours
            the token holds in each theme, at the alpha the outline needs. */}
        <path
          d="M40 34 L118 16 L214 30 L268 74 L246 146 L150 164 L74 138 Z"
          className="fill-indigo-500/10 stroke-indigo-500/40 dark:fill-cyan-400/10 dark:stroke-cyan-400/30"
          strokeWidth="1.5"
        />

        {shown.map((cluster, index) => (
          <g key={cluster.suburb}>
            {animated ? (
              <motion.circle
                cx={cluster.x}
                cy={cluster.y}
                r={5}
                className={SEVERITY_FILL[cluster.severity]}
                initial={{ opacity: 0.45, scale: 0.6 }}
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
  );
}

/**
 * The scam map, as a settings pane.
 *
 * The map is the pane's object — the place the accessory render sits — so it
 * is put beside its ring rather than above it: it is the one graphic on the
 * device that is wider than it is tall, and stacking a ring under it would
 * cost the list below four rows for no gain.
 *
 * Filtering drives the map and the list from the same state, which is the
 * point of having both: the dots that vanish and the rows that vanish are the
 * same reports.
 */
export function MapPane({ animated }: { animated: boolean }) {
  const [filter, setFilter] = useState<MapFilter>("all");
  const shown = filter === "all" ? CLUSTERS : CLUSTERS.filter((c) => c.severity === filter);
  const reports = shown.reduce((sum, cluster) => sum + cluster.reports, 0);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        className="flex items-center justify-center gap-6"
      >
        <ClusterMap shown={shown} animated={animated} />
        <HeroRing
          value={Math.round((reports / TOTAL_REPORTS) * 100)}
          caption="of 30-day reports"
          trackClassName={filter === "all" ? undefined : SEVERITY_STROKE[filter]}
        />
      </motion.div>

      <div>
        <ControlLabel>Severity</ControlLabel>
        <SegmentedControl
          segments={FILTERS}
          value={filter}
          onChange={setFilter}
          label="Filter the map by severity"
        />
      </div>

      <SettingsGroup
        title="Suburbs reporting"
        action={<span className="text-[0.8125rem] text-ui-label-2">{reports} reports</span>}
        footer="Aggregated to suburb level only. No address, name or contact detail is ever plotted, and a suburb is withheld until it has enough reports to stay anonymous."
      >
        <SettingsRows inset={52}>
          {shown.map((cluster) => (
            <SettingsRow
              key={cluster.suburb}
              icon={MapPin}
              iconClassName={cn(SEVERITY_TINT[cluster.severity])}
              label={cluster.suburb}
              value={
                <span className="flex items-center gap-3">
                  <span className="text-[0.9375rem] tabular-nums text-ui-label-2">
                    {cluster.trend}
                  </span>
                  <span className={cn("text-[0.9375rem]", SEVERITY_TEXT[cluster.severity])}>
                    {cluster.reports} {SEVERITY_LABEL[cluster.severity].toLowerCase()}
                  </span>
                </span>
              }
            />
          ))}
        </SettingsRows>
      </SettingsGroup>
    </>
  );
}
