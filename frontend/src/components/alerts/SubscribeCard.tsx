import { useEffect, useState, type FormEvent } from "react";
import { BellPlus, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/auth/useAuth";
import { FormAlert, SelectField, SubmitButton, TextField } from "@/components/forms/fields";
import { SegmentedControl } from "@/components/settings/SegmentedControl";
import { RowSeparator, SettingsGroup } from "@/components/settings/SettingsGroup";
import { fetchReferenceData } from "@/lib/account/api";
import type { ReferenceData } from "@/lib/account/types";
import { subscriptionsApi, type SubscriptionScope } from "@/lib/alerts/api";
import { ApiError } from "@/lib/api/client";

const SCOPES: { value: SubscriptionScope; label: string }[] = [
  { value: "ALL", label: "Everything" },
  { value: "CATEGORY", label: "A type of scam" },
  { value: "SUBURB", label: "My suburb" },
];

/**
 * FR64, FR65 — subscribe to alerts, with or without an account.
 *
 * A signed-in person subscribing their own confirmed address is subscribed at
 * once; anyone else confirms by a link first, so nobody can be signed up for
 * mail they did not ask for. Every alert email carries a one-click
 * unsubscribe link (FR66).
 */
export function SubscribeCard({ defaultCategoryId, defaultSuburbId }: { defaultCategoryId?: string; defaultSuburbId?: string }) {
  const { user } = useAuth();
  const [reference, setReference] = useState<ReferenceData | null>(null);
  const [email, setEmail] = useState(user?.email ?? "");
  const [scope, setScope] = useState<SubscriptionScope>("ALL");
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? "");
  const [suburbId, setSuburbId] = useState(defaultSuburbId ?? "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "success" | "info" | "error"; text: string; devLink?: string } | null>(null);

  useEffect(() => {
    fetchReferenceData().then(setReference).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (defaultCategoryId) setCategoryId(defaultCategoryId);
    if (defaultSuburbId) setSuburbId(defaultSuburbId);
  }, [defaultCategoryId, defaultSuburbId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const response = await subscriptionsApi.subscribe({
        email: email.trim(),
        scope,
        ...(scope === "CATEGORY" ? { categoryId } : {}),
        ...(scope === "SUBURB" ? { suburbId } : {}),
      });
      setResult(
        response.status === "confirmed"
          ? { tone: "success", text: "You are subscribed. Every alert email has a one-click unsubscribe link." }
          : response.status === "pending"
            ? { tone: "info", text: `Almost done — confirm the link we sent to ${response.subscription.email}.`, devLink: response.devLink }
            : { tone: "info", text: "Saved, but this site cannot send email yet, so your address cannot be confirmed. Sign in and subscribe with your account's address to be subscribed now." },
      );
    } catch (caught) {
      setResult({ tone: "error", text: caught instanceof ApiError ? (caught.fields[0]?.message ?? caught.message) : "That did not work. Try again." });
    } finally {
      setBusy(false);
    }
  };

  const ready = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && (scope !== "CATEGORY" || categoryId) && (scope !== "SUBURB" || suburbId);

  return (
    <form onSubmit={submit}>
      <SettingsGroup title="Get alerts by email" footer="No account needed. We use your address only to send the alerts you choose, and you can unsubscribe from any of them in one click.">
        <div className="px-4 pt-3.5">
          <p className="flex items-center gap-2 text-[0.9375rem] font-medium text-ui-label">
            <BellPlus aria-hidden="true" className="h-4 w-4 text-ui-tint" />
            What would you like to hear about?
          </p>
          <SegmentedControl label="Alerts about" segments={SCOPES} value={scope} onChange={setScope} className="mt-3" />
        </div>
        {scope === "CATEGORY" ? (
          <SelectField label="Type of scam" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">Choose one…</option>
            {reference?.categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </SelectField>
        ) : null}
        {scope === "SUBURB" ? (
          <SelectField label="Suburb" value={suburbId} onChange={(event) => setSuburbId(event.target.value)}>
            <option value="">Choose one…</option>
            {reference?.suburbs.map((suburb) => (
              <option key={suburb.id} value={suburb.id}>{suburb.name} {suburb.postcode}</option>
            ))}
          </SelectField>
        ) : null}
        <RowSeparator />
        <TextField label="Email address" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        <div className="flex flex-col gap-3 px-4 pb-4 pt-1">
          <SubmitButton busy={busy} disabled={!ready} icon={result?.tone === "success" ? CheckCircle2 : undefined} className="sm:self-start">
            Subscribe
          </SubmitButton>
          {result ? (
            <FormAlert tone={result.tone}>
              {result.text}
              {result.devLink ? (
                <>
                  {" "}
                  <a href={result.devLink} className="font-semibold underline">Development: open the confirmation link</a>
                </>
              ) : null}
            </FormAlert>
          ) : null}
        </div>
      </SettingsGroup>
    </form>
  );
}
