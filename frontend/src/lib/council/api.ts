import { apiDownload, apiRequest } from "@/lib/api/client";
import type { Role } from "@/lib/account/types";
import type {
  AdminCategory,
  AdminUser,
  AuditPage,
  CouncilReport,
  CouncilStats,
  IndicatorStatus,
  QueueFilters,
  QueuePage,
  SimilarCandidate,
  Severity,
  StaffMember,
  UsersPage,
} from "@/lib/council/types";

/** Builds a query string from the set values only — an empty filter is no filter. */
function query(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

const report = (reference: string) => `/api/council/reports/${encodeURIComponent(reference)}`;

/** Calls to `/api/council` — the officer's side of Modules 7 and 12. */
export const councilApi = {
  queue(filters: QueueFilters, signal?: AbortSignal) {
    return apiRequest<QueuePage>(`/api/council/reports${query({ ...filters, pageSize: 25 })}`, { signal });
  },
  get(reference: string, signal?: AbortSignal) {
    return apiRequest<{ report: CouncilReport }>(report(reference), { signal });
  },
  staff(signal?: AbortSignal) {
    return apiRequest<{ staff: StaffMember[] }>("/api/council/staff", { signal });
  },
  stats(days: number, signal?: AbortSignal) {
    return apiRequest<CouncilStats>(`/api/council/stats${query({ days })}`, { signal });
  },
  start(reference: string) {
    return apiRequest<{ report: CouncilReport }>(`${report(reference)}/start`, { method: "POST", body: {} });
  },
  assign(reference: string, reviewerId: string | null) {
    return apiRequest<{ report: CouncilReport }>(`${report(reference)}/assign`, { method: "POST", body: { reviewerId } });
  },
  triage(reference: string, body: { categoryId?: string | null; severity?: Severity | null }) {
    return apiRequest<{ report: CouncilReport }>(`${report(reference)}/triage`, { method: "PATCH", body });
  },
  requestInfo(reference: string, message: string) {
    return apiRequest<{ report: CouncilReport }>(`${report(reference)}/request-info`, { method: "POST", body: { message } });
  },
  decide(reference: string, body: { decision: "APPROVED" | "REJECTED"; reason: string; severity?: Severity; categoryId?: string }) {
    return apiRequest<{ report: CouncilReport }>(`${report(reference)}/decision`, { method: "POST", body });
  },
  reopen(reference: string, reason: string) {
    return apiRequest<{ report: CouncilReport }>(`${report(reference)}/reopen`, { method: "POST", body: { reason } });
  },
  similar(reference: string, signal?: AbortSignal) {
    return apiRequest<{ candidates: SimilarCandidate[]; compared: number; windowDays: number }>(`${report(reference)}/similar`, { signal });
  },
  link(reference: string, targetReference: string, kind: "DUPLICATE" | "RELATED") {
    return apiRequest<{ report: CouncilReport }>(`${report(reference)}/links`, { method: "POST", body: { targetReference, kind } });
  },
  unlink(reference: string, targetReference: string) {
    return apiRequest<{ report: CouncilReport }>(`${report(reference)}/links/${encodeURIComponent(targetReference)}`, { method: "DELETE" });
  },
  setIndicator(reference: string, indicatorId: string, status: IndicatorStatus) {
    return apiRequest<{ report: CouncilReport }>(`${report(reference)}/indicators/${encodeURIComponent(indicatorId)}`, { method: "PATCH", body: { status } });
  },
};

/** Calls to `/api/admin` — administrators only. */
export const adminApi = {
  users(filters: { q?: string; role?: Role; status?: "active" | "suspended" | "all"; page?: number }, signal?: AbortSignal) {
    return apiRequest<UsersPage>(`/api/admin/users${query({ ...filters, pageSize: 25 })}`, { signal });
  },
  setRole(id: string, role: Role) {
    return apiRequest<{ user: AdminUser }>(`/api/admin/users/${encodeURIComponent(id)}/role`, { method: "PATCH", body: { role } });
  },
  suspend(id: string, reason: string) {
    return apiRequest<{ user: AdminUser; releasedReports: number }>(`/api/admin/users/${encodeURIComponent(id)}/suspend`, { method: "POST", body: { reason } });
  },
  reactivate(id: string) {
    return apiRequest<{ user: AdminUser }>(`/api/admin/users/${encodeURIComponent(id)}/reactivate`, { method: "POST", body: {} });
  },
  categories(signal?: AbortSignal) {
    return apiRequest<{ categories: AdminCategory[] }>("/api/admin/categories", { signal });
  },
  createCategory(body: { name: string; description?: string }) {
    return apiRequest<{ category: AdminCategory }>("/api/admin/categories", { method: "POST", body });
  },
  updateCategory(id: string, body: { name?: string; description?: string | null; archived?: boolean }) {
    return apiRequest<{ category: AdminCategory }>(`/api/admin/categories/${encodeURIComponent(id)}`, { method: "PATCH", body });
  },
  audit(filters: { action?: string; entityType?: string; days?: number; page?: number }, signal?: AbortSignal) {
    return apiRequest<AuditPage>(`/api/admin/audit${query({ ...filters, pageSize: 50 })}`, { signal });
  },
  exportCsv(days: number) {
    return apiDownload(`/api/admin/export.csv${query({ days })}`);
  },
};
