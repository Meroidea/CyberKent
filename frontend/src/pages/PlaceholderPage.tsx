import { Construction } from "lucide-react";
import { ROUTES } from "@/config/site";
import { ActionLink } from "@/components/ui/ActionLink";
import { Pill } from "@/components/ui/Pill";

interface PlaceholderPageProps {
  title: string;
  /** What this page will do, in the present tense, so the promise is concrete. */
  summary: string;
  /** The requirement modules this page will implement, for traceability. */
  requirements: string;
}

/**
 * Stands in for a module that is designed but not yet built.
 *
 * Avoid.md §14 forbids exposing unfinished features, and the site links to
 * these paths from its navigation and its primary calls to action. A hard 404
 * is the worst of the options — it reads as a broken site rather than an
 * unfinished one. Saying plainly that the module is in development keeps the
 * navigation honest and tells the reader what to do in the meantime.
 */
export function PlaceholderPage({ title, summary, requirements }: PlaceholderPageProps) {
  return (
    <section className="relative z-10 flex min-h-[70svh] items-center py-section">
      <div className="container flex max-w-2xl flex-col items-start gap-6">
        <Pill>
          <Construction className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
          In development
        </Pill>

        <h1 className="display-depth text-balance font-display text-display-2 font-bold text-slate-900 dark:text-white">
          {title}
        </h1>

        <p className="text-lede text-slate-600 dark:text-slate-400">{summary}</p>

        <p className="text-copy text-slate-500 dark:text-slate-400">
          This module is specified and its database tables exist, but the screens
          are not finished. It is listed here rather than hidden so the service
          is honest about what it can and cannot do today.{" "}
          <span className="font-mono text-caption">{requirements}</span>
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <ActionLink href={ROUTES.checkMessage}>Check a message instead</ActionLink>
          <ActionLink href={ROUTES.home} variant="secondary">
            Back to the home page
          </ActionLink>
        </div>
      </div>
    </section>
  );
}
