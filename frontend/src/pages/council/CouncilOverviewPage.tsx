import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock3, Download, Inbox, Landmark, MessageSquareReply, ScrollText, ShieldQuestion, Tags, UserRoundCheck, UsersRound } from "lucide-react";
import { useAuth } from "@/components/auth/useAuth";
import { BarList, SplitBar, StatTile, Timeline } from "@/components/council/Charts";
import { useLoad } from "@/components/council/useLoad";
import { FormAlert, SubmitButton } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SegmentedControl } from "@/components/settings/SegmentedControl";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import { ROUTES } from "@/config/site";
import { ApiError } from "@/lib/api/client";
import { adminApi, councilApi } from "@/lib/council/api";
import { OFFICER_STATUS, formatHours, formatMoney } from "@/lib/council/labels";
import { CHANNEL_LABEL, STATUS } from "@/lib/report/labels";
import { isAdmin as isAdminRole } from "@/lib/roles";

const PERIODS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "Year" },
] as const;

function change(current: number, previous: number): string {
  if (previous === 0) return current === 0 ? "No change" : "New this period";
  const percent = Math.round(((current - previous) / previous) * 100);
  return percent === 0 ? "Same as the period before" : `${percent > 0 ? "▲" : "▼"} ${Math.abs(percent)}% on the period before`;
}

/**
 * Council's first screen: what needs doing, and what is happening in Hume.
 *
 * Ordered for an officer starting a shift. The work waiting on them comes
 * first, as rows that open the queue already filtered; then the period's
 * picture (FR70) — volume, where, what kind, how fast Council is answering.
 * The export is last and administrators' only (FR71).
 */
export function CouncilOverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [days, setDays] = useState<(typeof PERIODS)[number]["value"]>("30");
  const { data: stats, error, loading, reload } = useLoad((signal) => councilApi.stats(Number(days), signal), days);
  const isAdmin = isAdminRole(user?.role);

  const queue = (params: Record<string, string>) => navigate(`${ROUTES.councilQueue}?${new URLSearchParams(params).toString()}`);
  const risingCount = stats?.byCategory.filter((row) => row.rising).length ?? 0;

  return (
    <ConsoleLayout title="Council overview" subtitle="Hume City Council CyberSafe Services — officer console" wide>
      <ConsoleHero icon={Landmark} tint="bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500">
        <p className="text-[1.0625rem] font-semibold text-ui-label">
          {user?.fullName ? `Welcome, ${user.fullName.split(/\s+/)[0]}.` : "Welcome."}
        </p>
        <p className="mt-1">Everything reported to Council, and what is waiting on you.</p>
      </ConsoleHero>

      {error ? (
        <FormAlert>
          {error.message}{" "}
          <button type="button" onClick={reload} className="font-semibold underline">Try again</button>
        </FormAlert>
      ) : null}

      <SettingsGroup title="Needs attention">
        <SettingsRows inset={60}>
          <SettingsRow
            icon={Inbox}
            iconClassName="bg-orange-500"
            label="Waiting for an officer"
            detail="Open reports nobody has picked up, most urgent first."
            value={String(stats?.backlog.unassigned ?? "…")}
            onClick={() => queue({ view: "unassigned" })}
            chevron
          />
          <SettingsRow
            icon={ShieldQuestion}
            iconClassName="bg-violet-500"
            label="Not yet triaged"
            detail="Open reports with no severity set."
            value={String(stats?.backlog.untriaged ?? "…")}
            onClick={() => queue({ view: "open", severity: "UNSET" })}
            chevron
          />
          <SettingsRow
            icon={UserRoundCheck}
            iconClassName="bg-blue-500"
            label="Assigned to you"
            value={stats ? String(stats.workload.find((row) => row.id === user?.id)?.openReports ?? 0) : "…"}
            onClick={() => queue({ view: "mine" })}
            chevron
          />
          <SettingsRow
            icon={Clock3}
            iconClassName="bg-rose-500"
            label="Open for over a week"
            detail={stats?.backlog.oldestDays ? `The oldest has waited ${stats.backlog.oldestDays} days.` : undefined}
            value={stats ? String(stats.backlog.ages.slice(2).reduce((sum, age) => sum + age.count, 0)) : "…"}
            onClick={() => queue({ view: "open", olderThanDays: "7" })}
            chevron
          />
          <SettingsRow
            icon={MessageSquareReply}
            iconClassName="bg-amber-500"
            label="Waiting on reporters"
            detail="Council has asked a question and is waiting for the answer."
            value={String(stats?.backlog.waitingOnReporter ?? "…")}
            onClick={() => queue({ view: "waiting" })}
            chevron
          />
        </SettingsRows>
      </SettingsGroup>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="px-1 text-[1.0625rem] font-semibold text-ui-label">Across Hume</h2>
        <SegmentedControl label="Period" segments={PERIODS} value={days} onChange={setDays} className="w-full max-w-[22rem]" />
      </div>

      <section aria-label="Headline figures" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Reports received" loading={!stats} value={stats?.totals.reports} detail={stats ? change(stats.totals.reports, stats.totals.previousReports) : undefined} />
        <StatTile label="Still open" loading={!stats} value={stats?.backlog.open} tone={stats && stats.backlog.open > 0 ? "attention" : "default"} detail={stats ? `${stats.backlog.unassigned} unassigned` : undefined} />
        <StatTile label="Verified as scams" loading={!stats} value={stats?.totals.approved} tone="good" detail={stats ? `${stats.totals.rejected} closed, ${stats.totals.withdrawn} withdrawn` : undefined} />
        <StatTile
          label="Money reported lost"
          loading={!stats}
          value={stats ? formatMoney(stats.totals.moneyLost, true) : undefined}
          detail={stats ? `Across ${stats.totals.reportsWithLoss} report${stats.totals.reportsWithLoss === 1 ? "" : "s"}` : undefined}
        />
        <StatTile label="Median time to first review" loading={!stats} value={stats ? formatHours(stats.timing.medianHoursToFirstReview) : undefined} />
        <StatTile label="Median time to a decision" loading={!stats} value={stats ? formatHours(stats.timing.medianHoursToDecision) : undefined} />
        <StatTile label="Open, not yet triaged" loading={!stats} value={stats?.backlog.untriaged} detail="No severity set" />
        <StatTile
          label="Rising scam types"
          loading={!stats}
          value={risingCount}
          tone={risingCount > 0 ? "attention" : "default"}
          detail="At least double the period before"
        />
      </section>

      <SettingsGroup title={`Reports per ${stats?.period.bucket ?? "day"}`} footer="Counts reports by the date they reached Council. Drafts are never counted.">
        {stats ? <Timeline points={stats.timeline} bucket={stats.period.bucket} /> : <div className="m-4 h-40 animate-pulse rounded-lg bg-ui-fill" />}
      </SettingsGroup>

      <div className="grid gap-7 lg:grid-cols-2">
        <SettingsGroup title="By type of scam" footer="Rising: at least three reports, and at least double the period before. Select a type to see its reports.">
          <BarList
            rows={(stats?.byCategory ?? []).map((row) => ({ key: row.id ?? "none", label: row.name, count: row.count, rising: row.rising }))}
            onSelect={(key) => (key === "none" ? undefined : queue({ view: "all", categoryId: key }))}
          />
        </SettingsGroup>

        <SettingsGroup title="By suburb" footer="Aggregated to suburb and no finer, so patterns show but households do not.">
          <BarList
            rows={(stats?.bySuburb ?? []).map((row) => ({ key: row.id ?? "none", label: row.name, count: row.count, note: row.postcode ?? undefined }))}
            onSelect={(key) => (key === "none" ? undefined : queue({ view: "all", suburbId: key }))}
          />
        </SettingsGroup>

        <SettingsGroup title="Where reports stand">
          <SplitBar
            parts={(stats?.byStatus ?? []).map((row) => ({ key: row.status, label: OFFICER_STATUS[row.status], count: row.count, className: STATUS[row.status].tint }))}
          />
        </SettingsGroup>

        <SettingsGroup title="How the scam arrived">
          <BarList rows={(stats?.byChannel ?? []).map((row) => ({ key: row.channel, label: CHANNEL_LABEL[row.channel], count: row.count }))} />
        </SettingsGroup>

        <SettingsGroup title="Open reports by age" footer="Every report still with Council, whatever the period above.">
          <BarList rows={(stats?.backlog.ages ?? []).map((row) => ({ key: row.label, label: row.label, count: row.count }))} />
        </SettingsGroup>

        <SettingsGroup title="Officer workload" footer="Open reports each officer is holding.">
          <BarList rows={(stats?.workload ?? []).map((row) => ({ key: row.id, label: row.fullName, count: row.openReports, note: isAdminRole(row.role) ? "Admin" : undefined }))} empty="No officers yet." />
        </SettingsGroup>
      </div>

      {isAdmin ? <AdminTools loading={loading} /> : null}
    </ConsoleLayout>
  );
}

const EXPORT_PERIODS = [
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
  { value: "730", label: "2 years" },
] as const;

function AdminTools({ loading }: { loading: boolean }) {
  const [days, setDays] = useState<(typeof EXPORT_PERIODS)[number]["value"]>("365");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const download = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await adminApi.exportCsv(Number(days));
      setMessage({ tone: "success", text: "Export downloaded. The download is recorded in the audit trail." });
    } catch (caught) {
      setMessage({ tone: "error", text: caught instanceof ApiError ? caught.message : "The export could not be created." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SettingsGroup
        title="De-identified export"
        footer="Monthly counts by type, suburb and channel — no names, addresses, references, descriptions or scam details. Any group smaller than five reports is folded into a broader row before it leaves the system, so no one can be picked out."
      >
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
          <SegmentedControl label="Export period" segments={EXPORT_PERIODS} value={days} onChange={setDays} className="sm:flex-1" />
          <SubmitButton type="button" icon={Download} busy={busy} disabled={loading} onClick={download} className="sm:w-auto">
            Download CSV
          </SubmitButton>
        </div>
        {message ? <FormAlert tone={message.tone} className="mx-4 mb-4">{message.text}</FormAlert> : null}
      </SettingsGroup>

      <SettingsGroup title="Administration">
        <SettingsRows inset={60}>
          <SettingsRow icon={UsersRound} iconClassName="bg-blue-600" label="People and roles" detail="Officers, administrators, suspensions." to={ROUTES.councilUsers} />
          <SettingsRow icon={Tags} iconClassName="bg-fuchsia-600" label="Scam categories" detail="The taxonomy reports are classified against." to={ROUTES.councilCategories} />
          <SettingsRow icon={ScrollText} iconClassName="bg-slate-600" label="Audit trail" detail="Every consequential action, who took it and when." to={ROUTES.councilAudit} />
        </SettingsRows>
      </SettingsGroup>
    </>
  );
}
