import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlarmClock, Briefcase, Copy, IdCard, Inbox, KanbanSquare, MailCheck, Phone, Send, ShieldCheck, Timer, UserPlus } from "lucide-react";
import { useAuth } from "@/components/auth/useAuth";
import { StatTile } from "@/components/council/Charts";
import { SearchBox } from "@/components/council/Filters";
import { useLoad } from "@/components/council/useLoad";
import { Sheet } from "@/components/admin/Sheet";
import { FormAlert, SelectField, SubmitButton, TextField } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SegmentedControl } from "@/components/settings/SegmentedControl";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { ROUTES } from "@/config/site";
import type { Role } from "@/lib/account/types";
import { teamApi } from "@/lib/admin/api";
import type { InviteResult, TeamMember } from "@/lib/admin/types";
import { ApiError } from "@/lib/api/client";
import { adminApi } from "@/lib/council/api";
import { cn } from "@/lib/cn";
import { formatRelative, initials } from "@/lib/report/labels";
import { ROLE_NAME, isAdmin, isSuperAdmin } from "@/lib/roles";

const FILTERS = [
  { value: "all", label: "Everyone" },
  { value: "officers", label: "Officers" },
  { value: "admins", label: "Administrators" },
  { value: "invited", label: "Invited" },
  { value: "suspended", label: "Suspended" },
] as const;

const STATUS: Record<TeamMember["status"], { label: string; chip: string }> = {
  active: { label: "Active", chip: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" },
  invited: { label: "Invited", chip: "bg-sky-500/12 text-sky-700 dark:text-sky-300" },
  "never-signed-in": { label: "Not signed in yet", chip: "bg-amber-500/12 text-amber-700 dark:text-amber-300" },
  suspended: { label: "Suspended", chip: "bg-slate-500/15 text-ui-label-2" },
};

const DEPARTMENTS = ["Community Safety", "Customer Service", "Information Technology", "Governance and Privacy", "Communications"];

/**
 * People management: Council's team, what each person is carrying, and the
 * door in for someone new. Invitations send a one-time link; nobody is ever
 * handed a password. Changing an administrator is a super administrator's job.
 */
export function TeamPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");
  const [q, setQ] = useState("");
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const { data, error, loading, reload } = useLoad((signal) => teamApi.list(signal), "team");
  const members = data?.members ?? [];

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return members.filter((m) => {
      if (filter === "officers" && m.role !== "OFFICER") return false;
      if (filter === "admins" && !isAdmin(m.role)) return false;
      if (filter === "invited" && m.status !== "invited") return false;
      if (filter === "suspended" && m.status !== "suspended") return false;
      if (filter !== "suspended" && m.status === "suspended" && filter !== "all") return false;
      return !needle || [m.fullName, m.email, m.jobTitle ?? "", m.department ?? ""].join(" ").toLowerCase().includes(needle);
    });
  }, [members, filter, q]);

  const active = members.filter((m) => m.status !== "suspended");
  const maxLoad = Math.max(1, ...active.map((m) => m.workload.openReports + m.workload.openTasks));

  return (
    <ConsoleLayout title="Team" subtitle="Council's CyberSafe staff — roles, workload and access." wide>
      <ConsoleHero icon={IdCard} tint="bg-gradient-to-br from-violet-500 to-indigo-600">
        <p>Invite a council member and they choose their own password from the email. Workload counts open reports, open tasks and decisions over the last 30 days.</p>
      </ConsoleHero>

      <section aria-label="Team totals" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label="On the team" value={active.length} loading={!data} />
        <StatTile label="Officers" value={active.filter((m) => m.role === "OFFICER").length} loading={!data} />
        <StatTile label="Administrators" value={active.filter((m) => isAdmin(m.role)).length} loading={!data} detail={`${active.filter((m) => m.role === "SUPER_ADMIN").length} super`} />
        <StatTile label="Invitations pending" value={members.filter((m) => m.status === "invited").length} loading={!data} />
        <StatTile label="Overdue tasks" value={active.reduce((s, m) => s + m.workload.overdueTasks, 0)} loading={!data} tone={active.some((m) => m.workload.overdueTasks > 0) ? "attention" : "good"} />
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SegmentedControl label="Show" segments={FILTERS} value={filter} onChange={setFilter} className="lg:max-w-[34rem]" />
        <div className="flex-1"><SearchBox label="Search the team" value={q} onChange={setQ} placeholder="Name, email, title or department" /></div>
        <button type="button" onClick={() => setInviting(true)} className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-ui-tint px-4 py-2 text-[0.875rem] font-semibold text-white hover:opacity-90 dark:text-slate-950">
          <UserPlus className="h-4 w-4" aria-hidden="true" /> Invite a council member
        </button>
      </div>

      {notice ? <FormAlert tone={notice.tone}>{notice.text}</FormAlert> : null}
      {error ? <FormAlert tone="error">{error.message}</FormAlert> : null}

      {loading && !data ? (
        <div className="grid gap-3 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-44 animate-pulse rounded-ui bg-ui-card" />)}</div>
      ) : shown.length === 0 ? (
        <p className="rounded-ui bg-ui-card px-4 py-10 text-center text-[0.9375rem] text-ui-label-2">Nobody matches.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {shown.map((member) => <MemberCard key={member.id} member={member} me={user?.id ?? ""} maxLoad={maxLoad} onEdit={() => setEditing(member)} />)}
        </ul>
      )}

      <Sheet open={inviting} onClose={() => setInviting(false)} title="Invite a council member">
        {inviting ? <InviteForm superAdmin={isSuperAdmin(user?.role)} onInvited={() => reload()} /> : null}
      </Sheet>

      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={editing?.fullName ?? ""}>
        {editing ? (
          <EditMember
            key={editing.id}
            member={editing}
            self={editing.id === user?.id}
            superAdmin={isSuperAdmin(user?.role)}
            onChanged={(text) => { setNotice({ tone: "success", text }); reload(); setEditing(null); }}
          />
        ) : null}
      </Sheet>
    </ConsoleLayout>
  );
}

function MemberCard({ member, me, maxLoad, onEdit }: { member: TeamMember; me: string; maxLoad: number; onEdit: () => void }) {
  const S = STATUS[member.status];
  const load = member.workload.openReports + member.workload.openTasks;
  return (
    <li className={cn("flex flex-col gap-3 rounded-ui bg-ui-card p-4", member.status === "suspended" && "opacity-70")}>
      <div className="flex items-start gap-3">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[0.875rem] font-semibold text-white", member.role === "SUPER_ADMIN" ? "bg-gradient-to-br from-fuchsia-500 to-violet-600" : member.role === "ADMIN" ? "bg-gradient-to-br from-violet-500 to-indigo-600" : "bg-gradient-to-br from-blue-500 to-cyan-500")}>
          {initials(member.fullName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 text-[1rem] font-semibold text-ui-label">
            {member.fullName}{member.id === me ? <span className="text-[0.75rem] font-normal text-ui-label-3">(you)</span> : null}
          </p>
          <p className="truncate text-[0.8125rem] text-ui-label-2">{[member.jobTitle, member.department].filter(Boolean).join(" · ") || member.email}</p>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[0.6875rem]">
            <span className="inline-flex items-center gap-1 rounded-full bg-ui-fill px-2 py-0.5 font-semibold text-ui-label-2"><ShieldCheck className="h-3 w-3" aria-hidden="true" />{ROLE_NAME[member.role]}</span>
            <span className={cn("rounded-full px-2 py-0.5 font-semibold", S.chip)}>{S.label}</span>
          </p>
        </div>
        <button type="button" onClick={onEdit} className="rounded-full bg-ui-fill px-3 py-1 text-[0.8125rem] font-semibold text-ui-tint hover:bg-ui-fill-strong">Manage</button>
      </div>

      <div>
        <div className="flex items-center justify-between text-[0.6875rem] text-ui-label-3">
          <span>Carrying now</span>
          <span className="tabular-nums">{load} open</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ui-fill" role="img" aria-label={`${load} open items, against the busiest team member's ${maxLoad}`}>
          <div className="h-full rounded-full" style={{ width: `${(load / maxLoad) * 100}%`, background: "var(--viz-1)" }} />
        </div>
      </div>

      <dl className="grid grid-cols-4 gap-2 text-center">
        <Metric icon={Inbox} label="Open reports" value={member.workload.openReports} />
        <Metric icon={KanbanSquare} label="Open tasks" value={member.workload.openTasks} alert={member.workload.overdueTasks > 0 ? `${member.workload.overdueTasks} overdue` : undefined} />
        <Metric icon={MailCheck} label="Decided (30d)" value={member.workload.decided30} />
        <Metric icon={Timer} label="Median to decide" value={member.workload.medianDecisionHours === null ? "—" : `${Math.round(member.workload.medianDecisionHours)}h`} />
      </dl>

      <p className="text-[0.6875rem] text-ui-label-3">
        {member.lastActiveAt ? `Last active ${formatRelative(member.lastActiveAt)}` : "No activity yet"} · {member.email}
      </p>
    </li>
  );
}

function Metric({ icon: Icon, label, value, alert }: { icon: typeof Inbox; label: string; value: number | string; alert?: string }) {
  return (
    <div className="rounded-lg bg-ui-fill/50 px-1 py-2">
      <dt className="flex items-center justify-center gap-1 text-[0.625rem] text-ui-label-3"><Icon className="h-3 w-3" aria-hidden="true" />{label}</dt>
      <dd className="mt-0.5 text-[1.0625rem] font-semibold tabular-nums text-ui-label">{value}</dd>
      {alert ? <dd className="flex items-center justify-center gap-0.5 text-[0.625rem] font-semibold text-rose-600 dark:text-rose-300"><AlarmClock className="h-3 w-3" aria-hidden="true" />{alert}</dd> : null}
    </div>
  );
}

function InviteForm({ superAdmin, onInvited }: { superAdmin: boolean; onInvited: () => void }) {
  const [form, setForm] = useState({ fullName: "", email: "", role: "OFFICER" as Role, jobTitle: "CyberSafe Officer", department: "Community Safety", phone: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<InviteResult | null>(null);
  const [copied, setCopied] = useState(false);
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setResult(await teamApi.invite({ ...form, jobTitle: form.jobTitle || undefined, department: form.department || undefined, phone: form.phone || undefined }));
      onInvited();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError("The invitation could not be sent.", 0));
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <div className="flex flex-col gap-4">
        <FormAlert tone="success">
          {result.member.fullName} has been added as {ROLE_NAME[result.member.role].toLowerCase()}.{" "}
          {result.emailSent ? `An invitation is on its way to ${result.member.email}; the link lasts 7 days.` : "Email is unavailable right now, so share this one-time set-up link with them directly — by phone or in person, never in a group chat."}
        </FormAlert>
        {result.inviteLink ? (
          <div className="flex gap-2">
            <input readOnly value={result.inviteLink} aria-label="Set-up link" className="min-w-0 flex-1 rounded-[0.625rem] bg-ui-fill px-3 py-2 font-mono text-[0.75rem] text-ui-label" />
            <button type="button" onClick={() => void navigator.clipboard.writeText(result.inviteLink!).then(() => setCopied(true))} className="inline-flex items-center gap-1 rounded-full bg-ui-fill px-3 text-[0.8125rem] font-semibold text-ui-tint">
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />{copied ? "Copied" : "Copy"}
            </button>
          </div>
        ) : null}
        <SubmitButton type="button" variant="secondary" icon={UserPlus} onClick={() => { setResult(null); setForm((f) => ({ ...f, fullName: "", email: "", phone: "" })); }}>Invite someone else</SubmitButton>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-5">
      <SettingsGroup>
        <TextField label="Full name" value={form.fullName} onChange={set("fullName")} required autoFocus maxLength={120} error={error?.field("fullName")} />
        <TextField label="Work email" type="email" value={form.email} onChange={set("email")} required maxLength={254} placeholder="name@hume.vic.gov.au" error={error?.field("email")} />
      </SettingsGroup>
      <SettingsGroup footer={superAdmin ? "Administrators can manage people, categories, content, the audit trail and exports. Super administrators can also appoint and remove administrators." : "Only a super administrator can invite administrators."}>
        <SelectField label="Role" value={form.role} onChange={set("role")}>
          <option value="OFFICER">Officer — reviews reports and works the queue</option>
          {superAdmin ? <option value="ADMIN">Administrator</option> : null}
          {superAdmin ? <option value="SUPER_ADMIN">Super administrator</option> : null}
        </SelectField>
      </SettingsGroup>
      <SettingsGroup>
        <TextField label="Job title" aside="(optional)" value={form.jobTitle} onChange={set("jobTitle")} maxLength={80} />
        <TextField label="Department" aside="(optional)" value={form.department} onChange={set("department")} maxLength={80} list="departments" />
        <datalist id="departments">{DEPARTMENTS.map((d) => <option key={d} value={d} />)}</datalist>
        <TextField label="Phone" aside="(optional)" type="tel" value={form.phone} onChange={set("phone")} maxLength={30} />
      </SettingsGroup>
      {error && !error.fields.length ? <FormAlert tone="error">{error.message}</FormAlert> : null}
      <SubmitButton busy={busy} icon={Send}>Send invitation</SubmitButton>
    </form>
  );
}

function EditMember({ member, self, superAdmin, onChanged }: { member: TeamMember; self: boolean; superAdmin: boolean; onChanged: (text: string) => void }) {
  const [form, setForm] = useState({ fullName: member.fullName, jobTitle: member.jobTitle ?? "", department: member.department ?? "", phone: member.phone ?? "" });
  const [role, setRole] = useState<Role>(member.role);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const protectedTarget = isAdmin(member.role) && !superAdmin;
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const run = async (label: string, action: () => Promise<string>) => {
    setBusy(label);
    setMessage(null);
    try {
      onChanged(await action());
    } catch (caught) {
      setMessage({ tone: "error", text: caught instanceof ApiError ? caught.message : "That did not work." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <SettingsGroup title="Profile">
        <TextField label="Full name" value={form.fullName} onChange={set("fullName")} maxLength={120} disabled={protectedTarget && !self} />
        <TextField label="Job title" value={form.jobTitle} onChange={set("jobTitle")} maxLength={80} disabled={protectedTarget && !self} />
        <TextField label="Department" value={form.department} onChange={set("department")} maxLength={80} disabled={protectedTarget && !self} />
        <TextField label="Phone" type="tel" value={form.phone} onChange={set("phone")} maxLength={30} disabled={protectedTarget && !self} />
      </SettingsGroup>
      <SubmitButton
        type="button"
        busy={busy === "profile"}
        icon={Briefcase}
        disabled={protectedTarget && !self}
        onClick={() => void run("profile", async () => {
          await teamApi.update(member.id, { fullName: form.fullName, jobTitle: form.jobTitle || null, department: form.department || null, phone: form.phone || null });
          return `${form.fullName}'s profile is saved.`;
        })}
      >
        Save profile
      </SubmitButton>

      {member.status === "invited" || member.status === "never-signed-in" ? (
        <SettingsGroup title="Invitation" footer="Sends a fresh link and cancels the old one.">
          <div className="flex flex-col gap-3 p-4">
            <SubmitButton
              type="button"
              variant="secondary"
              icon={Send}
              busy={busy === "invite"}
              onClick={() => {
                setBusy("invite");
                teamApi.resend(member.id)
                  .then((r) => { setMessage({ tone: "success", text: r.emailSent ? `A new invitation is on its way to ${member.email}.` : "Email is unavailable — share this link directly." }); setLink(r.inviteLink); })
                  .catch((caught) => setMessage({ tone: "error", text: caught instanceof ApiError ? caught.message : "That did not work." }))
                  .finally(() => setBusy(null));
              }}
            >
              Resend invitation
            </SubmitButton>
            {link ? <input readOnly value={link} aria-label="Set-up link" className="rounded-[0.625rem] bg-ui-fill px-3 py-2 font-mono text-[0.75rem]" /> : null}
          </div>
        </SettingsGroup>
      ) : null}

      <SettingsGroup title="Access" footer={self ? "You cannot change your own role or suspend yourself." : protectedTarget ? "Only a super administrator can change or suspend an administrator." : "A change takes effect on their very next click."}>
        {self || protectedTarget ? (
          <p className="px-4 py-3.5 text-[0.9375rem] text-ui-label-2">{ROLE_NAME[member.role]}</p>
        ) : (
          <div className="flex flex-col gap-3 p-4">
            <SelectField label="Role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="OFFICER">Officer</option>
              {superAdmin ? <option value="ADMIN">Administrator</option> : null}
              {superAdmin ? <option value="SUPER_ADMIN">Super administrator</option> : null}
              <option value="RESIDENT">Remove from the team (resident account)</option>
            </SelectField>
            <SubmitButton
              type="button"
              variant="secondary"
              busy={busy === "role"}
              disabled={role === member.role}
              onClick={() => void run("role", async () => {
                await adminApi.setRole(member.id, role);
                return role === "RESIDENT" ? `${member.fullName} has left the team; their open reports are back in the queue.` : `${member.fullName} is now ${ROLE_NAME[role].toLowerCase()}.`;
              })}
            >
              Change role
            </SubmitButton>
            {member.status === "suspended" ? (
              <SubmitButton type="button" variant="secondary" busy={busy === "reactivate"} onClick={() => void run("reactivate", async () => { await adminApi.reactivate(member.id); return `${member.fullName} can sign in again.`; })}>
                Reactivate
              </SubmitButton>
            ) : (
              <>
                <TextField label="Reason for suspending" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} hint="Recorded on the audit trail." />
                <SubmitButton type="button" variant="danger" busy={busy === "suspend"} disabled={reason.trim().length < 5} onClick={() => void run("suspend", async () => { const r = await adminApi.suspend(member.id, reason.trim()); return `${member.fullName} is suspended.${r.releasedReports ? ` ${r.releasedReports} open report(s) returned to the queue.` : ""}`; })}>
                  Suspend access
                </SubmitButton>
              </>
            )}
          </div>
        )}
      </SettingsGroup>

      <p className="flex items-center gap-1.5 text-[0.75rem] text-ui-label-3">
        <Phone className="h-3.5 w-3.5" aria-hidden="true" />{member.phone ?? "No phone recorded"} · <Link to={`${ROUTES.councilTasks}?${new URLSearchParams({ new: "1", title: `Catch up with ${member.fullName}` }).toString()}`} className="text-ui-tint hover:underline">Assign a task</Link>
      </p>

      {message ? <FormAlert tone={message.tone}>{message.text}</FormAlert> : null}
    </div>
  );
}
