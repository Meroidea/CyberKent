import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BadgeCheck, CheckCircle2, LogOut, MailWarning, Trash2, UserX } from "lucide-react";
import { useAuth } from "@/components/auth/useAuth";
import { FormAlert, PasswordField, SubmitButton, TextAreaField, TextField } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import { Switch } from "@/components/settings/Switch";
import { accountApi } from "@/lib/account/api";
import type { Preferences } from "@/lib/account/types";
import { ApiError } from "@/lib/api/client";
import { clearReportDraft } from "@/lib/report/draft";
import { ROUTES, SITE } from "@/config/site";

/** FR7, FR8, FR11, FR12 — everything a person manages about their account, on one screen. */
export function AccountSettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <ConsoleLayout title="Settings" subtitle={user?.email}>
      <Link to={ROUTES.account} className="inline-flex items-center gap-1 self-start text-[0.9375rem] font-medium text-ui-tint hover:opacity-70">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Dashboard
      </Link>

      <ProfileSection />

      <SettingsGroup title="Email" footer={`To change the address on your account, contact ${SITE.supportEmail}.`}>
        <SettingsRow
          label={user?.email}
          trailing={
            user?.emailVerified ? (
              <span className="inline-flex items-center gap-1 text-[0.9375rem] text-emerald-600 dark:text-emerald-400">
                <BadgeCheck className="h-4 w-4" aria-hidden="true" /> Confirmed
              </span>
            ) : (
              <Link to={`${ROUTES.verifyEmail}?next=${encodeURIComponent(ROUTES.accountSettings)}`} className="inline-flex items-center gap-1 text-[0.9375rem] font-medium text-amber-600 hover:opacity-70 dark:text-amber-400">
                <MailWarning className="h-4 w-4" aria-hidden="true" /> Confirm now
              </Link>
            )
          }
        />
      </SettingsGroup>

      <PasswordSection />
      <PreferencesSection />

      <SettingsGroup>
        <SettingsRow
          icon={LogOut}
          iconClassName="bg-slate-500"
          label="Sign out"
          onClick={() => {
            navigate(ROUTES.home);
            void signOut();
          }}
          chevron={false}
        />
      </SettingsGroup>

      <DeleteSection />
    </ConsoleLayout>
  );
}

function ProfileSection() {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [organisation, setOrganisation] = useState(user?.organisation ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const dirty = fullName.trim() !== (user?.fullName ?? "") || phone.trim() !== (user?.phone ?? "") || organisation.trim() !== (user?.organisation ?? "");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const { user: updated } = await accountApi.updateProfile({ fullName: fullName.trim(), phone: phone.trim(), organisation: organisation.trim() });
      setUser(updated);
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError("Your profile could not be saved.", 0));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <SettingsGroup title="Profile" footer="Only Council's CyberSafe officers see these, to follow up on your reports. They are never published.">
        <SettingsRows>
          <TextField label="Name" value={fullName} onChange={(event) => { setFullName(event.target.value); setSaved(false); }} autoComplete="name" maxLength={120} error={error?.field("fullName")} />
          <TextField label="Phone" aside="(optional)" type="tel" value={phone} onChange={(event) => { setPhone(event.target.value); setSaved(false); }} autoComplete="tel" maxLength={40} placeholder="If you would rather be called" error={error?.field("phone")} />
          <TextField label="Business or organisation" aside="(optional)" value={organisation} onChange={(event) => { setOrganisation(event.target.value); setSaved(false); }} autoComplete="organization" maxLength={160} placeholder="If you report on behalf of one" error={error?.field("organisation")} />
        </SettingsRows>
      </SettingsGroup>
      {error && !error.fields.length ? <FormAlert>{error.message}</FormAlert> : null}
      {saved ? <FormAlert tone="success">Profile saved.</FormAlert> : null}
      {dirty ? (
        <SubmitButton busy={busy} disabled={fullName.trim().length < 2}>
          Save profile
        </SubmitButton>
      ) : null}
    </form>
  );
}

function PasswordSection() {
  const { setSession } = useAuth();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setSession(await accountApi.changePassword(current, next));
      setDone(true);
      setOpen(false);
      setCurrent("");
      setNext("");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError("Your password could not be changed.", 0));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <SettingsGroup title="Password">
        {open ? (
          <form onSubmit={submit}>
            <SettingsRows>
              <PasswordField label="Current password" value={current} onChange={(event) => setCurrent(event.target.value)} autoComplete="current-password" required error={error?.field("currentPassword")} />
              <PasswordField label="New password" value={next} onChange={(event) => setNext(event.target.value)} autoComplete="new-password" required minLength={12} meter error={error?.field("newPassword")} />
            </SettingsRows>
            <div className="flex flex-col gap-2 px-4 pb-4 pt-1 sm:flex-row">
              <SubmitButton busy={busy} disabled={!current || next.length < 12} className="sm:flex-1">
                Change password
              </SubmitButton>
              <SubmitButton type="button" variant="secondary" onClick={() => { setOpen(false); setError(null); }} className="sm:flex-1">
                Cancel
              </SubmitButton>
            </div>
          </form>
        ) : (
          <SettingsRow label="Change password" onClick={() => { setOpen(true); setDone(false); }} chevron />
        )}
      </SettingsGroup>
      {error && !error.fields.length ? <FormAlert>{error.message}</FormAlert> : null}
      {done ? <FormAlert tone="success">Password changed. We have emailed you to confirm it.</FormAlert> : null}
    </div>
  );
}

const PREFERENCE_ROWS: { key: keyof Preferences; label: string; detail: string }[] = [
  { key: "emailOnStatus", label: "My report's status changes", detail: "When an officer picks it up or decides on it." },
  { key: "emailOnRequest", label: "Council asks me a question", detail: "Strongly recommended — an unanswered question stalls the review." },
  { key: "emailOnAlerts", label: "New community alerts", detail: "Verified scams circulating in Hume." },
];

function PreferencesSection() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    accountApi
      .preferences(controller.signal)
      .then(({ preferences: loaded }) => setPreferences(loaded))
      .catch((caught: unknown) => {
        if (!(caught instanceof DOMException)) setError("Your email preferences could not be loaded.");
      });
    return () => controller.abort();
  }, []);

  /* Saved as it is flipped, like any settings switch; put back if the save fails. */
  const toggle = async (key: keyof Preferences, value: boolean) => {
    if (!preferences) return;
    const previous = preferences;
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    setError(null);
    try {
      setPreferences((await accountApi.setPreferences(next)).preferences);
    } catch {
      setPreferences(previous);
      setError("That change could not be saved. Try again.");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <SettingsGroup title="Email me when" footer="Receipts for reports you send, and security emails, always arrive.">
        <SettingsRows>
          {PREFERENCE_ROWS.map((row) => (
            <SettingsRow
              key={row.key}
              label={row.label}
              detail={row.detail}
              trailing={
                preferences ? (
                  <Switch checked={preferences[row.key]} onChange={(checked) => void toggle(row.key, checked)} label={row.label} />
                ) : (
                  <span className="h-[1.5625rem] w-[2.5625rem] animate-pulse rounded-full bg-ui-fill" />
                )
              }
            />
          ))}
        </SettingsRows>
      </SettingsGroup>
      {error ? <FormAlert>{error}</FormAlert> : null}
    </div>
  );
}

function DeleteSection() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await accountApi.deleteAccount(password, reason.trim() || undefined);
      clearReportDraft();
      navigate(`${ROUTES.account}/deleted`, { replace: true });
      void signOut();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError("Your account could not be deleted. Try again.", 0));
      setBusy(false);
    }
  };

  return (
    <SettingsGroup
      title="Delete account"
      footer="Your name, email and phone are erased. Reports you sent stay with Council as a record of the scam, no longer linked to you."
    >
      {open ? (
        <form onSubmit={submit}>
          <SettingsRows>
            <PasswordField label="Password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required error={error?.field("password")} hint="To confirm it is you." />
            <TextAreaField label="Why are you leaving?" aside="(optional)" value={reason} onChange={(event) => setReason(event.target.value)} rows={2} maxLength={500} />
          </SettingsRows>
          {error && !error.fields.length ? <FormAlert className="mx-4 mb-3">{error.message}</FormAlert> : null}
          <div className="flex flex-col gap-2 px-4 pb-4 pt-1 sm:flex-row">
            <SubmitButton variant="danger" icon={Trash2} busy={busy} disabled={!password} className="sm:flex-1">
              Delete my account
            </SubmitButton>
            <SubmitButton type="button" variant="secondary" onClick={() => { setOpen(false); setError(null); }} className="sm:flex-1">
              Keep my account
            </SubmitButton>
          </div>
        </form>
      ) : (
        <SettingsRow label="Delete my account" emphasis="danger" onClick={() => setOpen(true)} chevron={false} />
      )}
    </SettingsGroup>
  );
}

/** Shown once, after deletion. Not guarded — by now there is no account to guard. */
export function AccountDeletedPage() {
  const navigate = useNavigate();

  return (
    <ConsoleLayout title="Account deleted">
      <ConsoleHero icon={UserX} tint="bg-slate-500">
        <p className="text-[1.0625rem] font-semibold text-ui-label">Your account has been deleted.</p>
        <p className="mt-1">We have emailed you a confirmation. You can still check messages at any time — that never needs an account.</p>
      </ConsoleHero>
      <SubmitButton type="button" icon={CheckCircle2} onClick={() => navigate(ROUTES.home)}>
        Back to the home page
      </SubmitButton>
    </ConsoleLayout>
  );
}
