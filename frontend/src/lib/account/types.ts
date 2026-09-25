/** Shapes the account and report endpoints answer with. Mirrors the API's own types. */

export type Role = "RESIDENT" | "BUSINESS" | "OFFICER" | "ADMIN" | "SUPER_ADMIN";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  emailVerified: boolean;
  phone: string | null;
  organisation: string | null;
  createdAt: string;
}

export interface Session {
  user: User;
  token: string;
  /** Development builds only, where there is no mail transport. */
  devCode?: string;
}

export type ReportChannel = "SMS" | "EMAIL" | "PHONE" | "WEBSITE" | "SOCIAL" | "POST" | "OTHER";

export type ReportStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "INFORMATION_REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN";

export type IndicatorType = "URL" | "DOMAIN" | "PHONE" | "EMAIL" | "BANK_ACCOUNT";

export interface ReportSummary {
  reference: string;
  title: string;
  channel: ReportChannel;
  status: ReportStatus;
  category: string | null;
  indicatorCount: number;
  awaitingYou: boolean;
  submittedAt: string;
  updatedAt: string;
}

export interface ReportDetail {
  reference: string;
  title: string;
  description: string;
  channel: ReportChannel;
  status: ReportStatus;
  category: { id: string; name: string } | null;
  suburb: { id: string; name: string; postcode: string } | null;
  amountLost: number | null;
  occurredOn: string | null;
  submittedAt: string;
  withdrawnAt: string | null;
  updatedAt: string;
  indicators: { type: IndicatorType; value: string }[];
  reviews: { id: string; decision: ReportStatus; createdAt: string }[];
  infoRequests: { id: string; message: string; response: string | null; respondedAt: string | null; createdAt: string }[];
  canWithdraw: boolean;
}

export interface NewReport {
  channel: ReportChannel;
  categoryId?: string;
  suburbId?: string;
  title: string;
  description: string;
  amountLost?: number;
  occurredOn?: string;
  indicators: { type: IndicatorType; value: string }[];
  fromCheck?: { score: number; band: "high" | "medium" | "low" | "unclear" };
  /** FR26 — send a saved draft, which becomes this report. */
  draftReference?: string;
}

export interface Notification {
  id: string;
  kind: "REPORT_SUBMITTED" | "REPORT_STATUS_CHANGED" | "INFORMATION_REQUESTED" | "ALERT_PUBLISHED";
  title: string;
  body: string;
  linkPath: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface Overview {
  user: User;
  stats: { total: number; open: number; needsYou: number; verified: number; closed: number };
  recentReports: ReportSummary[];
  notifications: Notification[];
  unreadNotifications: number;
}

export interface Preferences {
  emailOnStatus: boolean;
  emailOnAlerts: boolean;
  emailOnRequest: boolean;
}

export interface ReferenceData {
  categories: { id: string; slug: string; name: string; description: string | null }[];
  suburbs: { id: string; name: string; postcode: string }[];
}
