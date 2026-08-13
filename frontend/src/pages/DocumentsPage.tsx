import { motion } from "framer-motion";
import { ArrowUpRight, Check, FileText, Info } from "lucide-react";
import { DOCUMENTS, DOCUMENTS_PAGE, type DocumentStatus } from "@/content/documents";
import { ROUTES } from "@/config/site";
import { ActionLink } from "@/components/ui/ActionLink";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";
import { fadeUp, REVEAL_VIEWPORT, staggerParent } from "@/lib/motion";

/**
 * Status colour carries meaning, so it is never the only carrier: the label is
 * always rendered as text beside it (UI-8, WCAG 1.4.1).
 */
const STATUS_CLASSES: Record<DocumentStatus, string> = {
  Published: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  "Awaiting approval": "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  Superseded: "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300",
};

/**
 * Formatted at render rather than stored formatted, so the register holds one
 * unambiguous date form and the display can change without a content edit.
 */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
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
 * register produced no output. Each card leads to that document's own page,
 * where it is read under the site's header and footer.
 */
export function DocumentsPage() {
  return (
    <section className="relative z-10 py-section">
      <div className="container">
        <header className="flex max-w-2xl flex-col items-start gap-4">
          <Pill>
            <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-cyan-400" aria-hidden="true" />
            {DOCUMENTS_PAGE.eyebrow}
          </Pill>
          <h1 className="display-depth text-balance font-display text-display-2 font-bold text-slate-900 dark:text-white">
            {DOCUMENTS_PAGE.title}
          </h1>
          <p className="text-lede text-slate-600 dark:text-slate-400">{DOCUMENTS_PAGE.lede}</p>
        </header>

        <p className="mt-8 flex max-w-2xl items-start gap-3 rounded-xl border border-slate-900/[0.06] bg-slate-900/[0.03] p-4 text-copy leading-relaxed text-slate-600 dark:border-white/10 dark:bg-black/20 dark:text-slate-400">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-cyan-400" aria-hidden="true" />
          {DOCUMENTS_PAGE.note}
        </p>

        {/* The stagger parent sits directly on the list so variants propagate to
            the `motion.li` children, matching the pattern used across the
            landing page. */}
        <motion.ul
          variants={staggerParent()}
          initial="hidden"
          whileInView="visible"
          viewport={REVEAL_VIEWPORT}
          className="mt-section-gap flex flex-col gap-4"
        >
          {DOCUMENTS.map((document) => (
            <motion.li key={document.id} variants={fadeUp}>
              <a
                href={document.href}
                /* Rendered documents open in place — they are pages of this
                   service and carry its header and footer. Only the PDF leaves
                   the site, and `rel` is set because `target="_blank"`
                   otherwise hands the opened file a reference back to here. */
                {...(document.format === "PDF"
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="glass-surface card-lift group flex flex-col gap-4 rounded-2xl p-6 hover:border-indigo-300 dark:hover:border-cyan-400/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="inline-flex items-center gap-2 font-display text-display-3 font-semibold text-slate-900 dark:text-white">
                    {document.title}
                    <ArrowUpRight
                      className="h-4 w-4 shrink-0 -translate-x-1 text-indigo-600 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 dark:text-cyan-400"
                      aria-hidden="true"
                    />
                  </h2>
                  <span
                    className={cn(
                      "shrink-0 rounded-md border px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide",
                      STATUS_CLASSES[document.status],
                    )}
                  >
                    {document.status}
                  </span>
                </div>

                <p className="text-copy leading-relaxed text-slate-600 dark:text-slate-400">
                  {document.summary}
                </p>

                <ul className="flex flex-col gap-1.5">
                  {document.contents.map((entry) => (
                    <li
                      key={entry}
                      className="flex items-start gap-2 text-copy text-slate-600 dark:text-slate-400"
                    >
                      <Check
                        className="mt-1 h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-cyan-400"
                        aria-hidden="true"
                      />
                      {entry}
                    </li>
                  ))}
                </ul>

                <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-caption text-slate-500 dark:text-slate-400">
                  {document.reference ? (
                    <div className="flex items-center gap-1.5">
                      <dt className="uppercase tracking-[0.14em]">Ref</dt>
                      <dd>{document.reference}</dd>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1.5">
                    <dt className="uppercase tracking-[0.14em]">Version</dt>
                    <dd>{document.version}</dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <dt className="uppercase tracking-[0.14em]">Issued</dt>
                    <dd>
                      <time dateTime={document.date}>{formatDate(document.date)}</time>
                    </dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <dt className="uppercase tracking-[0.14em]">Format</dt>
                    <dd>{document.format}</dd>
                  </div>
                </dl>
              </a>
            </motion.li>
          ))}
        </motion.ul>

        <div className="mt-section-gap flex flex-col gap-3 sm:flex-row">
          <ActionLink href={ROUTES.checkMessage}>Check a message</ActionLink>
          <ActionLink href={ROUTES.home} variant="secondary">
            Back to the home page
          </ActionLink>
        </div>
      </div>
    </section>
  );
}
