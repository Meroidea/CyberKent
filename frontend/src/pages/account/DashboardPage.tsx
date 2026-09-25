import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Clock3, Flag, Landmark, LogOut, MailWarning, MessageCircleQuestion, ScanSearch, Send, Settings, ShieldCheck } from "lucide-react";
import { StatusPill } from "@/components/account/StatusPill";
import { useAuth } from "@/components/auth/useAuth";
import { useEmailConfirmation } from "@/components/auth/useEmailConfirmation";
import { useCheckModal } from "@/components/check/useCheckModal";
import { FormAlert } from "@/components/forms/fields";
import { CountUp } from "@/components/dash/CountUp";
import { StatTile } from "@/components/dash/StatTile";
import { BannerAction, WelcomeBanner } from "@/components/dash/WelcomeBanner";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import { accountApi, reportsApi } from "@/lib/account/api";
import type { Overview, ReportSummary } from "@/lib/account/types";
import { ApiError } from "@/lib/api/client";
import { draftHasContent, loadReportDraft } from "@/lib/report/draft";
import { CHANNEL_LABEL, formatDate, formatRelative, initials } from "@/lib/report/labels";
import { ROUTES } from "@/config/site";
import { isAdmin, isStaff } from "@/lib/roles";

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
  const { confirmed, pending: confirmationPending } = useEmailConfirmation();
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
    <ConsoleLayout title="Your dashboard" subtitle={user ? `Signed in as ${user.email}` : undefined} wide>
      <WelcomeBanner
        eyebrow={new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
        title={<>{greeting()}, {firstName}.</>}
        avatar={<span className="tracking-wide">{initials(user?.fullName ?? "")}</span>}
        actions={
          <>
            <BannerAction primary onClick={openChecker}><ScanSearch className="h-4 w-4" aria-hidden="true" />Check a message</BannerAction>
            <BannerAction onClick={() => navigate(ROUTES.reportScam)}><Flag className="h-4 w-4" aria-hidden="true" />Report a scam</BannerAction>
          </>
        }
        aside={
          overview && overview.stats.verified > 0 ? (
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/25 backdrop-blur-md">
              <ShieldCheck className="h-8 w-8" aria-hidden="true" />
              <div>
                <p className="text-[1.5rem] font-semibold leading-none"><CountUp value={overview.stats.verified} /></p>
                <p className="mt-1 text-[0.75rem] text-white/80">scam{overview.stats.verified === 1 ? "" : "s"} you helped confirm</p>
              </div>
            </div>
          ) : null
        }
      >
        {awaiting
          ? "Council has a question about one of your reports — answering it keeps the review moving."
          : user
            ? `Member since ${formatDate(user.createdAt)}. Check anything suspicious before you act on it; report it so others in Hume are warned.`
            : null}
      </WelcomeBanner>

      {notice ? <FormAlert tone="success">{notice}</FormAlert> : null}
      {error ? (
        <FormAlert>
          {error}{" "}
          <button type="button" onClick={() => void load()} className="font-semibold underline">Try again</button>
        </FormAlert>
      ) : null}

      {user && !confirmed ? (
        <SettingsGroup
          footer={
            confirmationPending
              ? "Council needs a confirmed address to follow up on what you report."
              : "Council will use the address on your account to follow up on what you report."
          }
        >
          {/* Nothing to tap where no code can be sent: a row that opens a
              screen with no action on it is a job the reader cannot finish. */}
          <SettingsRow
            icon={MailWarning}
            iconClassName="bg-amber-500"
            label={confirmationPending ? "Confirm your email" : "Your email is not confirmed"}
            detail={
              confirmationPending
                ? "Enter the six-digit code we sent. Needed before you can send a report."
                : "Email isn't set up on this site yet, so codes can't be sent. You can still report scams to Council."
            }
            to={confirmationPending ? `${ROUTES.verifyEmail}?next=${encodeURIComponent(ROUTES.account)}` : undefined}
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

      <ServerDrafts />

      {draftHasContent(draft) ? (
        <SettingsGroup>
          <SettingsRow icon={Flag} iconClassName="bg-rose-500" label="Finish your report" detail={`“${draft.title || "Untitled"}” is saved on this device, not sent yet.`} to={ROUTES.reportScam} />
        </SettingsGroup>
      ) : null}

      <section aria-label="Your reports at a glance" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Clock3} label="With Council" value={overview?.stats.open} tint="bg-gradient-to-br from-sky-500 to-indigo-600" hint="Being reviewed" />
        <StatTile icon={MessageCircleQuestion} label="Need your reply" value={overview?.stats.needsYou} tint="bg-gradient-to-br from-amber-500 to-orange-500" emphasis={overview?.stats.needsYou ? "text-amber-600 dark:text-amber-300" : undefined} hint={overview?.stats.needsYou ? "Council is waiting on you" : "Nothing waiting"} to={awaiting ? `${ROUTES.accountReport}/${awaiting.reference}` : undefined} />
        <StatTile icon={ShieldCheck} label="Verified scams" value={overview?.stats.verified} tint="bg-gradient-to-br from-emerald-500 to-teal-600" hint="Confirmed by Council" />
        <StatTile icon={Send} label="Sent in total" value={overview?.stats.total} tint="bg-gradient-to-br from-violet-500 to-fuchsia-500" hint="Since you joined" />
      </section>

      <div className="grid gap-7 lg:grid-cols-5">
        <div className="flex flex-col gap-7 lg:col-span-3">
          {isStaff(user?.role) ? (
            <SettingsGroup>
              <SettingsRow
                icon={Landmark}
                iconClassName="bg-gradient-to-br from-indigo-600 to-cyan-500"
                label="Council console"
                detail={isAdmin(user?.role) ? "Admin panel: tasks, scam radar, analytics, team and content — plus the review queue." : "Review queue, tasks, scam radar and analytics."}
                to={ROUTES.council}
              />
            </SettingsGroup>
          ) : null}

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
        </div>
        <div className="flex flex-col gap-7 lg:col-span-2">
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
        </div>
      </div>
    </ConsoleLayout>
  );
}

/** FR26 — drafts saved on the account, to reopen on any device or discard. */
function ServerDrafts() {
  const [drafts, setDrafts] = useState<{ reference: string; title: string; files: number; updatedAt: string }[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    reportsApi.drafts(controller.signal).then(({ drafts: list }) => setDrafts(list)).catch(() => undefined);
    return () => controller.abort();
  }, []);

  if (drafts.length === 0) return null;

  return (
    <SettingsGroup title="Drafts saved to your account" footer="Not sent to Council yet. Only you can see them.">
      <SettingsRows inset={60}>
        {drafts.map((draft) => (
          <SettingsRow
            key={draft.reference}
            icon={Flag}
            iconClassName="bg-rose-400"
            label={draft.title || "Untitled draft"}
            detail={`${draft.reference} · saved ${formatRelative(draft.updatedAt)}${draft.files ? ` · ${draft.files} file${draft.files === 1 ? "" : "s"}` : ""}`}
            to={`${ROUTES.reportScam}?draft=${encodeURIComponent(draft.reference)}`}
            trailing={
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  if (window.confirm("Discard this draft?")) {
                    void reportsApi.discardDraft(draft.reference).then(() => setDrafts((list) => list.filter((row) => row.reference !== draft.reference)));
                  }
                }}
                className="shrink-0 text-[0.875rem] font-medium text-ui-label-2 hover:text-rose-500"
              >
                Discard
              </button>
            }
          />
        ))}
      </SettingsRows>
    </SettingsGroup>
  );
}
