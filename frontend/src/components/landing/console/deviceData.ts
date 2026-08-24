import {
  Ban,
  Bell,
  BookOpen,
  Building2,
  CircleSlash,
  Clock3,
  FileText,
  Flag,
  Globe,
  Landmark,
  LifeBuoy,
  Lock,
  MapPinned,
  MessageSquareWarning,
  Radar,
  ScanSearch,
  ShieldCheck,
  Smartphone,
  UserRoundSearch,
  type LucideIcon,
} from "lucide-react";

/**
 * Everything the device on the landing page displays.
 *
 * Held apart from the panes that render it for the same reason `config/`
 * exists: this is the only place in the codebase where illustrative figures
 * are written down, so it is the only place anyone has to check to be sure
 * that nothing on the device is claiming to be a live measurement. The screen
 * is labelled DEMO in its status bar and every card carries a footer saying so
 * in words — the numbers below are what those labels are about.
 *
 * The shapes deliberately mirror what the real screens will hold: a report has
 * a reference, a category, a severity and a state, because that is what the
 * report table has. When those screens are built they should be able to take
 * this file's types and swap the arrays for a query.
 */

export type Severity = "high" | "medium" | "low";

/** Fixed site-wide: rose is a threat, amber a caution, emerald a clear read. */
export const SEVERITY_LABEL: Record<Severity, string> = {
  high: "High",
  medium: "Medium",
  low: "Clear",
};

export const SEVERITY_TINT: Record<Severity, string> = {
  high: "bg-rose-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

export const SEVERITY_TEXT: Record<Severity, string> = {
  high: "text-rose-500",
  medium: "text-amber-500",
  low: "text-emerald-500",
};

export const SEVERITY_STROKE: Record<Severity, string> = {
  high: "stroke-rose-500",
  medium: "stroke-amber-500",
  low: "stroke-emerald-500",
};

export const SEVERITY_FILL: Record<Severity, string> = {
  high: "fill-rose-500",
  medium: "fill-amber-500",
  low: "fill-emerald-500",
};

/* -------------------------------------------------------------------------- */
/* Sidebar                                                                     */
/* -------------------------------------------------------------------------- */

export interface SidebarRow {
  label: string;
  icon: LucideIcon;
  /** The tile fill. Colour identifies a destination before the glyph is read. */
  tint: string;
  /** Right-aligned current value, as a settings row shows one. */
  value?: string;
  /** Renders the row with a toggle instead of a value. */
  toggle?: boolean;
}

export interface SidebarGroup {
  /** Omitted for the first group, as Settings omits it. */
  title?: string;
  rows: SidebarRow[];
}

/**
 * The rows under the selectable sections.
 *
 * These are the device's Wi-Fi and Bluetooth lines: state, not navigation.
 * The one that matters is true of the service as built — checking runs in the
 * browser and nothing pasted into it is transmitted — and it is stated here
 * because a resident deciding whether to paste a bank text into a council site
 * should be able to see the answer without opening anything.
 */
export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    title: "Service",
    rows: [
      { label: "Alerts", icon: Bell, tint: "bg-amber-500", toggle: true },
      { label: "Checks", icon: Smartphone, tint: "bg-emerald-500", value: "On-device" },
      { label: "Coverage", icon: Landmark, tint: "bg-slate-500", value: "Hume" },
    ],
  },
  {
    title: "Reference",
    rows: [
      { label: "Awareness", icon: BookOpen, tint: "bg-sky-500" },
      { label: "Documents", icon: FileText, tint: "bg-violet-500" },
      { label: "Privacy", icon: Lock, tint: "bg-slate-500" },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Detect                                                                      */
/* -------------------------------------------------------------------------- */

export interface Indicator {
  label: string;
  detail: string;
  severity: Severity;
}

export const CHECKED_MESSAGE =
  "HUME COUNCIL: your rates refund of $482.10 could not be processed. Confirm your bank details within 2 hours or the refund will be cancelled: hume-rates-refund.online/claim";

export const INDICATORS: Indicator[] = [
  { label: "Urgency language", detail: "“final notice”, “within 2 hours”", severity: "high" },
  { label: "Lookalike domain", detail: "hume-rates-refund.online", severity: "high" },
  { label: "Domain age", detail: "registered 4 days ago", severity: "medium" },
  { label: "Payment method", detail: "card details requested by link", severity: "medium" },
  { label: "Sender mismatch", detail: "display name is not the sending domain", severity: "medium" },
  { label: "Prior reports", detail: "number not seen in Hume before", severity: "low" },
];

/* -------------------------------------------------------------------------- */
/* Report                                                                      */
/* -------------------------------------------------------------------------- */

export type ReportState = "In review" | "Info requested" | "Verified" | "Duplicate";

export interface QueuedReport {
  reference: string;
  category: string;
  severity: Severity;
  state: ReportState;
  received: string;
}

export const REPORT_STATES: ReportState[] = [
  "In review",
  "Info requested",
  "Verified",
  "Duplicate",
];

export const REPORT_QUEUE: QueuedReport[] = [
  {
    reference: "HCC-2408-118",
    category: "Phishing email",
    severity: "high",
    state: "In review",
    received: "9 min ago",
  },
  {
    reference: "HCC-2408-117",
    category: "Investment",
    severity: "high",
    state: "Info requested",
    received: "41 min ago",
  },
  {
    reference: "HCC-2408-116",
    category: "Marketplace",
    severity: "medium",
    state: "Verified",
    received: "2 hr ago",
  },
  {
    reference: "HCC-2408-115",
    category: "Remote access",
    severity: "high",
    state: "Verified",
    received: "3 hr ago",
  },
  {
    reference: "HCC-2408-114",
    category: "Impersonation",
    severity: "medium",
    state: "In review",
    received: "5 hr ago",
  },
  {
    reference: "HCC-2408-113",
    category: "Delivery SMS",
    severity: "low",
    state: "Duplicate",
    received: "Yesterday",
  },
];

/* -------------------------------------------------------------------------- */
/* Alerts                                                                      */
/* -------------------------------------------------------------------------- */

export interface AlertCategory {
  label: string;
  icon: LucideIcon;
  tint: string;
  subscribers: number;
  reference: string;
  headline: string;
  summary: string;
  severity: Severity;
  channel: string;
  published: string;
}

/** Subscriber counts are drawn against this ceiling, so the bars stay comparable. */
export const SUBSCRIBER_CEILING = 4500;

export const ALERT_CATEGORIES: AlertCategory[] = [
  {
    label: "Impersonation",
    icon: Building2,
    tint: "bg-rose-500",
    subscribers: 4120,
    reference: "AL-0342",
    headline: "Fake toll notice demanding immediate payment",
    summary:
      "Reviewed and de-identified before publication. Residents in Broadmeadows and Dallas have reported the same wording since Monday.",
    severity: "high",
    channel: "SMS",
    published: "Today, 8:12 am",
  },
  {
    label: "Investment",
    icon: Radar,
    tint: "bg-violet-500",
    subscribers: 2874,
    reference: "AL-0339",
    headline: "Term deposit offer using a real bank’s branding",
    summary:
      "A cloned rate sheet is being emailed with a call-back number that is not the bank’s. Two reports included a signed-looking PDF.",
    severity: "high",
    channel: "Email",
    published: "Fri, 4:40 pm",
  },
  {
    label: "Marketplace",
    icon: MessageSquareWarning,
    tint: "bg-amber-500",
    subscribers: 2255,
    reference: "AL-0336",
    headline: "Rental bond requested before an inspection",
    summary:
      "Listings copied from real agencies, with the deposit asked for by bank transfer. Reported across Craigieburn and Sunbury.",
    severity: "medium",
    channel: "Listing",
    published: "Thu, 11:05 am",
  },
  {
    label: "Remote access",
    icon: UserRoundSearch,
    tint: "bg-sky-500",
    subscribers: 1408,
    reference: "AL-0331",
    headline: "Caller claiming to be from a telco support desk",
    summary:
      "The caller asks to install screen-sharing software to “process a refund”. Verified against four separate reports.",
    severity: "high",
    channel: "Phone",
    published: "Wed, 2:18 pm",
  },
];

export interface StreamEntry {
  text: string;
  tone: Severity;
}

/** The moderation ticker. Each line is a step the published alert above went through. */
export const MODERATION_STREAM: StreamEntry[] = [
  { text: "Report HCC-2408-121 received · delivery SMS", tone: "low" },
  { text: "Indicator match · number seen in 4 prior reports", tone: "medium" },
  { text: "Reporter details removed before publishing", tone: "low" },
  { text: "Alert AL-0342 approved for publication", tone: "low" },
  { text: "Duplicate detected · merged into HCC-2408-116", tone: "medium" },
  { text: "Digest sent · Craigieburn subscribers", tone: "low" },
  { text: "New lookalike domain added to the watchlist", tone: "high" },
];

/* -------------------------------------------------------------------------- */
/* Map                                                                         */
/* -------------------------------------------------------------------------- */

export interface Cluster {
  suburb: string;
  /** Position in the map's fixed 320×180 coordinate space. */
  x: number;
  y: number;
  reports: number;
  severity: Severity;
  trend: string;
}

export const CLUSTERS: Cluster[] = [
  { suburb: "Broadmeadows", x: 138, y: 118, reports: 46, severity: "high", trend: "+12" },
  { suburb: "Craigieburn", x: 196, y: 62, reports: 38, severity: "high", trend: "+9" },
  { suburb: "Sunbury", x: 58, y: 44, reports: 21, severity: "medium", trend: "+3" },
  { suburb: "Roxburgh Park", x: 172, y: 92, reports: 18, severity: "medium", trend: "−2" },
  { suburb: "Campbellfield", x: 210, y: 132, reports: 12, severity: "low", trend: "+1" },
];

/* -------------------------------------------------------------------------- */
/* Recover                                                                     */
/* -------------------------------------------------------------------------- */

export type RecoveryWindow = "First hour" | "Today" | "This week";

export interface RecoveryStep {
  label: string;
  detail: string;
  icon: LucideIcon;
  tint: string;
  window: RecoveryWindow;
}

export const RECOVERY_WINDOWS: RecoveryWindow[] = ["First hour", "Today", "This week"];

/**
 * Ordered by what matters soonest, which is the whole point of the checklist:
 * the money is recoverable for about as long as it takes to make one call.
 */
export const RECOVERY_STEPS: RecoveryStep[] = [
  {
    label: "Call your bank now",
    detail: "Ask for the card to be blocked and the payment recalled.",
    icon: Ban,
    tint: "bg-rose-500",
    window: "First hour",
  },
  {
    label: "Change the password you used",
    detail: "Start with the account the payment went through.",
    icon: Lock,
    tint: "bg-indigo-500",
    window: "First hour",
  },
  {
    label: "Keep the message",
    detail: "Do not delete it. It is the evidence a report is built on.",
    icon: MessageSquareWarning,
    tint: "bg-amber-500",
    window: "First hour",
  },
  {
    label: "Turn on two-factor authentication",
    detail: "Wherever the account offers it, starting with email.",
    icon: ShieldCheck,
    tint: "bg-emerald-500",
    window: "Today",
  },
  {
    label: "Report it to Council",
    detail: "The indicators are added to the watchlist other residents see.",
    icon: Flag,
    tint: "bg-rose-500",
    window: "Today",
  },
  {
    label: "Report to Scamwatch",
    detail: "And to police if money was lost, for the reference number.",
    icon: Globe,
    tint: "bg-sky-500",
    window: "Today",
  },
  {
    label: "Watch for a follow-up “recovery” offer",
    detail: "Anyone promising to get the money back for a fee is the same scam.",
    icon: CircleSlash,
    tint: "bg-violet-500",
    window: "This week",
  },
  {
    label: "Check your statements",
    detail: "Small test charges often come before a large one.",
    icon: Clock3,
    tint: "bg-slate-500",
    window: "This week",
  },
];

/* -------------------------------------------------------------------------- */
/* Section index                                                               */
/* -------------------------------------------------------------------------- */

export type SectionId = "detect" | "report" | "alerts" | "map" | "recover";

export interface ConsoleSection {
  id: SectionId;
  /** The sidebar row and the detail pane's centred title. */
  label: string;
  /** One line under the pane title. */
  subtitle: string;
  icon: LucideIcon;
  tint: string;
  /** Right-aligned value on the sidebar row. */
  value: string;
}

export const SECTIONS: ConsoleSection[] = [
  {
    id: "detect",
    label: "Scam checker",
    subtitle: "Content and indicator analysis, with the reasoning shown",
    icon: ScanSearch,
    tint: "bg-indigo-500",
    value: "Ready",
  },
  {
    id: "report",
    label: "Report a scam",
    subtitle: "From draft to reviewed, with a reference you can track",
    icon: Flag,
    tint: "bg-rose-500",
    value: "Queue open",
  },
  {
    id: "alerts",
    label: "Community alerts",
    subtitle: "Reviewed and de-identified, then published to subscribers",
    icon: Bell,
    tint: "bg-amber-500",
    value: "4 live",
  },
  {
    id: "map",
    label: "Scam map",
    subtitle: "Aggregated to suburb level so patterns show and people do not",
    icon: MapPinned,
    tint: "bg-emerald-500",
    value: "30 days",
  },
  {
    id: "recover",
    label: "Recovery",
    subtitle: "Checklists ordered by what matters in the first hour",
    icon: LifeBuoy,
    tint: "bg-teal-500",
    value: "8 steps",
  },
];
