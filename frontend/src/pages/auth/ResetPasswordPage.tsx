import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, XCircle } from "lucide-react";
import { useAuth } from "@/components/auth/useAuth";
import { FormAlert, PasswordField, SubmitButton } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRows } from "@/components/settings/SettingsRow";
import { authApi } from "@/lib/account/api";
import { ApiError } from "@/lib/api/client";
import { ROUTES } from "@/config/site";

/** FR6 — choose a new password from the emailed link, and be signed in by it. */
export function ResetPasswordPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  if (!token) {
    return (
      <ConsoleLayout title="Reset your password">
        <ConsoleHero icon={XCircle} tint="bg-rose-500">
          <p>This page needs the link from your reset email. Ask for a new one if you cannot find it.</p>
        </ConsoleHero>
        <SubmitButton type="button" onClick={() => navigate(ROUTES.forgotPassword)}>Send me a reset link</SubmitButton>
      </ConsoleLayout>
    );
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      signIn(await authApi.resetPassword(token, password));
      navigate(ROUTES.account, { replace: true, state: { notice: "Password changed. You are signed in." } });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError("Something went wrong. Try again.", 0));
      setBusy(false);
    }
  };

  const linkDead = error?.status === 400 && !error.fields.length;

  return (
    <ConsoleLayout title="Choose a new password">
      <ConsoleHero icon={KeyRound} tint="bg-blue-500">
        <p>Use at least 12 characters. A few unrelated words is easier to remember than symbols, and harder to guess.</p>
      </ConsoleHero>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {error ? (
          <FormAlert>
            {error.message}{" "}
            {linkDead ? <Link to={ROUTES.forgotPassword} className="font-semibold underline">Send a new link</Link> : null}
          </FormAlert>
        ) : null}
        <SettingsGroup>
          <SettingsRows>
            <PasswordField
              label="New password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              autoFocus
              required
              minLength={12}
              meter
              error={error?.field("password")}
            />
          </SettingsRows>
        </SettingsGroup>
        <SubmitButton busy={busy} disabled={password.length < 12}>
          Save and sign in
        </SubmitButton>
      </form>
    </ConsoleLayout>
  );
}
