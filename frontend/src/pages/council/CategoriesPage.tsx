import { useState, type FormEvent } from "react";
import { Archive, ArchiveRestore, Pencil, Plus, Tags } from "lucide-react";
import { useLoad } from "@/components/council/useLoad";
import { FormAlert, SubmitButton, TextField } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { RowSeparator, SettingsGroup } from "@/components/settings/SettingsGroup";
import { ApiError } from "@/lib/api/client";
import { adminApi } from "@/lib/council/api";
import type { AdminCategory } from "@/lib/council/types";
import { cn } from "@/lib/cn";

/**
 * FR69 — the taxonomy every report is classified against.
 *
 * Categories are archived, never deleted: a report classified under one keeps
 * its history, and the category simply stops being offered on the report
 * form and in the officer's picker.
 */
export function CategoriesPage() {
  const { data, setData, error, reload } = useLoad((signal) => adminApi.categories(signal).then((result) => result.categories), "categories");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const say = (caught: unknown, fallback: string) => setNotice({ tone: "error", text: caught instanceof ApiError ? (caught.fields[0]?.message ?? caught.message) : fallback });

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      await adminApi.createCategory({ name: name.trim(), ...(description.trim() ? { description: description.trim() } : {}) });
      setName("");
      setDescription("");
      setNotice({ tone: "success", text: `“${name.trim()}” added. It is on the report form now.` });
      reload();
    } catch (caught) {
      say(caught, "The category could not be created.");
    } finally {
      setBusy(false);
    }
  };

  const update = async (category: AdminCategory, body: { name?: string; description?: string | null; archived?: boolean }, text: string) => {
    setNotice(null);
    try {
      const { category: saved } = await adminApi.updateCategory(category.id, body);
      setData((current) => current?.map((row) => (row.id === category.id ? { ...row, ...saved, reportCount: row.reportCount, alertCount: row.alertCount } : row)) ?? current);
      setNotice({ tone: "success", text });
      setEditing(null);
      return true;
    } catch (caught) {
      say(caught, "The category could not be saved.");
      return false;
    }
  };

  const live = data?.filter((row) => !row.archivedAt) ?? [];
  const archived = data?.filter((row) => row.archivedAt) ?? [];

  return (
    <ConsoleLayout title="Scam categories" subtitle="The taxonomy reports and alerts are classified against">
      <ConsoleHero icon={Tags} tint="bg-gradient-to-br from-fuchsia-600 to-violet-600">
        <p>Based on the Scamwatch taxonomy. Renaming a category renames it everywhere, including on past reports. Archiving takes it out of use without touching a single report.</p>
      </ConsoleHero>

      {notice ? <FormAlert tone={notice.tone}>{notice.text}</FormAlert> : null}
      {error ? (
        <FormAlert>
          {error.message}{" "}
          <button type="button" onClick={reload} className="font-semibold underline">Try again</button>
        </FormAlert>
      ) : null}

      <form onSubmit={create}>
        <SettingsGroup title="Add a category">
          <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="For example: Rental and accommodation" />
          <RowSeparator />
          <TextField label="Description" aside="(optional)" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={240} placeholder="One line a resident will recognise" />
          <div className="px-4 pb-4 pt-1">
            <SubmitButton icon={Plus} busy={busy} disabled={name.trim().length < 3}>Add category</SubmitButton>
          </div>
        </SettingsGroup>
      </form>

      <SettingsGroup title={`In use (${live.length})`}>
        {!data ? (
          <div className="flex flex-col gap-3 p-4">{[0, 1, 2].map((row) => <div key={row} className="h-10 animate-pulse rounded-lg bg-ui-fill" />)}</div>
        ) : (
          <ul>
            {live.map((category, index) => (
              <li key={category.id}>
                {index > 0 ? <RowSeparator /> : null}
                <CategoryRow category={category} editing={editing === category.id} onEdit={() => setEditing(editing === category.id ? null : category.id)} onUpdate={update} />
              </li>
            ))}
          </ul>
        )}
      </SettingsGroup>

      {archived.length > 0 ? (
        <SettingsGroup title={`Archived (${archived.length})`} footer="Not offered anywhere, but still shown on the reports already classified under them.">
          <ul>
            {archived.map((category, index) => (
              <li key={category.id}>
                {index > 0 ? <RowSeparator /> : null}
                <CategoryRow category={category} editing={false} onEdit={() => undefined} onUpdate={update} />
              </li>
            ))}
          </ul>
        </SettingsGroup>
      ) : null}
    </ConsoleLayout>
  );
}

function CategoryRow({
  category,
  editing,
  onEdit,
  onUpdate,
}: {
  category: AdminCategory;
  editing: boolean;
  onEdit: () => void;
  onUpdate: (category: AdminCategory, body: { name?: string; description?: string | null; archived?: boolean }, text: string) => Promise<boolean>;
}) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? "");
  const [busy, setBusy] = useState(false);
  const archived = Boolean(category.archivedAt);

  const run = async (body: { name?: string; description?: string | null; archived?: boolean }, text: string) => {
    setBusy(true);
    await onUpdate(category, body, text);
    setBusy(false);
  };

  return (
    <div className={cn(archived && "opacity-70")}>
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="min-w-0 flex-1">
          <span className="block text-[1rem] text-ui-label">{category.name}</span>
          <span className="mt-0.5 block text-[0.8125rem] leading-snug text-ui-label-2">
            {category.description ?? "No description"} · <span className="tabular-nums">{category.reportCount}</span> report{category.reportCount === 1 ? "" : "s"}
          </span>
        </span>
        {!archived ? (
          <button type="button" onClick={onEdit} aria-expanded={editing} className="flex h-9 w-9 items-center justify-center rounded-full text-ui-tint hover:bg-ui-fill" aria-label={`Edit ${category.name}`}>
            <Pencil aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => run({ archived: !archived }, archived ? `“${category.name}” is back in use.` : `“${category.name}” archived.`)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-ui-label-2 hover:bg-ui-fill disabled:opacity-40"
          aria-label={archived ? `Restore ${category.name}` : `Archive ${category.name}`}
          title={archived ? "Restore" : "Archive"}
        >
          {archived ? <ArchiveRestore aria-hidden="true" className="h-4 w-4" /> : <Archive aria-hidden="true" className="h-4 w-4" />}
        </button>
      </div>

      {editing ? (
        <div className="mx-4 mb-3 overflow-hidden rounded-ui bg-ui-grouped">
          <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} />
          <RowSeparator />
          <TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={240} />
          <div className="flex gap-2 px-4 pb-3 pt-1">
            <SubmitButton
              type="button"
              busy={busy}
              disabled={name.trim().length < 3 || (name.trim() === category.name && description.trim() === (category.description ?? ""))}
              onClick={() => run({ name: name.trim(), description: description.trim() || null }, "Category saved.")}
            >
              Save
            </SubmitButton>
            <SubmitButton type="button" variant="secondary" onClick={onEdit}>Cancel</SubmitButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
