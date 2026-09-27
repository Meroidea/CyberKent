import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, KeyRound, MailCheck } from "lucide-react";
import { useAuth } from "@/components/auth/useAuth";
import { useEmailDelivery } from "@/components/auth/useEmailDelivery";
import { FormAlert, SubmitButton, TextField } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRows } from "@/components/settings/SettingsRow";
import { authApi } from "@/lib/account/api";
import { ApiError } from "@/lib/api/client";
import { ROUTES, SITE } from "@/config/site";

/**
 * FR6 — ask for a reset link.
 *
 * The confirmation reads the same whether or not the address has an account,
 * because the API answers the same either way. Saying "no account found" here
 * would tell anyone which of their neighbours' addresses are registered.
 */
export function ForgotPasswordPage() {
  const { user } = useAuth();
  const emailDelivery = useEmailDelivery();
  const [email, setEmail] = useState(user?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError("Something went wrong. Try again.", 0));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <ConsoleLayout title="Check your email">
        <ConsoleHero icon={MailCheck} tint="bg-emerald-500">
          <p>
            If <strong className="font-semibold text-ui-label">{email.trim()}</strong> has an account, a link to choose a new
            password is on its way. It works once, for an hour.
          </p>
        </ConsoleHero>
        <SettingsGroup footer="Nothing after a few minutes? Check your spam folder, or make sure this is the address you signed up with.">
          <button type="button" onClick={() => setSent(false)} className="w-full px-4 py-3.5 text-left text-[1.0625rem] text-ui-tint transition-colors hover:bg-ui-card-hover">
            Use a different address
          </button>
        </SettingsGroup>
        <p className="text-center text-[0.9375rem]">
          <Link to={ROUTES.signIn} className="font-medium text-ui-tint hover:opacity-70">Back to sign in</Link>
        </p>
      </ConsoleLayout>
    );
  }

  return (
    <ConsoleLayout title="Reset your password">
      <ConsoleHero icon={KeyRound} tint="bg-blue-500">
        <p>Enter the email you signed up with and we will send you a link to choose a new password.</p>
      </ConsoleHero>

      {emailDelivery === false ? (
        <FormAlert tone="info">
          Email isn't set up on this site yet, so a reset link can't be sent. If you are locked out, contact the CyberSafe
          team at {SITE.supportEmail}.
        </FormAlert>
      ) : null}

      {emailDelivery === false ? null : (
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {error ? <FormAlert>{error.field("email") ?? error.message}</FormAlert> : null}
        <SettingsGroup>
          <SettingsRows>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              inputMode="email"
              autoFocus
              required
              placeholder="you@example.com"
            />
          </SettingsRows>
        </SettingsGroup>
        <SubmitButton busy={busy} busyLabel="Sending…" trailingIcon={ArrowRight} disabled={!email.trim()} className="min-w-[11rem] self-center">
          Send reset link
        </SubmitButton>
      </form>
      )}

      <p className="text-center text-[0.9375rem] text-ui-label-2">
        Remembered it? <Link to={ROUTES.signIn} className="font-semibold text-ui-tint hover:opacity-70">Sign in</Link>
      </p>
    </ConsoleLayout>
  );
}
