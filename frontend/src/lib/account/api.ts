import { apiRequest } from "@/lib/api/client";
import type {
  NewReport,
  Notification,
  Overview,
  Preferences,
  ReferenceData,
  ReportDetail,
  ReportSummary,
  Session,
  User,
} from "@/lib/account/types";

/** Calls to `/api/auth`, `/api/account`, `/api/reports` and `/api/reference`. */

export const authApi = {
  register(body: { fullName: string; email: string; password: string }) {
    return apiRequest<Session>("/api/auth/register", { method: "POST", body });
  },
  login(body: { email: string; password: string }) {
    return apiRequest<Session>("/api/auth/login", { method: "POST", body });
  },
  me(signal?: AbortSignal) {
    return apiRequest<{ user: User }>("/api/auth/me", { signal });
  },
  verifyLink(token: string) {
    return apiRequest<{ user: User }>("/api/auth/verify-email", { method: "POST", body: { token } });
  },
  verifyCode(code: string) {
    return apiRequest<{ user: User }>("/api/auth/verify-email/code", { method: "POST", body: { code } });
  },
  resendCode() {
    return apiRequest<{ user: User; devCode?: string }>("/api/auth/verify-email/resend", { method: "POST", body: {} });
  },
  forgotPassword(email: string) {
    return apiRequest<{ sent: true }>("/api/auth/forgot-password", { method: "POST", body: { email } });
  },
  resetPassword(token: string, password: string) {
    return apiRequest<Session>("/api/auth/reset-password", { method: "POST", body: { token, password } });
  },
  logout() {
    return apiRequest<{ signedOut: true }>("/api/auth/logout", { method: "POST", body: {} });
  },
};

export const accountApi = {
  overview(signal?: AbortSignal) {
    return apiRequest<Overview>("/api/account/overview", { signal });
  },
  updateProfile(body: { fullName?: string; phone?: string | null; organisation?: string | null }) {
    return apiRequest<{ user: User }>("/api/account/profile", { method: "PATCH", body });
  },
  changePassword(currentPassword: string, newPassword: string) {
    return apiRequest<Session>("/api/account/password", { method: "POST", body: { currentPassword, newPassword } });
  },
  preferences(signal?: AbortSignal) {
    return apiRequest<{ preferences: Preferences }>("/api/account/preferences", { signal });
  },
  setPreferences(preferences: Preferences) {
    return apiRequest<{ preferences: Preferences }>("/api/account/preferences", { method: "PUT", body: preferences });
  },
  notifications(signal?: AbortSignal) {
    return apiRequest<{ notifications: Notification[]; unread: number }>("/api/account/notifications", { signal });
  },
  markRead(ids?: string[]) {
    return apiRequest<{ unread: number }>("/api/account/notifications/read", { method: "POST", body: ids ? { ids } : {} });
  },
  deleteAccount(password: string, reason?: string) {
    return apiRequest<{ deleted: true }>("/api/account/delete", {
      method: "POST",
      body: reason ? { password, reason } : { password },
    });
  },
};

export const reportsApi = {
  create(report: NewReport) {
    return apiRequest<{ reference: string; status: "SUBMITTED"; linkPath: string }>("/api/reports", {
      method: "POST",
      body: report,
    });
  },
  list(signal?: AbortSignal) {
    return apiRequest<{ reports: ReportSummary[] }>("/api/reports", { signal });
  },
  get(reference: string, signal?: AbortSignal) {
    return apiRequest<{ report: ReportDetail }>(`/api/reports/${encodeURIComponent(reference)}`, { signal });
  },
  withdraw(reference: string) {
    return apiRequest<{ report: ReportDetail }>(`/api/reports/${encodeURIComponent(reference)}/withdraw`, {
      method: "POST",
      body: {},
    });
  },
  respond(reference: string, requestId: string, response: string) {
    return apiRequest<{ report: ReportDetail }>(
      `/api/reports/${encodeURIComponent(reference)}/requests/${encodeURIComponent(requestId)}/respond`,
      { method: "POST", body: { response } },
    );
  },
};

/* Whether this deployment can send email. Asked once per page load. */
let configCache: Promise<{ emailDelivery: boolean }> | null = null;

export function fetchAuthConfig(): Promise<{ emailDelivery: boolean }> {
  configCache ??= apiRequest<{ emailDelivery: boolean }>("/api/auth/config").catch(() => {
    configCache = null;
    /* Unknown is treated as available: the journey then reads as designed,
       and a real failure surfaces where it happens. */
    return { emailDelivery: true };
  });
  return configCache;
}

/* Reference data changes a few times a year; one fetch per page load is plenty. */
let referenceCache: Promise<ReferenceData> | null = null;

export function fetchReferenceData(): Promise<ReferenceData> {
  referenceCache ??= apiRequest<ReferenceData>("/api/reference").catch((error: unknown) => {
    referenceCache = null;
    throw error;
  });
  return referenceCache;
}
