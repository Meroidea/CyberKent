import { Link } from "react-router-dom";
import { ArrowLeft, SearchX } from "lucide-react";
import { ROUTES } from "@/config/site";
import { ActionLink } from "@/components/ui/ActionLink";

/**
 * Genuine 404.
 *
 * The host rewrites every unmatched path to index.html so the router can own
 * routing, which means this component is the only thing standing between a
 * mistyped address and the landing page being served under it. Without it the
 * site would answer 200 for pages that do not exist.
 */
export function NotFoundPage() {
  return (
    <section className="relative z-10 flex min-h-[70svh] items-center py-section">
      <div className="container flex max-w-xl flex-col items-start gap-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white/70 text-indigo-600 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-cyan-400">
          <SearchX className="h-5 w-5" aria-hidden="true" />
        </span>

        <div>
          <p className="font-mono text-caption font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-cyan-400">
            Error 404
          </p>
          <h1 className="display-depth mt-2 text-balance font-display text-display-2 font-bold text-slate-900 dark:text-white">
            We could not find that page.
          </h1>
        </div>

        <p className="text-lede text-slate-600 dark:text-slate-400">
          The address may have changed, or it may never have existed. Nothing you
          submitted has been lost — checks and reports are unaffected by this.
        </p>

        <ActionLink href={ROUTES.home}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to the home page
        </ActionLink>

        <p className="text-copy text-slate-500 dark:text-slate-400">
          Looking for something specific? Try the{" "}
          <Link
            to={ROUTES.checkMessage}
            className="font-medium text-indigo-600 underline underline-offset-4 dark:text-cyan-400"
          >
            scam checker
          </Link>{" "}
          or{" "}
          <Link
            to={ROUTES.alerts}
            className="font-medium text-indigo-600 underline underline-offset-4 dark:text-cyan-400"
          >
            community alerts
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
