import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlarmClock,
  ArrowDown,
  ArrowUp,
  ChevronsUp,
  CircleDashed,
  CircleDot,
  CircleSlash,
  CheckCircle2,
  KanbanSquare,
  Lightbulb,
  Link2,
  MessageSquare,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/components/auth/useAuth";
import { StatTile } from "@/components/council/Charts";
import { SearchBox } from "@/components/council/Filters";
import { useLoad } from "@/components/council/useLoad";
import { Sheet } from "@/components/admin/Sheet";
import { FormAlert, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SegmentedControl } from "@/components/settings/SegmentedControl";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { ROUTES } from "@/config/site";
import { tasksApi } from "@/lib/admin/api";
import type { PersonRef, Task, TaskInput, TaskPriority, TaskStatus, TaskSuggestion } from "@/lib/admin/types";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { formatDate, formatDateTime, formatRelative, initials } from "@/lib/report/labels";
import { isAdmin } from "@/lib/roles";

export const STATUS: Record<TaskStatus, { label: string; icon: typeof CircleDot; tone: string }> = {
  TODO: { label: "To do", icon: CircleDashed, tone: "text-ui-label-2" },
  IN_PROGRESS: { label: "In progress", icon: CircleDot, tone: "text-sky-600 dark:text-sky-300" },
  BLOCKED: { label: "Blocked", icon: CircleSlash, tone: "text-rose-600 dark:text-rose-300" },
  DONE: { label: "Done", icon: CheckCircle2, tone: "text-emerald-600 dark:text-emerald-300" },
};
const COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];

/* Priority is a word and an icon, never a colour alone. */
export const PRIORITY: Record<TaskPriority, { label: string; icon: typeof ArrowUp; tone: string }> = {
  URGENT: { label: "Urgent", icon: ChevronsUp, tone: "text-rose-600 dark:text-rose-300" },
  HIGH: { label: "High", icon: ArrowUp, tone: "text-amber-600 dark:text-amber-300" },
  MEDIUM: { label: "Medium", icon: Minus, tone: "text-sky-600 dark:text-sky-300" },
  LOW: { label: "Low", icon: ArrowDown, tone: "text-ui-label-2" },
};

const VIEWS = [
  { value: "all", label: "All open" },
  { value: "mine", label: "Mine" },
  { value: "unassigned", label: "Unassigned" },
  { value: "overdue", label: "Overdue" },
] as const;

function dueLabel(task: Task): { text: string; tone: string } | null {
  if (!task.dueAt) return null;
  const days = Math.round((new Date(task.dueAt).getTime() - Date.now()) / 86_400_000);
  if (task.status === "DONE") return { text: `Due ${formatDate(task.dueAt)}`, tone: "text-ui-label-3" };
  if (task.overdue) return { text: days === 0 ? "Overdue today" : `Overdue ${Math.abs(days)}d`, tone: "text-rose-600 dark:text-rose-300" };
  if (days <= 1) return { text: days <= 0 ? "Due today" : "Due tomorrow", tone: "text-amber-600 dark:text-amber-300" };
  return { text: `Due ${formatDate(task.dueAt)}`, tone: "text-ui-label-2" };
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function TasksPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<(typeof VIEWS)[number]["value"]>("all");
  const [layout, setLayout] = useState<"board" | "list">(() => (localStorageGet("ck.tasks.layout") === "list" ? "list" : "board"));
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const openRef = params.get("task");
  const creating = params.get("new") === "1";

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(q.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  const { data, setData, error, loading, reload } = useLoad((signal) => tasksApi.list({ view, q: query || undefined }, signal), `${view}|${query}`);
  const suggestions = useLoad((signal) => (showSuggestions ? tasksApi.suggestions(signal) : Promise.resolve({ suggestions: [] as TaskSuggestion[] })), String(showSuggestions));

  const setLayoutSaved = (value: "board" | "list") => {
    setLayout(value);
    localStorageSet("ck.tasks.layout", value);
  };

  const openTask = (reference: string | null) => {
    const next = new URLSearchParams(params);
    next.delete("new");
    if (reference) next.set("task", reference);
    else next.delete("task");
    setParams(next, { replace: true });
  };

  const openNew = (value: boolean) => {
    const next = new URLSearchParams(params);
    if (value) next.set("new", "1");
    else ["new", "title", "report", "labels", "priority", "description"].forEach((key) => next.delete(key));
    setParams(next, { replace: true });
  };

  const replace = (task: Task) => setData((current) => (current ? { ...current, tasks: current.tasks.map((t) => (t.id === task.id ? task : t)) } : current));

  const move = async (task: Task, status: TaskStatus, before?: Task) => {
    const column = (data?.tasks ?? []).filter((t) => t.status === status && t.id !== task.id);
    const index = before ? column.findIndex((t) => t.id === before.id) : column.length;
    const prev = column[index - 1]?.position;
    const next = column[index]?.position;
    const position = prev === undefined && next === undefined ? 0 : prev === undefined ? next! - 1 : next === undefined ? prev + 1 : (prev + next) / 2;
    replace({ ...task, status, position, overdue: status !== "DONE" && task.overdue });
    try {
      replace((await tasksApi.update(task.reference, { status, position })).task);
    } catch (caught) {
      setNotice({ tone: "error", text: caught instanceof ApiError ? caught.message : "That move could not be saved." });
      reload();
    }
  };

  const accept = async (suggestion: TaskSuggestion) => {
    try {
      const { task } = await tasksApi.create({
        title: suggestion.title,
        description: suggestion.description,
        priority: suggestion.priority,
        labels: suggestion.labels,
        reportReference: suggestion.reportReference,
        dueAt: new Date(Date.now() + suggestion.dueInDays * 86_400_000).toISOString(),
      });
      setNotice({ tone: "success", text: `${task.reference} added to the board.` });
      suggestions.setData((current) => (current ? { suggestions: current.suggestions.filter((s) => s.key !== suggestion.key) } : current));
      reload();
    } catch (caught) {
      setNotice({ tone: "error", text: caught instanceof ApiError ? caught.message : "That suggestion could not be added." });
    }
  };

  const tasks = data?.tasks ?? [];

  return (
    <ConsoleLayout title="Task tracker" subtitle="Council's work in one place — who is on what, and what is late." wide>
      <ConsoleHero icon={KanbanSquare} tint="bg-gradient-to-br from-emerald-500 to-teal-600">
        <p>Drag a card to move it. Tie a task to a report and it links straight to the case; assign it and the assignee is told in their console and by email.</p>
      </ConsoleHero>

      <section aria-label="Task counts" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatTile label="Open" value={data?.counts.open ?? 0} loading={!data} />
        <StatTile label="Assigned to you" value={data?.counts.mine ?? 0} loading={!data} />
        <StatTile label="Unassigned" value={data?.counts.unassigned ?? 0} loading={!data} tone={data && data.counts.unassigned > 0 ? "attention" : "default"} />
        <StatTile label="Overdue" value={data?.counts.overdue ?? 0} loading={!data} tone={data && data.counts.overdue > 0 ? "attention" : "good"} />
        <StatTile label="Due within 48h" value={data?.counts.dueSoon ?? 0} loading={!data} />
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SegmentedControl label="Which tasks" segments={VIEWS} value={view} onChange={setView} className="lg:max-w-[26rem]" />
        <div className="flex-1">
          <SearchBox label="Search tasks" value={q} onChange={setQ} placeholder="Title, TASK-0001, report reference or label" />
        </div>
        <div className="flex gap-2">
          <SegmentedControl
            label="Layout"
            segments={[{ value: "board", label: "Board" }, { value: "list", label: "List" }] as const}
            value={layout}
            onChange={setLayoutSaved}
          />
          <button type="button" onClick={() => openNew(true)} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-ui-tint px-4 py-2 text-[0.875rem] font-semibold text-white hover:opacity-90 dark:text-slate-950">
            <Plus className="h-4 w-4" aria-hidden="true" /> New task
          </button>
        </div>
      </div>

      {notice ? <FormAlert tone={notice.tone}>{notice.text}</FormAlert> : null}
      {error ? <FormAlert tone="error">{error.message}</FormAlert> : null}

      <SettingsGroup
        title={
          <button type="button" onClick={() => setShowSuggestions((v) => !v)} aria-expanded={showSuggestions} className="inline-flex items-center gap-1.5 hover:text-ui-label">
            <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden="true" /> Suggested from what is waiting {showSuggestions ? "▴" : "▾"}
          </button>
        }
        footer={showSuggestions ? "Drawn from reports nobody has picked up, reporters who have gone quiet, alerts awaiting a second officer, unverified artefacts and surging campaigns. Nothing is added until you choose it." : undefined}
      >
        {showSuggestions ? (
          suggestions.loading && !suggestions.data ? (
            <div className="m-4 h-12 animate-pulse rounded-lg bg-ui-fill" />
          ) : (suggestions.data?.suggestions.length ?? 0) === 0 ? (
            <p className="px-4 py-4 text-[0.9375rem] text-ui-label-2">Nothing is waiting that is not already on the board.</p>
          ) : (
            <ul className="divide-y divide-ui-separator">
              {suggestions.data!.suggestions.map((s) => {
                const P = PRIORITY[s.priority];
                return (
                  <li key={s.key} className="flex items-start gap-3 px-4 py-3">
                    <P.icon className={cn("mt-0.5 h-4 w-4 shrink-0", P.tone)} aria-label={`${P.label} priority`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.9375rem] font-medium text-ui-label">{s.title}</p>
                      <p className="mt-0.5 text-[0.8125rem] text-ui-label-2">{s.reason} · {s.description}</p>
                    </div>
                    <button type="button" onClick={() => void accept(s)} className="shrink-0 rounded-full bg-ui-fill px-3 py-1 text-[0.8125rem] font-semibold text-ui-tint hover:bg-ui-fill-strong">
                      Add
                    </button>
                  </li>
                );
              })}
            </ul>
          )
        ) : null}
      </SettingsGroup>

      {loading && !data ? (
        <div className="grid gap-3 md:grid-cols-4">{COLUMNS.map((c) => <div key={c} className="h-48 animate-pulse rounded-ui bg-ui-card" />)}</div>
      ) : layout === "board" ? (
        <Board tasks={tasks} onOpen={openTask} onMove={move} />
      ) : (
        <TaskTable tasks={tasks} onOpen={openTask} />
      )}

      <Sheet open={Boolean(openRef)} onClose={() => openTask(null)} title={openRef ?? ""} wide>
        {openRef ? (
          <TaskSheet
            reference={openRef}
            staff={data?.staff ?? []}
            canDelete={(task) => task.createdBy?.id === user?.id || isAdmin(user?.role)}
            onSaved={(task) => { replace(task); }}
            onDeleted={() => { openTask(null); reload(); setNotice({ tone: "success", text: `${openRef} deleted.` }); }}
          />
        ) : null}
      </Sheet>

      <Sheet open={creating} onClose={() => openNew(false)} title="New task">
        {creating ? (
          <TaskForm
            staff={data?.staff ?? []}
            meId={user?.id ?? ""}
            initial={{
              title: params.get("title") ?? "",
              description: params.get("description") ?? "",
              reportReference: params.get("report") ?? "",
              labels: params.get("labels") ?? "",
              priority: (params.get("priority") as TaskPriority | null) ?? "MEDIUM",
            }}
            onCreated={(task) => {
              openNew(false);
              reload();
              setNotice({ tone: "success", text: `${task.reference} created.` });
            }}
          />
        ) : null}
      </Sheet>
    </ConsoleLayout>
  );
}

/* ── board ───────────────────────────────────────────────────────────── */

function Board({ tasks, onOpen, onMove }: { tasks: Task[]; onOpen: (ref: string) => void; onMove: (task: Task, status: TaskStatus, before?: Task) => void }) {
  const [dragging, setDragging] = useState<Task | null>(null);
  const [over, setOver] = useState<TaskStatus | null>(null);

  const drop = (status: TaskStatus, before?: Task) => (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setOver(null);
    if (dragging && (dragging.status !== status || before?.id !== dragging.id)) onMove(dragging, status, before);
    setDragging(null);
  };

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((status) => {
        const S = STATUS[status];
        const column = tasks.filter((t) => t.status === status);
        return (
          <section
            key={status}
            aria-label={`${S.label}, ${column.length} tasks`}
            onDragOver={(event) => { event.preventDefault(); setOver(status); }}
            onDragLeave={() => setOver((current) => (current === status ? null : current))}
            onDrop={drop(status)}
            className={cn("flex min-h-[12rem] flex-col gap-2 rounded-ui bg-ui-fill/60 p-2 transition-colors", over === status && "bg-ui-tint/10 ring-2 ring-ui-tint/40")}
          >
            <h2 className="flex items-center justify-between px-1.5 pt-1 text-[0.8125rem] font-semibold text-ui-label-2">
              <span className="flex items-center gap-1.5"><S.icon className={cn("h-4 w-4", S.tone)} aria-hidden="true" />{S.label}</span>
              <span className="tabular-nums">{column.length}</span>
            </h2>
            {column.map((task) => (
              <TaskCard key={task.id} task={task} onOpen={onOpen} onDragStart={() => setDragging(task)} onDrop={drop(status, task)} dragging={dragging?.id === task.id} />
            ))}
            {column.length === 0 ? <p className="px-2 py-6 text-center text-[0.8125rem] text-ui-label-3">Drop a task here</p> : null}
          </section>
        );
      })}
    </div>
  );
}

function TaskCard({ task, onOpen, onDragStart, onDrop, dragging }: { task: Task; onOpen: (ref: string) => void; onDragStart: () => void; onDrop: (event: DragEvent) => void; dragging: boolean }) {
  const P = PRIORITY[task.priority];
  const due = dueLabel(task);
  return (
    <article
      draggable
      onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", task.reference); onDragStart(); }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className={cn("rounded-xl bg-ui-card shadow-sm ring-1 ring-ui-separator/60 transition", dragging && "opacity-40", task.status === "DONE" && "opacity-75")}
    >
      <button type="button" onClick={() => onOpen(task.reference)} className="flex w-full flex-col gap-2 p-3 text-left">
        <span className="flex items-center justify-between gap-2 text-[0.6875rem] font-medium text-ui-label-3">
          <span className="font-mono">{task.reference}</span>
          <span className={cn("inline-flex items-center gap-0.5", P.tone)}><P.icon className="h-3.5 w-3.5" aria-hidden="true" />{P.label}</span>
        </span>
        <span className={cn("text-[0.9375rem] font-medium leading-snug text-ui-label", task.status === "DONE" && "line-through decoration-ui-label-3")}>{task.title}</span>
        {task.labels.length > 0 ? (
          <span className="flex flex-wrap gap-1">{task.labels.map((l) => <span key={l} className="rounded-full bg-ui-fill px-2 py-0.5 text-[0.6875rem] text-ui-label-2">{l}</span>)}</span>
        ) : null}
        <span className="flex items-center justify-between gap-2 text-[0.75rem]">
          <span className="flex min-w-0 items-center gap-2.5">
            {due ? <span className={cn("inline-flex items-center gap-1", due.tone)}><AlarmClock className="h-3.5 w-3.5" aria-hidden="true" />{due.text}</span> : null}
            {task.report ? <span className="inline-flex items-center gap-0.5 font-mono text-ui-label-3"><Link2 className="h-3 w-3" aria-hidden="true" />{task.report.reference}</span> : null}
            {task.commentCount > 0 ? <span className="inline-flex items-center gap-0.5 text-ui-label-3"><MessageSquare className="h-3 w-3" aria-hidden="true" />{task.commentCount}</span> : null}
          </span>
          {task.assignee ? (
            <span title={task.assignee.fullName} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-[0.625rem] font-semibold text-white">
              {initials(task.assignee.fullName)}
            </span>
          ) : (
            <span className="text-ui-label-3">Unassigned</span>
          )}
        </span>
      </button>
    </article>
  );
}

function TaskTable({ tasks, onOpen }: { tasks: Task[]; onOpen: (ref: string) => void }) {
  const rank: Record<TaskPriority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const sorted = [...tasks].sort((a, b) => Number(a.status === "DONE") - Number(b.status === "DONE") || Number(b.overdue) - Number(a.overdue) || rank[a.priority] - rank[b.priority] || (a.dueAt ?? "9").localeCompare(b.dueAt ?? "9"));
  if (sorted.length === 0) return <p className="rounded-ui bg-ui-card px-4 py-10 text-center text-[0.9375rem] text-ui-label-2">No tasks here.</p>;
  return (
    <div className="overflow-x-auto rounded-ui bg-ui-card">
      <table className="w-full min-w-[44rem] text-left text-[0.875rem]">
        <thead className="text-[0.75rem] text-ui-label-2">
          <tr className="border-b border-ui-separator">
            {["Task", "Status", "Priority", "Assignee", "Due", "Report"].map((h) => <th key={h} scope="col" className="px-4 py-2.5 font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {sorted.map((task) => {
            const S = STATUS[task.status];
            const P = PRIORITY[task.priority];
            const due = dueLabel(task);
            return (
              <tr key={task.id} className="border-b border-ui-separator/60 last:border-0 hover:bg-ui-card-hover">
                <td className="px-4 py-2.5">
                  <button type="button" onClick={() => onOpen(task.reference)} className="text-left">
                    <span className="block font-mono text-[0.6875rem] text-ui-label-3">{task.reference}</span>
                    <span className="font-medium text-ui-label hover:underline">{task.title}</span>
                  </button>
                </td>
                <td className="px-4 py-2.5"><span className={cn("inline-flex items-center gap-1", S.tone)}><S.icon className="h-4 w-4" aria-hidden="true" />{S.label}</span></td>
                <td className="px-4 py-2.5"><span className={cn("inline-flex items-center gap-1", P.tone)}><P.icon className="h-4 w-4" aria-hidden="true" />{P.label}</span></td>
                <td className="px-4 py-2.5 text-ui-label-2">{task.assignee?.fullName ?? "—"}</td>
                <td className={cn("px-4 py-2.5", due?.tone)}>{due?.text ?? "—"}</td>
                <td className="px-4 py-2.5 font-mono text-[0.8125rem]">{task.report ? <Link to={`${ROUTES.councilReport}/${task.report.reference}`} className="text-ui-tint hover:underline">{task.report.reference}</Link> : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── create ──────────────────────────────────────────────────────────── */

function TaskForm({
  staff,
  meId,
  initial,
  onCreated,
}: {
  staff: PersonRef[];
  meId: string;
  initial: { title: string; description: string; reportReference: string; labels: string; priority: TaskPriority };
  onCreated: (task: Task) => void;
}) {
  const [form, setForm] = useState({ ...initial, assigneeId: "", dueAt: "", status: "TODO" as TaskStatus });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { task } = await tasksApi.create({
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        status: form.status,
        assigneeId: form.assigneeId || undefined,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
        labels: form.labels.split(",").map((l) => l.trim()).filter(Boolean),
        reportReference: form.reportReference || undefined,
      });
      onCreated(task);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError("The task could not be created.", 0));
    } finally {
      setBusy(false);
    }
  };

  const fieldError = (field: string) => error?.field(field);

  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-5">
      <SettingsGroup>
        <TextField label="Title" value={form.title} onChange={set("title")} required maxLength={140} autoFocus placeholder="What needs doing" error={fieldError("title")} />
        <TextAreaField label="Details" aside="(optional)" value={form.description} onChange={set("description")} maxLength={4000} />
      </SettingsGroup>
      <SettingsGroup>
        <SelectField label="Assignee" value={form.assigneeId} onChange={set("assigneeId")} error={fieldError("assigneeId")}>
          <option value="">Unassigned</option>
          {staff.map((p) => <option key={p.id} value={p.id}>{p.fullName}{p.id === meId ? " (you)" : ""}</option>)}
        </SelectField>
        <SelectField label="Priority" value={form.priority} onChange={set("priority")}>
          {(Object.keys(PRIORITY) as TaskPriority[]).map((p) => <option key={p} value={p}>{PRIORITY[p].label}</option>)}
        </SelectField>
        <SelectField label="Column" value={form.status} onChange={set("status")}>
          {COLUMNS.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
        </SelectField>
        <TextField label="Due" type="datetime-local" value={form.dueAt} onChange={set("dueAt")} />
      </SettingsGroup>
      <SettingsGroup footer="Labels are comma-separated, e.g. triage, bank, follow-up.">
        <TextField label="Report" aside="(optional)" value={form.reportReference} onChange={set("reportReference")} placeholder="HCC-DEMO-8000" error={fieldError("reportReference")} />
        <TextField label="Labels" aside="(optional)" value={form.labels} onChange={set("labels")} />
      </SettingsGroup>
      {error && !error.fields.length ? <FormAlert tone="error">{error.message}</FormAlert> : null}
      <SubmitButton busy={busy} icon={Plus}>Create task</SubmitButton>
    </form>
  );
}

/* ── detail ──────────────────────────────────────────────────────────── */

const ACTION: Record<string, string> = { "task.created": "created this task", "task.updated": "updated it" };

function TaskSheet({ reference, staff, canDelete, onSaved, onDeleted }: { reference: string; staff: PersonRef[]; canDelete: (task: Task) => boolean; onSaved: (task: Task) => void; onDeleted: () => void }) {
  const { data, setData, error, loading } = useLoad((signal) => tasksApi.get(reference, signal), reference);
  const [draft, setDraft] = useState<TaskInput & { labelsText?: string; dueText?: string }>({});
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const task = data?.task;
  useEffect(() => setDraft({}), [reference]);

  const value = useMemo(
    () => (task ? {
      title: draft.title ?? task.title,
      description: draft.description ?? task.description ?? "",
      status: draft.status ?? task.status,
      priority: draft.priority ?? task.priority,
      assigneeId: draft.assigneeId !== undefined ? draft.assigneeId ?? "" : task.assignee?.id ?? "",
      dueText: draft.dueText ?? toLocalInput(task.dueAt),
      labelsText: draft.labelsText ?? task.labels.join(", "),
      reportReference: draft.reportReference !== undefined ? draft.reportReference ?? "" : task.report?.reference ?? "",
    } : null),
    [task, draft],
  );
  const dirty = Object.keys(draft).length > 0;

  const save = async (patch?: TaskInput) => {
    if (!task || !value) return;
    setBusy(true);
    setMessage(null);
    const body: TaskInput = patch ?? {
      ...(draft.title !== undefined ? { title: value.title } : {}),
      ...(draft.description !== undefined ? { description: value.description || null } : {}),
      ...(draft.status !== undefined ? { status: value.status } : {}),
      ...(draft.priority !== undefined ? { priority: value.priority } : {}),
      ...(draft.assigneeId !== undefined ? { assigneeId: value.assigneeId || null } : {}),
      ...(draft.dueText !== undefined ? { dueAt: value.dueText ? new Date(value.dueText).toISOString() : null } : {}),
      ...(draft.labelsText !== undefined ? { labels: value.labelsText.split(",").map((l) => l.trim()).filter(Boolean) } : {}),
      ...(draft.reportReference !== undefined ? { reportReference: value.reportReference || null } : {}),
    };
    try {
      const { task: saved } = await tasksApi.update(task.reference, body);
      onSaved(saved);
      setData((current) => (current ? { ...current, task: saved } : current));
      /* A one-field change (the status control) keeps any other unsaved edits. */
      setDraft((current) => {
        if (!patch) return {};
        const rest = { ...current };
        for (const key of Object.keys(patch)) delete rest[key as keyof typeof rest];
        return rest;
      });
      setMessage({ tone: "success", text: "Saved." });
      const fresh = await tasksApi.get(task.reference);
      setData(fresh);
    } catch (caught) {
      setMessage({ tone: "error", text: caught instanceof ApiError ? caught.message : "This could not be saved." });
    } finally {
      setBusy(false);
    }
  };

  const post = async (event: FormEvent) => {
    event.preventDefault();
    if (!task || !comment.trim()) return;
    try {
      const { comment: added } = await tasksApi.comment(task.reference, comment.trim());
      setData((current) => (current ? { ...current, comments: [...current.comments, added], task: { ...current.task, commentCount: current.task.commentCount + 1 } } : current));
      setComment("");
    } catch (caught) {
      setMessage({ tone: "error", text: caught instanceof ApiError ? caught.message : "The comment could not be added." });
    }
  };

  const remove = async () => {
    if (!task || !window.confirm(`Delete ${task.reference}? Its comments go with it. The audit trail keeps a record.`)) return;
    try {
      await tasksApi.remove(task.reference);
      onDeleted();
    } catch (caught) {
      setMessage({ tone: "error", text: caught instanceof ApiError ? caught.message : "The task could not be deleted." });
    }
  };

  if (error) return <FormAlert tone="error">{error.message}</FormAlert>;
  if (loading || !task || !value) return <div className="h-64 animate-pulse rounded-ui bg-ui-card" />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-[0.75rem] text-ui-label-3">
          Created by {task.createdBy?.fullName ?? "someone no longer here"} · {formatRelative(task.createdAt)}
          {task.completedAt ? ` · done ${formatRelative(task.completedAt)}` : ""}
        </p>
      </div>

      <SegmentedControl label="Status" segments={COLUMNS.map((s) => ({ value: s, label: STATUS[s].label }))} value={value.status} onChange={(status) => { setDraft((d) => ({ ...d, status })); void save({ status }); }} />

      <SettingsGroup>
        <TextField label="Title" value={value.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} maxLength={140} />
        <TextAreaField label="Details" value={value.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} maxLength={4000} />
      </SettingsGroup>
      <SettingsGroup>
        <SelectField label="Assignee" value={value.assigneeId} onChange={(e) => setDraft((d) => ({ ...d, assigneeId: e.target.value || null }))}>
          <option value="">Unassigned</option>
          {staff.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
        </SelectField>
        <SelectField label="Priority" value={value.priority} onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as TaskPriority }))}>
          {(Object.keys(PRIORITY) as TaskPriority[]).map((p) => <option key={p} value={p}>{PRIORITY[p].label}</option>)}
        </SelectField>
        <TextField label="Due" type="datetime-local" value={value.dueText} onChange={(e) => setDraft((d) => ({ ...d, dueText: e.target.value }))} />
        <TextField label="Labels" value={value.labelsText} onChange={(e) => setDraft((d) => ({ ...d, labelsText: e.target.value }))} />
        <TextField
          label="Report"
          value={value.reportReference}
          onChange={(e) => setDraft((d) => ({ ...d, reportReference: e.target.value || null }))}
          hint={task.report ? <Link to={`${ROUTES.councilReport}/${task.report.reference}`} className="text-ui-tint hover:underline">Open {task.report.reference} — {task.report.title}</Link> : undefined}
        />
      </SettingsGroup>

      {message ? <FormAlert tone={message.tone}>{message.text}</FormAlert> : null}
      <div className="flex flex-wrap gap-2">
        <SubmitButton type="button" busy={busy} disabled={!dirty} onClick={() => void save()}>Save changes</SubmitButton>
        {canDelete(task) ? <SubmitButton type="button" variant="danger" icon={Trash2} onClick={() => void remove()}>Delete</SubmitButton> : null}
      </div>

      <SettingsGroup title={`Discussion (${data.comments.length})`}>
        <ul className="divide-y divide-ui-separator">
          {data.comments.map((c) => (
            <li key={c.id} className="flex gap-3 px-4 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ui-fill text-[0.6875rem] font-semibold text-ui-label-2">{initials(c.author?.fullName ?? "?")}</span>
              <div className="min-w-0">
                <p className="text-[0.75rem] text-ui-label-3"><span className="font-semibold text-ui-label-2">{c.author?.fullName ?? "Former staff"}</span> · {formatDateTime(c.createdAt)}</p>
                <p className="mt-0.5 whitespace-pre-wrap text-[0.9375rem] text-ui-label">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <form onSubmit={(event) => void post(event)} className="flex gap-2 border-t border-ui-separator p-3">
          <input value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} placeholder="Add an update…" aria-label="Add a comment" className="min-w-0 flex-1 rounded-[0.625rem] bg-ui-fill px-3 py-2 text-[0.9375rem] text-ui-label placeholder:text-ui-label-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-tint" />
          <button type="submit" disabled={!comment.trim()} className="rounded-full bg-ui-tint px-4 text-[0.875rem] font-semibold text-white disabled:opacity-40 dark:text-slate-950">Post</button>
        </form>
      </SettingsGroup>

      <SettingsGroup title="History">
        <ol className="flex flex-col gap-2 px-4 py-3">
          {data.activity.map((a) => (
            <li key={a.id} className="text-[0.8125rem] text-ui-label-2">
              <span className="font-semibold text-ui-label">{a.actor?.fullName ?? "Someone"}</span> {ACTION[a.action] ?? a.action}
              {a.metadata?.changes ? ` — ${describeChanges(a.metadata.changes)}` : ""}
              <span className="text-ui-label-3"> · {formatDateTime(a.createdAt)}</span>
            </li>
          ))}
        </ol>
      </SettingsGroup>
    </div>
  );
}

function describeChanges(changes: Record<string, { from: unknown; to: unknown }>): string {
  return Object.entries(changes)
    .map(([field, { to }]) => {
      if (field === "status") return `moved to ${STATUS[to as TaskStatus]?.label ?? to}`;
      if (field === "priority") return `priority ${PRIORITY[to as TaskPriority]?.label.toLowerCase() ?? to}`;
      if (field === "assignee") return to ? `assigned to ${to}` : "unassigned";
      if (field === "due") return to ? `due ${formatDate(String(to))}` : "due date removed";
      return `${field} changed`;
    })
    .join(", ");
}

/* Per-viewer layout preference; storage may be unavailable. */
function localStorageGet(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function localStorageSet(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* not kept */ }
}
