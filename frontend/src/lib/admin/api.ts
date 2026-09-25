import { apiRequest } from "@/lib/api/client";
import type {
  AnalyticsDataset,
  ArticleInput,
  InviteResult,
  ManagedArticle,
  NoticeInput,
  PublicArticle,
  PublicNotice,
  Radar,
  SiteNotice,
  Task,
  TaskDetail,
  TaskInput,
  TaskList,
  TaskSuggestion,
  TeamMember,
} from "@/lib/admin/types";
import type { Role } from "@/lib/account/types";

function query(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  const text = search.toString();
  return text ? `?${text}` : "";
}

const task = (reference: string) => `/api/council/tasks/${encodeURIComponent(reference)}`;
const article = (id: string) => `/api/admin/content/articles/${encodeURIComponent(id)}`;

export const tasksApi = {
  list(filters: { view?: string; status?: string; priority?: string; assigneeId?: string; q?: string }, signal?: AbortSignal) {
    return apiRequest<TaskList>(`/api/council/tasks${query(filters)}`, { signal });
  },
  get(reference: string, signal?: AbortSignal) {
    return apiRequest<TaskDetail>(task(reference), { signal });
  },
  create(body: TaskInput & { title: string }) {
    return apiRequest<{ task: Task }>("/api/council/tasks", { method: "POST", body });
  },
  update(reference: string, body: TaskInput) {
    return apiRequest<{ task: Task }>(task(reference), { method: "PATCH", body });
  },
  remove(reference: string) {
    return apiRequest<null>(task(reference), { method: "DELETE" });
  },
  comment(reference: string, body: string) {
    return apiRequest<{ comment: TaskDetail["comments"][number] }>(`${task(reference)}/comments`, { method: "POST", body: { body } });
  },
  suggestions(signal?: AbortSignal) {
    return apiRequest<{ suggestions: TaskSuggestion[] }>("/api/council/tasks/suggestions", { signal });
  },
};

export const radarApi = {
  get(days: number, signal?: AbortSignal) {
    return apiRequest<Radar>(`/api/council/radar${query({ days })}`, { signal });
  },
};

export const analyticsApi = {
  dataset(days: number, signal?: AbortSignal) {
    return apiRequest<AnalyticsDataset>(`/api/council/analytics/dataset${query({ days })}`, { signal });
  },
};

export const teamApi = {
  list(signal?: AbortSignal) {
    return apiRequest<{ members: TeamMember[] }>("/api/admin/team", { signal });
  },
  invite(body: { fullName: string; email: string; role: Role; jobTitle?: string; department?: string; phone?: string }) {
    return apiRequest<InviteResult>("/api/admin/team", { method: "POST", body });
  },
  resend(id: string) {
    return apiRequest<{ emailSent: boolean; inviteLink: string | null }>(`/api/admin/team/${encodeURIComponent(id)}/invite`, { method: "POST", body: {} });
  },
  update(id: string, body: { fullName?: string; jobTitle?: string | null; department?: string | null; phone?: string | null }) {
    return apiRequest<{ member: TeamMember }>(`/api/admin/team/${encodeURIComponent(id)}`, { method: "PATCH", body });
  },
};

export const contentApi = {
  articles(signal?: AbortSignal) {
    return apiRequest<{ articles: ManagedArticle[] }>("/api/admin/content/articles", { signal });
  },
  article(id: string, signal?: AbortSignal) {
    return apiRequest<{ article: ManagedArticle }>(article(id), { signal });
  },
  create(body: ArticleInput) {
    return apiRequest<{ article: ManagedArticle }>("/api/admin/content/articles", { method: "POST", body });
  },
  update(id: string, body: Partial<ArticleInput>) {
    return apiRequest<{ article: ManagedArticle }>(article(id), { method: "PATCH", body });
  },
  setState(id: string, state: "publish" | "unpublish" | "archive" | "restore") {
    return apiRequest<{ article: ManagedArticle }>(`${article(id)}/${state}`, { method: "POST", body: {} });
  },
  importBuiltIns(articles: (ArticleInput & { slug: string })[]) {
    return apiRequest<{ imported: number; articles: ManagedArticle[] }>("/api/admin/content/articles/import", { method: "POST", body: { articles } });
  },
  notices(signal?: AbortSignal) {
    return apiRequest<{ notices: SiteNotice[] }>("/api/admin/content/notices", { signal });
  },
  createNotice(body: NoticeInput) {
    return apiRequest<{ notice: SiteNotice }>("/api/admin/content/notices", { method: "POST", body });
  },
  updateNotice(id: string, body: Partial<NoticeInput> & { archived?: boolean }) {
    return apiRequest<{ notice: SiteNotice }>(`/api/admin/content/notices/${encodeURIComponent(id)}`, { method: "PATCH", body });
  },
};

/** Public reads — no session needed. */
export const publicContentApi = {
  articles(signal?: AbortSignal) {
    return apiRequest<{ articles: PublicArticle[] }>("/api/content/articles", { signal });
  },
  notices(signal?: AbortSignal) {
    return apiRequest<{ notices: PublicNotice[] }>("/api/content/notices", { signal });
  },
};
