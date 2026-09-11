import { FileText } from "lucide-react";
import { DOCUMENTS, DOCUMENTS_PAGE, type DocumentStatus } from "@/content/documents";
import { DOCUMENT_ICONS } from "@/components/layout/resourceIcons";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import { cn } from "@/lib/cn";

/**
 * Status colour carries meaning, so it is never the only carrier: the label is
 * always rendered as text beside it (UI-8, WCAG 1.4.1).
 */
const STATUS_CLASSES: Record<DocumentStatus, string> = {
  Published: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  "Awaiting approval": "bg-amber-500/12 text-amber-600 dark:text-amber-400",
  Superseded: "bg-slate-500/12 text-ui-label-2",
};

/** The tile colour a document's row carries, matched to its kind. */
const DOCUMENT_TINTS: Record<string, string> = {
  requirements: "bg-blue-500",
  architecture: "bg-violet-500",
  interim: "bg-amber-500",
  midproject: "bg-emerald-500",
  srs: "bg-indigo-500",
  features: "bg-teal-500",
};

/**
 * Formatted at render rather than stored formatted, so the register holds one
 * unambiguous date form and the display can change without a content edit.
 */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * The public document register.
 *
 * Every document is openable by anyone, without an account. That is a
 * deliberate extension of the service's own ethical position: it asks people to
 * trust an automated judgement and shows them the reasoning behind it, so the
 * project holds itself to the same standard and publishes the reasoning behind
 * the project.
 *
 * The content itself is generated into `public/documents/` by
 * `scripts/build-documents.mjs`, which fails the build if a document in the
 * register produced no output. Each row leads to that document's own page,
 * where it is read under the site's header rather than as a download.
 */
export function DocumentsPage() {
  return (
    <ConsoleLayout title="Project documents" subtitle="The requirements, architecture, specification and delivery record, published in full.">
      <header className="-mt-2 flex flex-col items-center pb-1 text-center">
        <span
          aria-hidden="true"
          className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.375rem] bg-violet-500 text-white"
        >
          <FileText className="h-9 w-9" />
        </span>
        <p className="mt-4 max-w-[32rem] text-[0.9375rem] leading-relaxed text-ui-label-2">
          {DOCUMENTS_PAGE.lede}
        </p>
      </header>

      <SettingsGroup
        title={`${DOCUMENTS.length} documents`}
        footer="Every one is open to anyone, without an account. The service asks people to trust an automated judgement and shows its reasoning, so the project publishes its own."
      >
        <SettingsRows>
          {DOCUMENTS.map((document) => (
            <SettingsRow
              key={document.id}
              to={document.href.startsWith("/") && !document.href.endsWith(".pdf") ? document.href : undefined}
              href={document.href.endsWith(".pdf") ? document.href : undefined}
              icon={DOCUMENT_ICONS[document.icon]}
              iconClassName={DOCUMENT_TINTS[document.icon] ?? "bg-slate-500"}
              label={document.title}
              detail={document.navDescription}
              trailing={
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide",
                      STATUS_CLASSES[document.status],
                    )}
                  >
                    {document.status}
                  </span>
                  <span className="text-[0.75rem] tabular-nums text-ui-label-3">
                    {document.format} · v{document.version} · {formatDate(document.date)}
                  </span>
                </span>
              }
            />
          ))}
        </SettingsRows>
      </SettingsGroup>
    </ConsoleLayout>
  );
}
