import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, HelpCircle, Save } from "lucide-react";
import { ArticleBody } from "@/components/learn/ArticleBody";
import { FormAlert, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/forms/fields";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { ROUTES } from "@/config/site";
import { contentApi } from "@/lib/admin/api";
import type { ArticleAccent, ArticleInput, ArticleKind, ManagedArticle } from "@/lib/admin/types";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { MARKUP_HELP, parseMarkup } from "@/lib/content/markup";

const KINDS: ArticleKind[] = ["Article", "Tutorial", "Tips & tricks", "Checklist"];
const ACCENTS: ArticleAccent[] = ["amber", "indigo", "cyan", "emerald"];
const CATEGORIES = ["Residents", "Small business", "Community", "Organisations", "Recovery", "Scam types"];

const STARTER = `## What it looks like

Describe the scam the way a resident will meet it.

- The first warning sign
- The second warning sign

## What to do

+ Stop: Do not reply, tap the link or call the number in the message.
+ Check: Contact the organisation on a number you already trust.

!do Report it: Tell Council on CyberKent so others in Hume are warned.`;

/**
 * The guide editor. Writing on one side, the guide as residents will see it
 * on the other — rendered by the same component the library uses, so the
 * preview is the page, not an approximation of it.
 */
export function ArticleEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const creating = id === "new";
  const [form, setForm] = useState<ArticleInput>({ title: "", slug: "", category: "Residents", summary: "", kind: "Article", accent: "indigo", audience: "", lede: "", takeaways: [], markup: STARTER });
  const [takeawaysText, setTakeawaysText] = useState("");
  const [saved, setSaved] = useState<ManagedArticle | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    if (creating || !id) return;
    contentApi.article(id).then(({ article }) => {
      setSaved(article);
      setForm({ title: article.title, slug: article.slug, category: article.category, summary: article.summary, ...article.content });
      setTakeawaysText(article.content.takeaways.join("\n"));
    }).catch((caught) => setError(caught instanceof ApiError ? caught : new ApiError("This guide could not be loaded.", 0)));
  }, [id, creating]);

  const sections = useMemo(() => parseMarkup(form.markup), [form.markup]);
  const set = (key: keyof ArticleInput) => (event: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const save = async (publish = false) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    const body: ArticleInput = { ...form, slug: form.slug || undefined, takeaways: takeawaysText.split("\n").map((t) => t.trim()).filter(Boolean) };
    try {
      let article = saved ? (await contentApi.update(saved.id, body)).article : (await contentApi.create(body)).article;
      if (publish && article.status !== "published") article = (await contentApi.setState(article.id, "publish")).article;
      setSaved(article);
      setForm((f) => ({ ...f, slug: article.slug }));
      setMessage(publish ? "Published — it is in the awareness library now." : "Saved.");
      if (creating) navigate(`${ROUTES.adminContent}/guides/${article.id}`, { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError("The guide could not be saved.", 0));
    } finally {
      setBusy(false);
    }
  };

  const unpublish = async () => {
    if (!saved) return;
    setSaved((await contentApi.setState(saved.id, "unpublish")).article);
    setMessage("Taken off the library; kept as a draft.");
  };

  return (
    <ConsoleLayout title={creating ? "New guide" : "Edit guide"} subtitle={saved ? `/learn/${saved.slug} · ${saved.status}` : "A draft until you publish it."} wide>
      <Link to={ROUTES.adminContent} className="inline-flex items-center gap-1 text-[0.875rem] font-medium text-ui-tint hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />All content</Link>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="flex flex-col gap-5">
          <SettingsGroup title="The card">
            <TextField label="Title" value={form.title} onChange={set("title")} maxLength={120} required error={error?.field("title")} />
            <TextAreaField label="Summary" value={form.summary} onChange={set("summary")} maxLength={280} hint="One or two sentences on the library card." error={error?.field("summary")} />
            <TextField label="Address" aside="(optional)" value={form.slug ?? ""} onChange={set("slug")} placeholder="made from the title" hint={`/learn/${form.slug || "…"}`} error={error?.field("slug")} />
            <SelectField label="Written for" value={form.category} onChange={set("category")}>
              {[...new Set([...CATEGORIES, form.category])].map((c) => <option key={c} value={c}>{c}</option>)}
            </SelectField>
            <SelectField label="Kind" value={form.kind} onChange={set("kind")}>{KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</SelectField>
            <SelectField label="Colour" value={form.accent} onChange={set("accent")}>{ACCENTS.map((a) => <option key={a} value={a}>{a[0]!.toUpperCase() + a.slice(1)}</option>)}</SelectField>
          </SettingsGroup>

          <SettingsGroup title="The opening">
            <TextField label="Audience" aside="(optional)" value={form.audience} onChange={set("audience")} maxLength={160} placeholder="Anyone who has been asked to pay by gift card" />
            <TextAreaField label="Lede" aside="(optional)" value={form.lede} onChange={set("lede")} maxLength={1200} />
            <TextAreaField label="Key takeaways" aside="(one per line)" value={takeawaysText} onChange={(e) => setTakeawaysText(e.target.value)} />
          </SettingsGroup>

          <SettingsGroup
            title="The guide"
            action={<button type="button" onClick={() => setHelp((v) => !v)} className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-ui-tint"><HelpCircle className="h-4 w-4" aria-hidden="true" />Formatting</button>}
            footer={`${sections.length} section${sections.length === 1 ? "" : "s"} · ${form.markup.split(/\s+/).filter(Boolean).length} words`}
          >
            {help ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-b border-ui-separator px-4 py-3 text-[0.8125rem]">
                {MARKUP_HELP.map(([syntax, meaning]) => (
                  <div key={syntax} className="contents"><dt className="font-mono text-ui-label">{syntax}</dt><dd className="text-ui-label-2">{meaning}</dd></div>
                ))}
              </dl>
            ) : null}
            <textarea
              value={form.markup}
              onChange={(e) => setForm((f) => ({ ...f, markup: e.target.value }))}
              aria-label="Guide body"
              spellCheck
              className="block min-h-[26rem] w-full resize-y bg-transparent px-4 py-3 font-mono text-[0.8125rem] leading-relaxed text-ui-label focus:outline-none"
            />
          </SettingsGroup>

          {error && !error.fields.length ? <FormAlert tone="error">{error.message}</FormAlert> : null}
          {message ? <FormAlert tone="success">{message}</FormAlert> : null}
          <div className="flex flex-wrap gap-2">
            <SubmitButton type="button" busy={busy} icon={Save} variant="secondary" onClick={() => void save(false)}>Save draft</SubmitButton>
            {saved?.status === "published" ? (
              <>
                <SubmitButton type="button" busy={busy} icon={Save} onClick={() => void save(false)}>Update live guide</SubmitButton>
                <SubmitButton type="button" variant="secondary" icon={EyeOff} onClick={() => void unpublish()}>Unpublish</SubmitButton>
              </>
            ) : (
              <SubmitButton type="button" busy={busy} icon={Eye} onClick={() => void save(true)}>Save and publish</SubmitButton>
            )}
          </div>
        </div>

        <div className="xl:sticky xl:top-24 xl:max-h-[calc(100svh-7rem)] xl:overflow-y-auto">
          <p className="px-1 pb-2 text-[0.8125rem] font-semibold text-ui-label-2">Preview</p>
          <article className="rounded-ui bg-ui-card p-5">
            <p className={cn("font-mono text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-cyan-400")}>{form.kind} · {form.category}</p>
            <h2 className="mt-2 text-[1.75rem] font-semibold leading-tight text-ui-label">{form.title || "Your title"}</h2>
            {form.summary ? <p className="mt-2 text-[1rem] text-ui-label-2">{form.summary}</p> : null}
            {form.lede ? <p className="mt-4 text-[1rem] leading-relaxed text-ui-label">{form.lede}</p> : null}
            {takeawaysText.trim() ? (
              <ul className="mt-4 list-disc rounded-xl bg-ui-fill/60 py-3 pl-8 pr-4 text-[0.9375rem] text-ui-label">
                {takeawaysText.split("\n").filter((t) => t.trim()).map((t) => <li key={t}>{t}</li>)}
              </ul>
            ) : null}
            <div className="mt-6">
              <ArticleBody sections={sections} accent={form.accent} />
            </div>
          </article>
        </div>
      </div>
    </ConsoleLayout>
  );
}
