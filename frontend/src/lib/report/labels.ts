import type { IndicatorType, ReportChannel, ReportStatus } from "@/lib/account/types";

/**
 * How a report's state is said to the person who made it.
 *
 * The database speaks in workflow states; a resident needs to know what is
 * happening and whether anything is waiting on them. `step` places the state
 * on the three-stage tracker (received → reviewing → decided).
 */
export const STATUS: Record<ReportStatus, { label: string; tint: string; text: string; detail: string; step: 0 | 1 | 2 }> = {
  DRAFT: {
    label: "Draft",
    tint: "bg-slate-500",
    text: "text-slate-600 dark:text-slate-300",
    detail: "Not sent yet.",
    step: 0,
  },
  SUBMITTED: {
    label: "Received",
    tint: "bg-indigo-500",
    text: "text-indigo-600 dark:text-indigo-300",
    detail: "Council has your report and it is waiting for a CyberSafe officer.",
    step: 0,
  },
  UNDER_REVIEW: {
    label: "Being reviewed",
    tint: "bg-sky-500",
    text: "text-sky-600 dark:text-sky-300",
    detail: "An officer is checking what you sent against other reports.",
    step: 1,
  },
  INFORMATION_REQUESTED: {
    label: "Needs your reply",
    tint: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-300",
    detail: "Council has asked you a question. Answer it to keep the review moving.",
    step: 1,
  },
  APPROVED: {
    label: "Verified",
    tint: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-300",
    detail: "Council confirmed this as a scam. It may be used, de-identified, to warn others.",
    step: 2,
  },
  REJECTED: {
    label: "Closed",
    tint: "bg-slate-500",
    text: "text-slate-600 dark:text-slate-300",
    detail: "Council reviewed this and closed it without publishing an alert.",
    step: 2,
  },
  WITHDRAWN: {
    label: "Withdrawn",
    tint: "bg-slate-400",
    text: "text-slate-500 dark:text-slate-400",
    detail: "You withdrew this report. Council keeps a record but takes no further action.",
    step: 2,
  },
};

export const CHANNELS: { value: ReportChannel; label: string }[] = [
  { value: "SMS", label: "Text message" },
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone call" },
  { value: "WEBSITE", label: "Website" },
  { value: "SOCIAL", label: "Social media" },
  { value: "POST", label: "Letter or post" },
  { value: "OTHER", label: "Something else" },
];

export const CHANNEL_LABEL = Object.fromEntries(CHANNELS.map((c) => [c.value, c.label])) as Record<ReportChannel, string>;

export const INDICATOR_TYPES: { value: IndicatorType; label: string; placeholder: string }[] = [
  { value: "URL", label: "Link", placeholder: "https://…" },
  { value: "PHONE", label: "Phone number", placeholder: "04xx xxx xxx" },
  { value: "EMAIL", label: "Email address", placeholder: "name@example.com" },
  { value: "DOMAIN", label: "Website", placeholder: "example.com" },
  { value: "BANK_ACCOUNT", label: "Bank account", placeholder: "BSB and account number" },
];

export const INDICATOR_LABEL = Object.fromEntries(INDICATOR_TYPES.map((t) => [t.value, t.label])) as Record<IndicatorType, string>;

const DATE = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" });
const DATE_TIME = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function formatDate(iso: string): string {
  return DATE.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}

/** "3 min ago", "yesterday", or a date — for lists where recency is the point. */
export function formatRelative(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 172_800) return "yesterday";
  if (seconds < 604_800) return `${Math.floor(seconds / 86_400)} days ago`;
  return formatDate(iso);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1]![0] : "")).toUpperCase() || "?";
}
