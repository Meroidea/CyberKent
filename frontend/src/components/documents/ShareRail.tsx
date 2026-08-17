import { type ReactNode, useEffect, useRef, useState } from "react";
import { Check, Layers, Link2, Mail, Printer, Share2, ShieldCheck } from "lucide-react";
import { ROUTES } from "@/config/site";
import type { ProjectDocument } from "@/content/documents";
import { cn } from "@/lib/cn";

interface ShareRailProps {
  document: ProjectDocument;
  others: ProjectDocument[];
}

function RailCard({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="glass-surface rounded-2xl p-4">
      <p className="mb-3 flex items-center gap-1.5 font-mono text-[0.625rem] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
        {icon}
        {label}
      </p>
      {children}
    </div>
  );
}

const ACTION =
  "flex w-full items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-2 text-left text-[0.78125rem] font-semibold text-slate-600 transition-colors duration-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-white/10 dark:text-slate-300 dark:hover:border-cyan-400/40 dark:hover:bg-white/5 dark:hover:text-cyan-300";

/**
 * The right rail: what a reader does with a document once they have it.
 *
 * The share URL is read at click time rather than at render. There is no
 * canonical address to bake in — only whichever one the reader actually has —
 * and reading it during render would be reading `window` from a place that has
 * no business assuming one.
 */
export function ShareRail({ document: doc, others }: ShareRailProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = () => {
    if (!navigator.clipboard) {
      return;
    }

    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), 2000);
      })
      /* Clipboard access can be blocked by policy; the button simply does
         nothing rather than reporting a success that did not happen. */
      .catch(() => undefined);
  };

  return (
    <div className="flex flex-col gap-4">
      <RailCard label="Share" icon={<Share2 className="h-3.5 w-3.5" aria-hidden="true" />}>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={copy}
            className={cn(
              ACTION,
              copied &&
                "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
            )}
          >
            {copied ? (
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <Link2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            {copied ? "Link copied" : "Copy link"}
          </button>

          <button type="button" onClick={() => window.print()} className={ACTION}>
            <Printer className="h-4 w-4 shrink-0" aria-hidden="true" />
            Print or save as PDF
          </button>

          <a
            href={`mailto:?subject=${encodeURIComponent(`${doc.title} — CyberKent project documentation`)}`}
            className={ACTION}
          >
            <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
            Send by email
          </a>
        </div>
      </RailCard>

      <RailCard label="Other documents" icon={<Layers className="h-3.5 w-3.5" aria-hidden="true" />}>
        <div className="flex flex-col">
          {others.map((other) => (
            <a
              key={other.id}
              href={other.href}
              {...(other.format === "PDF" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group rounded-lg px-1.5 py-2 transition-colors duration-200 hover:bg-indigo-50 dark:hover:bg-white/5"
            >
              <span className="block text-[0.8125rem] font-semibold leading-snug text-slate-900 transition-colors duration-200 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-cyan-300">
                {other.title}
              </span>
              <span className="mt-0.5 block font-mono text-[0.625rem] text-slate-400 dark:text-slate-500">
                {other.format} · Version {other.version}
              </span>
            </a>
          ))}
        </div>
      </RailCard>

      {/* The one saturated element on the page, and the only thing on it
          asking for anything: everything else here is the document. */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 p-4 text-white">
        <p className="mb-2 flex items-center gap-1.5 font-mono text-[0.625rem] font-bold uppercase tracking-[0.18em] text-white/75">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Use the service
        </p>
        <p className="text-[0.9375rem] font-bold leading-snug">Check a message for scam signals</p>
        <p className="mt-1.5 text-xs leading-relaxed text-white/85">
          Paste a text, link, email or phone number and get a risk read with the reasons behind it.
          No account needed.
        </p>
        <a
          href={ROUTES.checkMessage}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[0.78125rem] font-bold text-indigo-700 transition-transform duration-200 hover:scale-[1.03]"
        >
          Open the scam checker
        </a>
      </div>
    </div>
  );
}
