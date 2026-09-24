import { useMemo, useState } from "react";
import { MapPinned } from "lucide-react";
import { BarList, StatTile } from "@/components/council/Charts";
import { useLoad } from "@/components/council/useLoad";
import { FormAlert } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SegmentedControl } from "@/components/settings/SegmentedControl";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SUBURB_CENTRES } from "@/content/suburbs";
import { apiRequest } from "@/lib/api/client";
import { cn } from "@/lib/cn";

interface Area {
  id: string;
  name: string;
  postcode: string;
  reports: number | null;
  suppressed: boolean;
  topCategories: { name: string; count: number }[];
}

interface MapData {
  period: { days: number; since: string };
  k: number;
  totals: { reports: number | null; verified: number | null; unplaced: number | null };
  areas: Area[];
  types: { name: string; slug: string | null; reports: number | null }[];
}

const PERIODS = [
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "Year" },
] as const;

/* The SVG's own coordinate space; the map scales to its container. */
const WIDTH = 640;
const HEIGHT = 420;
const PAD = 44;

/**
 * FR70 — where scam reports are coming from across Hume.
 *
 * A schematic, not a street map: each suburb is a point at its centre, and the
 * bubble's area is proportional to the reports from it. A suburb with fewer
 * than five is drawn as a dashed ring and never given a number, because in a
 * small suburb a small number can point at a household.
 */
export function ScamMapPage() {
  const [days, setDays] = useState<(typeof PERIODS)[number]["value"]>("90");
  const [active, setActive] = useState<string | null>(null);
  const { data, error, reload } = useLoad((signal) => apiRequest<MapData>(`/api/insights/map?days=${days}`, { signal }), days);

  const layout = useMemo(() => {
    const points = Object.values(SUBURB_CENTRES);
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
    /* Longitude shrinks with latitude; at 37.6°S one degree east is ~0.79 of one north. */
    const scale = Math.min((WIDTH - 2 * PAD) / ((maxLng - minLng) * 0.79), (HEIGHT - 2 * PAD) / (maxLat - minLat));
    const offsetX = (WIDTH - (maxLng - minLng) * 0.79 * scale) / 2;
    const offsetY = (HEIGHT - (maxLat - minLat) * scale) / 2;
    return (name: string) => {
      const c = SUBURB_CENTRES[name];
      return c ? { x: offsetX + (c.lng - minLng) * 0.79 * scale, y: offsetY + (maxLat - c.lat) * scale } : null;
    };
  }, []);

  const top = Math.max(1, ...(data?.areas.map((area) => area.reports ?? 0) ?? [1]));
  const radius = (count: number) => 6 + Math.sqrt(count / top) * 30;
  const selected = data?.areas.find((area) => area.id === active) ?? null;
  const ranked = [...(data?.areas ?? [])].sort((a, b) => (b.reports ?? (b.suppressed ? 0.5 : 0)) - (a.reports ?? (a.suppressed ? 0.5 : 0)));

  return (
    <ConsoleLayout title="Scam map" subtitle="Where reports are coming from across Hume" wide>
      <ConsoleHero icon={MapPinned} tint="bg-gradient-to-br from-emerald-500 to-teal-600">
        <p>Counts of scam reports made to Council, by suburb. Nothing finer than a suburb is ever shown, and any suburb with fewer than five reports is shown only as “fewer than five”.</p>
      </ConsoleHero>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl label="Period" segments={PERIODS} value={days} onChange={setDays} className="w-full max-w-[20rem]" />
      </div>

      {error ? (
        <FormAlert>
          {error.message}{" "}
          <button type="button" onClick={reload} className="font-semibold underline">Try again</button>
        </FormAlert>
      ) : null}

      <section aria-label="Totals" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Reports to Council" loading={!data} value={data?.totals.reports ?? "Fewer than 5"} />
        <StatTile label="Verified as scams" loading={!data} value={data?.totals.verified ?? "Fewer than 5"} tone="good" />
        <StatTile label="Suburb not given" loading={!data} value={data?.totals.unplaced ?? (data ? "Fewer than 5" : undefined)} />
      </section>

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <SettingsGroup title="Reports by suburb" footer="Schematic: each suburb is placed at its approximate centre. Bubble area shows the number of reports. Select a suburb for its most-reported scam types.">
          <div className="relative p-2">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="group" aria-label="Map of Hume suburbs">
              <defs>
                <pattern id="map-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M32 0H0V32" fill="none" className="stroke-ui-separator" strokeWidth="0.6" />
                </pattern>
              </defs>
              <rect width={WIDTH} height={HEIGHT} fill="url(#map-grid)" rx="12" />
              <text x={PAD / 2} y={HEIGHT - 12} className="fill-ui-label-3 text-[11px]">N ↑ · approximate positions</text>

              {data?.areas.map((area) => {
                const point = layout(area.name);
                if (!point) return null;
                const isActive = area.id === active;
                const count = area.suppressed ? 0 : (area.reports ?? 0);
                return (
                  <g
                    key={area.id}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isActive}
                    aria-label={`${area.name}: ${area.suppressed ? "fewer than 5 reports" : `${count} report${count === 1 ? "" : "s"}`}`}
                    onClick={() => setActive(isActive ? null : area.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setActive(isActive ? null : area.id);
                      }
                    }}
                    onMouseEnter={() => setActive(area.id)}
                    className="cursor-pointer focus:outline-none [&:focus-visible>circle:first-child]:stroke-[3]"
                  >
                    {area.suppressed ? (
                      <circle cx={point.x} cy={point.y} r={9} fill="none" strokeDasharray="3 3" strokeWidth={isActive ? 2.5 : 1.5} className="stroke-ui-tint" />
                    ) : count > 0 ? (
                      <circle cx={point.x} cy={point.y} r={radius(count)} strokeWidth={2} className={cn("fill-ui-tint stroke-ui-card", isActive ? "opacity-100" : "opacity-60 hover:opacity-90")} />
                    ) : (
                      <circle cx={point.x} cy={point.y} r={3} className="fill-ui-fill-strong" />
                    )}
                    {/* Named where counted, or when pointed at: the southern
                        suburbs sit too close for every name at once. */}
                    {count > 0 || isActive ? (
                    <text
                      x={point.x}
                      y={point.y + (area.suppressed ? 22 : count > 0 ? radius(count) + 13 : 15)}
                      textAnchor="middle"
                      className={cn("pointer-events-none text-[11px]", isActive ? "fill-ui-label font-semibold" : "fill-ui-label-2")}
                    >
                      {area.name}
                    </text>
                    ) : null}
                    {!area.suppressed && count > 0 ? (
                      <text x={point.x} y={point.y + 4} textAnchor="middle" className="pointer-events-none fill-white text-[11px] font-semibold dark:fill-slate-950">
                        {count}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </svg>
          </div>
        </SettingsGroup>

        <div className="flex flex-col gap-7 lg:sticky lg:top-24">
          <SettingsGroup title={selected ? selected.name : "Select a suburb"}>
            {selected ? (
              <div className="px-4 py-3.5">
                <p className="text-[1.5rem] font-semibold tabular-nums text-ui-label">
                  {selected.suppressed ? "Fewer than 5" : selected.reports}
                  <span className="ml-1.5 text-[0.875rem] font-normal text-ui-label-2">reports · {selected.postcode}</span>
                </p>
                {selected.topCategories.length ? (
                  <ul className="mt-3 flex flex-col gap-1.5 text-[0.875rem]">
                    {selected.topCategories.map((row) => (
                      <li key={row.name} className="flex justify-between gap-3">
                        <span className="text-ui-label">{row.name}</span>
                        <span className="tabular-nums text-ui-label-2">{row.count}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[0.8125rem] text-ui-label-2">No single type of scam has five or more reports here, so none is named.</p>
                )}
              </div>
            ) : (
              <p className="px-4 py-3.5 text-[0.875rem] text-ui-label-2">Hover or tap a bubble to see its count and the scam types reported most there.</p>
            )}
          </SettingsGroup>

          <SettingsGroup title="Legend">
            <ul className="flex flex-col gap-2.5 px-4 py-3.5 text-[0.8125rem] text-ui-label-2">
              <li className="flex items-center gap-2.5"><span aria-hidden="true" className="h-4 w-4 rounded-full bg-ui-tint opacity-70" />Five or more reports — larger is more</li>
              <li className="flex items-center gap-2.5"><span aria-hidden="true" className="h-4 w-4 rounded-full border-[1.5px] border-dashed border-ui-tint" />Fewer than five — not counted publicly</li>
              <li className="flex items-center gap-2.5"><span aria-hidden="true" className="mx-1 h-2 w-2 rounded-full bg-ui-fill-strong" />None reported</li>
            </ul>
          </SettingsGroup>
        </div>
      </div>

      <div className="grid gap-7 lg:grid-cols-2">
        <SettingsGroup title="Every suburb" footer="The same numbers as the map, as a list.">
          <table className="w-full text-left text-[0.875rem]">
            <thead className="sr-only">
              <tr><th>Suburb</th><th>Reports</th></tr>
            </thead>
            <tbody className="divide-y divide-ui-separator">
              {ranked.map((area) => (
                <tr key={area.id}>
                  <td className="px-4 py-2.5 text-ui-label">{area.name} <span className="text-ui-label-3">{area.postcode}</span></td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-ui-label-2">{area.suppressed ? "Fewer than 5" : area.reports}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SettingsGroup>

        <SettingsGroup title="Most-reported scam types" footer="Types with fewer than five reports in the period are not listed.">
          <BarList rows={(data?.types ?? []).map((row) => ({ key: row.slug ?? row.name, label: row.name, count: row.reports ?? 0 }))} empty="No type has five or more reports in this period." max={10} />
        </SettingsGroup>
      </div>
    </ConsoleLayout>
  );
}
