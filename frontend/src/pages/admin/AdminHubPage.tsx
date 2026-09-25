import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  AlarmClock,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Bot,
  ChevronRight,
  Database,
  Download,
  FilePlus2,
  IdCard,
  Inbox,
  KanbanSquare,
  Mail,
  Megaphone,
  Newspaper,
  Plus,
  Radar,
  ShieldHalf,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/components/auth/useAuth";
import { CountUp } from "@/components/dash/CountUp";
import { StatTile } from "@/components/dash/StatTile";
import { BannerAction, WelcomeBanner } from "@/components/dash/WelcomeBanner";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { ROUTES } from "@/config/site";
import { contentApi, radarApi, tasksApi, teamApi } from "@/lib/admin/api";
import type { Radar as RadarData, SiteNotice, TaskList, TeamMember, ManagedArticle } from "@/lib/admin/types";
import { apiRequest } from "@/lib/api/client";
import { fetchAiStatus } from "@/lib/ai/api";
import type { AiStatus } from "@/lib/ai/types";
import { adminApi, councilApi } from "@/lib/council/api";
import { auditLabel } from "@/lib/council/labels";
import type { AuditPage, QueuePage } from "@/lib/council/types";
import { cn } from "@/lib/cn";
import { formatRelative, initials } from "@/lib/report/labels";
import { ROLE_NAME } from "@/lib/roles";

interface Snapshot {
  tasks?: TaskList;
  radar?: RadarData;
  queue?: QueuePage;
  team?: TeamMember[];
  articles?: ManagedArticle[];
  notices?: SiteNotice[];
  audit?: AuditPage;
  health?: { db: number | null; email: boolean | null; ai: AiStatus | null };
}

function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Melbourne", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

/**
 * The admin panel's front door: is everything working, what needs a decision,
 * and one click to every tool. Each figure comes from its own request, so one
 * slow area never blanks the page.
 */
export function AdminHubPage() {
  const { user } = useAuth();
  const [s, setS] = useState<Snapshot>({});

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const put = (patch: Partial<Snapshot>) => !signal.aborted && setS((current) => ({ ...current, ...patch }));
    tasksApi.list({ view: "all" }, signal).then((tasks) => put({ tasks })).catch(() => undefined);
    radarApi.get(14, signal).then((radar) => put({ radar })).catch(() => undefined);
    councilApi.queue({ view: "unassigned" }, signal).then((queue) => put({ queue })).catch(() => undefined);
    teamApi.list(signal).then(({ members }) => put({ team: members })).catch(() => undefined);
    contentApi.articles(signal).then(({ articles }) => put({ articles })).catch(() => undefined);
    contentApi.notices(signal).then(({ notices }) => put({ notices })).catch(() => undefined);
    adminApi.audit({ days: 7 }, signal).then((audit) => put({ audit })).catch(() => undefined);
    Promise.all([
      apiRequest<{ databaseLatencyMs: number }>("/api/health/ready", { signal }).then((r) => r.databaseLatencyMs).catch(() => null),
      apiRequest<{ emailDelivery: boolean }>("/api/auth/config", { signal }).then((r) => r.emailDelivery).catch(() => null),
      fetchAiStatus(signal).catch(() => null),
    ]).then(([db, email, ai]) => put({ health: { db, email, ai } }));
    return () => controller.abort();
  }, []);

  const overdue = s.tasks?.counts.overdue ?? 0;
  const uncovered = s.radar?.totals.uncovered ?? 0;
  const unassigned = s.queue?.counts.unassigned ?? 0;
  const invited = s.team?.filter((m) => m.status === "invited").length ?? 0;
  const drafts = s.articles?.filter((a) => a.status === "draft").length ?? 0;
  const liveNotices = s.notices?.filter((n) => n.status === "live").length ?? 0;

  const attention: { key: string; text: string; to: string; tone: "urgent" | "normal" }[] = [
    ...(overdue ? [{ key: "overdue", text: `${overdue} task${overdue === 1 ? " is" : "s are"} overdue`, to: `${ROUTES.councilTasks}`, tone: "urgent" as const }] : []),
    ...(uncovered ? [{ key: "uncovered", text: `${uncovered} surging or rising campaign${uncovered === 1 ? " has" : "s have"} no community alert`, to: ROUTES.councilRadar, tone: "urgent" as const }] : []),
    ...(unassigned ? [{ key: "queue", text: `${unassigned} report${unassigned === 1 ? " is" : "s are"} waiting for an officer`, to: ROUTES.councilQueue, tone: "normal" as const }] : []),
    ...(invited ? [{ key: "invited", text: `${invited} invitation${invited === 1 ? " has" : "s have"} not been accepted yet`, to: ROUTES.adminTeam, tone: "normal" as const }] : []),
    ...(drafts ? [{ key: "drafts", text: `${drafts} guide draft${drafts === 1 ? "" : "s"} not yet published`, to: ROUTES.adminContent, tone: "normal" as const }] : []),
  ];

  const navigate = useNavigate();
  const reports = s.radar?.totals.reports;
  const previous = s.radar?.totals.previousReports;
  const reportDelta = reports !== undefined && previous ? ((reports - previous) / previous) * 100 : undefined;
  const today = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Melbourne", weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <ConsoleLayout title="Admin home" subtitle="CyberKent's control room: what needs a decision, how the service is running, and every tool in one place." wide>
      <WelcomeBanner
        eyebrow={today}
        title={<>{greeting()}, {user?.fullName.split(" ")[0]}.</>}
        avatar={<ShieldHalf className="h-7 w-7" aria-hidden="true" />}
        actions={
          <>
            <BannerAction primary onClick={() => navigate(`${ROUTES.councilTasks}?new=1`)}><Plus className="h-4 w-4" aria-hidden="true" />New task</BannerAction>
            <BannerAction onClick={() => navigate(ROUTES.councilRadar)}><Radar className="h-4 w-4" aria-hidden="true" />Scam radar</BannerAction>
            <BannerAction onClick={() => navigate(ROUTES.adminTeam)}><UserPlus className="h-4 w-4" aria-hidden="true" />Invite</BannerAction>
          </>
        }
        aside={<AttentionRing count={attention.length} urgent={attention.filter((a) => a.tone === "urgent").length} loaded={Boolean(s.tasks && s.radar)} />}
      >
        Signed in as {user ? ROLE_NAME[user.role].toLowerCase() : "…"}.{" "}
        {attention.length === 0 ? "Nothing needs a decision right now." : `${attention.length} thing${attention.length === 1 ? " needs" : "s need"} your attention today.`}
      </WelcomeBanner>

      <section aria-label="Key figures" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Activity} label="Reports, last 14 days" value={reports} tint="bg-gradient-to-br from-sky-500 to-indigo-600" delta={reportDelta !== undefined ? { change: reportDelta, upIsGood: false, against: "the 14 days before" } : undefined} hint={reportDelta !== undefined ? "vs prior 14 days" : null} to={ROUTES.councilAnalytics} />
        <StatTile icon={KanbanSquare} label="Open tasks" value={s.tasks?.counts.open} tint="bg-gradient-to-br from-emerald-500 to-teal-600" hint={s.tasks ? <span className={overdue ? "font-semibold text-rose-600 dark:text-rose-300" : ""}>{overdue} overdue</span> : null} to={ROUTES.councilTasks} />
        <StatTile icon={Radar} label="Surging campaigns" value={s.radar?.totals.surging} tint="bg-gradient-to-br from-rose-500 to-orange-500" emphasis={s.radar?.totals.surging ? "text-rose-600 dark:text-rose-300" : undefined} hint={s.radar ? `${uncovered} without an alert` : null} to={ROUTES.councilRadar} />
        <StatTile icon={Inbox} label="Awaiting an officer" value={s.queue?.counts.unassigned} tint="bg-gradient-to-br from-orange-500 to-amber-500" hint={s.queue ? `${s.queue.counts.open} open in the queue` : null} to={ROUTES.councilQueue} />
      </section>

      <div className="grid gap-7 lg:grid-cols-5">
        <div className="flex flex-col gap-7 lg:col-span-3">
          <SettingsGroup title="Needs your attention">
            {attention.length === 0 ? (
              <div className="flex items-center gap-3 px-4 py-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><CheckCircle2 className="h-5 w-5" aria-hidden="true" /></span>
                <div>
                  <p className="text-[0.9375rem] font-semibold text-ui-label">All clear</p>
                  <p className="text-[0.8125rem] text-ui-label-2">{s.tasks ? "Nothing is overdue or waiting on a decision." : "Checking…"}</p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-ui-separator">
                {attention.map((item) => {
                  const Icon = ATTENTION_ICON[item.key] ?? AlertTriangle;
                  return (
                    <li key={item.key}>
                      <Link to={item.to} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ui-card-hover">
                        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", item.tone === "urgent" ? "bg-rose-500/10 text-rose-600 dark:text-rose-300" : "bg-amber-500/10 text-amber-600 dark:text-amber-300")}>
                          <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
                        </span>
                        <span className="flex-1 text-[0.9375rem] text-ui-label">{item.text}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold", item.tone === "urgent" ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300")}>{item.tone === "urgent" ? "Urgent" : "To do"}</span>
                        <ChevronRight className="h-4 w-4 text-ui-label-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </SettingsGroup>

          <SettingsGroup title="System status">
            <div className="grid grid-cols-2 gap-px bg-ui-separator">
              <Health icon={Activity} label="API" state={s.health ? "ok" : "checking"} detail="Responding" />
              <Health icon={Database} label="Database" state={!s.health ? "checking" : s.health.db !== null ? "ok" : "down"} detail={s.health?.db != null ? `${s.health.db} ms` : "Unreachable"} />
              <Health icon={Mail} label="Email" state={!s.health ? "checking" : s.health.email ? "ok" : "down"} detail={s.health?.email ? "Delivering" : "Not configured"} />
              <Health icon={Bot} label="AI" state={!s.health ? "checking" : s.health.ai?.available ? "ok" : "down"} detail={s.health?.ai?.available ? "Online" : "Unavailable"} />
            </div>
          </SettingsGroup>
        </div>

        <div className="lg:col-span-2">
          <SettingsGroup title="Recent activity" action={<Link to={ROUTES.councilAudit} className="text-[0.8125rem] font-semibold text-ui-tint hover:underline">Audit trail</Link>}>
            {!s.audit ? (
              <div className="m-4 h-40 animate-pulse rounded-lg bg-ui-fill" />
            ) : (
              <ol className="relative px-4 py-3">
                <span aria-hidden="true" className="absolute bottom-5 left-[1.9rem] top-5 w-px bg-ui-separator" />
                {s.audit.entries.filter((entry) => entry.action !== "account.signed_in").slice(0, 7).map((entry) => (
                  <li key={entry.id} className="relative flex gap-3 py-2">
                    <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[0.625rem] font-semibold text-white ring-4 ring-ui-card">
                      {initials(entry.actor?.fullName ?? "?")}
                    </span>
                    <span className="min-w-0 text-[0.8125rem] leading-snug">
                      <span className="font-semibold text-ui-label">{entry.actor?.fullName ?? "Someone"}</span>{" "}
                      <span className="text-ui-label-2">{auditLabel(entry.action).toLowerCase()}</span>
                      <span className="block text-[0.6875rem] text-ui-label-3">
                        {entry.reference ? <span className="whitespace-nowrap font-mono">{entry.reference} · </span> : null}
                        {formatRelative(entry.createdAt)}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </SettingsGroup>
        </div>
      </div>

      <section aria-label="Tools">
        <h2 className="px-1 pb-2.5 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-ui-label-2">Tools</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Tile to={ROUTES.councilTasks} icon={KanbanSquare} tint="from-emerald-500 to-teal-600" title="Task tracker" figures={[["Open", s.tasks?.counts.open], ["Yours", s.tasks?.counts.mine], ["Overdue", s.tasks?.counts.overdue]]} />
          <Tile to={ROUTES.councilRadar} icon={Radar} tint="from-rose-500 to-orange-500" title="Scam radar" figures={[["Campaigns", s.radar?.totals.campaigns], ["Surging", s.radar?.totals.surging], ["No alert", s.radar?.totals.uncovered]]} />
          <Tile to={ROUTES.councilQueue} icon={Inbox} tint="from-orange-500 to-amber-500" title="Review queue" figures={[["Open", s.queue?.counts.open], ["Unassigned", s.queue?.counts.unassigned], ["Waiting", s.queue?.counts.waiting]]} />
          <Tile to={ROUTES.councilAnalytics} icon={BarChart3} tint="from-sky-500 to-indigo-600" title="Analytics" figures={[["Reports, 14d", s.radar?.totals.reports], ["Prior 14d", s.radar?.totals.previousReports]]} />
          <Tile to={ROUTES.adminTeam} icon={IdCard} tint="from-violet-500 to-indigo-600" title="Team" figures={[["Staff", s.team?.filter((m) => m.status !== "suspended").length], ["Invited", invited]]} />
          <Tile to={ROUTES.adminContent} icon={Newspaper} tint="from-teal-500 to-emerald-600" title="Content" figures={[["Guides", s.articles?.length], ["Drafts", drafts], ["Live notices", liveNotices]]} />
        </div>
      </section>

      <SettingsGroup title="Quick actions">
        <div className="flex flex-wrap gap-2 p-3">
          <Quick to={`${ROUTES.councilTasks}?new=1`} icon={Plus}>New task</Quick>
          <Quick to={ROUTES.adminTeam} icon={UserPlus}>Invite a council member</Quick>
          <Quick to={ROUTES.adminContent} icon={Megaphone}>Post a site notice</Quick>
          <Quick to={`${ROUTES.adminContent}/guides/new`} icon={FilePlus2}>Write a guide</Quick>
          <Quick to={ROUTES.council} icon={Download}>Export de-identified data</Quick>
        </div>
      </SettingsGroup>
    </ConsoleLayout>
  );
}

const ATTENTION_ICON: Record<string, typeof Activity> = {
  overdue: AlarmClock,
  uncovered: Radar,
  queue: Inbox,
  invited: UserPlus,
  drafts: FilePlus2,
};

/** How much is waiting, as a ring on the banner: a count when there is something, a tick when there is not. */
function AttentionRing({ count, urgent, loaded }: { count: number; urgent: number; loaded: boolean }) {
  const circumference = 2 * Math.PI * 34;
  const share = count === 0 ? 1 : Math.min(1, urgent / count || 0.25);
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/25 backdrop-blur-md">
      <svg viewBox="0 0 80 80" className="h-16 w-16 -rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="7" />
        <circle
          cx="40" cy="40" r="34" fill="none" stroke="white" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={loaded ? circumference * (1 - share) : circumference}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div>
        <p className="text-[1.75rem] font-semibold leading-none">{!loaded ? "…" : count === 0 ? <CheckCircle2 className="h-7 w-7" aria-label="All clear" /> : <CountUp value={count} />}</p>
        <p className="mt-1 text-[0.75rem] text-white/80">{count === 0 ? "All clear" : `need attention${urgent ? ` · ${urgent} urgent` : ""}`}</p>
      </div>
    </div>
  );
}

function Health({ icon: Icon, label, state, detail }: { icon: typeof Activity; label: string; state: "ok" | "down" | "checking"; detail: string }) {
  return (
    <div className="flex items-center gap-3 bg-ui-card px-4 py-3">
      <Icon className="h-5 w-5 text-ui-label-3" aria-hidden="true" />
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-[0.875rem] font-semibold text-ui-label">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            {state === "ok" ? <span className="ck-ping absolute inset-0 rounded-full bg-emerald-400" /> : null}
            <span className={cn("relative h-2 w-2 rounded-full", state === "ok" ? "bg-emerald-500" : state === "down" ? "bg-amber-500" : "animate-pulse bg-slate-400")} />
          </span>
          {label}
        </p>
        <p className="truncate text-[0.75rem] text-ui-label-2">{state === "checking" ? "Checking…" : detail}</p>
      </div>
    </div>
  );
}

function Tile({ to, icon: Icon, tint, title, figures }: { to: string; icon: typeof Activity; tint: string; title: string; figures: [string, number | undefined][] }) {
  return (
    <Link to={to} className="ck-card ck-lift group flex flex-col gap-3 rounded-2xl bg-ui-card p-4">
      <span className="flex items-center justify-between">
        <span className="flex items-center gap-2.5">
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110", tint)}><Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" /></span>
          <span className="text-[1rem] font-semibold text-ui-label">{title}</span>
        </span>
        <ChevronRight className="h-4 w-4 text-ui-label-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
      <span className="grid grid-cols-3 gap-2">
        {figures.map(([label, value]) => (
          <span key={label} className="flex flex-col">
            <span className="text-[1.375rem] font-semibold leading-none tabular-nums text-ui-label">{value === undefined ? <span className="inline-block h-5 w-6 animate-pulse rounded bg-ui-fill" /> : <CountUp value={value} />}</span>
            <span className="mt-1 text-[0.6875rem] text-ui-label-2">{label}</span>
          </span>
        ))}
      </span>
    </Link>
  );
}

function Quick({ to, icon: Icon, children }: { to: string; icon: typeof Plus; children: ReactNode }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1.5 rounded-full bg-ui-fill px-3.5 py-2 text-[0.875rem] font-semibold text-ui-label transition-all duration-200 hover:-translate-y-0.5 hover:bg-ui-fill-strong">
      <Icon className="h-4 w-4 text-ui-tint" aria-hidden="true" />{children}
    </Link>
  );
}
