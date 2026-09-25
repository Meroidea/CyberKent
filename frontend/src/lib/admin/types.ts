import type { Role } from "@/lib/account/types";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface PersonRef {
  id: string;
  fullName: string;
  role: Role;
}

export interface Task {
  id: string;
  reference: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  overdue: boolean;
  labels: string[];
  position: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: PersonRef | null;
  createdBy: PersonRef | null;
  report: { reference: string; status: string; title: string } | null;
  commentCount: number;
}

export interface TaskList {
  tasks: Task[];
  counts: { open: number; mine: number; unassigned: number; overdue: number; dueSoon: number };
  staff: PersonRef[];
}

export interface TaskDetail {
  task: Task;
  comments: { id: string; body: string; createdAt: string; author: PersonRef | null }[];
  activity: { id: string; action: string; metadata: { changes?: Record<string, { from: unknown; to: unknown }> } | null; createdAt: string; actor: { id: string; fullName: string } | null }[];
}

export interface TaskSuggestion {
  key: string;
  title: string;
  description: string;
  priority: TaskPriority;
  reportReference?: string;
  labels: string[];
  dueInDays: number;
  reason: string;
}

export interface TaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueAt?: string | null;
  assigneeId?: string | null;
  labels?: string[];
  reportReference?: string | null;
  position?: number;
}

export type Threat = "surging" | "rising" | "steady" | "fading";

export interface Campaign {
  key: string;
  kind: "artefact" | "pattern";
  label: string;
  detail: string;
  category: string | null;
  channel: string | null;
  indicator: { type: string; value: string; status: string } | null;
  current: number;
  previous: number;
  threat: Threat;
  velocityLabel: string;
  heat: number;
  series: number[];
  firstSeen: string;
  lastSeen: string;
  suburbs: { name: string; count: number }[];
  lossCents: number;
  verified: number;
  specimen: string;
  latestReference: string | null;
  references: string[];
  alert: { reference: string; headline: string } | null;
}

export interface Radar {
  days: number;
  generatedAt: string;
  totals: { reports: number; previousReports: number; campaigns: number; surging: number; uncovered: number; lossCents: number };
  campaigns: Campaign[];
  ticker: { reference: string; category: string | null; channel: string; suburb: string | null; submittedAt: string; excerpt: string }[];
}

export interface TeamMember {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  jobTitle: string | null;
  department: string | null;
  role: Role;
  status: "active" | "invited" | "suspended" | "never-signed-in";
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  workload: { openReports: number; decided30: number; medianDecisionHours: number | null; openTasks: number; overdueTasks: number; tasksDone30: number };
}

export interface InviteResult {
  member: { id: string; email: string; fullName: string; role: Role };
  emailSent: boolean;
  inviteLink: string | null;
}

/** One report as the analytics dataset carries it — short keys, no identity. */
export interface AnalyticsRow {
  t: string;
  c: string | null;
  s: string | null;
  ch: string;
  st: string;
  sv: string | null;
  l: number;
  d: number | null;
  i: number;
}

export interface AnalyticsDataset {
  days: number;
  periodStart: string;
  previousStart: string;
  generatedAt: string;
  rows: AnalyticsRow[];
  categories: { slug: string; name: string }[];
  suburbs: { name: string; postcode: string }[];
  alerts: { t: string; c: string | null }[];
  tasks: { created: string; done: string | null }[];
}

export type ArticleKind = "Article" | "Tutorial" | "Tips & tricks" | "Checklist";
export type ArticleAccent = "amber" | "indigo" | "cyan" | "emerald";

export interface ArticleContent {
  kind: ArticleKind;
  accent: ArticleAccent;
  audience: string;
  lede: string;
  takeaways: string[];
  markup: string;
}

export interface ManagedArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  readingTime: string;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  archivedAt: string | null;
  updatedAt: string;
  createdAt: string;
  author: string | null;
  content: ArticleContent;
  legacy: boolean;
}

export interface ArticleInput extends ArticleContent {
  slug?: string;
  title: string;
  category: string;
  summary: string;
}

export type NoticeTone = "INFO" | "WARNING" | "CRITICAL";

export interface SiteNotice {
  id: string;
  title: string;
  body: string;
  tone: NoticeTone;
  linkUrl: string | null;
  linkLabel: string | null;
  startsAt: string;
  endsAt: string | null;
  archivedAt: string | null;
  status: "live" | "scheduled" | "ended" | "archived";
  updatedAt: string;
}

export interface NoticeInput {
  title: string;
  body: string;
  tone: NoticeTone;
  linkUrl?: string | null;
  linkLabel?: string | null;
  startsAt?: string;
  endsAt?: string | null;
}

export interface PublicArticle {
  slug: string;
  title: string;
  category: string;
  summary: string;
  readingTime: string;
  updated: string;
  content: ArticleContent;
}

export interface PublicNotice {
  id: string;
  title: string;
  body: string;
  tone: NoticeTone;
  linkUrl: string | null;
  linkLabel: string | null;
}
