import { apiRequest } from "@/lib/api/client";
import type { AlertDraft, AlertFeed, AlertStatus, AlertSuggestion, PublicAlert, StaffAlert } from "@/lib/alerts/types";
import type { Severity } from "@/lib/council/types";

function query(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== "") search.set(key, String(value));
  const text = search.toString();
  return text ? `?${text}` : "";
}

/** `/api/alerts` — public, no account. */
export const alertsApi = {
  feed(filters: { q?: string; categoryId?: string; suburbId?: string; severity?: Severity; archived?: "include" | "only"; page?: number; pageSize?: number }, signal?: AbortSignal) {
    return apiRequest<AlertFeed>(`/api/alerts${query(filters)}`, { signal });
  },
  get(reference: string, signal?: AbortSignal) {
    return apiRequest<{ alert: PublicAlert }>(`/api/alerts/${encodeURIComponent(reference)}`, { signal });
  },
};

const staff = (id: string) => `/api/council/alerts/${encodeURIComponent(id)}`;

/** `/api/council/alerts` — the officer's alert desk. */
export const alertDeskApi = {
  list(status: AlertStatus | undefined, page: number, signal?: AbortSignal) {
    return apiRequest<{ alerts: StaffAlert[]; total: number; page: number; pageSize: number; counts: Partial<Record<AlertStatus, number>> }>(
      `/api/council/alerts${query({ status, page })}`,
      { signal },
    );
  },
  suggest(reference: string, signal?: AbortSignal) {
    return apiRequest<{ suggestion: AlertSuggestion }>(`/api/council/alerts/suggest/${encodeURIComponent(reference)}`, { signal });
  },
  get(id: string, signal?: AbortSignal) {
    return apiRequest<{ alert: StaffAlert }>(staff(id), { signal });
  },
  create(body: AlertDraft & { sourceReference?: string }) {
    return apiRequest<{ alert: StaffAlert }>("/api/council/alerts", { method: "POST", body });
  },
  update(id: string, body: Partial<AlertDraft>) {
    return apiRequest<{ alert: StaffAlert }>(staff(id), { method: "PATCH", body });
  },
  submit(id: string) {
    return apiRequest<{ alert: StaffAlert }>(`${staff(id)}/submit`, { method: "POST", body: {} });
  },
  sendBack(id: string, note: string) {
    return apiRequest<{ alert: StaffAlert }>(`${staff(id)}/return`, { method: "POST", body: { note } });
  },
  approve(id: string) {
    return apiRequest<{ alert: StaffAlert }>(`${staff(id)}/approve`, { method: "POST", body: {} });
  },
  archive(id: string) {
    return apiRequest<{ alert: StaffAlert }>(`${staff(id)}/archive`, { method: "POST", body: {} });
  },
  restore(id: string) {
    return apiRequest<{ alert: StaffAlert }>(`${staff(id)}/restore`, { method: "POST", body: {} });
  },
};

export type SubscriptionScope = "ALL" | "CATEGORY" | "SUBURB";

export interface AlertSubscription {
  id: string;
  email: string;
  scope: SubscriptionScope;
  category: { id: string; name: string } | null;
  suburb: { id: string; name: string } | null;
  confirmed: boolean;
  createdAt: string;
}

/** `/api/subscriptions` — FR64–FR66. Works with or without an account. */
export const subscriptionsApi = {
  subscribe(body: { email: string; scope: SubscriptionScope; categoryId?: string; suburbId?: string }) {
    return apiRequest<{ subscription: AlertSubscription; status: "confirmed" | "pending" | "unavailable"; devLink?: string }>("/api/subscriptions", { method: "POST", body });
  },
  confirm(token: string) {
    return apiRequest<{ subscription: AlertSubscription }>("/api/subscriptions/confirm", { method: "POST", body: { token } });
  },
  unsubscribe(token: string) {
    return apiRequest<{ subscription: AlertSubscription & { description: string } }>("/api/subscriptions/unsubscribe", { method: "POST", body: { token } });
  },
  mine(signal?: AbortSignal) {
    return apiRequest<{ subscriptions: AlertSubscription[] }>("/api/subscriptions/mine", { signal });
  },
  cancel(id: string) {
    return apiRequest<{ subscriptions: AlertSubscription[] }>(`/api/subscriptions/mine/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};

/** "Every alert", "Bank impersonation scams", "Alerts for Craigieburn". */
export function describeSubscription(subscription: Pick<AlertSubscription, "scope" | "category" | "suburb">): string {
  if (subscription.scope === "ALL") return "Every alert in Hume";
  if (subscription.scope === "CATEGORY") return `${subscription.category?.name ?? "One type of"} scams`;
  return `Alerts for ${subscription.suburb?.name ?? "one suburb"}`;
}
