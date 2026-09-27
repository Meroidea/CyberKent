import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth/useAuth";
import { FormAlert, PasswordField, SubmitButton, TextField } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRows } from "@/components/settings/SettingsRow";
import { authApi } from "@/lib/account/api";
import { safeNext } from "@/lib/account/session";
import { ApiError } from "@/lib/api/client";
import { draftHasContent, loadReportDraft } from "@/lib/report/draft";
import { ROUTES } from "@/config/site";

/**
 * Sign in, and go straight back to whatever sent you here.
 *
 * An unverified account is let through: the one thing verification gates is
 * sending a report, and the report form asks for the code in place.
 */
export function SignInPage() {
  const { status, signIn, expired } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"), ROUTES.account);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const draft = loadReportDraft();

  if (status === "member" && !busy) {
    return <Navigate to={next} replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      signIn(await authApi.login({ email: email.trim(), password }));
      navigate(next, { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError("Something went wrong. Try again.", 0));
      setPassword("");
      setBusy(false);
    }
  };

  const registerHref = `${ROUTES.register}${params.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <ConsoleLayout title="Sign in" subtitle="Track your reports and manage your alerts.">
      <ConsoleHero icon={UserRound} tint="bg-blue-500">
        <p>An account is never needed to check a message — only to report one to Council and follow it.</p>
      </ConsoleHero>

      {expired ? <FormAlert tone="info">Your session ended. Sign in again to carry on — nothing you were writing has been lost.</FormAlert> : null}
      {next.startsWith(ROUTES.reportScam) && draftHasContent(draft) ? (
        <FormAlert tone="success">Your report draft is saved on this device and will be waiting for you.</FormAlert>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {error ? <FormAlert>{error.message}</FormAlert> : null}

        <SettingsGroup>
          <SettingsRows>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              inputMode="email"
              required
              autoFocus
              placeholder="you@example.com"
            />
            <PasswordField
              label="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </SettingsRows>
        </SettingsGroup>

        <div className="-mt-1 flex justify-end px-1">
          <Link to={ROUTES.forgotPassword} className="text-[0.9375rem] font-medium text-ui-tint hover:opacity-70">
            Forgot your password?
          </Link>
        </div>

        <SubmitButton
          busy={busy}
          busyLabel="Signing in…"
          trailingIcon={ArrowRight}
          disabled={!email.trim() || !password}
          className="min-w-[11rem] self-center"
        >
          Sign in
        </SubmitButton>
      </form>

      <SettingsGroup footer="Free, and takes under a minute.">
        <Link
          to={registerHref}
          className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-ui-card-hover"
        >
          <span className="text-[1.0625rem] text-ui-label">New here?</span>
          <span className="text-[1.0625rem] font-semibold text-ui-tint">Create a free account</span>
        </Link>
      </SettingsGroup>
    </ConsoleLayout>
  );
}
