import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BellOff, BellRing, CircleAlert, Loader2 } from "lucide-react";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { ROUTES } from "@/config/site";
import { describeSubscription, subscriptionsApi } from "@/lib/alerts/api";
import { ApiError } from "@/lib/api/client";

/**
 * Where the links in subscription emails land: confirming (FR64, FR65) and
 * one-click unsubscribing (FR66). Neither needs an account — the link is the
 * credential — and each is acted on once, on arrival.
 */
export function SubscriptionLinkPage({ mode }: { mode: "confirm" | "unsubscribe" }) {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<{ status: "working" } | { status: "done"; text: string } | { status: "failed"; text: string }>({ status: "working" });
  const ran = useRef(false);

  useEffect(() => {
    /* Once — a confirmation replayed by a remounting effect is harmless, but
       it is two audit lines for one click. */
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setState({ status: "failed", text: "This link is incomplete. Open it again from the email." });
      return;
    }

    const work =
      mode === "confirm"
        ? subscriptionsApi.confirm(token).then(({ subscription }) => `You will now receive ${describeSubscription(subscription).toLowerCase()} at ${subscription.email}.`)
        : subscriptionsApi.unsubscribe(token).then(({ subscription }) => `${subscription.email} will no longer receive ${subscription.description}.`);

    work
      .then((text) => setState({ status: "done", text }))
      .catch((caught: unknown) => setState({ status: "failed", text: caught instanceof ApiError ? caught.message : "That did not work. Try the link again." }));
  }, [mode, token]);

  const title = mode === "confirm" ? "Confirm your alerts" : "Unsubscribe";

  return (
    <ConsoleLayout title={title}>
      <ConsoleHero
        icon={state.status === "failed" ? CircleAlert : mode === "confirm" ? BellRing : BellOff}
        tile={state.status === "working" ? <Loader2 className="h-9 w-9 animate-spin" /> : undefined}
        tint={state.status === "failed" ? "bg-slate-500" : mode === "confirm" ? "bg-emerald-500" : "bg-slate-600"}
      >
        <p className="text-[1.0625rem] font-semibold text-ui-label">
          {state.status === "working" ? "One moment…" : state.status === "done" ? (mode === "confirm" ? "You are subscribed." : "You are unsubscribed.") : "That link did not work."}
        </p>
        {state.status !== "working" ? <p className="mt-1">{state.text}</p> : null}
        <Link to={ROUTES.alerts} className="mt-4 inline-block text-[0.9375rem] font-semibold text-ui-tint hover:opacity-70">
          See current alerts
        </Link>
      </ConsoleHero>
    </ConsoleLayout>
  );
}
