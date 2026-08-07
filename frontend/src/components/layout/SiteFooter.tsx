import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { FOOTER_COLUMNS, LEGAL_LINKS, ROUTES, SITE } from "@/config/site";
import { Wordmark } from "@/components/layout/Wordmark";

const CURRENT_YEAR = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-gray-200/80 bg-white/60 backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-[#0A0A0A]/70">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/4 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 right-1/4 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl"
      />

      <div className="container relative grid gap-10 py-14 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-4">
          <Wordmark />
          <p className="max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {SITE.program} — {SITE.tagline}. Delivered by {SITE.owner} for
            residents, small businesses and community organisations.
          </p>

          <ul className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-cyan-400" aria-hidden="true" />
              {SITE.address}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-indigo-600 dark:text-cyan-400" aria-hidden="true" />
              <a href={`tel:${SITE.supportPhone.replace(/\s/g, "")}`} className="hover:underline">
                {SITE.supportPhone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-indigo-600 dark:text-cyan-400" aria-hidden="true" />
              <a href={`mailto:${SITE.supportEmail}`} className="hover:underline">
                {SITE.supportEmail}
              </a>
            </li>
          </ul>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title} className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{column.title}</h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="group inline-flex w-fit flex-col text-sm text-slate-600 transition-colors duration-200 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-cyan-300"
                  >
                    <span className="inline-flex items-center gap-1">
                      {link.label}
                      <ArrowUpRight
                        className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="h-px w-0 bg-gradient-to-r from-indigo-600 to-cyan-500 transition-all duration-300 group-hover:w-full dark:from-indigo-400 dark:to-cyan-400" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="lg:col-span-4">
          <div className="glass-surface rounded-2xl p-6">
            <h2 className="font-display text-display-3 font-semibold text-slate-900 dark:text-white">
              Think you have been scammed?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Act on the first three steps of the recovery checklist before
              anything else — contact your bank, secure the account, and keep
              the message as evidence.
            </p>
            <a
              href={ROUTES.recover}
              className="interactive mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 dark:from-indigo-500 dark:to-cyan-400 dark:text-slate-950"
            >
              Open the checklist
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <div className="container relative flex flex-col items-center justify-between gap-4 border-t border-gray-200/80 py-6 text-xs text-slate-500 sm:flex-row dark:border-white/10 dark:text-slate-400">
        <p>
          &copy; {CURRENT_YEAR} {SITE.owner}. {SITE.name} is an advisory service and does not
          guarantee protection from scams or cyberattacks.
        </p>

        <div className="flex items-center gap-5">
          <ul className="flex items-center gap-4">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="transition-colors duration-200 hover:text-indigo-700 dark:hover:text-cyan-300">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <p className="flex items-center gap-2">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            All systems operational
          </p>
        </div>
      </div>
    </footer>
  );
}
