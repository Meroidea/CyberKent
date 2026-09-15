import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, MailCheck, XCircle } from "lucide-react";
import { useAuth } from "@/components/auth/useAuth";
import { VerifyCodePanel } from "@/components/auth/VerifyCodePanel";
import { useEmailDelivery } from "@/components/auth/useEmailDelivery";
import { FormAlert, SubmitButton } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { authApi } from "@/lib/account/api";
import { safeNext } from "@/lib/account/session";
import { ApiError } from "@/lib/api/client";
import { draftHasContent, loadReportDraft } from "@/lib/report/draft";
import { ROUTES } from "@/config/site";

/**
 * Confirm the email address — by code on this screen, or by the link in the
 * email, which lands here too.
 *
 * The link works signed out and on another device: someone who signed up on a
 * laptop and opened the email on their phone should not be asked to sign in on
 * the phone to finish something the laptop started.
 */
export function VerifyEmailPage() {
  const { status, user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const token = params.get("token");
  const next = safeNext(params.get("next"), ROUTES.account);
  const state = (location.state ?? {}) as { devCode?: string; fresh?: boolean };

  const [linkState, setLinkState] = useState<"idle" | "checking" | "done" | "failed">(token ? "checking" : "idle");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const ranRef = useRef(false);
  const emailDelivery = useEmailDelivery();

  /* The link is spent on first use, so it is followed once — StrictMode's
     second mount would otherwise spend it and then report the spent link. */
  useEffect(() => {
    if (!token || ranRef.current) {
      return;
    }
    ranRef.current = true;

    authApi
      .verifyLink(token)
      .then(({ user: confirmed }) => {
        if (user && user.id === confirmed.id) {
          setUser(confirmed);
        }
        setLinkState("done");
      })
      .catch((error: unknown) => {
        setLinkError(error instanceof ApiError ? error.message : "We could not check that link. Try again.");
        setLinkState("failed");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const reporting = next.startsWith(ROUTES.reportScam) && draftHasContent(loadReportDraft());
  const continueLabel = reporting ? "Continue to your report" : "Go to your dashboard";

  /* A link visit, whatever its outcome. */
  if (token) {
    return (
      <ConsoleLayout title="Confirm your email">
        {linkState === "checking" ? (
          <ConsoleHero tile={<Loader2 className="h-9 w-9 animate-spin" />} tint="bg-blue-500">
            <p>Confirming your address…</p>
          </ConsoleHero>
        ) : linkState === "done" ? (
          <>
            <ConsoleHero icon={CheckCircle2} tint="bg-emerald-500">
              <p className="text-[1.0625rem] font-semibold text-ui-label">Your email is confirmed.</p>
              <p className="mt-1">You can now send reports to Council.</p>
            </ConsoleHero>
            <SubmitButton type="button" onClick={() => navigate(status === "member" ? next : `${ROUTES.signIn}?next=${encodeURIComponent(next)}`, { replace: true })}>
              {status === "member" ? continueLabel : "Sign in to continue"}
            </SubmitButton>
          </>
        ) : (
          <>
            <ConsoleHero icon={XCircle} tint="bg-rose-500">
              <p>{linkError}</p>
            </ConsoleHero>
            {status === "member" && user && !user.emailVerified ? (
              <SettingsGroup title="Use a code instead" footer="A new code also makes a fresh link.">
                <VerifyCodePanel onVerified={() => navigate(next, { replace: true })} compact justSent={false} />
              </SettingsGroup>
            ) : (
              <SubmitButton type="button" onClick={() => navigate(status === "member" ? ROUTES.account : ROUTES.signIn)}>
                {status === "member" ? "Go to your dashboard" : "Sign in"}
              </SubmitButton>
            )}
          </>
        )}
      </ConsoleLayout>
    );
  }

  if (status === "guest") {
    return <Navigate to={`${ROUTES.signIn}?next=${encodeURIComponent(`${ROUTES.verifyEmail}?next=${encodeURIComponent(next)}`)}`} replace />;
  }

  if (user?.emailVerified && !verified) {
    return <Navigate to={next} replace />;
  }

  if (verified) {
    return (
      <ConsoleLayout title="Confirm your email">
        <ConsoleHero icon={CheckCircle2} tint="bg-emerald-500">
          <p className="text-[1.0625rem] font-semibold text-ui-label">You are all set.</p>
          <p className="mt-1">{reporting ? "Your report is ready to send." : "Your account is ready."}</p>
        </ConsoleHero>
        <SubmitButton type="button" autoFocus onClick={() => navigate(next, { replace: true })}>
          {continueLabel}
        </SubmitButton>
      </ConsoleLayout>
    );
  }

  return (
    <ConsoleLayout
      title="Confirm your email"
      subtitle={
        emailDelivery === false ? "Not needed on this site yet." : state.fresh ? "Account created — one last step." : "One quick step."
      }
    >
      <ConsoleHero icon={MailCheck} tint="bg-blue-500">
        {emailDelivery === false ? (
          <p>There is nothing to confirm here yet — this site cannot send codes. Your account is ready to use as it is.</p>
        ) : (
          <p>
            Enter the six-digit code we just emailed you. It lets Council reach you about what you report — and proves nobody
            signed up with your address.
          </p>
        )}
      </ConsoleHero>

      <SettingsGroup>
        <VerifyCodePanel devCode={state.devCode} justSent={Boolean(state.fresh)} onVerified={() => setVerified(true)} />
      </SettingsGroup>

      {/* A screen with nothing to type on it needs the way onward to be the
          obvious thing on it, not a quiet link under the fold. */}
      {emailDelivery === false ? (
        <SubmitButton type="button" onClick={() => navigate(next, { replace: true })}>
          {continueLabel}
        </SubmitButton>
      ) : null}

      {reporting ? (
        <FormAlert tone="info">
          {emailDelivery === false
            ? "Your report draft is saved and ready to send."
            : "Your report draft is saved. Once you are confirmed, you can send it."}
        </FormAlert>
      ) : null}

      {emailDelivery === false ? null : (
        <p className="text-center text-[0.9375rem] leading-relaxed text-ui-label-2">
          <Link to={next === ROUTES.account ? ROUTES.account : next} className="font-medium text-ui-tint hover:opacity-70">
            Do this later
          </Link>
          <span className="mx-2 text-ui-label-3">·</span>
          <span>You can look around, but a report can only be sent once your email is confirmed.</span>
        </p>
      )}
    </ConsoleLayout>
  );
}
