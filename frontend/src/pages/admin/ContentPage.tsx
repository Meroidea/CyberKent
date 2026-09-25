import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlertOctagon, AlertTriangle, Archive, ArchiveRestore, Download, Eye, EyeOff, FilePlus2, Info, Megaphone, Newspaper, PenLine } from "lucide-react";
import { useLoad } from "@/components/council/useLoad";
import { Sheet } from "@/components/admin/Sheet";
import { FormAlert, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SegmentedControl } from "@/components/settings/SegmentedControl";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { ROUTES } from "@/config/site";
import { LEARN_ARTICLES } from "@/content/learn";
import { contentApi } from "@/lib/admin/api";
import type { ManagedArticle, NoticeInput, NoticeTone, SiteNotice } from "@/lib/admin/types";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { toMarkup } from "@/lib/content/markup";
import { formatDateTime, formatRelative } from "@/lib/report/labels";

const TABS = [
  { value: "guides", label: "Guides" },
  { value: "notices", label: "Site notices" },
] as const;

const ARTICLE_STATUS: Record<ManagedArticle["status"], { label: string; chip: string }> = {
  published: { label: "Published", chip: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" },
  draft: { label: "Draft", chip: "bg-amber-500/12 text-amber-700 dark:text-amber-300" },
  archived: { label: "Archived", chip: "bg-slate-500/15 text-ui-label-2" },
};

export const TONE: Record<NoticeTone, { label: string; icon: typeof Info; bar: string }> = {
  INFO: { label: "Information", icon: Info, bar: "bg-sky-600 text-white" },
  WARNING: { label: "Warning", icon: AlertTriangle, bar: "bg-amber-500 text-slate-950" },
  CRITICAL: { label: "Urgent", icon: AlertOctagon, bar: "bg-rose-600 text-white" },
};

const NOTICE_STATUS: Record<SiteNotice["status"], string> = { live: "Live now", scheduled: "Scheduled", ended: "Ended", archived: "Archived" };

/**
 * Content management: the awareness library's guides and the banner across
 * the public site. Guides are drafts until published; notices run on a
 * schedule and switch themselves off.
 */
export function ContentPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("guides");
  return (
    <ConsoleLayout title="Content" subtitle="The awareness library and the notices residents see across the site." wide>
      <ConsoleHero icon={Newspaper} tint="bg-gradient-to-br from-teal-500 to-emerald-600">
        <p>Write and publish guides without a code change, and put an urgent warning across every page in seconds — scheduled to switch itself off.</p>
      </ConsoleHero>
      <SegmentedControl label="Content type" segments={TABS} value={tab} onChange={setTab} className="sm:max-w-[20rem]" />
      {tab === "guides" ? <Guides /> : <Notices />}
    </ConsoleLayout>
  );
}

/* ── guides ──────────────────────────────────────────────────────────── */

function Guides() {
  const { data, setData, error, loading } = useLoad((signal) => contentApi.articles(signal), "articles");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const articles = data?.articles ?? [];
  const managedSlugs = new Set(articles.filter((a) => !a.legacy).map((a) => a.slug));
  const unmanagedBuiltIns = LEARN_ARTICLES.filter((a) => !managedSlugs.has(a.id));

  const importBuiltIns = async () => {
    setBusy("import");
    try {
      const result = await contentApi.importBuiltIns(unmanagedBuiltIns.map((a) => ({
        slug: a.id,
        title: a.title,
        category: a.category,
        summary: a.summary,
        kind: a.kind,
        accent: a.accent,
        audience: a.audience,
        lede: a.lede,
        takeaways: a.takeaways,
        markup: toMarkup(a.sections),
      })));
      setData({ articles: result.articles });
      setMessage({ tone: "success", text: `${result.imported} built-in guide${result.imported === 1 ? " is" : "s are"} now editable here.` });
    } catch (caught) {
      setMessage({ tone: "error", text: caught instanceof ApiError ? caught.message : "The guides could not be imported." });
    } finally {
      setBusy(null);
    }
  };

  const setState = async (article: ManagedArticle, state: "publish" | "unpublish" | "archive" | "restore") => {
    setBusy(article.id + state);
    try {
      const { article: updated } = await contentApi.setState(article.id, state);
      setData((current) => (current ? { articles: current.articles.map((a) => (a.id === updated.id ? updated : a)) } : current));
    } catch (caught) {
      setMessage({ tone: "error", text: caught instanceof ApiError ? caught.message : "That did not work." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Link to={`${ROUTES.adminContent}/guides/new`} className="inline-flex items-center gap-1.5 rounded-full bg-ui-tint px-4 py-2 text-[0.875rem] font-semibold text-white hover:opacity-90 dark:text-slate-950">
          <FilePlus2 className="h-4 w-4" aria-hidden="true" />New guide
        </Link>
        {unmanagedBuiltIns.length > 0 ? (
          <button type="button" onClick={() => void importBuiltIns()} disabled={busy === "import"} className="inline-flex items-center gap-1.5 rounded-full bg-ui-fill px-4 py-2 text-[0.875rem] font-semibold text-ui-tint hover:bg-ui-fill-strong disabled:opacity-60">
            <Download className="h-4 w-4" aria-hidden="true" />Make the {unmanagedBuiltIns.length} built-in guides editable
          </button>
        ) : null}
      </div>

      {message ? <FormAlert tone={message.tone}>{message.text}</FormAlert> : null}
      {error ? <FormAlert tone="error">{error.message}</FormAlert> : null}

      <SettingsGroup title={`${articles.length} guide${articles.length === 1 ? "" : "s"} managed here`} footer="A published guide appears in the awareness library straight away. One that shares a built-in guide's address replaces it.">
        {loading && !data ? (
          <div className="m-4 h-24 animate-pulse rounded-lg bg-ui-fill" />
        ) : articles.length === 0 ? (
          <p className="px-4 py-6 text-[0.9375rem] text-ui-label-2">No guides yet. Start one, or make the built-in guides editable.</p>
        ) : (
          <ul className="divide-y divide-ui-separator">
            {articles.map((article) => {
              const S = ARTICLE_STATUS[article.status];
              return (
                <li key={article.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="text-[0.9375rem] font-medium text-ui-label">{article.title}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold", S.chip)}>{S.label}</span>
                      {article.legacy ? <span className="text-[0.6875rem] text-ui-label-3">needs one save in the editor</span> : null}
                    </p>
                    <p className="truncate text-[0.8125rem] text-ui-label-2">/learn/{article.slug} · {article.category} · {article.readingTime} · edited {formatRelative(article.updatedAt)}{article.author ? ` by ${article.author}` : ""}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Link to={`${ROUTES.adminContent}/guides/${article.id}`} className="inline-flex items-center gap-1 rounded-full bg-ui-fill px-3 py-1 text-[0.8125rem] font-semibold text-ui-tint"><PenLine className="h-3.5 w-3.5" aria-hidden="true" />Edit</Link>
                    {article.status === "draft" ? <Action onClick={() => void setState(article, "publish")} busy={busy === article.id + "publish"} icon={Eye}>Publish</Action> : null}
                    {article.status === "published" ? <Action onClick={() => void setState(article, "unpublish")} busy={busy === article.id + "unpublish"} icon={EyeOff}>Unpublish</Action> : null}
                    {article.status !== "archived" ? <Action onClick={() => void setState(article, "archive")} busy={busy === article.id + "archive"} icon={Archive}>Archive</Action> : <Action onClick={() => void setState(article, "restore")} busy={busy === article.id + "restore"} icon={ArchiveRestore}>Restore</Action>}
                    {article.status === "published" ? <Link to={`${ROUTES.learn}/${article.slug}`} target="_blank" className="rounded-full px-3 py-1 text-[0.8125rem] text-ui-label-2 hover:bg-ui-fill">View</Link> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SettingsGroup>
    </>
  );
}

function Action({ onClick, busy, icon: Icon, children }: { onClick: () => void; busy: boolean; icon: typeof Eye; children: string }) {
  return (
    <button type="button" onClick={onClick} disabled={busy} className="inline-flex items-center gap-1 rounded-full bg-ui-fill px-3 py-1 text-[0.8125rem] font-semibold text-ui-label-2 hover:text-ui-label disabled:opacity-50">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />{children}
    </button>
  );
}

/* ── notices ─────────────────────────────────────────────────────────── */

function Notices() {
  const { data, reload, error, loading } = useLoad((signal) => contentApi.notices(signal), "notices");
  const [editing, setEditing] = useState<SiteNotice | "new" | null>(null);
  const notices = data?.notices ?? [];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setEditing("new")} className="inline-flex items-center gap-1.5 rounded-full bg-ui-tint px-4 py-2 text-[0.875rem] font-semibold text-white hover:opacity-90 dark:text-slate-950">
          <Megaphone className="h-4 w-4" aria-hidden="true" />New notice
        </button>
      </div>
      {error ? <FormAlert tone="error">{error.message}</FormAlert> : null}
      <SettingsGroup title="Notices" footer="At most three show at once, most urgent first. Residents can dismiss one; it stays dismissed on that device.">
        {loading && !data ? (
          <div className="m-4 h-16 animate-pulse rounded-lg bg-ui-fill" />
        ) : notices.length === 0 ? (
          <p className="px-4 py-6 text-[0.9375rem] text-ui-label-2">No notices. Use one when a scam wave needs every visitor to see a warning.</p>
        ) : (
          <ul className="divide-y divide-ui-separator">
            {notices.map((notice) => {
              const T = TONE[notice.tone];
              return (
                <li key={notice.id} className="flex items-start gap-3 px-4 py-3">
                  <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", T.bar)}><T.icon className="h-4 w-4" aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.9375rem] font-medium text-ui-label">{notice.title}</p>
                    <p className="text-[0.8125rem] text-ui-label-2">
                      <span className={cn("font-semibold", notice.status === "live" ? "text-emerald-700 dark:text-emerald-300" : "")}>{NOTICE_STATUS[notice.status]}</span>
                      {" · "}{T.label} · from {formatDateTime(notice.startsAt)}{notice.endsAt ? ` until ${formatDateTime(notice.endsAt)}` : ", no end"}
                    </p>
                  </div>
                  <button type="button" onClick={() => setEditing(notice)} className="rounded-full bg-ui-fill px-3 py-1 text-[0.8125rem] font-semibold text-ui-tint">Edit</button>
                </li>
              );
            })}
          </ul>
        )}
      </SettingsGroup>
      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New notice" : "Edit notice"}>
        {editing ? <NoticeForm notice={editing === "new" ? null : editing} onSaved={() => { setEditing(null); reload(); }} /> : null}
      </Sheet>
    </>
  );
}

function localInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function NoticeForm({ notice, onSaved }: { notice: SiteNotice | null; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: notice?.title ?? "",
    body: notice?.body ?? "",
    tone: notice?.tone ?? ("WARNING" as NoticeTone),
    linkUrl: notice?.linkUrl ?? "",
    linkLabel: notice?.linkLabel ?? "",
    startsAt: localInput(notice?.startsAt ?? new Date().toISOString()),
    endsAt: localInput(notice?.endsAt ?? new Date(Date.now() + 3 * 86_400_000).toISOString()),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: event.target.value }));
  const T = TONE[form.tone];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const body: NoticeInput = {
      title: form.title,
      body: form.body,
      tone: form.tone,
      linkUrl: form.linkUrl || null,
      linkLabel: form.linkLabel || null,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    };
    try {
      if (notice) await contentApi.updateNotice(notice.id, body);
      else await contentApi.createNotice(body);
      onSaved();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError("The notice could not be saved.", 0));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-5">
      <div className={cn("flex items-start gap-2 rounded-xl px-4 py-3 text-[0.875rem]", T.bar)} aria-label="Preview">
        <T.icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p><span className="font-semibold">{form.title || "Your headline"}</span>{form.body ? ` ${form.body}` : ""}{form.linkUrl ? <span className="ml-1 font-semibold underline">{form.linkLabel || "Read more"}</span> : null}</p>
      </div>
      <SettingsGroup>
        <TextField label="Headline" value={form.title} onChange={set("title")} required maxLength={100} placeholder="Fake toll texts are circulating in Hume" error={error?.field("title")} />
        <TextAreaField label="Detail" aside="(optional)" value={form.body} onChange={set("body")} maxLength={400} placeholder="Linkt never texts a payment link. Delete the message." />
        <SelectField label="Tone" value={form.tone} onChange={set("tone")}>
          {(Object.keys(TONE) as NoticeTone[]).map((t) => <option key={t} value={t}>{TONE[t].label}</option>)}
        </SelectField>
      </SettingsGroup>
      <SettingsGroup footer="A site path such as /alerts, or a full https:// address.">
        <TextField label="Link" aside="(optional)" value={form.linkUrl} onChange={set("linkUrl")} placeholder="/alerts" error={error?.field("linkUrl")} />
        <TextField label="Link text" aside="(optional)" value={form.linkLabel} onChange={set("linkLabel")} maxLength={40} placeholder="See the alert" />
      </SettingsGroup>
      <SettingsGroup footer="Leave the end empty to run until you archive it.">
        <TextField label="Starts" type="datetime-local" value={form.startsAt} onChange={set("startsAt")} />
        <TextField label="Ends" type="datetime-local" value={form.endsAt} onChange={set("endsAt")} error={error?.field("endsAt")} />
      </SettingsGroup>
      {error && !error.fields.length ? <FormAlert tone="error">{error.message}</FormAlert> : null}
      <div className="flex flex-wrap gap-2">
        <SubmitButton busy={busy} icon={Megaphone}>{notice ? "Save notice" : "Schedule notice"}</SubmitButton>
        {notice && notice.status !== "archived" ? (
          <SubmitButton type="button" variant="secondary" icon={Archive} onClick={() => void contentApi.updateNotice(notice.id, { archived: true }).then(onSaved)}>Take down now</SubmitButton>
        ) : null}
      </div>
    </form>
  );
}
