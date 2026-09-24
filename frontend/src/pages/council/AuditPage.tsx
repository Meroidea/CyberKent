import { useState } from "react";
import { Link } from "react-router-dom";
import { ScrollText } from "lucide-react";
import { FilterBar, FilterSelect, Pager } from "@/components/council/Filters";
import { useLoad } from "@/components/council/useLoad";
import { FormAlert } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { RowSeparator, SettingsGroup } from "@/components/settings/SettingsGroup";
import { ROUTES } from "@/config/site";
import { adminApi } from "@/lib/council/api";
import { auditLabel } from "@/lib/council/labels";
import type { AuditEntry } from "@/lib/council/types";
import { formatDateTime } from "@/lib/report/labels";
import { cn } from "@/lib/cn";

const PERIODS = [
  { value: "1", label: "Last 24 hours" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last year" },
];

/* Groups of actions, filtered by prefix — what an auditor usually asks first. */
const AREAS = [
  { value: "report.", label: "Reports" },
  { value: "user.", label: "People and roles" },
  { value: "category.", label: "Categories" },
  { value: "alert.", label: "Community alerts" },
  { value: "subscription.", label: "Subscriptions" },
  { value: "indicator.", label: "Artefacts" },
  { value: "account.", label: "Sign-ins and accounts" },
  { value: "data.", label: "Exports" },
];

/** Metadata said as short phrases. Only the keys the service writes; anything else is shown raw. */
function describe(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) return null;
  const parts: string[] = [];
  const m = metadata as Record<string, unknown>;

  if (typeof m.from === "string" && typeof m.to === "string") parts.push(`${m.from.toLowerCase()} → ${m.to.toLowerCase()}`);
  if (typeof m.reason === "string") parts.push(`“${m.reason}”`);
  if (typeof m.category === "string") parts.push(m.category);
  if (typeof m.name === "string") parts.push(m.name);
  if (m.renamed && typeof m.renamed === "object") {
    const renamed = m.renamed as { from?: string; to?: string };
    parts.push(`renamed ${renamed.from} → ${renamed.to}`);
  }
  if (typeof m.severity === "object" && m.severity) {
    const change = m.severity as { from?: string | null; to?: string | null };
    parts.push(`severity ${change.from ?? "unset"} → ${change.to ?? "unset"}`.toLowerCase());
  } else if (typeof m.severity === "string") parts.push(`severity ${m.severity.toLowerCase()}`);
  if (typeof m.releasedReports === "number" && m.releasedReports > 0) parts.push(`${m.releasedReports} report(s) returned to the queue`);
  if (typeof m.note === "string") parts.push(`“${m.note}”`);
  if (typeof m.subscribers === "number") parts.push(`${m.subscribers} subscriber(s), ${String(m.emailed ?? 0)} emailed`);
  if (typeof m.reference === "string") parts.push(m.reference);
  if (typeof m.rows === "number") parts.push(`${m.rows} rows, k ≥ ${String(m.k ?? 5)}`);
  if (typeof m.report === "string") parts.push(m.report);
  if (m.synthetic === true) parts.push("synthetic data");

  return parts.length ? parts.join(" · ") : null;
}

/**
 * FR72 — the audit trail, read-only.
 *
 * There is no edit or delete anywhere, in this screen or in the API behind it.
 * An entry whose actor has since deleted their account keeps the entry and
 * shows the actor as removed: erasing a person does not erase what was done.
 */
export function AuditPage() {
  const [area, setArea] = useState("");
  const [days, setDays] = useState("30");
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useLoad((signal) => adminApi.audit({ action: area || undefined, days: Number(days), page }, signal), `${area}|${days}|${page}`);

  return (
    <ConsoleLayout title="Audit trail" subtitle="Every consequential action — who, what, when and from where" wide>
      <ConsoleHero icon={ScrollText} tint="bg-gradient-to-br from-slate-600 to-slate-800">
        <p>Append-only. Nothing here can be edited or deleted, by anyone. Report contents and passwords are never written to it.</p>
      </ConsoleHero>

      <FilterBar active={Boolean(area)} onClear={() => { setArea(""); setPage(1); }}>
        <FilterSelect label="Area" value={area} onChange={(event) => { setArea(event.target.value); setPage(1); }}>
          <option value="">Every action</option>
          {AREAS.map((entry) => (
            <option key={entry.value} value={entry.value}>{entry.label}</option>
          ))}
        </FilterSelect>
        <FilterSelect label="Period" value={days} onChange={(event) => { setDays(event.target.value); setPage(1); }}>
          {PERIODS.map((entry) => (
            <option key={entry.value} value={entry.value}>{entry.label}</option>
          ))}
        </FilterSelect>
        {data ? <span className="px-2 text-[0.8125rem] tabular-nums text-ui-label-2">{data.total.toLocaleString("en-AU")} entries</span> : null}
      </FilterBar>

      {error ? (
        <FormAlert>
          {error.message}{" "}
          <button type="button" onClick={reload} className="font-semibold underline">Try again</button>
        </FormAlert>
      ) : null}

      <SettingsGroup>
        <div aria-busy={loading} className={cn(loading && data && "opacity-60")}>
          {!data ? (
            <div className="flex flex-col gap-3 p-4">{[0, 1, 2, 3].map((row) => <div key={row} className="h-10 animate-pulse rounded-lg bg-ui-fill" />)}</div>
          ) : data.entries.length === 0 ? (
            <p className="px-4 py-8 text-center text-[0.9375rem] text-ui-label-2">Nothing recorded in this period.</p>
          ) : (
            <ol>
              {data.entries.map((entry, index) => (
                <li key={entry.id}>
                  {index > 0 ? <RowSeparator /> : null}
                  <AuditRow entry={entry} />
                </li>
              ))}
            </ol>
          )}
        </div>
      </SettingsGroup>

      {data ? <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} /> : null}
    </ConsoleLayout>
  );
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const detail = describe(entry.metadata);

  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:gap-4">
      <time dateTime={entry.createdAt} className="shrink-0 text-[0.8125rem] tabular-nums text-ui-label-3 sm:w-32">
        {formatDateTime(entry.createdAt)}
      </time>
      <div className="min-w-0 flex-1">
        <p className="text-[0.9375rem] text-ui-label">
          <span className="font-medium">{entry.actor?.fullName ?? (entry.action === "report.submitted" ? "A resident" : "Removed account")}</span>{" "}
          <span className="text-ui-label-2">{auditLabel(entry.action).replace(/^\w/, (c) => c.toLowerCase())}</span>
          {entry.reference ? (
            <>
              {" "}
              <Link to={`${ROUTES.councilReport}/${entry.reference}`} className="font-mono text-[0.875rem] text-ui-tint hover:underline">
                {entry.reference}
              </Link>
            </>
          ) : null}
        </p>
        {detail ? <p className="mt-0.5 break-words text-[0.8125rem] text-ui-label-2">{detail}</p> : null}
      </div>
      <span className="shrink-0 font-mono text-[0.6875rem] text-ui-label-3 sm:pt-0.5">{entry.action}</span>
    </div>
  );
}
