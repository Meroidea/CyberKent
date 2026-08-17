import { motion } from "framer-motion";
import { Calendar, Check, Clock, FileText, Hash } from "lucide-react";
import { SITE } from "@/config/site";
import type { DocumentStatus, ProjectDocument } from "@/content/documents";
import { cn } from "@/lib/cn";

interface DocumentFrontMatterProps {
  document: ProjectDocument;
  subtitle: string;
  minutes: number;
}

/**
 * Status colour carries meaning, so it is never the only carrier: the label is
 * always rendered as text beside it (UI-8, WCAG 1.4.1).
 */
const STATUS_CLASSES: Record<DocumentStatus, string> = {
  Published: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  "Awaiting approval": "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  Superseded: "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300",
};

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * A document's front matter, set as a paper's rather than an article's.
 *
 * Centred, with the issuing body, the version and the deliverable reference on
 * a rule of their own, because these are project records: a reader arriving at
 * one needs to know what it is, whose it is, and whether it is still current
 * before they need to know what it says.
 */
export function DocumentFrontMatter({ document: doc, subtitle, minutes }: DocumentFrontMatterProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-12 text-center"
    >
      <span
        className={cn(
          "inline-flex rounded-full border px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-wider",
          STATUS_CLASSES[doc.status],
        )}
      >
        {doc.status}
      </span>

      <p className="mt-5 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
        CyberKent · Project documentation
      </p>

      <h1 className="display-depth mx-auto mt-3 max-w-2xl text-balance font-display text-display-2 font-bold text-slate-900 dark:text-white">
        {doc.title}
      </h1>

      <p className="mx-auto mt-4 max-w-xl text-lede text-slate-600 dark:text-slate-400">{subtitle}</p>

      <div className="mt-7 flex items-center justify-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 text-[0.6875rem] font-bold text-white"
        >
          CK
        </span>
        <span className="text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-slate-900 dark:text-white">
          Group CyberKent
        </span>
      </div>

      <p className="mt-2 text-caption text-slate-400 dark:text-slate-500">
        Prepared for {SITE.owner} — {SITE.program}
      </p>

      <dl className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-y border-slate-900/[0.08] py-4 text-caption text-slate-500 dark:border-white/10 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
          <dt className="sr-only">Issued</dt>
          <dd>
            Issued <time dateTime={doc.date}>{formatDate(doc.date)}</time>
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
          <dt className="sr-only">Reading time</dt>
          <dd>{minutes} min read</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
          <dt className="sr-only">Version</dt>
          <dd>Version {doc.version}</dd>
        </div>
        {doc.reference ? (
          <div className="flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
            <dt className="sr-only">Deliverable</dt>
            <dd>Deliverable {doc.reference}</dd>
          </div>
        ) : null}
      </dl>

      <section
        aria-labelledby="abstract"
        className="glass-surface mt-10 rounded-2xl p-6 text-left shadow-sm md:p-8"
      >
        <h2
          id="abstract"
          className="scroll-mt-28 text-center font-display text-sm font-bold uppercase tracking-[0.25em] text-slate-900 dark:text-white"
        >
          Abstract
        </h2>
        <p className="mt-4 text-[0.9375rem] leading-[1.85] text-slate-600 dark:text-slate-300">
          {doc.summary}
        </p>

        <div className="my-5 h-px bg-slate-900/[0.08] dark:bg-white/10" />

        <p className="mb-3 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
          In this document
        </p>
        <ul className="flex flex-col gap-2">
          {doc.contents.map((entry) => (
            <li
              key={entry}
              className="flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-slate-600 dark:text-slate-400"
            >
              <Check
                className="mt-1 h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-cyan-400"
                aria-hidden="true"
              />
              {entry}
            </li>
          ))}
        </ul>
      </section>
    </motion.header>
  );
}
