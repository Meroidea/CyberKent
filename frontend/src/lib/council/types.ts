/** Shapes the `/api/council` and `/api/admin` endpoints answer with. Mirrors the API's own types. */

import type { IndicatorType, ReportChannel, ReportStatus, Role } from "@/lib/account/types";

export type Severity = "HIGH" | "MEDIUM" | "LOW";
export type PriorityBand = "urgent" | "high" | "normal" | "low";
export type IndicatorStatus = "UNVERIFIED" | "VERIFIED" | "DISPUTED" | "REJECTED";
export type QueueView = "open" | "mine" | "unassigned" | "waiting" | "decided" | "all";

export interface Named {
  id: string;
  name: string;
}

export interface Person {
  id: string;
  fullName: string;
}

export interface QueueItem {
  reference: string;
  title: string;
  channel: ReportChannel;
  status: ReportStatus;
  severity: Severity | null;
  category: Named | null;
  suburb: Named | null;
  reviewer: Person | null;
  amountLost: number | null;
  indicatorCount: number;
  evidenceCount: number;
  anonymised: boolean;
  submittedAt: string;
  updatedAt: string;
  ageDays: number;
  replyReceived: boolean;
  outstandingQuestions: number;
  priority: { score: number; band: PriorityBand; reasons: string[] };
}

export interface QueueCounts {
  open: number;
  waiting: number;
  mine: number;
  unassigned: number;
  decided: number;
  all: number;
}

export interface QueuePage {
  view: QueueView;
  counts: QueueCounts;
  items: QueueItem[];
  page: number;
  pageSize: number;
  total: number;
  truncated: boolean;
  ordering: "priority" | "recent";
}

export interface QueueFilters {
  view: QueueView;
  status?: ReportStatus;
  severity?: Severity | "UNSET";
  categoryId?: string;
  suburbId?: string;
  olderThanDays?: number;
  q?: string;
  page?: number;
}

export interface CouncilReport {
  reference: string;
  title: string;
  description: string;
  channel: ReportChannel;
  status: ReportStatus;
  severity: Severity | null;
  category: Named | null;
  suburb: (Named & { postcode: string }) | null;
  reviewer: (Person & { email: string }) | null;
  amountLost: number | null;
  occurredOn: string | null;
  submittedAt: string;
  withdrawnAt: string | null;
  updatedAt: string;
  ageDays: number;
  reporter: {
    fullName: string;
    email: string;
    phone: string | null;
    organisation: string | null;
    role: Role;
    emailVerified: boolean;
    memberSince: string;
    reportCount: number;
  } | null;
  fromCheck: { score: number; band: string } | null;
  indicators: {
    id: string;
    type: IndicatorType;
    value: string;
    reportCount: number;
    verificationStatus: IndicatorStatus;
    firstSeenAt: string;
    lastSeenAt: string;
  }[];
  related: { reference: string; title: string; status: ReportStatus; submittedAt: string; shared: { type: IndicatorType; value: string }[] }[];
  links: { reference: string; title: string; status: ReportStatus; kind: "DUPLICATE" | "RELATED"; similarity: number | null; linkedAt: string }[];
  evidence: { id: string; originalName: string; mimeType: string; sizeBytes: number; description: string | null; createdAt: string }[];
  reviews: { id: string; decision: ReportStatus; severity: Severity | null; notes: string | null; reviewer: Person | null; createdAt: string }[];
  infoRequests: { id: string; message: string; response: string | null; respondedAt: string | null; requestedBy: Person | null; createdAt: string }[];
  actions: { start: boolean; assign: boolean; triage: boolean; requestInfo: boolean; decide: boolean; reopen: boolean };
}

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  openReports: number;
}

export interface CouncilStats {
  period: { days: number; since: string; bucket: "day" | "week" };
  totals: {
    reports: number;
    previousReports: number;
    open: number;
    approved: number;
    rejected: number;
    withdrawn: number;
    checks: number;
    moneyLost: number;
    reportsWithLoss: number;
  };
  timing: { medianHoursToFirstReview: number | null; medianHoursToDecision: number | null };
  backlog: { open: number; unassigned: number; untriaged: number; waitingOnReporter: number; ages: { label: string; count: number }[]; oldestDays: number | null };
  timeline: { date: string; count: number }[];
  byStatus: { status: ReportStatus; count: number }[];
  bySeverity: { severity: Severity | null; count: number }[];
  byChannel: { channel: ReportChannel; count: number }[];
  byCategory: { id: string | null; name: string; count: number; previous: number; rising: boolean }[];
  bySuburb: { id: string | null; name: string; postcode: string | null; count: number }[];
  workload: { id: string; fullName: string; role: Role; openReports: number }[];
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  organisation: string | null;
  role: Role;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  suspendedAt: string | null;
  reportCount: number;
  openAssigned: number;
}

export interface UsersPage {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  roles: Partial<Record<Role, number>>;
}

export interface AdminCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  archivedAt: string | null;
  createdAt: string;
  reportCount: number;
  alertCount: number;
}

export interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  reference: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  actor: { id: string; fullName: string; email: string; role: Role } | null;
}

export interface AuditPage {
  entries: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
  actions: { action: string; count: number }[];
}

export interface SimilarCandidate {
  reference: string;
  title: string;
  status: ReportStatus;
  submittedAt: string;
  similarity: number;
  score: number;
  suggestion: "DUPLICATE" | "RELATED";
  reasons: string[];
  linked: "DUPLICATE" | "RELATED" | null;
}
