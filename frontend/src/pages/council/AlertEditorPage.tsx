import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Archive, ArchiveRestore, ArrowLeft, Eye, Loader2, Save, Send, ShieldCheck, Undo2 } from "lucide-react";
import { AlertCard } from "@/components/alerts/AlertCard";
import { useAuth } from "@/components/auth/useAuth";
import { FormAlert, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/forms/fields";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SegmentedControl } from "@/components/settings/SegmentedControl";
import { RowSeparator, SettingsGroup } from "@/components/settings/SettingsGroup";
import { ROUTES } from "@/config/site";
import { fetchReferenceData } from "@/lib/account/api";
import type { ReferenceData, ReportChannel } from "@/lib/account/types";
import { alertDeskApi } from "@/lib/alerts/api";
import type { AlertDraft, PublicAlert, StaffAlert } from "@/lib/alerts/types";
import { ApiError } from "@/lib/api/client";
import { SEVERITY, SEVERITIES } from "@/lib/council/labels";
import { CHANNELS, formatDateTime } from "@/lib/report/labels";
import { ALERT_STATUS } from "@/pages/council/AlertDeskPage";
import { cn } from "@/lib/cn";

const EMPTY: AlertDraft = { headline: "", summary: "", specimen: "", categoryId: null, suburbId: null, channel: "SMS", severity: "MEDIUM" };

const REDACTION_LABEL: Record<string, string> = {
  name: "name",
  email: "email address",
  phone: "phone number",
  number: "card or account number",
  address: "street address",
  greeting: "name in a greeting",
};

/**
 * FR49–FR52, FR54 — write, check and publish one alert.
 *
 * The draft is edited on the left and previewed on the right exactly as a
 * resident will see it. When it starts from a report, the de-identified
 * wording arrives pre-filled with a note of what was removed, so the officer
 * knows what the first pass did — and what it may have missed.
 */
export function AlertEditorPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const from = params.get("from") ?? undefined;
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { user } = useAuth();

  const [reference, setReference] = useState<ReferenceData | null>(null);
  const [alert, setAlert] = useState<StaffAlert | null>(null);
  const [draft, setDraft] = useState<AlertDraft>(EMPTY);
  const [redactions, setRedactions] = useState<{ kind: string; count: number }[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const [returnNote, setReturnNote] = useState("");

  useEffect(() => {
    fetchReferenceData().then(setReference).catch(() => undefined);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const work = isNew
      ? from
        ? alertDeskApi.suggest(from, controller.signal).then(({ suggestion }) => {
            const { redactions: removed, sourceReference: _source, ...rest } = suggestion;
            setDraft(rest);
            setRedactions(removed);
          })
        : Promise.resolve(setDraft(EMPTY))
      : alertDeskApi.get(id!, controller.signal).then(({ alert: loaded }) => adopt(loaded));

    work
      .catch((caught: unknown) => {
        if (caught instanceof DOMException) return;
        setNotice({ tone: "error", text: caught instanceof ApiError ? caught.message : "This alert could not be loaded." });
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id, from, isNew]);

  function adopt(next: StaffAlert) {
    setAlert(next);
    setDraft({
      headline: next.headline,
      summary: next.summary,
      specimen: next.specimen ?? "",
      categoryId: next.category?.id ?? null,
      suburbId: next.suburb?.id ?? null,
      channel: next.channel,
      severity: next.severity,
    });
  }

  const run = async (kind: string, work: () => Promise<{ alert: StaffAlert }>, success: string) => {
    setBusy(kind);
    setNotice(null);
    try {
      const { alert: next } = await work();
      adopt(next);
      setNotice({ tone: "success", text: success });
      if (isNew) navigate(`${ROUTES.councilAlerts}/${next.id}`, { replace: true });
      return true;
    } catch (caught) {
      setNotice({ tone: "error", text: caught instanceof ApiError ? (caught.status === 422 && caught.fields[0] ? caught.fields[0].message : caught.message) : "That did not work. Try again." });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const payload = { ...draft, specimen: draft.specimen?.trim() ? draft.specimen.trim() : null };
  const save = () =>
    isNew ? run("save", () => alertDeskApi.create({ ...payload, ...(from ? { sourceReference: from } : {}) }), "Draft saved.") : run("save", () => alertDeskApi.update(alert!.id, payload), "Saved.");

  const editable = isNew || Boolean(alert?.actions.edit);
  const dirty =
    isNew ||
    (alert !== null &&
      (draft.headline !== alert.headline ||
        draft.summary !== alert.summary ||
        (draft.specimen ?? "") !== (alert.specimen ?? "") ||
        draft.categoryId !== (alert.category?.id ?? null) ||
        draft.suburbId !== (alert.suburb?.id ?? null) ||
        draft.channel !== alert.channel ||
        draft.severity !== alert.severity));
  const valid = draft.headline.trim().length >= 10 && draft.summary.trim().length >= 40;

  const preview: PublicAlert = {
    reference: alert?.reference ?? "HCA-…",
    headline: draft.headline || "Headline",
    summary: draft.summary || "Summary",
    specimen: draft.specimen || null,
    channel: draft.channel,
    severity: draft.severity,
    archived: alert?.status === "ARCHIVED",
    publishedAt: alert?.publishedAt ?? new Date().toISOString(),
    archivedAt: null,
    category: reference?.categories.find((category) => category.id === draft.categoryId) ?? null,
    suburb: reference?.suburbs.find((suburb) => suburb.id === draft.suburbId) ?? null,
  };

  if (loading) {
    return (
      <ConsoleLayout title="Alert" wide>
        <div className="flex justify-center py-16"><Loader2 aria-hidden="true" className="h-8 w-8 animate-spin text-ui-label-3" /></div>
      </ConsoleLayout>
    );
  }

  return (
    <ConsoleLayout
      title={isNew ? "New alert" : alert?.headline ?? "Alert"}
      subtitle={isNew ? (from ? `Drafted from verified report ${from}` : "Written from scratch") : `${alert?.reference} · ${alert ? ALERT_STATUS[alert.status].label : ""}`}
      wide
    >
      <Link to={ROUTES.councilAlerts} className="inline-flex items-center gap-1 self-start text-[0.9375rem] font-medium text-ui-tint hover:opacity-70">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Alert desk
      </Link>

      {notice ? <FormAlert tone={notice.tone}>{notice.text}</FormAlert> : null}

      {alert?.returnNote ? (
        <FormAlert tone="info">
          <strong>{alert.returnNote.by ?? "The approver"} sent this back:</strong> {alert.returnNote.note}
        </FormAlert>
      ) : null}

      {redactions ? (
        <FormAlert tone="info">
          <span className="block">“What the scam says” starts from the reporter's own description. Trim it to the scam's wording — the part a resident would recognise on their own phone.</span>
          {redactions.length
            ? `Removed from the report's wording: ${redactions.map((r) => `${r.count} ${REDACTION_LABEL[r.kind] ?? r.kind}${r.count === 1 ? "" : "s"}`).join(", ")}. Read it through for anything else that could identify someone.`
            : "Nothing identifying was found automatically. Read it through before saving — automated removal is a first pass, not a guarantee."}
        </FormAlert>
      ) : null}

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-7">
          <SettingsGroup title="The alert">
            <TextField label="Headline" value={draft.headline} onChange={(event) => setDraft({ ...draft, headline: event.target.value })} maxLength={140} disabled={!editable} placeholder="Fake toll texts asking for an overdue payment" />
            <RowSeparator />
            <TextAreaField
              label="What the scam says"
              aside="(optional)"
              hint="Quoted wording, de-identified. Links are shown defanged — example[.]com — so they cannot be tapped."
              value={draft.specimen ?? ""}
              onChange={(event) => setDraft({ ...draft, specimen: event.target.value })}
              rows={4}
              maxLength={1500}
              disabled={!editable}
            />
            <RowSeparator />
            <TextAreaField label="What to know and do" value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} rows={5} maxLength={2000} disabled={!editable} />
          </SettingsGroup>

          <SettingsGroup title="Where and how">
            <SelectField label="Type of scam" value={draft.categoryId ?? ""} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value || null })} disabled={!editable}>
              <option value="">No category</option>
              {reference?.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </SelectField>
            <RowSeparator />
            <SelectField label="Suburb" hint="Leave as All of Hume unless the scam is genuinely local." value={draft.suburbId ?? ""} onChange={(event) => setDraft({ ...draft, suburbId: event.target.value || null })} disabled={!editable}>
              <option value="">All of Hume</option>
              {reference?.suburbs.map((suburb) => <option key={suburb.id} value={suburb.id}>{suburb.name}</option>)}
            </SelectField>
            <RowSeparator />
            <SelectField label="How it arrives" value={draft.channel} onChange={(event) => setDraft({ ...draft, channel: event.target.value as ReportChannel })} disabled={!editable}>
              {CHANNELS.map((channel) => <option key={channel.value} value={channel.value}>{channel.label}</option>)}
            </SelectField>
            <div className="px-4 pb-4 pt-1">
              <p className="pb-2 text-[0.8125rem] font-medium text-ui-label-2">Severity</p>
              <SegmentedControl label="Severity" segments={SEVERITIES.map((value) => ({ value, label: SEVERITY[value].label }))} value={draft.severity} onChange={(severity) => editable && setDraft({ ...draft, severity })} />
            </div>
          </SettingsGroup>
        </div>

        <div className="flex flex-col gap-7 lg:sticky lg:top-24">
          <section className="flex flex-col">
            <h2 className="flex items-center gap-1.5 px-4 pb-2 text-[0.9375rem] font-semibold text-ui-label-2">
              <Eye aria-hidden="true" className="h-4 w-4" />
              As residents will see it
            </h2>
            <AlertCard alert={preview} full />
          </section>

          <SettingsGroup title="Workflow" footer={alert ? `Written by ${alert.author?.fullName ?? "a former officer"}${alert.approvedBy ? `, published by ${alert.approvedBy.fullName}` : ""}. Last change ${formatDateTime(alert.updatedAt)}.` : "Save the draft, then send it to a second officer for approval."}>
            <div className="flex flex-col gap-2 p-4">
              {editable ? (
                <SubmitButton type="button" variant={isNew || alert?.status === "DRAFT" ? "primary" : "secondary"} icon={Save} busy={busy === "save"} disabled={busy !== null || !valid || !dirty} onClick={save}>
                  {isNew ? "Save draft" : "Save changes"}
                </SubmitButton>
              ) : null}

              {alert?.actions.submit ? (
                <SubmitButton type="button" variant="secondary" icon={Send} busy={busy === "submit"} disabled={busy !== null || dirty} onClick={() => run("submit", () => alertDeskApi.submit(alert.id), "Sent for a second officer's approval.")}>
                  Send for approval
                </SubmitButton>
              ) : null}

              {alert?.status === "PENDING_APPROVAL" && alert.author?.id === user?.id ? (
                <p className="rounded-lg bg-ui-fill px-3 py-2 text-[0.875rem] text-ui-label-2">Waiting for another officer to approve it. You can still edit it.</p>
              ) : null}

              {alert?.actions.approve ? (
                <SubmitButton type="button" icon={ShieldCheck} busy={busy === "approve"} disabled={busy !== null || dirty} onClick={() => run("approve", () => alertDeskApi.approve(alert.id), "Published — subscribers are being notified.")}>
                  Approve and publish
                </SubmitButton>
              ) : null}

              {alert?.actions.return ? (
                <div className="mt-2 overflow-hidden rounded-ui bg-ui-grouped">
                  <TextField label="Send back with a note" value={returnNote} onChange={(event) => setReturnNote(event.target.value)} maxLength={1000} placeholder="What needs changing?" />
                  <div className="px-4 pb-3">
                    <SubmitButton
                      type="button"
                      variant="secondary"
                      icon={Undo2}
                      busy={busy === "return"}
                      disabled={busy !== null || returnNote.trim().length < 5}
                      onClick={async () => {
                        if (await run("return", () => alertDeskApi.sendBack(alert.id, returnNote.trim()), "Returned to the author.")) setReturnNote("");
                      }}
                    >
                      Return to author
                    </SubmitButton>
                  </div>
                </div>
              ) : null}

              {alert?.actions.archive ? (
                <SubmitButton type="button" variant="secondary" icon={Archive} busy={busy === "archive"} disabled={busy !== null} onClick={() => run("archive", () => alertDeskApi.archive(alert.id), "Archived — off the feed, still findable in the archive.")}>
                  Archive
                </SubmitButton>
              ) : null}

              {alert?.actions.restore ? (
                <SubmitButton type="button" variant="secondary" icon={ArchiveRestore} busy={busy === "restore"} disabled={busy !== null} onClick={() => run("restore", () => alertDeskApi.restore(alert.id), "Back on the feed.")}>
                  Put back on the feed
                </SubmitButton>
              ) : null}

              {alert?.status === "PUBLISHED" || alert?.status === "ARCHIVED" ? (
                <Link to={`${ROUTES.alerts}/${alert.reference}`} className={cn("mt-1 text-center text-[0.9375rem] font-medium text-ui-tint hover:opacity-70")}>
                  Open the public page
                </Link>
              ) : null}

              {alert?.sourceReport ? (
                <p className="mt-1 text-[0.8125rem] text-ui-label-3">
                  From report{" "}
                  <Link to={`${ROUTES.councilReport}/${alert.sourceReport.reference}`} className="font-mono text-ui-tint hover:underline">
                    {alert.sourceReport.reference}
                  </Link>
                  . The link is cut when the alert is published.
                </p>
              ) : null}
            </div>
          </SettingsGroup>
        </div>
      </div>
    </ConsoleLayout>
  );
}
