import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { EvidencePanel } from "@/components/evidence/EvidencePanel";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  ClipboardCopy,
  Flag,
  LayoutDashboard,
  LifeBuoy,
  MailCheck,
  Plus,
  ScanSearch,
  Send,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/components/auth/useAuth";
import { useEmailConfirmation } from "@/components/auth/useEmailConfirmation";
import { EmailUnavailableNotice, VerifyCodePanel } from "@/components/auth/VerifyCodePanel";
import { useEmailDelivery } from "@/components/auth/useEmailDelivery";
import { useCheckModal } from "@/components/check/useCheckModal";
import { FormAlert, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import { Switch } from "@/components/settings/Switch";
import { fetchReferenceData, reportsApi } from "@/lib/account/api";
import type { IndicatorType, ReferenceData, ReportDetail } from "@/lib/account/types";
import { ApiError } from "@/lib/api/client";
import {
  EMPTY_DRAFT,
  clearReportDraft,
  draftHasContent,
  loadReportDraft,
  saveReportDraft,
  type ReportDraft,
} from "@/lib/report/draft";
import { CHANNELS, INDICATOR_LABEL, INDICATOR_TYPES } from "@/lib/report/labels";
import { ROUTES } from "@/config/site";
import { cn } from "@/lib/cn";

/**
 * FR25–FR28 — Report a scam to Council.
 *
 * Checking is free and anonymous; reporting is not, because a report starts a
 * piece of Council work that someone must be able to follow up. So a guest
 * sees why an account is needed and a one-tap way to make one, and everything
 * they had already put into the checker waits for them on the other side.
 */
export function ReportPage() {
  const { status } = useAuth();
  return status === "member" ? <ReportForm /> : <ReportGate />;
}

const ACCOUNT_STEP = { label: "Create a free account", detail: "Name, email and a password. Under a minute." };
const CONFIRM_STEP = { label: "Confirm your email", detail: "Type the six-digit code we send you." };
const SEND_STEPS = [
  { label: "Send your report", detail: "Anything the checker found is already filled in." },
  { label: "Track it", detail: "Your dashboard shows each step, and any question Council asks." },
];

/** The journey as this deployment can actually run it. */
function steps(emailDelivery: boolean | null) {
  return emailDelivery === false ? [ACCOUNT_STEP, ...SEND_STEPS] : [ACCOUNT_STEP, CONFIRM_STEP, ...SEND_STEPS];
}

function ReportGate() {
  const { open: openChecker } = useCheckModal();
  const emailDelivery = useEmailDelivery();
  const draft = loadReportDraft();
  const next = encodeURIComponent(ROUTES.reportScam);

  return (
    <ConsoleLayout title="Report a scam to Council" subtitle="Send it to a CyberSafe officer and get a reference number.">
      <ConsoleHero icon={Flag} tint="bg-rose-500">
        <p>
          Reporting needs a <strong className="font-semibold text-ui-label">free account</strong>, so an officer can
          follow up with you and you can see what happens to your report. Checking a message stays free, with no account.
        </p>
      </ConsoleHero>

      {draftHasContent(draft) ? (
        <FormAlert tone="success">
          Your report <strong className="font-semibold">“{draft.title || "draft"}”</strong> is saved on this device
          {draft.indicators.length > 0 ? `, with ${draft.indicators.length} detail${draft.indicators.length === 1 ? "" : "s"} from your check` : ""}. It will be
          waiting once you are signed in.
        </FormAlert>
      ) : null}

      <div className="flex flex-col gap-3">
        <Link
          to={`${ROUTES.register}?next=${next}`}
          className="interactive inline-flex min-h-[2.875rem] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 px-6 py-3 text-[0.9375rem] font-semibold text-white shadow-lg shadow-indigo-600/20 dark:from-indigo-500 dark:to-cyan-400 dark:text-slate-950"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Create a free account
        </Link>
        <Link
          to={`${ROUTES.signIn}?next=${next}`}
          className="interactive inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-ui-card px-6 py-3 text-[0.9375rem] font-semibold text-ui-tint shadow-[0_0_0_1px_var(--ui-separator)] hover:bg-ui-card-hover"
        >
          I have an account — sign in
        </Link>
      </div>

      <SettingsGroup title="How reporting works">
        <SettingsRows inset={60}>
          {steps(emailDelivery).map((step, index) => (
            <div key={step.label} className="flex items-start gap-3 px-4 py-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ui-fill text-[0.875rem] font-semibold tabular-nums text-ui-label"
              >
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-[1.0625rem] leading-tight text-ui-label">{step.label}</span>
                <span className="mt-1 block text-[0.8125rem] leading-snug text-ui-label-2">{step.detail}</span>
              </span>
            </div>
          ))}
        </SettingsRows>
      </SettingsGroup>

      <SettingsGroup title="Not ready to report?">
        <SettingsRows inset={60}>
          <SettingsRow icon={ScanSearch} iconClassName="bg-indigo-500" label="Check a message first" detail="Free and private — runs on your device." onClick={openChecker} chevron />
          <SettingsRow icon={LifeBuoy} iconClassName="bg-teal-500" label="Already lost money?" detail="Call your bank first, then follow the first-hour checklist." to={`${ROUTES.learn}/first-hour`} />
        </SettingsRows>
      </SettingsGroup>
    </ConsoleLayout>
  );
}

/** The hostname of a URL indicator's value, however it was stored (with or without a scheme). */
function hostOf(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return value.split("/")[0];
  }
}

/** A draft from the server, in the form's shape. A URL's derived domain is folded back into the URL. */
function fromServerDraft(report: ReportDetail): ReportDraft {
  const urls = report.indicators.filter((indicator) => indicator.type === "URL");
  const hosts = new Set(urls.map((indicator) => hostOf(indicator.value)));
  return {
    ...EMPTY_DRAFT,
    channel: report.channel,
    categoryId: report.category?.id ?? "",
    suburbId: report.suburb?.id ?? "",
    title: report.title,
    description: report.description,
    occurredOn: report.occurredOn ?? "",
    lostMoney: report.amountLost !== null,
    amountLost: report.amountLost !== null ? String(report.amountLost) : "",
    indicators: report.indicators.filter((indicator) => !(indicator.type === "DOMAIN" && hosts.has(indicator.value))),
    serverReference: report.reference,
    savedAt: Date.now(),
  };
}

type Errors = Partial<Record<"channel" | "title" | "description" | "categoryId" | "suburbId" | "amountLost" | "occurredOn" | "newIndicator", string>> & {
  indicators?: Record<number, string>;
};

const BAND_LABEL = { high: "High risk", medium: "Medium risk", low: "Low risk", unclear: "Inconclusive" } as const;

function todayLocal(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function parseAmount(value: string): number | undefined {
  const cleaned = value.replace(/[$,\s]/g, "");
  if (!cleaned) return undefined;
  const amount = Number(cleaned);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : Number.NaN;
}

function ReportForm() {
  const { user } = useAuth();
  const [draft, setDraft] = useState<ReportDraft>(() => loadReportDraft() ?? EMPTY_DRAFT);
  const [reference, setReference] = useState<ReferenceData | null>(null);
  const [referenceFailed, setReferenceFailed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [newType, setNewType] = useState<IndicatorType>("URL");
  const [newValue, setNewValue] = useState("");
  const verifyRef = useRef<HTMLDivElement>(null);
  const [params, setParams] = useSearchParams();
  const [draftNotice, setDraftNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);

  /* FR26 — reopening a draft saved on the account, from any device. */
  useEffect(() => {
    const wanted = params.get("draft");
    if (!wanted) return;
    const controller = new AbortController();
    reportsApi
      .get(wanted, controller.signal)
      .then(({ report }) => {
        if (report.status !== "DRAFT") {
          setDraftNotice({ tone: "error", text: `${report.reference} has already been sent.` });
          return;
        }
        setDraft(fromServerDraft(report));
        setDraftNotice({ tone: "success", text: `Draft ${report.reference} reopened. Finish it and send when you are ready.` });
      })
      .catch(() => setDraftNotice({ tone: "error", text: "That draft could not be opened." }))
      .finally(() => setParams({}, { replace: true }));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveToAccount = async () => {
    setSavingDraft(true);
    setDraftNotice(null);
    try {
      const amount = draft.lostMoney ? parseAmount(draft.amountLost) : undefined;
      const saved = await reportsApi.saveDraft({
        reference: draft.serverReference,
        channel: draft.channel ?? undefined,
        title: draft.title.trim(),
        description: draft.description.trim(),
        categoryId: draft.categoryId || undefined,
        suburbId: draft.suburbId || undefined,
        occurredOn: draft.occurredOn || undefined,
        amountLost: amount === undefined || Number.isNaN(amount) ? undefined : amount,
        indicators: draft.indicators,
      });
      setDraft((current) => ({ ...current, serverReference: saved.reference }));
      setDraftNotice({ tone: "success", text: `Saved to your account as draft ${saved.reference}. Carry on here, or finish it from your dashboard on any device.` });
    } catch (caught) {
      setDraftNotice({ tone: "error", text: caught instanceof ApiError ? caught.message : "The draft could not be saved. It is still kept on this device." });
    } finally {
      setSavingDraft(false);
    }
  };

  /* Whether the address has been proved, whether there is still a code to
     type, and whether Council can be written to today — which on a deployment
     that cannot email anybody is true without the first two. */
  const { confirmed, pending: confirmationPending, canSendReport } = useEmailConfirmation();
  const restored = useMemo(() => draftHasContent(draft) && draft.savedAt > 0, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchReferenceData().then(setReference).catch(() => setReferenceFailed(true));
  }, []);

  /* Every change is kept, a beat after typing stops. */
  useEffect(() => {
    if (sent) return;
    const timer = window.setTimeout(() => {
      if (draft.channel || draftHasContent(draft)) saveReportDraft(draft);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draft, sent]);

  const update = <K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const addIndicator = () => {
    const value = newValue.trim();
    if (value.length < 3) {
      setErrors((current) => ({ ...current, newIndicator: "Type the link, number or address first." }));
      return;
    }
    if (draft.indicators.length >= 25) {
      setErrors((current) => ({ ...current, newIndicator: "That is the most one report can hold." }));
      return;
    }
    update("indicators", [...draft.indicators, { type: newType, value }]);
    setNewValue("");
    setErrors((current) => ({ ...current, newIndicator: undefined }));
  };

  const removeIndicator = (index: number) => {
    update("indicators", draft.indicators.filter((_, i) => i !== index));
    setErrors((current) => ({ ...current, indicators: undefined }));
  };

  const validate = (): Errors => {
    const found: Errors = {};
    if (!draft.channel) found.channel = "Choose how it reached you.";
    if (draft.title.trim().length < 4) found.title = "Give the report a short title.";
    if (draft.description.trim().length < 20) found.description = "Tell us a little more — a sentence or two is enough.";
    if (draft.lostMoney && Number.isNaN(parseAmount(draft.amountLost) ?? 0)) found.amountLost = "Enter an amount, like 250 or 1,200.50.";
    return found;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!canSendReport) {
      verifyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setFormError("Confirm your email with the code first — your report is saved while you do.");
      return;
    }

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError("Some details need another look.");
      return;
    }

    setBusy(true);

    try {
      const amount = draft.lostMoney ? parseAmount(draft.amountLost) : undefined;
      const result = await reportsApi.create({
        channel: draft.channel!,
        title: draft.title.trim(),
        description: draft.description.trim(),
        categoryId: draft.categoryId || undefined,
        suburbId: draft.suburbId || undefined,
        occurredOn: draft.occurredOn || undefined,
        amountLost: amount,
        indicators: draft.indicators,
        fromCheck: draft.fromCheck,
        draftReference: draft.serverReference,
      });

      clearReportDraft();
      setSent(result.reference);
      window.scrollTo({ top: 0 });
    } catch (caught) {
      if (caught instanceof ApiError) {
        const indicatorErrors: Record<number, string> = {};
        const fieldErrors: Errors = {};

        for (const entry of caught.fields) {
          const match = entry.field?.match(/^indicators\.(\d+)/);
          if (match) {
            indicatorErrors[Number(match[1])] = entry.message;
          } else if (entry.field && entry.field !== "emailVerified") {
            (fieldErrors as Record<string, string>)[entry.field] = entry.message;
          }
        }

        setErrors({ ...fieldErrors, indicators: Object.keys(indicatorErrors).length ? indicatorErrors : undefined });
        setFormError(caught.message);
      } else {
        setFormError("Something went wrong. Your report is saved — try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return <ReportSent reference={sent} email={user?.email ?? ""} />;
  }

  const newPlaceholder = INDICATOR_TYPES.find((type) => type.value === newType)?.placeholder;

  return (
    <ConsoleLayout title="Report a scam to Council" subtitle="A CyberSafe officer reviews every report.">
      {restored ? (
        <FormAlert tone="success">
          {draft.fromCheck ? "We filled this in from your check." : "We restored your saved draft."} Review it, add what happened, and send.
        </FormAlert>
      ) : null}

      {/*
        * Unconfirmed, but nothing is stopping the report: the site cannot send
        * a code to anyone. Said plainly, and once — a "confirm your email"
        * heading over a step that cannot be taken would read as the report
        * being held back, which is exactly what it is not.
        */}
      {!confirmed && !confirmationPending ? <EmailUnavailableNotice /> : null}

      {confirmationPending ? (
        <div ref={verifyRef}>
          <SettingsGroup
            title="Confirm your email to send this"
            footer={
              <>
                Enter the code we emailed to <strong className="font-medium text-ui-label">{user?.email}</strong>. You can keep
                filling in the report while you wait — nothing is lost.
              </>
            }
          >
            <VerifyCodePanel compact justSent={false} onVerified={() => setFormError(null)} />
          </SettingsGroup>
        </div>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-7">
        {draft.fromCheck ? (
          <SettingsGroup>
            <SettingsRow
              icon={ScanSearch}
              iconClassName="bg-indigo-500"
              label="Started from your check"
              detail="The checker's reading travels with the report for triage. An officer reaches their own conclusion."
              value={`${BAND_LABEL[draft.fromCheck.band]} · ${draft.fromCheck.score}/100`}
            />
          </SettingsGroup>
        ) : null}

        <fieldset className="flex flex-col">
          <legend className="px-4 pb-2 text-[0.9375rem] font-semibold leading-tight text-ui-label-2">
            How did it reach you?
          </legend>
          <div
            role="radiogroup"
            aria-label="How did it reach you?"
            aria-invalid={Boolean(errors.channel) || undefined}
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          >
            {CHANNELS.map((channel) => {
              const selected = draft.channel === channel.value;
              return (
                <button
                  key={channel.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => update("channel", channel.value)}
                  className={cn(
                    "rounded-[0.75rem] px-3 py-2.5 text-[0.9375rem] font-medium transition-colors duration-150",
                    selected ? "bg-ui-tint text-white dark:text-slate-950" : "bg-ui-card text-ui-label hover:bg-ui-card-hover",
                  )}
                >
                  {channel.label}
                </button>
              );
            })}
          </div>
          {errors.channel ? <p role="alert" className="px-4 pt-2 text-[0.8125rem] text-rose-500">{errors.channel}</p> : null}
        </fieldset>

        <SettingsGroup title="What happened">
          <SettingsRows>
            <TextField
              label="Short title"
              value={draft.title}
              onChange={(event) => update("title", event.target.value)}
              maxLength={140}
              placeholder="e.g. Fake toll payment text"
              error={errors.title}
            />
            <SelectField
              label="Type of scam"
              aside="(optional)"
              value={draft.categoryId}
              onChange={(event) => update("categoryId", event.target.value)}
              error={errors.categoryId}
              hint={referenceFailed ? "Types could not be loaded — leave it, an officer will classify it." : undefined}
            >
              <option value="">Not sure</option>
              {reference?.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </SelectField>
            <TextAreaField
              label="Tell us what happened"
              value={draft.description}
              onChange={(event) => update("description", event.target.value)}
              rows={7}
              maxLength={20_000}
              placeholder="What did the message or caller say or ask for? Did you click, reply, pay or share anything?"
              error={errors.description}
              hint="Include the message itself if you have it. Leave out passwords and full card numbers."
            />
          </SettingsRows>
        </SettingsGroup>

        <SettingsGroup title="When and where" footer="Suburb-level only. Council never publishes anything that could identify you.">
          <SettingsRows>
            <TextField
              label="When did it happen?"
              aside="(optional)"
              type="date"
              value={draft.occurredOn}
              max={todayLocal()}
              onChange={(event) => update("occurredOn", event.target.value)}
              error={errors.occurredOn}
            />
            <SelectField
              label="Your suburb"
              aside="(optional)"
              value={draft.suburbId}
              onChange={(event) => update("suburbId", event.target.value)}
              error={errors.suburbId}
            >
              <option value="">Prefer not to say, or outside Hume</option>
              {reference?.suburbs.map((suburb) => (
                <option key={suburb.id} value={suburb.id}>
                  {suburb.name} {suburb.postcode}
                </option>
              ))}
            </SelectField>
            <SettingsRow
              label="I lost money"
              detail={draft.lostMoney ? "If you have not yet, call your bank now on the number on your card." : undefined}
              trailing={<Switch checked={draft.lostMoney} onChange={(checked) => update("lostMoney", checked)} label="I lost money" />}
            />
            {draft.lostMoney ? (
              <TextField
                label="How much, roughly? (AUD)"
                inputMode="decimal"
                value={draft.amountLost}
                onChange={(event) => update("amountLost", event.target.value)}
                placeholder="$0.00"
                error={errors.amountLost}
              />
            ) : null}
          </SettingsRows>
        </SettingsGroup>

        <SettingsGroup
          title={`Details the scammer used${draft.indicators.length ? ` (${draft.indicators.length})` : ""}`}
          footer="Links, numbers and addresses are what Council matches across reports. We never open or call them."
        >
          <SettingsRows>
            {draft.indicators.map((indicator, index) => (
              <div key={`${indicator.type}-${indicator.value}-${index}`} className="flex items-start gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.8125rem] font-medium text-ui-label-2">{INDICATOR_LABEL[indicator.type]}</span>
                  <span className="mt-1 block break-all font-mono text-[0.9375rem] text-ui-label">{indicator.value}</span>
                  {errors.indicators?.[index] ? (
                    <span role="alert" className="mt-1 block text-[0.8125rem] text-rose-500">{errors.indicators[index]}</span>
                  ) : null}
                </span>
                <button
                  type="button"
                  onClick={() => removeIndicator(index)}
                  aria-label={`Remove ${indicator.value}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ui-label-3 transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}

            <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-end">
              <label className="block sm:w-44">
                <span className="block text-[0.8125rem] font-medium text-ui-label-2">Add a detail</span>
                <select
                  value={newType}
                  onChange={(event) => setNewType(event.target.value as IndicatorType)}
                  className="mt-1.5 w-full cursor-pointer rounded-[0.625rem] bg-ui-fill px-3 py-2 text-[1.0625rem] text-ui-label focus:outline-none focus:ring-2 focus:ring-ui-tint"
                >
                  {INDICATOR_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </label>
              <label className="block min-w-0 flex-1">
                <span className="sr-only">Value</span>
                <input
                  value={newValue}
                  onChange={(event) => {
                    setNewValue(event.target.value);
                    setErrors((current) => ({ ...current, newIndicator: undefined }));
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addIndicator();
                    }
                  }}
                  placeholder={newPlaceholder}
                  maxLength={500}
                  className="w-full rounded-[0.625rem] bg-ui-fill px-3 py-2 text-[1.0625rem] text-ui-label placeholder:text-ui-label-3 focus:outline-none focus:ring-2 focus:ring-ui-tint"
                />
              </label>
              <button
                type="button"
                onClick={addIndicator}
                className="inline-flex items-center justify-center gap-1.5 rounded-[0.625rem] bg-ui-fill px-4 py-2 text-[1.0625rem] font-medium text-ui-tint transition-colors hover:bg-ui-fill-strong"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add
              </button>
            </div>
            {errors.newIndicator ? <p role="alert" className="px-4 pb-3 text-[0.8125rem] text-rose-500">{errors.newIndicator}</p> : null}
          </SettingsRows>
        </SettingsGroup>

        <div className="flex flex-col gap-3">
          {formError ? <FormAlert>{formError}</FormAlert> : null}
          <SubmitButton busy={busy} icon={canSendReport ? Send : MailCheck}>
            {canSendReport ? "Send report to Council" : "Confirm your email to send"}
          </SubmitButton>
          <p className="flex items-start justify-center gap-1.5 text-center text-[0.8125rem] leading-snug text-ui-label-2">
            <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Council uses your report to investigate and to warn others. Anything published is de-identified first.
          </p>
          {draftNotice ? <FormAlert tone={draftNotice.tone}>{draftNotice.text}</FormAlert> : null}
          {draftHasContent(draft) ? (
            <SubmitButton type="button" variant="secondary" busy={savingDraft} onClick={() => void saveToAccount()}>
              {draft.serverReference ? `Update draft ${draft.serverReference}` : "Save as a draft on your account"}
            </SubmitButton>
          ) : null}
          {draftHasContent(draft) ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Clear this report and start again?")) {
                  clearReportDraft();
                  setDraft(EMPTY_DRAFT);
                  setErrors({});
                  setFormError(null);
                }
              }}
              className="mx-auto text-[0.875rem] font-medium text-ui-label-2 transition-colors hover:text-rose-500"
            >
              Clear and start again
            </button>
          ) : null}
        </div>
      </form>

      {/* Files attach to a report on the server, so they are offered once the
          draft is there; otherwise straight after the report is sent. */}
      {draft.serverReference ? <EvidencePanel reference={draft.serverReference} canAdd canRemove /> : null}

      <SettingsGroup>
        <SettingsRows inset={60}>
          <SettingsRow icon={LayoutDashboard} iconClassName="bg-blue-500" label="Your dashboard" detail="Reports you have already sent." to={ROUTES.account} />
        </SettingsRows>
      </SettingsGroup>
    </ConsoleLayout>
  );
}

function ReportSent({ reference, email }: { reference: string; email: string }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <ConsoleLayout title="Report sent" subtitle="Thank you — this helps protect others in Hume.">
      <ConsoleHero icon={CheckCircle2} tint="bg-emerald-500">
        <p>Your reference number is</p>
        <p className="mt-2 font-mono text-[1.75rem] font-semibold tracking-wider text-ui-label">{reference}</p>
        <button type="button" onClick={copy} className="mt-2 inline-flex items-center gap-1.5 text-[0.9375rem] font-medium text-ui-tint hover:opacity-70">
          {copied ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <ClipboardCopy className="h-4 w-4" aria-hidden="true" />}
          {copied ? "Copied" : "Copy reference"}
        </button>
        <p className="mt-3" role="status">A receipt is on its way to {email}.</p>
      </ConsoleHero>

      <EvidencePanel reference={reference} canAdd canRemove />

      <div className="flex flex-col gap-3">
        <SubmitButton type="button" onClick={() => navigate(`${ROUTES.accountReport}/${reference}`)}>Track this report</SubmitButton>
        <SubmitButton type="button" variant="secondary" onClick={() => navigate(ROUTES.account)}>Go to your dashboard</SubmitButton>
      </div>

      <SettingsGroup title="What happens next">
        <SettingsRows inset={60}>
          {[
            ["A CyberSafe officer reviews it", "They match it against other reports of the same links and numbers."],
            ["If they need more, they ask you", "The question appears on your dashboard and by email — answer it there."],
            ["If it is confirmed, others are warned", "A de-identified community alert may be published. Your name never is."],
          ].map(([label, detail], index) => (
            <div key={label} className="flex items-start gap-3 px-4 py-3">
              <span aria-hidden="true" className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ui-fill text-[0.875rem] font-semibold text-ui-label">
                {index + 1}
              </span>
              <span>
                <span className="block text-[1.0625rem] leading-tight text-ui-label">{label}</span>
                <span className="mt-1 block text-[0.8125rem] leading-snug text-ui-label-2">{detail}</span>
              </span>
            </div>
          ))}
        </SettingsRows>
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRows inset={60}>
          <SettingsRow icon={LifeBuoy} iconClassName="bg-teal-500" label="Lost money or shared details?" detail="What to do in the first hour." to={`${ROUTES.learn}/first-hour`} />
        </SettingsRows>
      </SettingsGroup>
    </ConsoleLayout>
  );
}
