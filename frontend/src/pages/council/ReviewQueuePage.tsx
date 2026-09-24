import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Inbox, MessageSquareReply, Paperclip, UserRound } from "lucide-react";
import { OfficerStatus, PriorityRing, SeverityBadge } from "@/components/council/Badges";
import { FilterBar, FilterSelect, Pager, SearchBox } from "@/components/council/Filters";
import { useLoad } from "@/components/council/useLoad";
import { FormAlert } from "@/components/forms/fields";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SegmentedControl } from "@/components/settings/SegmentedControl";
import { RowSeparator, SettingsGroup } from "@/components/settings/SettingsGroup";
import { ROUTES } from "@/config/site";
import { fetchReferenceData } from "@/lib/account/api";
import type { ReferenceData } from "@/lib/account/types";
import { councilApi } from "@/lib/council/api";
import { SEVERITY, SEVERITIES, formatAge, formatMoney } from "@/lib/council/labels";
import type { QueueCounts, QueueFilters, QueueItem, QueueView, Severity } from "@/lib/council/types";
import { CHANNEL_LABEL, initials } from "@/lib/report/labels";
import { cn } from "@/lib/cn";

const VIEWS: { value: QueueView; label: string; countKey: keyof QueueCounts }[] = [
  { value: "open", label: "Open", countKey: "open" },
  { value: "mine", label: "Mine", countKey: "mine" },
  { value: "unassigned", label: "Unassigned", countKey: "unassigned" },
  { value: "waiting", label: "Waiting", countKey: "waiting" },
  { value: "decided", label: "Decided", countKey: "decided" },
  { value: "all", label: "All", countKey: "all" },
];

const VIEW_NOTE: Record<QueueView, string> = {
  open: "New and in-review reports, most urgent first.",
  mine: "Open reports you are responsible for.",
  unassigned: "Open reports nobody has picked up yet.",
  waiting: "Reports where Council has asked the reporter a question.",
  decided: "Verified and closed reports, most recently decided first.",
  all: "Every report Council has received, most recently updated first.",
};

const AGES = [
  { value: "2", label: "Older than 2 days" },
  { value: "7", label: "Older than a week" },
  { value: "14", label: "Older than 2 weeks" },
  { value: "30", label: "Older than a month" },
];

function readFilters(params: URLSearchParams): QueueFilters {
  const view = (params.get("view") ?? "open") as QueueView;
  return {
    view: VIEWS.some((entry) => entry.value === view) ? view : "open",
    severity: (params.get("severity") as Severity | "UNSET" | null) ?? undefined,
    categoryId: params.get("categoryId") ?? undefined,
    suburbId: params.get("suburbId") ?? undefined,
    olderThanDays: params.get("olderThanDays") ? Number(params.get("olderThanDays")) : undefined,
    q: params.get("q") ?? undefined,
    page: params.get("page") ? Number(params.get("page")) : 1,
  };
}

/**
 * FR37 — the review queue.
 *
 * The filters live in the address, so a filtered queue can be bookmarked,
 * shared with a colleague, and survives opening a report and coming back.
 * Open views are ranked by the API's priority score; each row shows the score
 * and the reasons for it, so the order can be read and argued with.
 */
export function ReviewQueuePage() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);
  const [reference, setReference] = useState<ReferenceData | null>(null);
  const [search, setSearch] = useState(filters.q ?? "");
  const { data, error, loading, reload } = useLoad((signal) => councilApi.queue(filters, signal), params.toString());

  useEffect(() => {
    fetchReferenceData().then(setReference).catch(() => undefined);
  }, []);

  /* Typing searches after a pause, not per keystroke. */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if ((filters.q ?? "") !== search.trim()) update({ q: search.trim() || undefined });
    }, 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function update(next: Partial<Record<keyof QueueFilters, string | number | undefined>>, keepPage = false) {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === "") merged.delete(key);
      else merged.set(key, String(value));
    }
    if (!keepPage) merged.delete("page");
    setParams(merged, { replace: true });
  }

  const filtered = Boolean(filters.severity || filters.categoryId || filters.suburbId || filters.olderThanDays || filters.q);

  return (
    <ConsoleLayout title="Review queue" subtitle={VIEW_NOTE[filters.view]} wide>
      <SegmentedControl
        label="Queue view"
        segments={VIEWS.map((view) => ({ value: view.value, label: data ? `${view.label} ${data.counts[view.countKey]}` : view.label }))}
        value={filters.view}
        onChange={(view) => update({ view })}
      />

      <FilterBar active={filtered} onClear={() => { setSearch(""); setParams(new URLSearchParams({ view: filters.view }), { replace: true }); }}>
        <SearchBox label="Search reports" value={search} onChange={setSearch} placeholder="Reference, title, phone number, link…" />
        <FilterSelect label="Severity" value={filters.severity ?? ""} onChange={(event) => update({ severity: event.target.value || undefined })}>
          <option value="">Any severity</option>
          {SEVERITIES.map((value) => (
            <option key={value} value={value}>{SEVERITY[value].label} severity</option>
          ))}
          <option value="UNSET">Not triaged</option>
        </FilterSelect>
        <FilterSelect label="Type of scam" value={filters.categoryId ?? ""} onChange={(event) => update({ categoryId: event.target.value || undefined })}>
          <option value="">Any type</option>
          {reference?.categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </FilterSelect>
        <FilterSelect label="Suburb" value={filters.suburbId ?? ""} onChange={(event) => update({ suburbId: event.target.value || undefined })}>
          <option value="">Any suburb</option>
          {reference?.suburbs.map((suburb) => (
            <option key={suburb.id} value={suburb.id}>{suburb.name}</option>
          ))}
        </FilterSelect>
        <FilterSelect label="Age" value={filters.olderThanDays ? String(filters.olderThanDays) : ""} onChange={(event) => update({ olderThanDays: event.target.value || undefined })}>
          <option value="">Any age</option>
          {AGES.map((age) => (
            <option key={age.value} value={age.value}>{age.label}</option>
          ))}
        </FilterSelect>
      </FilterBar>

      {error ? (
        <FormAlert>
          {error.message}{" "}
          <button type="button" onClick={reload} className="font-semibold underline">Try again</button>
        </FormAlert>
      ) : null}

      <SettingsGroup
        footer={
          data?.ordering === "priority"
            ? "Ordered by priority: severity, money lost, whether the same number or link appears in other reports, a reply waiting, and time in the queue. Hover a score for its reasons."
            : undefined
        }
      >
        <div aria-busy={loading} className={cn("transition-opacity", loading && data ? "opacity-60" : "")}>
          {!data && loading ? (
            <div className="flex flex-col gap-3 p-4">
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="h-14 animate-pulse rounded-lg bg-ui-fill" />
              ))}
            </div>
          ) : data && data.items.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ui-fill text-ui-label-2">
                <Inbox aria-hidden="true" className="h-6 w-6" />
              </span>
              <p className="mt-3 text-[1.0625rem] text-ui-label">{filtered ? "No reports match these filters." : "Nothing here."}</p>
              <p className="mt-1 text-[0.875rem] text-ui-label-2">{filtered ? "Try clearing a filter." : "When reports arrive in this view, they will be listed here."}</p>
            </div>
          ) : (
            <ul>
              {data?.items.map((item, index) => (
                <li key={item.reference}>
                  {index > 0 ? <RowSeparator inset={72} /> : null}
                  <QueueRow item={item} ranked={data.ordering === "priority"} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </SettingsGroup>

      {data ? <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={(page) => update({ page }, true)} /> : null}
      {data?.truncated ? <p className="px-1 text-[0.8125rem] text-ui-label-2">Only the first 1,000 matching reports are ranked. Narrow the filters to see the rest.</p> : null}
    </ConsoleLayout>
  );
}

function QueueRow({ item, ranked }: { item: QueueItem; ranked: boolean }) {
  return (
    <Link
      to={`${ROUTES.councilReport}/${item.reference}`}
      className="flex items-start gap-4 px-4 py-3.5 transition-colors duration-150 hover:bg-ui-card-hover active:bg-ui-fill"
    >
      <span className="pt-0.5">
        {ranked ? (
          <PriorityRing score={item.priority.score} band={item.priority.band} reasons={item.priority.reasons} />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ui-fill text-[0.75rem] font-semibold text-ui-label-2">{formatAge(item.ageDays).replace(" days", "d").replace(" day", "d")}</span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[1rem] font-medium leading-snug text-ui-label">{item.title}</span>
          {item.replyReceived ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[0.6875rem] font-semibold text-emerald-700 dark:text-emerald-300">
              <MessageSquareReply aria-hidden="true" className="h-3 w-3" />
              Reply received
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-[0.8125rem] leading-snug text-ui-label-2">
          <span className="font-mono">{item.reference}</span> · {CHANNEL_LABEL[item.channel]}
          {item.category ? ` · ${item.category.name}` : " · Not classified"}
          {item.suburb ? ` · ${item.suburb.name}` : ""} · {formatAge(item.ageDays)}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-2 sm:hidden">
          <OfficerStatus status={item.status} />
          <SeverityBadge severity={item.severity} />
        </span>
        {ranked && item.priority.reasons.length > 0 ? (
          <span className="mt-1.5 flex flex-wrap gap-1">
            {item.priority.reasons.slice(0, 4).map((reason) => (
              <span key={reason} className="rounded-md bg-ui-fill px-1.5 py-0.5 text-[0.6875rem] font-medium text-ui-label-2">{reason}</span>
            ))}
          </span>
        ) : null}
      </span>

      <span className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
        <OfficerStatus status={item.status} />
        <SeverityBadge severity={item.severity} />
        <span className="flex items-center gap-2 text-[0.75rem] text-ui-label-3">
          {item.amountLost ? <span className="font-semibold text-ui-label-2">{formatMoney(item.amountLost, true)}</span> : null}
          {item.evidenceCount ? (
            <span className="inline-flex items-center gap-0.5"><Paperclip aria-hidden="true" className="h-3 w-3" />{item.evidenceCount}</span>
          ) : null}
          {item.reviewer ? (
            <span title={`Assigned to ${item.reviewer.fullName}`} className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[0.5625rem] font-semibold text-white">
              {initials(item.reviewer.fullName)}
            </span>
          ) : (
            <span title="Unassigned" className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-ui-label-3">
              <UserRound aria-hidden="true" className="h-3 w-3" />
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}
