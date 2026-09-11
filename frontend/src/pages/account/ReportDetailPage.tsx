import { Fragment, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CircleSlash,
  Inbox,
  Loader2,
  Mail,
  MessageCircleQuestion,
  SearchCheck,
  SearchX,
  ShieldCheck,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { StatusPill } from "@/components/account/StatusPill";
import { FormAlert, SubmitButton, TextAreaField } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import { reportsApi } from "@/lib/account/api";
import type { ReportDetail, ReportStatus } from "@/lib/account/types";
import { ApiError } from "@/lib/api/client";
import { CHANNEL_LABEL, INDICATOR_LABEL, STATUS, formatDate, formatDateTime } from "@/lib/report/labels";
import { ROUTES, SITE } from "@/config/site";
import { cn } from "@/lib/cn";

const STATUS_ICON: Record<ReportStatus, LucideIcon> = {
  DRAFT: Inbox,
  SUBMITTED: Inbox,
  UNDER_REVIEW: SearchCheck,
  INFORMATION_REQUESTED: MessageCircleQuestion,
  APPROVED: ShieldCheck,
  REJECTED: CircleSlash,
  WITHDRAWN: Undo2,
};

const MONEY = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });

/** Received → being reviewed → decided, with the current stage marked. */
function Tracker({ status }: { status: ReportStatus }) {
  const step = STATUS[status].step;
  const last = status === "WITHDRAWN" ? "Withdrawn" : status === "APPROVED" ? "Verified" : status === "REJECTED" ? "Closed" : "Decision";
  const labels = ["Received", "Being reviewed", last];

  return (
    <ol className="flex items-start px-2" aria-label="Progress">
      {labels.map((label, index) => {
        const done = index < step || (index === step && index === 2);
        const current = index === step;

        return (
          <Fragment key={label}>
            <li className="flex w-20 shrink-0 flex-col items-center gap-2 text-center sm:w-24" aria-current={current ? "step" : undefined}>
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-[0.8125rem] font-semibold",
                  done || current ? "bg-ui-tint text-white dark:text-slate-950" : "bg-ui-fill text-ui-label-3",
                  current && index < 2 && "ring-4 ring-[color-mix(in_srgb,var(--ui-tint)_25%,transparent)]",
                )}
              >
                {index + 1}
              </span>
              <span className={cn("text-[0.8125rem] leading-tight", current ? "font-semibold text-ui-label" : "text-ui-label-2")}>{label}</span>
            </li>
            {index < 2 ? (
              <li aria-hidden="true" className={cn("mt-3.5 h-0.5 flex-1 rounded-full", index < step ? "bg-ui-tint" : "bg-ui-fill")} />
            ) : null}
          </Fragment>
        );
      })}
    </ol>
  );
}

/** Everything that has happened to the report, oldest first. */
function timeline(report: ReportDetail): { at: string; label: string; detail?: string }[] {
  const events: { at: string; label: string; detail?: string }[] = [{ at: report.submittedAt, label: "You sent the report" }];

  for (const review of report.reviews) {
    events.push({ at: review.createdAt, label: STATUS[review.decision].label, detail: STATUS[review.decision].detail });
  }
  for (const request of report.infoRequests) {
    events.push({ at: request.createdAt, label: "Council asked a question", detail: request.message });
    if (request.respondedAt) {
      events.push({ at: request.respondedAt, label: "You answered", detail: request.response ?? undefined });
    }
  }
  if (report.withdrawnAt) {
    events.push({ at: report.withdrawnAt, label: "You withdrew the report" });
  }

  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

export function ReportDetailPage() {
  const { reference = "" } = useParams();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setReport(null);
    setError(null);

    reportsApi
      .get(reference, controller.signal)
      .then(({ report: loaded }) => setReport(loaded))
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof ApiError ? caught : new ApiError("This report could not be loaded.", 0));
      });

    return () => controller.abort();
  }, [reference]);

  const withdraw = async () => {
    setWithdrawing(true);
    setActionError(null);
    try {
      setReport((await reportsApi.withdraw(reference)).report);
      setConfirmWithdraw(false);
    } catch (caught) {
      setActionError(caught instanceof ApiError ? caught.message : "The report could not be withdrawn. Try again.");
    } finally {
      setWithdrawing(false);
    }
  };

  const back = (
    <Link to={ROUTES.account} className="inline-flex items-center gap-1 self-start text-[0.9375rem] font-medium text-ui-tint hover:opacity-70">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Dashboard
    </Link>
  );

  if (error) {
    return (
      <ConsoleLayout title="Report not found" subtitle={reference}>
        <ConsoleHero icon={SearchX} tint="bg-slate-500">
          <p>{error.status === 404 ? "There is no report with that reference on your account." : error.message}</p>
        </ConsoleHero>
        {back}
      </ConsoleLayout>
    );
  }

  if (!report) {
    return (
      <ConsoleLayout title="Your report" subtitle={reference}>
        <ConsoleHero tile={<Loader2 className="h-9 w-9 animate-spin" />} tint="bg-slate-400">
          <p>Loading…</p>
        </ConsoleHero>
      </ConsoleLayout>
    );
  }

  const meta = STATUS[report.status];
  const open = report.infoRequests.filter((request) => !request.respondedAt);

  return (
    <ConsoleLayout title={report.title} subtitle={`Reference ${report.reference}`}>
      {back}

      <ConsoleHero icon={STATUS_ICON[report.status]} tint={meta.tint}>
        <p className="text-[1.0625rem] font-semibold text-ui-label">{meta.label}</p>
        <p className="mt-1">{meta.detail}</p>
      </ConsoleHero>

      <SettingsGroup>
        <div className="px-3 py-5">
          <Tracker status={report.status} />
        </div>
      </SettingsGroup>

      {report.status !== "WITHDRAWN" &&
        open.map((request) => (
          <AnswerCard key={request.id} reference={report.reference} requestId={request.id} question={request.message} askedAt={request.createdAt} onAnswered={setReport} />
        ))}

      <SettingsGroup title="Details">
        <SettingsRows>
          <SettingsRow label="Status" trailing={<StatusPill status={report.status} />} />
          <SettingsRow label="Reference" value={<span className="font-mono">{report.reference}</span>} />
          <SettingsRow label="Sent" value={formatDateTime(report.submittedAt)} />
          <SettingsRow label="How it reached you" value={CHANNEL_LABEL[report.channel]} />
          <SettingsRow label="Type of scam" value={report.category?.name ?? "Not specified"} />
          {report.occurredOn ? <SettingsRow label="When it happened" value={formatDate(report.occurredOn)} /> : null}
          {report.suburb ? <SettingsRow label="Suburb" value={report.suburb.name} /> : null}
          {report.amountLost !== null ? <SettingsRow label="Money lost" value={MONEY.format(report.amountLost)} /> : null}
        </SettingsRows>
      </SettingsGroup>

      <SettingsGroup title="What you told us">
        <p className="whitespace-pre-wrap break-words px-4 py-3.5 text-[0.9375rem] leading-relaxed text-ui-label">{report.description}</p>
      </SettingsGroup>

      {report.indicators.length > 0 ? (
        <SettingsGroup title="Details the scammer used" footer="Council matches these against every other report.">
          <SettingsRows>
            {report.indicators.map((indicator) => (
              <SettingsRow
                key={`${indicator.type}:${indicator.value}`}
                label={<span className="break-all font-mono text-[0.9375rem]">{indicator.value}</span>}
                detail={INDICATOR_LABEL[indicator.type]}
              />
            ))}
          </SettingsRows>
        </SettingsGroup>
      ) : null}

      <SettingsGroup title="History">
        <ol className="px-4 py-2">
          {timeline(report).map((event, index, all) => (
            <li key={`${event.at}-${index}`} className="relative flex gap-3 pb-4 last:pb-2">
              {index < all.length - 1 ? <span aria-hidden="true" className="absolute left-[0.3125rem] top-4 h-full w-px bg-ui-separator" /> : null}
              <span aria-hidden="true" className={cn("relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", index === all.length - 1 ? "bg-ui-tint" : "bg-ui-fill-strong")} />
              <span className="min-w-0">
                <span className="block text-[0.9375rem] font-medium text-ui-label">{event.label}</span>
                <span className="block text-[0.8125rem] text-ui-label-3">{formatDateTime(event.at)}</span>
                {event.detail ? <span className="mt-1 block whitespace-pre-wrap break-words text-[0.875rem] leading-snug text-ui-label-2">{event.detail}</span> : null}
              </span>
            </li>
          ))}
        </ol>
      </SettingsGroup>

      <SettingsGroup
        title="Need to change something?"
        footer={report.canWithdraw ? "Withdrawing stops the review. Council keeps a record of the report, but takes no further action." : undefined}
      >
        <SettingsRows inset={60}>
          <SettingsRow
            icon={Mail}
            iconClassName="bg-slate-500"
            label="Contact the CyberSafe team"
            detail="Quote your reference number."
            href={`mailto:${SITE.supportEmail}?subject=${encodeURIComponent(`Report ${report.reference}`)}`}
          />
          {report.canWithdraw && !confirmWithdraw ? (
            <SettingsRow icon={Undo2} iconClassName="bg-rose-500" label="Withdraw this report" emphasis="danger" onClick={() => setConfirmWithdraw(true)} chevron={false} />
          ) : null}
        </SettingsRows>
        {confirmWithdraw ? (
          <div className="flex flex-col gap-3 border-t border-ui-separator px-4 py-4">
            <p className="text-[0.9375rem] text-ui-label">Withdraw {report.reference}? This cannot be undone.</p>
            {actionError ? <FormAlert>{actionError}</FormAlert> : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <SubmitButton type="button" variant="danger" busy={withdrawing} onClick={withdraw} className="sm:flex-1">
                Withdraw report
              </SubmitButton>
              <SubmitButton type="button" variant="secondary" onClick={() => setConfirmWithdraw(false)} className="sm:flex-1">
                Keep it
              </SubmitButton>
            </div>
          </div>
        ) : null}
      </SettingsGroup>
    </ConsoleLayout>
  );
}

function AnswerCard({
  reference,
  requestId,
  question,
  askedAt,
  onAnswered,
}: {
  reference: string;
  requestId: string;
  question: string;
  askedAt: string;
  onAnswered: (report: ReportDetail) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onAnswered((await reportsApi.respond(reference, requestId, answer.trim())).report);
    } catch (caught) {
      setError(caught instanceof ApiError ? (caught.field("response") ?? caught.message) : "Your answer could not be sent. Try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <SettingsGroup title="Council asked you" footer="Your answer goes straight to the officer reviewing this report.">
        <div className="border-l-4 border-amber-500 bg-amber-500/5 px-4 py-3.5">
          <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-ui-label">{question}</p>
          <p className="mt-1 text-[0.8125rem] text-ui-label-3">{formatDateTime(askedAt)}</p>
        </div>
        <TextAreaField label="Your answer" value={answer} onChange={(event) => setAnswer(event.target.value)} rows={4} maxLength={5000} error={error ?? undefined} />
        <div className="px-4 pb-4">
          <SubmitButton busy={busy} disabled={answer.trim().length < 2} className="w-full">
            Send answer
          </SubmitButton>
        </div>
      </SettingsGroup>
    </form>
  );
}
