import { useEffect, useRef, useState } from "react";
import { MailCheck, RotateCw } from "lucide-react";
import { useAuth } from "@/components/auth/useAuth";
import { useEmailDelivery } from "@/components/auth/useEmailDelivery";
import { CodeInput } from "@/components/forms/CodeInput";
import { FormAlert } from "@/components/forms/fields";
import { authApi } from "@/lib/account/api";
import { ApiError } from "@/lib/api/client";
import type { User } from "@/lib/account/types";

/* Long enough that a slow inbox is given a chance, short enough that nobody
   waits on a button they have decided to press. */
const RESEND_COOLDOWN_S = 30;

/**
 * Enter the emailed code — on its own screen after sign-up, and inline on the
 * report form for someone who skipped it.
 *
 * Submits itself on the sixth digit: there is nothing else to fill in, and a
 * "Verify" button after a complete code is a click that only confirms the
 * person meant to type what they typed.
 */
export function VerifyCodePanel({
  onVerified,
  devCode,
  compact = false,
  justSent = true,
}: {
  onVerified: (user: User) => void;
  /** Development builds: the code the API handed back, shown so the flow can be walked without an inbox. */
  devCode?: string;
  compact?: boolean;
  /**
   * Whether a code went out a moment ago. Only then is "send another" held
   * back — someone returning days later has an expired code and needs a new
   * one now, not in thirty seconds.
   */
  justSent?: boolean;
}) {
  const { user, setUser } = useAuth();
  const emailDelivery = useEmailDelivery();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(justSent ? RESEND_COOLDOWN_S : 0);
  const [shownCode, setShownCode] = useState(devCode);
  const timer = useRef(0);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    timer.current = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer.current);
  }, [cooldown]);

  const submit = async (value: string) => {
    if (value.length !== 6 || busy) {
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const { user: verified } = await authApi.verifyCode(value);
      setUser(verified);
      onVerified(verified);
    } catch (caught) {
      setError(caught instanceof ApiError ? (caught.field("code") ?? caught.message) : "Something went wrong. Try again.");
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    setNotice(null);

    try {
      const result = await authApi.resendCode();
      if (result.user.emailVerified) {
        setUser(result.user);
        onVerified(result.user);
        return;
      }
      setShownCode(result.devCode);
      setNotice(`A new code is on its way to ${result.user.email}. The previous one no longer works.`);
      setCooldown(RESEND_COOLDOWN_S);
      setCode("");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "We could not send a new code. Try again.");
    }
  };

  /* No code can have been sent, so there is nothing to type. */
  if (emailDelivery === false) {
    return (
      <div className={compact ? "px-4 py-4" : "px-4 py-5 sm:px-6"}>
        <EmailUnavailableNotice />
      </div>
    );
  }

  return (
    <div className={compact ? "flex flex-col gap-4 px-4 py-5" : "flex flex-col gap-5 px-4 py-6 sm:px-6"}>
      {!compact ? (
        <p className="flex items-center justify-center gap-2 text-center text-[0.9375rem] text-ui-label-2">
          <MailCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-ui-tint" />
          <span>
            Sent to <strong className="font-semibold text-ui-label">{user?.email}</strong>
          </span>
        </p>
      ) : null}

      <CodeInput
        value={code}
        onChange={(value) => {
          setCode(value);
          setError(null);
        }}
        onComplete={submit}
        disabled={busy}
        invalid={Boolean(error)}
        autoFocus={!compact}
        describedBy="verify-code-status"
      />

      <div id="verify-code-status" aria-live="polite" className="flex flex-col gap-3">
        {busy ? <p className="text-center text-[0.8125rem] text-ui-label-2">Checking…</p> : null}
        {error ? <FormAlert>{error}</FormAlert> : null}
        {notice ? <FormAlert tone="success">{notice}</FormAlert> : null}
        {shownCode && import.meta.env.DEV ? (
          <FormAlert tone="info">
            Development build — no email is sent. Your code is{" "}
            <button type="button" className="font-mono font-semibold underline" onClick={() => { setCode(shownCode); void submit(shownCode); }}>
              {shownCode}
            </button>
            .
          </FormAlert>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[0.9375rem]">
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="inline-flex items-center gap-1.5 font-medium text-ui-tint transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:text-ui-label-3 disabled:hover:opacity-100"
        >
          <RotateCw aria-hidden="true" className="h-3.5 w-3.5" />
          {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
        </button>
        <span className="text-[0.8125rem] text-ui-label-3">Check your spam folder too.</span>
      </div>
    </div>
  );
}

/** What the site says where it would otherwise promise an email. */
export function EmailUnavailableNotice({ className }: { className?: string }) {
  return (
    <FormAlert tone="info" className={className}>
      Email isn't set up on this site yet, so we can't send your confirmation code. Your account works and you can
      still report scams to Council — an officer will reach you at the address you signed up with.
    </FormAlert>
  );
}
