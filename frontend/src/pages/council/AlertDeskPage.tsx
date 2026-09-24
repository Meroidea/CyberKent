import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BellRing, Plus } from "lucide-react";
import { SeverityBadge } from "@/components/council/Badges";
import { Pager } from "@/components/council/Filters";
import { useLoad } from "@/components/council/useLoad";
import { FormAlert } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SegmentedControl } from "@/components/settings/SegmentedControl";
import { RowSeparator, SettingsGroup } from "@/components/settings/SettingsGroup";
import { ROUTES } from "@/config/site";
import { alertDeskApi } from "@/lib/alerts/api";
import type { AlertStatus, StaffAlert } from "@/lib/alerts/types";
import { formatRelative } from "@/lib/report/labels";
import { cn } from "@/lib/cn";

export const ALERT_STATUS: Record<AlertStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-slate-500/15 text-slate-700 dark:text-slate-300" },
  PENDING_APPROVAL: { label: "Awaiting approval", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  PUBLISHED: { label: "Published", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  ARCHIVED: { label: "Archived", className: "bg-ui-fill text-ui-label-2" },
};

const TABS: { value: AlertStatus; label: string }[] = [
  { value: "PENDING_APPROVAL", label: "To approve" },
  { value: "DRAFT", label: "Drafts" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

/** FR49–FR54 — every alert Council has written, by where it is in its life. */
export function AlertDeskPage() {
  const [params, setParams] = useSearchParams();
  const status = (params.get("status") as AlertStatus | null) ?? "PENDING_APPROVAL";
  const [page, setPage] = useState(1);
  const { data, error, reload } = useLoad((signal) => alertDeskApi.list(status, page, signal), `${status}|${page}`);

  return (
    <ConsoleLayout title="Alert desk" subtitle="Community alerts — written by one officer, published by another" wide>
      <ConsoleHero icon={BellRing} tint="bg-gradient-to-br from-amber-500 to-rose-500">
        <p>Alerts are drafted from verified reports. De-identification runs on the draft and again at publication, and nobody can publish their own alert.</p>
      </ConsoleHero>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SegmentedControl
          label="Alert status"
          segments={TABS.map((tab) => ({ value: tab.value, label: data ? `${tab.label} ${data.counts[tab.value] ?? 0}` : tab.label }))}
          value={status}
          onChange={(value) => { setPage(1); setParams({ status: value }, { replace: true }); }}
          className="sm:flex-1"
        />
        <Link
          to={`${ROUTES.councilAlerts}/new`}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-ui-card px-4 py-2 text-[0.9375rem] font-semibold text-ui-tint shadow-[0_0_0_1px_var(--ui-separator)] hover:bg-ui-card-hover"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          New alert
        </Link>
      </div>

      {error ? (
        <FormAlert>
          {error.message}{" "}
          <button type="button" onClick={reload} className="font-semibold underline">Try again</button>
        </FormAlert>
      ) : null}

      <SettingsGroup footer={status === "PENDING_APPROVAL" ? "Alerts you wrote are listed but cannot be approved by you." : undefined}>
        {!data ? (
          <div className="flex flex-col gap-3 p-4">{[0, 1, 2].map((n) => <div key={n} className="h-12 animate-pulse rounded-lg bg-ui-fill" />)}</div>
        ) : data.alerts.length === 0 ? (
          <p className="px-4 py-8 text-center text-[0.9375rem] text-ui-label-2">
            {status === "PENDING_APPROVAL" ? "Nothing waiting for approval." : "Nothing here."} Verified reports can be turned into alerts from the report screen.
          </p>
        ) : (
          <ul>
            {data.alerts.map((alert, index) => (
              <li key={alert.id}>
                {index > 0 ? <RowSeparator /> : null}
                <DeskRow alert={alert} />
              </li>
            ))}
          </ul>
        )}
      </SettingsGroup>

      {data ? <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} /> : null}
    </ConsoleLayout>
  );
}

function DeskRow({ alert }: { alert: StaffAlert }) {
  return (
    <Link to={`${ROUTES.councilAlerts}/${alert.id}`} className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-ui-card-hover">
      <span className="min-w-0 flex-1">
        <span className="block text-[1rem] font-medium text-ui-label">{alert.headline}</span>
        <span className="mt-1 block text-[0.8125rem] text-ui-label-2">
          <span className="font-mono">{alert.reference}</span> · {alert.category?.name ?? "No category"} · {alert.suburb?.name ?? "All of Hume"} · by {alert.author?.fullName ?? "a former officer"}
          {alert.approvedBy ? ` · approved by ${alert.approvedBy.fullName}` : ""} · {formatRelative(alert.updatedAt)}
        </span>
        {alert.returnNote ? <span className="mt-1.5 block rounded-md bg-amber-500/10 px-2 py-1 text-[0.8125rem] text-ui-label">Returned: {alert.returnNote.note}</span> : null}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1.5">
        <span className={cn("rounded-full px-2.5 py-0.5 text-[0.75rem] font-semibold", ALERT_STATUS[alert.status].className)}>{ALERT_STATUS[alert.status].label}</span>
        <SeverityBadge severity={alert.severity} />
      </span>
    </Link>
  );
}
