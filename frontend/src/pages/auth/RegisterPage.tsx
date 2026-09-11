import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { BellRing, ClipboardList, FileCheck2, MessageSquareReply, ScanSearch, UserPlus } from "lucide-react";
import { useAuth } from "@/components/auth/useAuth";
import { FormAlert, PasswordField, SubmitButton, TextField } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import { useCheckModal } from "@/components/check/useCheckModal";
import { authApi } from "@/lib/account/api";
import { safeNext } from "@/lib/account/session";
import { ApiError } from "@/lib/api/client";
import { draftHasContent, loadReportDraft } from "@/lib/report/draft";
import { ROUTES } from "@/config/site";

const BENEFITS = [
  { Icon: FileCheck2, tint: "bg-rose-500", label: "Report scams to Council", detail: "With the links, numbers and details the checker already found." },
  { Icon: ClipboardList, tint: "bg-indigo-500", label: "Get a reference and track it", detail: "See when an officer picks it up and what they decide." },
  { Icon: MessageSquareReply, tint: "bg-amber-500", label: "Answer Council's questions", detail: "In one place, instead of a phone tag." },
  { Icon: BellRing, tint: "bg-emerald-500", label: "Choose what reaches you", detail: "Status updates and community alerts, by email — or not." },
];

/**
 * Create a free account.
 *
 * Three fields. Everything else a profile can hold is optional and lives in
 * settings; asking for a phone number here is asking a person with a scam in
 * their hand to stop and decide something that does not matter yet.
 */
export function RegisterPage() {
  const { status, signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { open: openChecker } = useCheckModal();
  const next = safeNext(params.get("next"), ROUTES.account);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const draft = loadReportDraft();
  const reporting = next.startsWith(ROUTES.reportScam);

  if (status === "member" && !busy) {
    return <Navigate to={next} replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const session = await authApi.register({ fullName: fullName.trim(), email: email.trim(), password });
      signIn(session);
      navigate(`${ROUTES.verifyEmail}?next=${encodeURIComponent(next)}`, {
        replace: true,
        state: { devCode: session.devCode, fresh: true },
      });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError("Something went wrong. Try again.", 0));
      setBusy(false);
    }
  };

  const taken = error?.status === 409;

  return (
    <ConsoleLayout title="Create a free account" subtitle="Takes under a minute. No card, no cost.">
      <ConsoleHero icon={UserPlus} tint="bg-blue-500">
        {reporting ? (
          <p>
            Checking messages is free and always will be. To <strong className="font-semibold text-ui-label">report</strong> one
            to Council, we need a way to reach you about it — that is all the account is for.
          </p>
        ) : (
          <p>Report scams to Council, follow what happens to them, and choose which alerts reach you. Checking a message never needs an account.</p>
        )}
      </ConsoleHero>

      {reporting && draftHasContent(draft) ? (
        <FormAlert tone="success">
          Your report <strong className="font-semibold">“{draft.title || "draft"}”</strong> is saved on this device. You will pick up exactly where you left off.
        </FormAlert>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {error && !error.fields.length ? <FormAlert>{error.message}</FormAlert> : null}
        {taken ? (
          <FormAlert>
            That email already has an account.{" "}
            <Link to={`${ROUTES.signIn}?next=${encodeURIComponent(next)}`} className="font-semibold underline">
              Sign in
            </Link>{" "}
            or{" "}
            <Link to={ROUTES.forgotPassword} className="font-semibold underline">
              reset your password
            </Link>
            .
          </FormAlert>
        ) : null}

        <SettingsGroup
          footer={
            <>
              By creating an account you agree to the{" "}
              <Link to={ROUTES.terms} className="text-ui-tint hover:opacity-70">terms of use</Link> and how we handle your details in the{" "}
              <Link to={ROUTES.privacy} className="text-ui-tint hover:opacity-70">privacy statement</Link>. We never ask for bank or card details.
            </>
          }
        >
          <SettingsRows>
            <TextField
              label="Your name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
              placeholder="As you would like Council to address you"
              error={error?.field("fullName")}
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              inputMode="email"
              required
              placeholder="you@example.com"
              error={taken ? undefined : error?.field("email")}
              hint="We will send a six-digit code to confirm it."
            />
            <PasswordField
              label="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
              minLength={12}
              meter
              placeholder="At least 12 characters"
              error={error?.field("password")}
            />
          </SettingsRows>
        </SettingsGroup>

        <SubmitButton busy={busy} disabled={!fullName.trim() || !email.trim() || password.length < 12}>
          Create free account
        </SubmitButton>

        <p className="text-center text-[0.9375rem] text-ui-label-2">
          Already have an account?{" "}
          <Link to={`${ROUTES.signIn}${params.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-ui-tint hover:opacity-70">
            Sign in
          </Link>
        </p>
      </form>

      <SettingsGroup title="What an account gives you">
        <SettingsRows inset={60}>
          {BENEFITS.map(({ Icon, tint, label, detail }) => (
            <SettingsRow key={label} icon={Icon} iconClassName={tint} label={label} detail={detail} />
          ))}
        </SettingsRows>
      </SettingsGroup>

      <SettingsGroup footer="The checker runs on your device and never needs an account.">
        <SettingsRows inset={60}>
          <SettingsRow icon={ScanSearch} iconClassName="bg-indigo-500" label="Just want to check something?" detail="Paste a message, link or number for an instant read." onClick={openChecker} chevron />
        </SettingsRows>
      </SettingsGroup>
    </ConsoleLayout>
  );
}
