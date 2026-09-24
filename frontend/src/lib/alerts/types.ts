import type { ReportChannel } from "@/lib/account/types";
import type { Severity } from "@/lib/council/types";

export type AlertStatus = "DRAFT" | "PENDING_APPROVAL" | "PUBLISHED" | "ARCHIVED";

/** What anyone may read about a published alert — no author, no source report. */
export interface PublicAlert {
  reference: string;
  headline: string;
  summary: string;
  specimen: string | null;
  channel: ReportChannel;
  severity: Severity;
  archived: boolean;
  publishedAt: string | null;
  archivedAt: string | null;
  category: { id: string; slug: string; name: string } | null;
  suburb: { id: string; name: string; postcode: string } | null;
}

export interface AlertFeed {
  alerts: PublicAlert[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StaffAlert extends PublicAlert {
  id: string;
  status: AlertStatus;
  createdAt: string;
  updatedAt: string;
  author: { id: string; fullName: string } | null;
  approvedBy: { id: string; fullName: string } | null;
  sourceReport: { reference: string; title: string } | null;
  returnNote: { note: string; by: string | null; at: string } | null;
  actions: { edit: boolean; submit: boolean; approve: boolean; return: boolean; archive: boolean; restore: boolean };
}

export interface AlertDraft {
  headline: string;
  summary: string;
  specimen: string | null;
  categoryId: string | null;
  suburbId: string | null;
  channel: ReportChannel;
  severity: Severity;
}

export interface AlertSuggestion extends AlertDraft {
  sourceReference: string;
  redactions: { kind: string; count: number }[];
}
