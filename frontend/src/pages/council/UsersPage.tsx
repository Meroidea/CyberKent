import { useEffect, useState } from "react";
import { Ban, RotateCcw, UsersRound } from "lucide-react";
import { useAuth } from "@/components/auth/useAuth";
import { FilterBar, FilterSelect, Pager, SearchBox } from "@/components/council/Filters";
import { useLoad } from "@/components/council/useLoad";
import { FormAlert, SubmitButton, TextField } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SegmentedControl } from "@/components/settings/SegmentedControl";
import { RowSeparator, SettingsGroup } from "@/components/settings/SettingsGroup";
import type { Role } from "@/lib/account/types";
import { ApiError } from "@/lib/api/client";
import { adminApi } from "@/lib/council/api";
import type { AdminUser } from "@/lib/council/types";
import { formatDate, formatRelative, initials } from "@/lib/report/labels";
import { cn } from "@/lib/cn";

const ROLES: { value: Role; label: string; detail: string }[] = [
  { value: "RESIDENT", label: "Resident", detail: "Checks messages and reports scams." },
  { value: "BUSINESS", label: "Business", detail: "A resident account for a business or organisation." },
  { value: "OFFICER", label: "Officer", detail: "Reviews reports and reads reporters' details." },
  { value: "ADMIN", label: "Administrator", detail: "Everything an officer can, plus people, categories, audit and export." },
];

const ROLE_LABEL = Object.fromEntries(ROLES.map((role) => [role.value, role.label])) as Record<Role, string>;

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "all", label: "Everyone" },
] as const;

/**
 * FR67, FR68 — who can use the service, and with what authority.
 *
 * A role change or a suspension takes effect on the person's very next
 * request: the API re-reads the role for every staff call rather than trusting
 * the one in their session. The screen says so, because an administrator
 * removing an officer's access needs to know it is gone now.
 */
export function UsersPage() {
  const { user: me } = useAuth();
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]["value"]>("active");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(q.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [q]);

  const { data, setData, error, loading, reload } = useLoad(
    (signal) => adminApi.users({ q: query || undefined, role: role || undefined, status, page }, signal),
    `${query}|${role}|${status}|${page}`,
  );

  const replace = (next: AdminUser) => setData((current) => (current ? { ...current, users: current.users.map((row) => (row.id === next.id ? next : row)) } : current));

  return (
    <ConsoleLayout title="People and roles" subtitle="Accounts, roles and suspensions" wide>
      <ConsoleHero icon={UsersRound} tint="bg-gradient-to-br from-blue-600 to-indigo-600">
        <p>Changes take effect on the person's next click — not when their session expires. Every change is written to the audit trail.</p>
      </ConsoleHero>

      {data ? (
        <section aria-label="Accounts by role" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ROLES.map((entry) => (
            <button
              key={entry.value}
              type="button"
              onClick={() => { setRole(role === entry.value ? "" : entry.value); setPage(1); }}
              className={cn("rounded-ui px-4 py-3 text-left transition-colors", role === entry.value ? "bg-ui-tint/15 ring-2 ring-ui-tint" : "bg-ui-card hover:bg-ui-card-hover")}
            >
              <p className="text-[1.5rem] font-semibold leading-none tabular-nums text-ui-label">{data.roles[entry.value] ?? 0}</p>
              <p className="mt-1.5 text-[0.8125rem] text-ui-label-2">{entry.label}{(data.roles[entry.value] ?? 0) === 1 ? "" : "s"}</p>
            </button>
          ))}
        </section>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SegmentedControl label="Account status" segments={STATUSES} value={status} onChange={(value) => { setStatus(value); setPage(1); }} className="sm:max-w-[20rem]" />
        <FilterBar active={Boolean(role || q)} onClear={() => { setRole(""); setQ(""); }}>
          <SearchBox label="Search people" value={q} onChange={setQ} placeholder="Name, email or organisation" />
          <FilterSelect label="Role" value={role} onChange={(event) => { setRole(event.target.value as Role | ""); setPage(1); }}>
            <option value="">Any role</option>
            {ROLES.map((entry) => (
              <option key={entry.value} value={entry.value}>{entry.label}</option>
            ))}
          </FilterSelect>
        </FilterBar>
      </div>

      {notice ? <FormAlert tone={notice.tone}>{notice.text}</FormAlert> : null}
      {error ? (
        <FormAlert>
          {error.message}{" "}
          <button type="button" onClick={reload} className="font-semibold underline">Try again</button>
        </FormAlert>
      ) : null}

      <SettingsGroup>
        <div aria-busy={loading} className={cn(loading && data && "opacity-60")}>
          {!data ? (
            <div className="flex flex-col gap-3 p-4">{[0, 1, 2].map((row) => <div key={row} className="h-12 animate-pulse rounded-lg bg-ui-fill" />)}</div>
          ) : data.users.length === 0 ? (
            <p className="px-4 py-8 text-center text-[0.9375rem] text-ui-label-2">Nobody matches.</p>
          ) : (
            <ul>
              {data.users.map((person, index) => (
                <li key={person.id}>
                  {index > 0 ? <RowSeparator inset={68} /> : null}
                  <PersonRow
                    person={person}
                    self={person.id === me?.id}
                    expanded={open === person.id}
                    onToggle={() => setOpen(open === person.id ? null : person.id)}
                    onChanged={(next, text) => { replace(next); setNotice({ tone: "success", text }); }}
                    onError={(text) => setNotice({ tone: "error", text })}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </SettingsGroup>

      {data ? <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} /> : null}
    </ConsoleLayout>
  );
}

function PersonRow({
  person,
  self,
  expanded,
  onToggle,
  onChanged,
  onError,
}: {
  person: AdminUser;
  self: boolean;
  expanded: boolean;
  onToggle: () => void;
  onChanged: (next: AdminUser, text: string) => void;
  onError: (text: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [pendingRole, setPendingRole] = useState<Role>(person.role);
  const suspended = Boolean(person.suspendedAt);

  useEffect(() => setPendingRole(person.role), [person.role]);

  const run = async (work: () => Promise<{ user: AdminUser; releasedReports?: number }>, text: (result: { releasedReports?: number }) => string) => {
    setBusy(true);
    try {
      const result = await work();
      onChanged(result.user, text(result));
      setReason("");
    } catch (caught) {
      onError(caught instanceof ApiError ? caught.message : "That change could not be made.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn(suspended && "bg-ui-fill/40")}>
      <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ui-card-hover">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[0.8125rem] font-semibold text-white", suspended ? "bg-slate-400" : person.role === "ADMIN" ? "bg-gradient-to-br from-violet-500 to-indigo-600" : person.role === "OFFICER" ? "bg-gradient-to-br from-blue-500 to-cyan-500" : "bg-gradient-to-br from-slate-400 to-slate-500")}>
          {initials(person.fullName)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 text-[1rem] font-medium text-ui-label">
            {person.fullName}
            {self ? <span className="text-[0.75rem] font-normal text-ui-label-3">(you)</span> : null}
            {suspended ? <span className="rounded-full bg-rose-500/15 px-2 py-px text-[0.6875rem] font-semibold text-rose-700 dark:text-rose-300">Suspended</span> : null}
          </span>
          <span className="mt-0.5 block truncate text-[0.8125rem] text-ui-label-2">
            {person.email}
            {person.organisation ? ` · ${person.organisation}` : ""}
          </span>
        </span>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[0.875rem] font-medium text-ui-label">{ROLE_LABEL[person.role]}</span>
          <span className="block text-[0.75rem] text-ui-label-3">{person.lastLoginAt ? `Signed in ${formatRelative(person.lastLoginAt)}` : "Never signed in"}</span>
        </span>
      </button>

      {expanded ? (
        <div className="flex flex-col gap-4 border-t border-ui-separator px-4 py-4 sm:pl-[4.25rem]">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[0.8125rem] sm:grid-cols-4">
            <div><dt className="text-ui-label-3">Joined</dt><dd className="text-ui-label">{formatDate(person.createdAt)}</dd></div>
            <div><dt className="text-ui-label-3">Email</dt><dd className="text-ui-label">{person.emailVerified ? "Confirmed" : "Not confirmed"}</dd></div>
            <div><dt className="text-ui-label-3">Reports sent</dt><dd className="tabular-nums text-ui-label">{person.reportCount}</dd></div>
            <div><dt className="text-ui-label-3">Open reports held</dt><dd className="tabular-nums text-ui-label">{person.openAssigned}</dd></div>
          </dl>

          {self ? (
            <p className="text-[0.875rem] text-ui-label-2">You cannot change your own role or suspend yourself. Another administrator can.</p>
          ) : (
            <>
              <div>
                <p className="pb-2 text-[0.8125rem] font-medium text-ui-label-2">Role</p>
                <SegmentedControl
                  label={`Role for ${person.fullName}`}
                  segments={ROLES.map((entry) => ({ value: entry.value, label: entry.label }))}
                  value={pendingRole}
                  onChange={setPendingRole}
                  className="max-w-full"
                />
                <p className="mt-1.5 text-[0.75rem] text-ui-label-3">{ROLES.find((entry) => entry.value === pendingRole)?.detail}</p>
                {/* Confirmed, not applied on tap: one slip here would hand
                    someone a victim's bank details, or Council's name. */}
                {pendingRole !== person.role ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <SubmitButton
                      type="button"
                      busy={busy}
                      onClick={() => void run(() => adminApi.setRole(person.id, pendingRole), () => `${person.fullName} is now ${ROLE_LABEL[pendingRole].toLowerCase()}.`)}
                    >
                      Change to {ROLE_LABEL[pendingRole].toLowerCase()}
                    </SubmitButton>
                    <SubmitButton type="button" variant="secondary" onClick={() => setPendingRole(person.role)}>
                      Cancel
                    </SubmitButton>
                  </div>
                ) : null}
              </div>

              {suspended ? (
                <SubmitButton type="button" variant="secondary" icon={RotateCcw} busy={busy} className="self-start" onClick={() => void run(() => adminApi.reactivate(person.id), () => `${person.fullName} can sign in again.`)}>
                  Reactivate account
                </SubmitButton>
              ) : (
                <div className="overflow-hidden rounded-ui bg-ui-grouped">
                  <TextField label="Reason for suspending" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder="For example: left the CyberSafe team" />
                  <div className="px-4 pb-3">
                    <SubmitButton
                      type="button"
                      variant="danger"
                      icon={Ban}
                      busy={busy}
                      disabled={reason.trim().length < 5}
                      onClick={() =>
                        void run(
                          () => adminApi.suspend(person.id, reason.trim()),
                          (result) => `${person.fullName} is suspended${result.releasedReports ? ` and ${result.releasedReports} open report${result.releasedReports === 1 ? " was" : "s were"} returned to the queue` : ""}.`,
                        )
                      }
                    >
                      Suspend account
                    </SubmitButton>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
