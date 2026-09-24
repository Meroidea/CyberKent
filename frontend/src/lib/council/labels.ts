import type { IndicatorStatus, PriorityBand, Severity } from "@/lib/council/types";
import type { ReportStatus } from "@/lib/account/types";

/**
 * How Council's console words its states.
 *
 * Officers read the same workflow states as residents, but they need the
 * workflow's name for them, not the reassurance: "Needs your reply" to a
 * resident is "Waiting on reporter" to the officer who asked.
 */
export const OFFICER_STATUS: Record<ReportStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "New",
  UNDER_REVIEW: "In review",
  INFORMATION_REQUESTED: "Waiting on reporter",
  APPROVED: "Verified",
  REJECTED: "Closed",
  WITHDRAWN: "Withdrawn",
};

/** Colour is never alone here: every severity is also a word and a bar count. */
export const SEVERITY: Record<Severity, { label: string; dot: string; text: string; bars: 1 | 2 | 3 }> = {
  HIGH: { label: "High", dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-300", bars: 3 },
  MEDIUM: { label: "Medium", dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-300", bars: 2 },
  LOW: { label: "Low", dot: "bg-sky-500", text: "text-sky-600 dark:text-sky-300", bars: 1 },
};

export const SEVERITIES: Severity[] = ["HIGH", "MEDIUM", "LOW"];

export const PRIORITY: Record<PriorityBand, { label: string; ring: string; text: string }> = {
  urgent: { label: "Urgent", ring: "stroke-rose-500", text: "text-rose-600 dark:text-rose-300" },
  high: { label: "High", ring: "stroke-amber-500", text: "text-amber-600 dark:text-amber-300" },
  normal: { label: "Normal", ring: "stroke-sky-500", text: "text-sky-600 dark:text-sky-300" },
  low: { label: "Low", ring: "stroke-slate-400", text: "text-ui-label-2" },
};

export const INDICATOR_STATUS: Record<IndicatorStatus, { label: string; detail: string; text: string }> = {
  UNVERIFIED: { label: "Unverified", detail: "Reported, not yet confirmed by an officer.", text: "text-ui-label-2" },
  VERIFIED: { label: "Confirmed scam", detail: "An officer has confirmed this is used in scams.", text: "text-rose-600 dark:text-rose-300" },
  DISPUTED: { label: "Disputed", detail: "Someone says this belongs to them and was spoofed.", text: "text-amber-600 dark:text-amber-300" },
  REJECTED: { label: "Not a scam", detail: "An officer found this is not used in scams.", text: "text-emerald-600 dark:text-emerald-300" },
};

/** The audit trail's action identifiers, said as a sentence fragment. */
export const AUDIT_ACTION: Record<string, string> = {
  "account.signed_in": "Signed in",
  "account.registered": "Registered",
  "report.submitted": "Submitted a report",
  "report.withdrawn": "Withdrew a report",
  "report.information_provided": "Answered Council's question",
  "report.viewed": "Opened a report",
  "report.assigned": "Assigned a report",
  "report.unassigned": "Returned a report to the queue",
  "report.triaged": "Classified a report",
  "report.review_started": "Started a review",
  "report.information_requested": "Asked the reporter a question",
  "report.approved": "Verified a report",
  "report.rejected": "Closed a report",
  "report.reopened": "Re-opened a decision",
  "indicator.status_changed": "Changed an artefact's status",
  "user.role_changed": "Changed a role",
  "user.suspended": "Suspended an account",
  "user.reactivated": "Reactivated an account",
  "category.created": "Created a category",
  "category.updated": "Edited a category",
  "category.archived": "Archived a category",
  "category.restored": "Restored a category",
  "data.exported": "Exported de-identified data",
  ALERT_PUBLISHED: "Published a community alert",
};

export function auditLabel(action: string): string {
  return AUDIT_ACTION[action] ?? action.replace(/[._]/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

const MONEY = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
const COMPACT = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", notation: "compact", maximumFractionDigits: 1 });

export function formatMoney(value: number, compact = false): string {
  return (compact && value >= 10_000 ? COMPACT : MONEY).format(value);
}

/** "3 h", "2.5 days" — a duration an officer can compare at a glance. */
export function formatHours(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${(hours / 24).toFixed(hours < 240 ? 1 : 0)} days`;
}

export function formatAge(days: number): string {
  return days === 0 ? "Today" : days === 1 ? "1 day" : `${days} days`;
}
