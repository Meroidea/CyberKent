import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BellRing, ShieldCheck } from "lucide-react";
import { AlertCard } from "@/components/alerts/AlertCard";
import { FilterBar, FilterSelect, Pager, SearchBox } from "@/components/council/Filters";
import { useLoad } from "@/components/council/useLoad";
import { SubscribeCard } from "@/components/alerts/SubscribeCard";
import { FormAlert } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SegmentedControl } from "@/components/settings/SegmentedControl";
import { fetchReferenceData } from "@/lib/account/api";
import type { ReferenceData } from "@/lib/account/types";
import { alertsApi } from "@/lib/alerts/api";
import { SEVERITY, SEVERITIES } from "@/lib/council/labels";
import type { Severity } from "@/lib/council/types";

const SCOPES = [
  { value: "current", label: "Current" },
  { value: "include", label: "Including archived" },
  { value: "only", label: "Archive" },
] as const;

/**
 * FR52, FR53 — community alerts, for everyone.
 *
 * Each one is a report a CyberSafe officer verified, rewritten with anything
 * identifying removed and checked by a second officer before it went out.
 * No account is needed to read them or to subscribe.
 */
export function AlertsPage() {
  const [params, setParams] = useSearchParams();
  const [reference, setReference] = useState<ReferenceData | null>(null);
  const [search, setSearch] = useState(params.get("q") ?? "");

  const filters = useMemo(
    () => ({
      q: params.get("q") ?? undefined,
      categoryId: params.get("categoryId") ?? undefined,
      suburbId: params.get("suburbId") ?? undefined,
      severity: (params.get("severity") as Severity | null) ?? undefined,
      archived: (params.get("archived") as "include" | "only" | null) ?? undefined,
      page: Number(params.get("page") ?? 1),
    }),
    [params],
  );

  const { data, error, loading, reload } = useLoad((signal) => alertsApi.feed(filters, signal), params.toString());

  useEffect(() => {
    fetchReferenceData().then(setReference).catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if ((filters.q ?? "") !== search.trim()) set({ q: search.trim() || undefined });
    }, 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function set(next: Record<string, string | number | undefined>, keepPage = false) {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === "") merged.delete(key);
      else merged.set(key, String(value));
    }
    if (!keepPage) merged.delete("page");
    setParams(merged, { replace: true });
  }

  const filtered = Boolean(filters.q || filters.categoryId || filters.suburbId || filters.severity);

  return (
    <ConsoleLayout title="Community alerts" subtitle="Scams verified by Council, circulating in Hume" wide>
      <ConsoleHero icon={BellRing} tint="bg-gradient-to-br from-amber-500 to-rose-500">
        <p>Every alert here started as a resident's report. A CyberSafe officer verified it, removed anything that could identify anyone, and a second officer checked it before it was published.</p>
      </ConsoleHero>

      <SegmentedControl
        label="Which alerts"
        segments={SCOPES}
        value={filters.archived ?? "current"}
        onChange={(value) => set({ archived: value === "current" ? undefined : value })}
        className="max-w-[26rem]"
      />

      <FilterBar active={filtered} onClear={() => { setSearch(""); setParams(new URLSearchParams(filters.archived ? { archived: filters.archived } : {}), { replace: true }); }}>
        <SearchBox label="Search alerts" value={search} onChange={setSearch} placeholder="Search words, a website, or a reference" />
        <FilterSelect label="Type of scam" value={filters.categoryId ?? ""} onChange={(event) => set({ categoryId: event.target.value || undefined })}>
          <option value="">Any type</option>
          {reference?.categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </FilterSelect>
        <FilterSelect label="Suburb" value={filters.suburbId ?? ""} onChange={(event) => set({ suburbId: event.target.value || undefined })}>
          <option value="">All of Hume</option>
          {reference?.suburbs.map((suburb) => (
            <option key={suburb.id} value={suburb.id}>{suburb.name}</option>
          ))}
        </FilterSelect>
        <FilterSelect label="Severity" value={filters.severity ?? ""} onChange={(event) => set({ severity: event.target.value || undefined })}>
          <option value="">Any severity</option>
          {SEVERITIES.map((value) => (
            <option key={value} value={value}>{SEVERITY[value].label}</option>
          ))}
        </FilterSelect>
      </FilterBar>

      {error ? (
        <FormAlert>
          {error.message}{" "}
          <button type="button" onClick={reload} className="font-semibold underline">Try again</button>
        </FormAlert>
      ) : null}

      <div aria-busy={loading} className={loading && data ? "opacity-60 transition-opacity" : "transition-opacity"}>
        {!data && loading ? (
          <div className="grid gap-4 md:grid-cols-2">{[0, 1, 2, 3].map((n) => <div key={n} className="h-48 animate-pulse rounded-ui bg-ui-card" />)}</div>
        ) : data && data.alerts.length === 0 ? (
          <div className="flex flex-col items-center rounded-ui bg-ui-card px-4 py-10 text-center">
            <ShieldCheck aria-hidden="true" className="h-8 w-8 text-emerald-500" />
            <p className="mt-3 text-[1.0625rem] text-ui-label">{filtered ? "No alerts match." : "No current alerts."}</p>
            <p className="mt-1 max-w-[28rem] text-[0.875rem] text-ui-label-2">
              {filtered ? "Try fewer filters, or search the archive." : "That is not a promise nothing is circulating. If a message feels wrong, check it or report it."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data?.alerts.map((alert) => <AlertCard key={alert.reference} alert={alert} />)}
          </div>
        )}
      </div>

      {data ? <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={(page) => set({ page }, true)} /> : null}

      <SubscribeCard />
    </ConsoleLayout>
  );
}
