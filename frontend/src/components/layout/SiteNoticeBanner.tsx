import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertOctagon, AlertTriangle, Info, X } from "lucide-react";
import { publicContentApi } from "@/lib/admin/api";
import type { NoticeTone, PublicNotice } from "@/lib/admin/types";
import { cn } from "@/lib/cn";

const TONE: Record<NoticeTone, { icon: typeof Info; bar: string; label: string }> = {
  INFO: { icon: Info, bar: "bg-sky-600 text-white", label: "Notice" },
  WARNING: { icon: AlertTriangle, bar: "bg-amber-400 text-slate-950", label: "Warning" },
  CRITICAL: { icon: AlertOctagon, bar: "bg-rose-600 text-white", label: "Urgent warning" },
};

const DISMISSED = "ck.notices.dismissed";

function dismissed(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(DISMISSED) ?? "[]") as string[];
  } catch {
    return [];
  }
}

/**
 * Council's site-wide notice — "fake toll texts are circulating today" —
 * across the foot of every page, most urgent first. Set from the admin panel's
 * Content screen; a dismissed notice stays dismissed on this device. Fixed to
 * the bottom rather than pushed under the header, so no page's own spacing is
 * disturbed and the warning is never scrolled away.
 */
export function SiteNoticeBanner() {
  const [notices, setNotices] = useState<PublicNotice[]>([]);
  const [hidden, setHidden] = useState<string[]>(() => dismissed());

  useEffect(() => {
    const controller = new AbortController();
    publicContentApi.notices(controller.signal).then(({ notices: live }) => setNotices(live)).catch(() => undefined);
    return () => controller.abort();
  }, []);

  const notice = notices.find((n) => !hidden.includes(n.id));
  const bar = useRef<HTMLElement>(null);

  // Reserve room at the foot of the page while a notice shows, so the fixed
  // bar never sits over the last lines of a page or a form's buttons.
  useEffect(() => {
    const el = bar.current;
    if (!notice || !el) return;
    const body = document.body;
    const before = body.style.paddingBottom;
    const fit = () => { body.style.paddingBottom = `${el.offsetHeight}px`; };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => { observer.disconnect(); body.style.paddingBottom = before; };
  }, [notice]);

  if (!notice) return null;
  const T = TONE[notice.tone];

  const dismiss = () => {
    const next = [...hidden, notice.id].slice(-20);
    setHidden(next);
    try {
      window.localStorage.setItem(DISMISSED, JSON.stringify(next));
    } catch {
      /* Dismissed for this visit only. */
    }
  };

  const external = notice.linkUrl?.startsWith("https://");

  return (
    <aside
      ref={bar}
      role={notice.tone === "CRITICAL" ? "alert" : "status"}
      aria-label={T.label}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[55] flex justify-center px-3 pb-3 sm:px-6 sm:pb-5"
    >
      <div className={cn("pointer-events-auto flex w-full max-w-[52rem] items-start gap-3 rounded-2xl px-4 py-3 shadow-2xl shadow-black/25", T.bar)}>
        <T.icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-[0.9375rem] leading-snug">
          <span className="font-semibold">{notice.title}</span>
          {notice.body ? <span> {notice.body}</span> : null}
          {notice.linkUrl ? (
            external ? (
              <a href={notice.linkUrl} target="_blank" rel="noopener noreferrer" className="ml-1.5 font-semibold underline underline-offset-2">{notice.linkLabel || "Read more"}</a>
            ) : (
              <Link to={notice.linkUrl} className="ml-1.5 font-semibold underline underline-offset-2">{notice.linkLabel || "Read more"}</Link>
            )
          ) : null}
        </p>
        <button type="button" onClick={dismiss} aria-label="Dismiss this notice" className="-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-black/10">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
