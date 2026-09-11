import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Flag, LogOut, MailWarning, MessageCircleQuestion, ScanSearch, Settings } from "lucide-react";
import { StatusPill } from "@/components/account/StatusPill";
import { useAuth } from "@/components/auth/useAuth";
import { useCheckModal } from "@/components/check/useCheckModal";
import { FormAlert } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import { accountApi, reportsApi } from "@/lib/account/api";
import type { Overview, ReportSummary } from "@/lib/account/types";
import { ApiError } from "@/lib/api/client";
import { draftHasContent, loadReportDraft } from "@/lib/report/draft";
import { CHANNEL_LABEL, formatDate, formatRelative, initials } from "@/lib/report/labels";
import { ROUTES } from "@/config/site";
import { cn } from "@/lib/cn";

function greeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

/**
 * The first screen after signing in.
 *
 * Ordered by what might need the person: an unconfirmed email and an
 * unanswered question from Council come first, because both stall a report
 * until they are dealt with. Then where things stand, then what to do next.
 */
export function DashboardPage() {
  const { user, setUser, signOut } = useAuth();
  const { open: openChecker } = useCheckModal();
  const navigate = useNavigate();
  const location = useLocation();
  const notice = (location.state as { notice?: string } | null)?.notice;

  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allReports, setAllReports] = useState<ReportSummary[] | null>(null);
  const draft = loadReportDraft();

  const load = useCallback(
    (signal?: AbortSignal) =>
      accountApi
        .overview(signal)
        .then((data) => {
          setOverview(data);
          setUser(data.user);
          setError(null);
        })
        .catch((caught: unknown) => {
          if (caught instanceof DOMException && caught.name === "AbortError") return;
          setError(caught instanceof ApiError ? caught.message : "Your dashboard could not be loaded.");
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const markAllRead = async () => {
    await accountApi.markRead().catch(() => undefined);
    void load();
  };

  const openNotification = (id: string, linkPath: string | null) => {
    void accountApi.markRead([id]).catch(() => undefined);
    if (linkPath) navigate(linkPath);
  };

  const firstName = user?.fullName.split(/\s+/)[0] ?? "";
  const reports = allReports ?? overview?.recentReports ?? [];
  const awaiting = overview?.recentReports.find((report) => report.awaitingYou);

  return (
    <ConsoleLayout title="Your dashboard" subtitle={user?.email}>
      <ConsoleHero
        tile={<span className="text-[1.625rem] font-semibold tracking-wide">{initials(user?.fullName ?? "")}</span>}
        tint="bg-gradient-to-br from-blue-500 to-indigo-600"
      >
        <p className="text-[1.0625rem] font-semibold text-ui-label">
          {greeting()}, {firstName}.
        </p>
        {user ? <p className="mt-1 text-[0.8125rem]">Member since {formatDate(user.createdAt)}</p> : null}
      </ConsoleHero>

      {notice ? <FormAlert tone="success">{notice}</FormAlert> : null}
      {error ? (
        <FormAlert>
          {error}{" "}
          <button type="button" onClick={() => void load()} className="font-semibold underline">Try again</button>
        </FormAlert>
      ) : null}

      {user && !user.emailVerified ? (
        <SettingsGroup footer="Council needs a confirmed address to follow up on what you report.">
          <SettingsRow
            icon={MailWarning}
            iconClassName="bg-amber-500"
            label="Confirm your email"
            detail="Enter the six-digit code we sent. Needed before you can send a report."
            to={`${ROUTES.verifyEmail}?next=${encodeURIComponent(ROUTES.account)}`}
          />
        </SettingsGroup>
      ) : null}

      {awaiting ? (
        <SettingsGroup>
          <SettingsRow
            icon={MessageCircleQuestion}
            iconClassName="bg-amber-500"
            label="Council has a question for you"
            detail={`About ${awaiting.reference} — “${awaiting.title}”. Answering keeps the review moving.`}
            to={`${ROUTES.accountReport}/${awaiting.reference}`}
          />
        </SettingsGroup>
      ) : null}

      {draftHasContent(draft) ? (
        <SettingsGroup>
          <SettingsRow icon={Flag} iconClassName="bg-rose-500" label="Finish your report" detail={`“${draft.title || "Untitled"}” is saved on this device, not sent yet.`} to={ROUTES.reportScam} />
        </SettingsGroup>
      ) : null}

      <section aria-label="Your reports at a glance" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "With Council", value: overview?.stats.open, accent: "text-sky-600 dark:text-sky-300" },
          { label: "Need your reply", value: overview?.stats.needsYou, accent: overview?.stats.needsYou ? "text-amber-600 dark:text-amber-300" : "text-ui-label" },
          { label: "Verified scams", value: overview?.stats.verified, accent: "text-emerald-600 dark:text-emerald-300" },
          { label: "Sent in total", value: overview?.stats.total, accent: "text-ui-label" },
        ].map((tile) => (
          <div key={tile.label} className="rounded-ui bg-ui-card px-4 py-3.5">
            <p className={cn("text-[1.75rem] font-semibold leading-none tabular-nums", tile.accent)}>
              {tile.value ?? <span className="inline-block h-7 w-8 animate-pulse rounded bg-ui-fill" />}
            </p>
            <p className="mt-2 text-[0.8125rem] leading-tight text-ui-label-2">{tile.label}</p>
          </div>
        ))}
      </section>

      <SettingsGroup>
        <SettingsRows inset={60}>
          <SettingsRow icon={Flag} iconClassName="bg-rose-500" label="Report a scam" detail="Send it to Council with the details." to={ROUTES.reportScam} />
          <SettingsRow icon={ScanSearch} iconClassName="bg-indigo-500" label="Check a message" detail="Instant, private, free." onClick={openChecker} chevron />
        </SettingsRows>
      </SettingsGroup>

      <SettingsGroup
        title="Your reports"
        action={
          overview && !allReports && overview.stats.total > overview.recentReports.length ? (
            <button
              type="button"
              onClick={() => reportsApi.list().then(({ reports: list }) => setAllReports(list)).catch(() => undefined)}
              className="text-[0.9375rem] font-medium text-ui-tint hover:opacity-70"
            >
              See all {overview.stats.total}
            </button>
          ) : null
        }
      >
        {!overview && !error ? (
          <div className="flex flex-col gap-3 px-4 py-4" aria-busy="true">
            {[0, 1].map((row) => (
              <div key={row} className="h-10 animate-pulse rounded-lg bg-ui-fill" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-[1.0625rem] text-ui-label">No reports yet.</p>
            <p className="mt-1 text-[0.875rem] text-ui-label-2">When you report a scam, you can follow it here.</p>
            <Link to={ROUTES.reportScam} className="mt-3 inline-block text-[0.9375rem] font-semibold text-ui-tint hover:opacity-70">
              Report a scam
            </Link>
          </div>
        ) : (
          <SettingsRows>
            {reports.map((report) => (
              <SettingsRow
                key={report.reference}
                label={report.title}
                detail={`${report.reference} · ${CHANNEL_LABEL[report.channel]} · ${formatRelative(report.submittedAt)}`}
                trailing={<StatusPill status={report.status} />}
                to={`${ROUTES.accountReport}/${report.reference}`}
              />
            ))}
          </SettingsRows>
        )}
      </SettingsGroup>

      {overview && overview.notifications.length > 0 ? (
        <SettingsGroup
          title="Updates"
          action={
            overview.unreadNotifications > 0 ? (
              <button type="button" onClick={markAllRead} className="text-[0.9375rem] font-medium text-ui-tint hover:opacity-70">
                Mark all read
              </button>
            ) : null
          }
        >
          <SettingsRows>
            {overview.notifications.map((item) => (
              <SettingsRow
                key={item.id}
                label={
                  <span className="flex items-center gap-2">
                    {!item.readAt ? <span aria-label="Unread" className="h-2 w-2 shrink-0 rounded-full bg-ui-tint" /> : null}
                    <span className={item.readAt ? "" : "font-semibold"}>{item.title}</span>
                  </span>
                }
                detail={
                  <>
                    {item.body} <span className="text-ui-label-3">· {formatRelative(item.createdAt)}</span>
                  </>
                }
                onClick={() => openNotification(item.id, item.linkPath)}
                chevron={Boolean(item.linkPath)}
              />
            ))}
          </SettingsRows>
        </SettingsGroup>
      ) : null}

      <SettingsGroup title="Account">
        <SettingsRows inset={60}>
          <SettingsRow icon={Settings} iconClassName="bg-slate-500" label="Settings" detail="Profile, password, email preferences." to={ROUTES.accountSettings} />
          <SettingsRow icon={BookOpen} iconClassName="bg-sky-500" label="Awareness library" detail="Short guides to the scams going around." to={ROUTES.learn} />
          <SettingsRow
            icon={LogOut}
            iconClassName="bg-slate-400"
            label="Sign out"
            onClick={() => {
              /* Away first: signing out on a guarded screen would send the
                 guard to the sign-in form instead of home. */
              navigate(ROUTES.home);
              void signOut();
            }}
            chevron={false}
          />
        </SettingsRows>
      </SettingsGroup>
    </ConsoleLayout>
  );
}
