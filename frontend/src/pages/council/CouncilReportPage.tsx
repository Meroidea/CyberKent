import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  BellPlus,
  CircleSlash,
  EyeOff,
  Loader2,
  Mail,
  MessageCircleQuestion,
  Phone,
  PlayCircle,
  RotateCcw,
  SearchX,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { OfficerStatus, SeverityBadge } from "@/components/council/Badges";
import { SimilarReports } from "@/components/council/SimilarReports";
import { StaffEvidence } from "@/components/evidence/StaffEvidence";
import { useLoad } from "@/components/council/useLoad";
import { FormAlert, SelectField, SubmitButton, TextAreaField } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SegmentedControl } from "@/components/settings/SegmentedControl";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import { useAuth } from "@/components/auth/useAuth";
import { ROUTES } from "@/config/site";
import { fetchReferenceData } from "@/lib/account/api";
import type { ReferenceData } from "@/lib/account/types";
import { ApiError } from "@/lib/api/client";
import { councilApi } from "@/lib/council/api";
import { INDICATOR_STATUS, OFFICER_STATUS, SEVERITY, SEVERITIES, formatAge, formatMoney } from "@/lib/council/labels";
import type { CouncilReport, IndicatorStatus, Severity, StaffMember } from "@/lib/council/types";
import { CHANNEL_LABEL, INDICATOR_LABEL, formatDate, formatDateTime } from "@/lib/report/labels";
import { cn } from "@/lib/cn";

type Busy = null | "start" | "assign" | "triage" | "ask" | "decide" | "reopen" | "link" | `indicator:${string}`;

/**
 * FR38–FR42 — one report, as the officer works it.
 *
 * The report on the left, everything that can be done to it on the right. The
 * actions shown are the ones the API says are open for this report and this
 * officer (`report.actions`), so a button is never offered that the server
 * would refuse. Every action answers with the report as it now stands; when
 * two officers collide, the loser is told and shown the winner's version.
 */
export function CouncilReportPage() {
  const { reference = "" } = useParams();
  const { data, setData, error, reload } = useLoad((signal) => councilApi.get(reference, signal).then((result) => result.report), reference);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    councilApi.staff().then(({ staff: list }) => setStaff(list)).catch(() => undefined);
    fetchReferenceData().then(setReferenceData).catch(() => undefined);
  }, []);

  /** Runs one action; the report it answers with replaces the one on screen. */
  const act = async (kind: Busy, run: () => Promise<{ report: CouncilReport }>, success: string): Promise<boolean> => {
    setBusy(kind);
    setNotice(null);
    try {
      setData((await run()).report);
      setNotice({ tone: "success", text: success });
      return true;
    } catch (caught) {
      const failure = caught instanceof ApiError ? caught : new ApiError("That did not work. Try again.", 0);
      setNotice({ tone: "error", text: failure.fields[0]?.message && failure.status === 422 ? failure.fields[0].message : failure.message });
      if (failure.status === 409) reload();
      return false;
    } finally {
      setBusy(null);
    }
  };

  const back = (
    <Link to={ROUTES.councilQueue} className="inline-flex items-center gap-1 self-start text-[0.9375rem] font-medium text-ui-tint hover:opacity-70">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Review queue
    </Link>
  );

  if (error) {
    return (
      <ConsoleLayout title="Report not found" subtitle={reference} wide>
        {back}
        <ConsoleHero icon={SearchX} tint="bg-slate-500">
          <p>{error.status === 404 ? "There is no report with that reference." : error.message}</p>
        </ConsoleHero>
      </ConsoleLayout>
    );
  }

  if (!data) {
    return (
      <ConsoleLayout title="Report" subtitle={reference} wide>
        <ConsoleHero tile={<Loader2 className="h-9 w-9 animate-spin" />} tint="bg-slate-400">
          <p>Loading…</p>
        </ConsoleHero>
      </ConsoleLayout>
    );
  }

  const report = data;

  return (
    <ConsoleLayout title={report.title} subtitle={`${report.reference} · received ${formatDateTime(report.submittedAt)}`} wide>
      {back}

      <div className="flex flex-wrap items-center gap-2">
        <OfficerStatus status={report.status} className="text-[0.8125rem]" />
        <SeverityBadge severity={report.severity} className="rounded-full bg-ui-fill px-2.5 py-1 text-[0.8125rem]" />
        <span className="rounded-full bg-ui-fill px-2.5 py-1 text-[0.8125rem] text-ui-label-2">
          {report.reviewer ? `With ${report.reviewer.fullName}` : "Unassigned"}
        </span>
        <span className="rounded-full bg-ui-fill px-2.5 py-1 text-[0.8125rem] text-ui-label-2">{formatAge(report.ageDays)} old</span>
        {/* On a phone the actions stack under the whole report. */}
        <a href="#actions" className="ml-auto rounded-full px-2.5 py-1 text-[0.8125rem] font-semibold text-ui-tint hover:bg-ui-fill lg:hidden">
          Jump to actions
        </a>
      </div>

      {notice ? <FormAlert tone={notice.tone}>{notice.text}</FormAlert> : null}

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="flex min-w-0 flex-col gap-7">
          <ReportBody report={report} busy={busy} onIndicator={(id, status) => act(`indicator:${id}`, () => councilApi.setIndicator(report.reference, id, status), "Detail updated.")} />
          <SimilarReports
            report={report}
            busy={busy !== null}
            onLink={(target, kind) => void act("link", () => councilApi.link(report.reference, target, kind), kind === "DUPLICATE" ? `Marked ${target} as a duplicate.` : `Linked ${target} as related.`)}
            onUnlink={(target) => void act("link", () => councilApi.unlink(report.reference, target), `Unlinked ${target}.`)}
          />
        </div>

        <aside id="actions" className="flex scroll-mt-24 flex-col gap-7 lg:sticky lg:top-24" aria-label="Actions">
          <ActionPanel report={report} staff={staff} referenceData={referenceData} busy={busy} act={act} />
        </aside>
      </div>
    </ConsoleLayout>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return <SettingsRow label={label} value={children} />;
}

function ReportBody({ report, busy, onIndicator }: { report: CouncilReport; busy: Busy; onIndicator: (id: string, status: IndicatorStatus) => void }) {
  return (
    <>
      <SettingsGroup title="What happened">
        <p className="whitespace-pre-wrap break-words px-4 py-3.5 text-[0.9375rem] leading-relaxed text-ui-label">{report.description}</p>
      </SettingsGroup>

      <SettingsGroup title="Details">
        <SettingsRows>
          <Fact label="How it arrived">{CHANNEL_LABEL[report.channel]}</Fact>
          <Fact label="Type of scam">{report.category?.name ?? "Not classified"}</Fact>
          <Fact label="Suburb">{report.suburb ? `${report.suburb.name} ${report.suburb.postcode}` : "Not given"}</Fact>
          {report.occurredOn ? <Fact label="When it happened">{formatDate(report.occurredOn)}</Fact> : null}
          <Fact label="Money lost">{report.amountLost !== null ? formatMoney(report.amountLost) : "None reported"}</Fact>
          {report.fromCheck ? (
            <Fact label="Started from the checker">
              Scored {report.fromCheck.score}/100 ({report.fromCheck.band})
            </Fact>
          ) : null}
          {report.withdrawnAt ? <Fact label="Withdrawn">{formatDateTime(report.withdrawnAt)}</Fact> : null}
        </SettingsRows>
      </SettingsGroup>

      <SettingsGroup
        title="Reporter"
        footer={
          <span className="inline-flex items-start gap-1.5">
            <EyeOff aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Council staff only. Never published, never exported. Opening this report is recorded in the audit trail.
          </span>
        }
      >
        {report.reporter ? (
          <SettingsRows inset={60}>
            <SettingsRow
              label={report.reporter.fullName}
              detail={[
                report.reporter.organisation,
                report.reporter.role === "BUSINESS" ? "Business or organisation" : "Resident",
                `${report.reporter.reportCount} report${report.reporter.reportCount === 1 ? "" : "s"}`,
                `member since ${formatDate(report.reporter.memberSince)}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
            <SettingsRow
              icon={Mail}
              iconClassName="bg-blue-500"
              label={<span className="break-all">{report.reporter.email}</span>}
              detail={report.reporter.emailVerified ? "Address confirmed" : "Address not confirmed — follow-up may not reach them"}
              href={`mailto:${report.reporter.email}?subject=${encodeURIComponent(`Your report ${report.reference}`)}`}
            />
            {report.reporter.phone ? <SettingsRow icon={Phone} iconClassName="bg-emerald-500" label={report.reporter.phone} href={`tel:${report.reporter.phone.replace(/\s+/g, "")}`} /> : null}
          </SettingsRows>
        ) : (
          <p className="px-4 py-3.5 text-[0.9375rem] text-ui-label-2">The reporter has deleted their account. The report stays as Council's record, with nothing that identifies them.</p>
        )}
      </SettingsGroup>

      <SettingsGroup
        title="Details the scammer used"
        footer="Counted across every report. A count is not proof — an officer confirms an artefact before it is treated as a scam's, because numbers and addresses are often spoofed from innocent people."
      >
        {report.indicators.length === 0 ? (
          <p className="px-4 py-3.5 text-[0.9375rem] text-ui-label-2">The reporter did not list any phone numbers, links or addresses.</p>
        ) : (
          <SettingsRows>
            {report.indicators.map((indicator) => (
              <div key={indicator.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="break-all font-mono text-[0.9375rem] text-ui-label">{indicator.value}</p>
                  <p className="mt-0.5 text-[0.8125rem] text-ui-label-2">
                    {INDICATOR_LABEL[indicator.type]} ·{" "}
                    <span className={cn(indicator.reportCount > 1 && "font-semibold text-amber-700 dark:text-amber-300")}>
                      in {indicator.reportCount} report{indicator.reportCount === 1 ? "" : "s"}
                    </span>{" "}
                    · first seen {formatDate(indicator.firstSeenAt)}
                  </p>
                </div>
                <label className="relative inline-flex shrink-0 items-center gap-2">
                  <span className="sr-only">Status of {indicator.value}</span>
                  {busy === `indicator:${indicator.id}` ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-ui-label-3" /> : null}
                  <select
                    value={indicator.verificationStatus}
                    onChange={(event) => onIndicator(indicator.id, event.target.value as IndicatorStatus)}
                    disabled={busy !== null}
                    className={cn(
                      "h-8 cursor-pointer rounded-full bg-ui-fill px-3 text-[0.8125rem] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-tint",
                      INDICATOR_STATUS[indicator.verificationStatus].text,
                    )}
                  >
                    {(Object.keys(INDICATOR_STATUS) as IndicatorStatus[]).map((status) => (
                      <option key={status} value={status}>{INDICATOR_STATUS[status].label}</option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          </SettingsRows>
        )}
      </SettingsGroup>

      <StaffEvidence report={report} />

      <SettingsGroup title="History" footer="Decision notes are Council's working record. The reporter sees each change of status, never the notes.">
        <History report={report} />
      </SettingsGroup>
    </>
  );
}

function History({ report }: { report: CouncilReport }) {
  const events: { at: string; label: string; who?: string; body?: string; tone?: "question" | "answer" }[] = [
    { at: report.submittedAt, label: "Report received", who: report.reporter?.fullName },
  ];

  for (const review of report.reviews) {
    if (review.decision === "INFORMATION_REQUESTED") continue;
    events.push({
      at: review.createdAt,
      label: review.decision === "UNDER_REVIEW" && review.notes?.startsWith("Re-opened") ? "Decision re-opened" : OFFICER_STATUS[review.decision],
      who: review.reviewer?.fullName,
      body: [review.severity ? `Severity: ${SEVERITY[review.severity].label}.` : null, review.notes].filter(Boolean).join(" ") || undefined,
    });
  }
  for (const request of report.infoRequests) {
    events.push({ at: request.createdAt, label: "Question to the reporter", who: request.requestedBy?.fullName, body: request.message, tone: "question" });
    if (request.respondedAt) {
      events.push({ at: request.respondedAt, label: "Reporter answered", who: report.reporter?.fullName, body: request.response ?? undefined, tone: "answer" });
    }
  }
  if (report.withdrawnAt) events.push({ at: report.withdrawnAt, label: "Withdrawn by the reporter" });

  events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <ol className="px-4 py-3">
      {events.map((event, index) => (
        <li key={`${event.at}-${index}`} className="relative flex gap-3 pb-4 last:pb-1">
          {index < events.length - 1 ? <span aria-hidden="true" className="absolute left-[0.3125rem] top-4 h-full w-px bg-ui-separator" /> : null}
          <span aria-hidden="true" className={cn("relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", index === events.length - 1 ? "bg-ui-tint" : "bg-ui-fill-strong")} />
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9375rem] font-medium text-ui-label">{event.label}</span>
            <span className="block text-[0.8125rem] text-ui-label-3">
              {formatDateTime(event.at)}
              {event.who ? ` · ${event.who}` : ""}
            </span>
            {event.body ? (
              <span
                className={cn(
                  "mt-1.5 block whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-[0.875rem] leading-snug",
                  event.tone === "question" ? "bg-amber-500/10 text-ui-label" : event.tone === "answer" ? "bg-emerald-500/10 text-ui-label" : "bg-ui-fill text-ui-label-2",
                )}
              >
                {event.body}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

function ActionPanel({
  report,
  staff,
  referenceData,
  busy,
  act,
}: {
  report: CouncilReport;
  staff: StaffMember[];
  referenceData: ReferenceData | null;
  busy: Busy;
  act: (kind: Busy, run: () => Promise<{ report: CouncilReport }>, success: string) => Promise<boolean>;
}) {
  const { user } = useAuth();
  const [categoryId, setCategoryId] = useState(report.category?.id ?? "");
  const [severity, setSeverity] = useState<Severity | "">(report.severity ?? "");
  const [question, setQuestion] = useState("");
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reason, setReason] = useState("");
  const [reopenReason, setReopenReason] = useState("");

  /* The server's version wins whenever it changes under the form. */
  useEffect(() => {
    setCategoryId(report.category?.id ?? "");
    setSeverity(report.severity ?? "");
  }, [report.category?.id, report.severity]);

  const triageChanged = categoryId !== (report.category?.id ?? "") || severity !== (report.severity ?? "");
  const needsSeverity = decision === "APPROVED" && !severity;
  const open = report.actions.decide;

  return (
    <>
      {report.actions.start ? (
        <SettingsGroup footer="Moves the report to In review, assigns it to you if nobody holds it, and lets the reporter know.">
          <div className="p-4">
            <SubmitButton type="button" icon={PlayCircle} busy={busy === "start"} disabled={busy !== null} className="w-full" onClick={() => act("start", () => councilApi.start(report.reference), "Review started — the reporter has been told.")}>
              Start review
            </SubmitButton>
          </div>
        </SettingsGroup>
      ) : null}

      {report.actions.assign ? (
        <SettingsGroup title="Responsible officer">
          <SelectField
            label="Assigned to"
            value={report.reviewer?.id ?? ""}
            disabled={busy !== null}
            onChange={(event) => act("assign", () => councilApi.assign(report.reference, event.target.value || null), event.target.value ? "Assigned." : "Returned to the queue.")}
          >
            <option value="">Nobody — in the queue</option>
            {staff.map((person) => (
              <option key={person.id} value={person.id}>
                {person.fullName} ({person.openReports} open)
              </option>
            ))}
          </SelectField>
          {user && report.reviewer?.id !== user.id ? (
            <div className="px-4 pb-3">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => act("assign", () => councilApi.assign(report.reference, user.id), "Assigned to you.")}
                className="inline-flex items-center gap-1.5 text-[0.875rem] font-medium text-ui-tint hover:opacity-70 disabled:opacity-40"
              >
                <UserRoundCheck aria-hidden="true" className="h-4 w-4" />
                Assign to me
              </button>
            </div>
          ) : null}
        </SettingsGroup>
      ) : null}

      {report.actions.triage ? (
        <SettingsGroup title="Classification" footer="Severity is the officer's judgement of harm, separate from the checker's automated score.">
          <SelectField label="Type of scam" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} disabled={busy !== null}>
            <option value="">Not classified</option>
            {referenceData?.categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </SelectField>
          <div className="px-4 pb-3 pt-1">
            <p className="pb-2 text-[0.8125rem] font-medium text-ui-label-2">Severity</p>
            <SegmentedControl
              label="Severity"
              segments={[...SEVERITIES.map((value) => ({ value, label: SEVERITY[value].label })), { value: "" as const, label: "Unset" }]}
              value={severity}
              onChange={setSeverity}
            />
          </div>
          {triageChanged ? (
            <div className="px-4 pb-4">
              <SubmitButton
                type="button"
                variant="secondary"
                busy={busy === "triage"}
                disabled={busy !== null}
                className="w-full"
                onClick={() => act("triage", () => councilApi.triage(report.reference, { categoryId: categoryId || null, severity: severity || null }), "Classification saved.")}
              >
                Save classification
              </SubmitButton>
            </div>
          ) : null}
        </SettingsGroup>
      ) : null}

      {report.actions.requestInfo ? (
        <SettingsGroup title="Ask the reporter" footer="They are notified in their dashboard, and by email if they allow it. The report waits on them until they answer.">
          <TextAreaField label="Question" value={question} onChange={(event) => setQuestion(event.target.value)} rows={3} maxLength={2000} placeholder="What would help you decide?" />
          <div className="px-4 pb-4">
            <SubmitButton
              type="button"
              variant="secondary"
              icon={MessageCircleQuestion}
              busy={busy === "ask"}
              disabled={busy !== null || question.trim().length < 10}
              className="w-full"
              onClick={async () => {
                if (await act("ask", () => councilApi.requestInfo(report.reference, question.trim()), "Question sent to the reporter.")) setQuestion("");
              }}
            >
              Send question
            </SubmitButton>
          </div>
        </SettingsGroup>
      ) : null}

      {open ? (
        <SettingsGroup title="Decision" footer="A decision is final unless an administrator re-opens it. The reason stays on Council's record; the reporter is told the outcome.">
          <div className="px-4 pt-3">
            <SegmentedControl
              label="Decision"
              segments={[
                { value: "APPROVED", label: "Verify scam", icon: BadgeCheck },
                { value: "REJECTED", label: "Close", icon: CircleSlash },
              ]}
              value={decision}
              onChange={setDecision}
            />
          </div>
          <TextAreaField
            label="Reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            maxLength={4000}
            placeholder={decision === "APPROVED" ? "What confirms this is a scam?" : "Why is no further action needed?"}
            hint={needsSeverity ? "Set a severity under Classification before verifying." : undefined}
          />
          <div className="px-4 pb-4">
            <SubmitButton
              type="button"
              variant={decision === "APPROVED" ? "primary" : "danger"}
              icon={decision === "APPROVED" ? ShieldCheck : CircleSlash}
              busy={busy === "decide"}
              disabled={busy !== null || reason.trim().length < 10 || needsSeverity}
              className="w-full"
              onClick={async () => {
                const ok = await act(
                  "decide",
                  () =>
                    councilApi.decide(report.reference, {
                      decision,
                      reason: reason.trim(),
                      ...(severity ? { severity } : {}),
                      ...(categoryId ? { categoryId } : {}),
                    }),
                  decision === "APPROVED" ? "Verified as a scam — the reporter has been told." : "Report closed — the reporter has been told.",
                );
                if (ok) setReason("");
              }}
            >
              {decision === "APPROVED" ? "Verify as a scam" : "Close report"}
            </SubmitButton>
          </div>
        </SettingsGroup>
      ) : (
        <SettingsGroup title="Decision">
          <p className="px-4 py-3.5 text-[0.9375rem] text-ui-label-2">
            {report.status === "WITHDRAWN" ? "The reporter withdrew this report. No further action is taken." : `This report is ${OFFICER_STATUS[report.status].toLowerCase()}.`}
          </p>
        </SettingsGroup>
      )}

      {report.status === "APPROVED" ? (
        <SettingsGroup title="Warn the community" footer="Starts a draft alert with the wording de-identified. A second officer approves it before it is published.">
          <div className="p-4">
            <Link
              to={`${ROUTES.councilAlerts}/new?from=${encodeURIComponent(report.reference)}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-6 py-3 text-[0.9375rem] font-semibold text-white shadow-lg shadow-rose-500/20"
            >
              <BellPlus aria-hidden="true" className="h-4 w-4" />
              Draft a community alert
            </Link>
          </div>
        </SettingsGroup>
      ) : null}

      {report.actions.reopen ? (
        <SettingsGroup title="Re-open (administrator)" footer="The earlier decision stays in the history. The reporter is told the report is being reviewed again.">
          <TextAreaField label="Why re-open it?" value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} rows={2} maxLength={2000} />
          <div className="px-4 pb-4">
            <SubmitButton
              type="button"
              variant="secondary"
              icon={RotateCcw}
              busy={busy === "reopen"}
              disabled={busy !== null || reopenReason.trim().length < 10}
              className="w-full"
              onClick={async () => {
                if (await act("reopen", () => councilApi.reopen(report.reference, reopenReason.trim()), "Decision re-opened.")) setReopenReason("");
              }}
            >
              Re-open decision
            </SubmitButton>
          </div>
        </SettingsGroup>
      ) : null}
    </>
  );
}
