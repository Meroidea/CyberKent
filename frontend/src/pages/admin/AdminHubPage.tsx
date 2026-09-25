import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
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
import { ConsoleHero } from "@/components/settings/ConsoleHero";
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
import { formatRelative } from "@/lib/report/labels";
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

  return (
    <ConsoleLayout title="Admin home" subtitle="CyberKent's control room." wide>
      <ConsoleHero icon={ShieldHalf} tint="bg-gradient-to-br from-indigo-600 to-violet-600">
        <p className="text-[1.0625rem] font-semibold text-ui-label">{greeting()}, {user?.fullName.split(" ")[0]}.</p>
        <p className="mt-1">Signed in as {user ? ROLE_NAME[user.role].toLowerCase() : "…"}. {attention.length === 0 ? "Nothing needs a decision right now." : `${attention.length} thing${attention.length === 1 ? " needs" : "s need"} attention.`}</p>
      </ConsoleHero>

      <SettingsGroup title="System status">
        <div className="grid grid-cols-2 gap-px bg-ui-separator sm:grid-cols-4">
          <Health icon={Activity} label="API" state={s.health ? "ok" : "checking"} detail="Responding" />
          <Health icon={Database} label="Database" state={!s.health ? "checking" : s.health.db !== null ? "ok" : "down"} detail={s.health?.db != null ? `${s.health.db} ms` : "Unreachable"} />
          <Health icon={Mail} label="Email" state={!s.health ? "checking" : s.health.email ? "ok" : "down"} detail={s.health?.email ? "Delivering" : "Not configured"} />
          <Health icon={Bot} label="AI" state={!s.health ? "checking" : s.health.ai?.available ? "ok" : "down"} detail={s.health?.ai?.available ? "Online" : "Unavailable"} />
        </div>
      </SettingsGroup>

      {attention.length > 0 ? (
        <SettingsGroup title="Needs your attention">
          <ul className="divide-y divide-ui-separator">
            {attention.map((item) => (
              <li key={item.key}>
                <Link to={item.to} className="flex items-center gap-3 px-4 py-3 hover:bg-ui-card-hover">
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", item.tone === "urgent" ? "bg-rose-500" : "bg-amber-500")} aria-hidden="true" />
                  <span className="flex-1 text-[0.9375rem] text-ui-label">{item.text}</span>
                  <span className="sr-only">{item.tone === "urgent" ? "Urgent" : "To do"}</span>
                  <ChevronRight className="h-4 w-4 text-ui-label-3" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </SettingsGroup>
      ) : null}

      <section aria-label="Tools" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Tile to={ROUTES.councilTasks} icon={KanbanSquare} tint="from-emerald-500 to-teal-600" title="Task tracker" figures={[["Open", s.tasks?.counts.open], ["Yours", s.tasks?.counts.mine], ["Overdue", s.tasks?.counts.overdue]]} />
        <Tile to={ROUTES.councilRadar} icon={Radar} tint="from-rose-500 to-orange-500" title="Scam radar" figures={[["Campaigns", s.radar?.totals.campaigns], ["Surging", s.radar?.totals.surging], ["No alert", s.radar?.totals.uncovered]]} />
        <Tile to={ROUTES.councilQueue} icon={Inbox} tint="from-orange-500 to-amber-500" title="Review queue" figures={[["Open", s.queue?.counts.open], ["Unassigned", s.queue?.counts.unassigned], ["Waiting", s.queue?.counts.waiting]]} />
        <Tile to={ROUTES.councilAnalytics} icon={BarChart3} tint="from-sky-500 to-indigo-600" title="Analytics" figures={[["Reports, 14d", s.radar?.totals.reports], ["Prior 14d", s.radar?.totals.previousReports]]} />
        <Tile to={ROUTES.adminTeam} icon={IdCard} tint="from-violet-500 to-indigo-600" title="Team" figures={[["Staff", s.team?.filter((m) => m.status !== "suspended").length], ["Invited", invited]]} />
        <Tile to={ROUTES.adminContent} icon={Newspaper} tint="from-teal-500 to-emerald-600" title="Content" figures={[["Guides", s.articles?.length], ["Drafts", drafts], ["Live notices", liveNotices]]} />
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

      <SettingsGroup title="Recent activity" action={<Link to={ROUTES.councilAudit} className="text-[0.8125rem] font-semibold text-ui-tint hover:underline">Audit trail</Link>}>
        {!s.audit ? (
          <div className="m-4 h-24 animate-pulse rounded-lg bg-ui-fill" />
        ) : (
          <ol className="divide-y divide-ui-separator">
            {s.audit.entries.slice(0, 8).map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[0.875rem]">
                <span className="min-w-0 truncate text-ui-label"><span className="font-semibold">{entry.actor?.fullName ?? "Someone"}</span> <span className="text-ui-label-2">{auditLabel(entry.action).toLowerCase()}</span>{entry.reference ? <span className="font-mono text-[0.75rem] text-ui-label-3"> {entry.reference}</span> : null}</span>
                <span className="shrink-0 text-[0.75rem] text-ui-label-3">{formatRelative(entry.createdAt)}</span>
              </li>
            ))}
          </ol>
        )}
      </SettingsGroup>
    </ConsoleLayout>
  );
}

function Health({ icon: Icon, label, state, detail }: { icon: typeof Activity; label: string; state: "ok" | "down" | "checking"; detail: string }) {
  return (
    <div className="flex items-center gap-3 bg-ui-card px-4 py-3">
      <Icon className="h-5 w-5 text-ui-label-3" aria-hidden="true" />
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-[0.875rem] font-semibold text-ui-label">
          <span className={cn("h-2 w-2 rounded-full", state === "ok" ? "bg-emerald-500" : state === "down" ? "bg-amber-500" : "animate-pulse bg-slate-400")} aria-hidden="true" />
          {label}
        </p>
        <p className="truncate text-[0.75rem] text-ui-label-2">{state === "checking" ? "Checking…" : detail}</p>
      </div>
    </div>
  );
}

function Tile({ to, icon: Icon, tint, title, figures }: { to: string; icon: typeof Activity; tint: string; title: string; figures: [string, number | undefined][] }) {
  return (
    <Link to={to} className="group flex flex-col gap-3 rounded-ui bg-ui-card p-4 transition-colors hover:bg-ui-card-hover">
      <span className="flex items-center justify-between">
        <span className="flex items-center gap-2.5">
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-[0.625rem] bg-gradient-to-br text-white", tint)}><Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" /></span>
          <span className="text-[1rem] font-semibold text-ui-label">{title}</span>
        </span>
        <ChevronRight className="h-4 w-4 text-ui-label-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
      <span className="grid grid-cols-3 gap-2">
        {figures.map(([label, value]) => (
          <span key={label} className="flex flex-col">
            <span className="text-[1.375rem] font-semibold leading-none tabular-nums text-ui-label">{value ?? <span className="inline-block h-5 w-6 animate-pulse rounded bg-ui-fill" />}</span>
            <span className="mt-1 text-[0.6875rem] text-ui-label-2">{label}</span>
          </span>
        ))}
      </span>
    </Link>
  );
}

function Quick({ to, icon: Icon, children }: { to: string; icon: typeof Plus; children: ReactNode }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1.5 rounded-full bg-ui-fill px-3.5 py-2 text-[0.875rem] font-semibold text-ui-label hover:bg-ui-fill-strong">
      <Icon className="h-4 w-4 text-ui-tint" aria-hidden="true" />{children}
    </Link>
  );
}
