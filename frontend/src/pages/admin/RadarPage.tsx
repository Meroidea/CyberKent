import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BellPlus, CheckCircle2, ExternalLink, Flame, KanbanSquare, MapPin, Minus, Quote, Radar as RadarIcon, ShieldAlert, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { StatTile } from "@/components/council/Charts";
import { SearchBox } from "@/components/council/Filters";
import { useLoad } from "@/components/council/useLoad";
import { Sparkline } from "@/components/admin/viz";
import { FormAlert } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SegmentedControl } from "@/components/settings/SegmentedControl";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { ROUTES } from "@/config/site";
import { radarApi } from "@/lib/admin/api";
import type { Campaign, Threat } from "@/lib/admin/types";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/council/labels";
import { formatRelative } from "@/lib/report/labels";

/* Direction is a word and an icon as well as a tint. */
const THREAT: Record<Threat, { label: string; icon: typeof Flame; chip: string }> = {
  surging: { label: "Surging", icon: Flame, chip: "bg-rose-500/12 text-rose-700 ring-rose-500/30 dark:text-rose-300" },
  rising: { label: "Rising", icon: TrendingUp, chip: "bg-amber-500/12 text-amber-700 ring-amber-500/30 dark:text-amber-300" },
  steady: { label: "Steady", icon: Minus, chip: "bg-slate-500/10 text-ui-label-2 ring-slate-500/25" },
  fading: { label: "Fading", icon: TrendingDown, chip: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300" },
};

const PERIODS = [
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
] as const;

const FOCUS = [
  { value: "all", label: "Everything" },
  { value: "hot", label: "Surging or rising" },
  { value: "uncovered", label: "No alert yet" },
  { value: "artefact", label: "Shared artefact" },
] as const;

const CHANNEL: Record<string, string> = { SMS: "Text", EMAIL: "Email", PHONE: "Phone", WEBSITE: "Website", SOCIAL: "Social", POST: "Post", OTHER: "Other" };

/**
 * What is circulating in Hume right now: reports grouped into campaigns,
 * ranked by a heat score that weighs size, direction, money lost and whether
 * an officer has confirmed it. Each campaign is one click from the report, a
 * draft alert, or a task.
 */
export function RadarPage() {
  const [days, setDays] = useState<(typeof PERIODS)[number]["value"]>("14");
  const [focus, setFocus] = useState<(typeof FOCUS)[number]["value"]>("all");
  const [q, setQ] = useState("");
  const { data, error, loading, reload } = useLoad((signal) => radarApi.get(Number(days), signal), days);

  const campaigns = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data?.campaigns ?? []).filter((c) => {
      if (focus === "hot" && c.threat !== "surging" && c.threat !== "rising") return false;
      if (focus === "uncovered" && c.alert) return false;
      if (focus === "artefact" && c.kind !== "artefact") return false;
      if (!needle) return true;
      return [c.label, c.detail, c.category ?? "", c.specimen, ...c.suburbs.map((s) => s.name), ...c.references].join(" ").toLowerCase().includes(needle);
    });
  }, [data, focus, q]);

  const change = data ? data.totals.reports - data.totals.previousReports : 0;

  return (
    <ConsoleLayout title="Scam radar" subtitle="The scams circulating in Hume now, and which way each is heading." wide>
      <ConsoleHero icon={RadarIcon} tint="bg-gradient-to-br from-rose-500 to-orange-500">
        <p>Reports that share a phone number, link or sender are one campaign. The rest are grouped by scam type and channel. Each is compared with the {days} days before, and sample wording is de-identified.</p>
      </ConsoleHero>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl label="Window" segments={PERIODS} value={days} onChange={setDays} className="sm:max-w-[22rem]" />
        {data ? <p className="text-[0.75rem] text-ui-label-3">Updated {formatRelative(data.generatedAt)} · <button type="button" onClick={reload} className="font-semibold text-ui-tint hover:underline">Refresh</button></p> : null}
      </div>

      {error ? <FormAlert tone="error">{error.message}</FormAlert> : null}

      <section aria-label="Radar totals" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label={`Reports, last ${days} days`} value={data?.totals.reports ?? 0} loading={!data} detail={data ? `${change >= 0 ? "+" : ""}${change} on the ${days} days before` : undefined} />
        <StatTile label="Campaigns" value={data?.totals.campaigns ?? 0} loading={!data} />
        <StatTile label="Surging" value={data?.totals.surging ?? 0} loading={!data} tone={data && data.totals.surging > 0 ? "attention" : "good"} detail="At least doubled" />
        <StatTile label="Hot, with no alert" value={data?.totals.uncovered ?? 0} loading={!data} tone={data && data.totals.uncovered > 0 ? "attention" : "good"} />
        <StatTile label="Money reported lost" value={data ? formatMoney(data.totals.lossCents / 100, true) : "—"} loading={!data} />
      </section>

      {data && data.ticker.length > 0 ? (
        <SettingsGroup title={<span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4 text-amber-500" aria-hidden="true" />Just reported</span>} footer="The newest messages as residents received them, with names, numbers and addresses removed and links defanged.">
          <ul className="flex snap-x gap-3 overflow-x-auto p-3 [scrollbar-width:thin]">
            {data.ticker.map((item) => (
              <li key={item.reference} className="w-[16rem] shrink-0 snap-start rounded-xl bg-ui-fill/60 p-3">
                <p className="flex items-center justify-between text-[0.6875rem] text-ui-label-3">
                  <span>{CHANNEL[item.channel] ?? item.channel}{item.suburb ? ` · ${item.suburb}` : ""}</span>
                  <span>{formatRelative(item.submittedAt)}</span>
                </p>
                <p className="mt-1.5 line-clamp-3 text-[0.8125rem] leading-snug text-ui-label">“{item.excerpt}”</p>
                <Link to={`${ROUTES.councilReport}/${item.reference}`} className="mt-1.5 inline-block font-mono text-[0.6875rem] text-ui-tint hover:underline">{item.reference}</Link>
              </li>
            ))}
          </ul>
        </SettingsGroup>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SegmentedControl label="Show" segments={FOCUS} value={focus} onChange={setFocus} className="lg:max-w-[34rem]" />
        <div className="flex-1"><SearchBox label="Search campaigns" value={q} onChange={setQ} placeholder="Scam type, suburb, number, wording" /></div>
      </div>

      {loading && !data ? (
        <div className="flex flex-col gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-ui bg-ui-card" />)}</div>
      ) : campaigns.length === 0 ? (
        <p className="rounded-ui bg-ui-card px-4 py-10 text-center text-[0.9375rem] text-ui-label-2">Nothing circulating matches — a quiet {days} days.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {campaigns.map((campaign, index) => <CampaignCard key={campaign.key} campaign={campaign} rank={index + 1} days={Number(days)} />)}
        </ol>
      )}
    </ConsoleLayout>
  );
}

function CampaignCard({ campaign, rank, days }: { campaign: Campaign; rank: number; days: number }) {
  const T = THREAT[campaign.threat];
  const taskHref = `${ROUTES.councilTasks}?${new URLSearchParams({
    new: "1",
    title: `Respond to campaign: ${campaign.label}`.slice(0, 140),
    description: `${campaign.current} reports in the last ${days} days (${campaign.velocityLabel}).${campaign.suburbs.length ? ` Suburbs: ${campaign.suburbs.map((s) => s.name).join(", ")}.` : ""}`,
    ...(campaign.latestReference ? { report: campaign.latestReference } : {}),
    labels: "radar",
    priority: campaign.threat === "surging" ? "HIGH" : "MEDIUM",
  }).toString()}`;

  return (
    <li className="overflow-hidden rounded-ui bg-ui-card">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
        <div className="flex items-center gap-3 sm:w-[3rem] sm:flex-col sm:items-center">
          <span className="text-[1.5rem] font-semibold leading-none tabular-nums text-ui-label-3">{rank}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.75rem] font-semibold ring-1", T.chip)}>
              <T.icon className="h-3.5 w-3.5" aria-hidden="true" />{T.label}
            </span>
            {campaign.kind === "artefact" ? <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-violet-700 dark:text-violet-300">Shared artefact</span> : null}
            {campaign.alert ? (
              <span className="inline-flex items-center gap-1 text-[0.75rem] text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />Covered by {campaign.alert.reference}</span>
            ) : campaign.threat === "surging" || campaign.threat === "rising" ? (
              <span className="inline-flex items-center gap-1 text-[0.75rem] text-amber-700 dark:text-amber-300"><ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />No alert yet</span>
            ) : null}
          </div>
          <h3 className="mt-1.5 text-[1.0625rem] font-semibold leading-snug text-ui-label">{campaign.label}</h3>
          <p className="mt-0.5 break-all font-mono text-[0.75rem] text-ui-label-2">{campaign.detail}{campaign.indicator ? ` · ${campaign.indicator.status.toLowerCase()}` : ""}</p>

          <blockquote className="mt-3 flex gap-2 rounded-lg bg-ui-fill/60 px-3 py-2 text-[0.875rem] leading-snug text-ui-label">
            <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ui-label-3" aria-hidden="true" />
            <span className="line-clamp-3">{campaign.specimen}</span>
          </blockquote>

          {campaign.suburbs.length > 0 ? (
            <p className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[0.75rem] text-ui-label-2">
              <MapPin className="h-3.5 w-3.5 text-ui-label-3" aria-hidden="true" />
              {campaign.suburbs.slice(0, 6).map((s) => <span key={s.name} className="rounded-full bg-ui-fill px-2 py-0.5">{s.name} <span className="tabular-nums text-ui-label-3">{s.count}</span></span>)}
              {campaign.suburbs.length > 6 ? <span className="text-ui-label-3">+{campaign.suburbs.length - 6} more</span> : null}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-row items-end justify-between gap-4 sm:w-[11rem] sm:flex-col sm:items-end">
          <div className="text-right">
            <p className="text-[1.75rem] font-semibold leading-none tabular-nums text-ui-label">{campaign.current}</p>
            <p className="mt-1 text-[0.75rem] text-ui-label-2">reports · {campaign.velocityLabel}</p>
          </div>
          <Sparkline values={campaign.series} label={`${campaign.label}, daily reports`} />
          <p className="text-right text-[0.75rem] text-ui-label-2">
            {campaign.lossCents > 0 ? `${formatMoney(campaign.lossCents / 100, true)} lost · ` : ""}{campaign.verified} verified
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-ui-separator bg-ui-fill/30 px-4 py-2.5">
        {campaign.latestReference ? (
          <Link to={`${ROUTES.councilReport}/${campaign.latestReference}`} className="inline-flex items-center gap-1 rounded-full bg-ui-card px-3 py-1 text-[0.8125rem] font-medium text-ui-label hover:bg-ui-card-hover">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />Latest report
          </Link>
        ) : null}
        {!campaign.alert && campaign.latestReference ? (
          <Link to={`${ROUTES.councilAlerts}/new?from=${encodeURIComponent(campaign.latestReference)}`} className="inline-flex items-center gap-1 rounded-full bg-ui-card px-3 py-1 text-[0.8125rem] font-medium text-ui-label hover:bg-ui-card-hover">
            <BellPlus className="h-3.5 w-3.5" aria-hidden="true" />Draft an alert
          </Link>
        ) : null}
        <Link to={taskHref} className="inline-flex items-center gap-1 rounded-full bg-ui-card px-3 py-1 text-[0.8125rem] font-medium text-ui-label hover:bg-ui-card-hover">
          <KanbanSquare className="h-3.5 w-3.5" aria-hidden="true" />Make it a task
        </Link>
        <span className="ml-auto text-[0.6875rem] text-ui-label-3">First seen {formatRelative(campaign.firstSeen)} · last {formatRelative(campaign.lastSeen)}</span>
      </div>
    </li>
  );
}
