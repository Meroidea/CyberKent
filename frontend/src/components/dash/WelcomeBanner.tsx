import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The top of a dashboard: who you are, what day it is, and the one sentence
 * that matters, on a slow-moving colour field. Everything below it is detail.
 */
export function WelcomeBanner({
  eyebrow,
  title,
  children,
  avatar,
  actions,
  aside,
  className,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  avatar?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 p-5 text-white shadow-[0_24px_60px_-28px_rgba(79,70,229,0.65)] sm:p-7",
        className,
      )}
    >
      {/* Depth: two drifting orbs, a fine grid fading out to the right, and a
          sheen that crosses now and then. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="ck-aurora absolute -right-16 -top-24 h-72 w-72 rounded-full bg-cyan-300/40 blur-3xl" />
        <div className="ck-aurora absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-fuchsia-400/30 blur-3xl [animation-delay:-8s]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(90deg,transparent,black_55%,transparent)]" />
        <div className="ck-sheen absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {avatar ? (
            <span className="ck-float flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-[1.25rem] font-semibold ring-1 ring-white/30 backdrop-blur-md sm:h-16 sm:w-16">
              {avatar}
            </span>
          ) : null}
          <div className="min-w-0">
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-white/75">{eyebrow}</p>
            <h2 className="mt-1 text-[1.5rem] font-semibold leading-tight tracking-[-0.02em] sm:text-[1.875rem]">{title}</h2>
            {children ? <div className="mt-2 max-w-[36rem] text-[0.9375rem] leading-relaxed text-white/85">{children}</div> : null}
            {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
          </div>
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
    </section>
  );
}

/** A button on the banner: white on colour, or glass for the secondary one. */
export function BannerAction({ children, onClick, primary = false }: { children: ReactNode; onClick?: () => void; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[0.875rem] font-semibold transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0",
        primary ? "bg-white text-indigo-700 shadow-lg shadow-indigo-900/20" : "bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-md hover:bg-white/25",
      )}
    >
      {children}
    </button>
  );
}
