import { Link } from "react-router-dom";
import { Archive, MapPin } from "lucide-react";
import { SeverityBadge } from "@/components/council/Badges";
import { ROUTES } from "@/config/site";
import type { PublicAlert } from "@/lib/alerts/types";
import { CHANNEL_LABEL, formatDate } from "@/lib/report/labels";
import { cn } from "@/lib/cn";

/**
 * One community alert, in the console's card language.
 *
 * The specimen is set apart as quoted evidence — monospace, in a well — so no
 * one mistakes the scam's words for Council's. It is the part a resident
 * recognises on their own phone, which is why it sits above the advice.
 */
export function AlertCard({ alert, full = false, className }: { alert: PublicAlert; full?: boolean; className?: string }) {
  const body = (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <SeverityBadge severity={alert.severity} />
        <span className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-ui-tint">{alert.category?.name ?? "Scam alert"}</span>
        {alert.archived ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-ui-fill px-2 py-0.5 text-[0.6875rem] font-medium text-ui-label-2">
            <Archive aria-hidden="true" className="h-3 w-3" />
            Archived
          </span>
        ) : null}
        <span className="ml-auto font-mono text-[0.6875rem] text-ui-label-3">{alert.reference}</span>
      </div>

      <h3 className={cn("mt-2 font-semibold leading-snug text-ui-label", full ? "text-[1.25rem]" : "text-[1.0625rem]")}>{alert.headline}</h3>

      {alert.specimen ? (
        <blockquote className="mt-3 rounded-lg border-l-4 border-amber-500 bg-ui-fill px-3 py-2.5">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ui-label-3">What the scam says</p>
          <p className={cn("mt-1 whitespace-pre-wrap break-words font-mono text-[0.8125rem] leading-relaxed text-ui-label", !full && "line-clamp-4")}>{alert.specimen}</p>
        </blockquote>
      ) : null}

      <p className={cn("mt-3 text-[0.9375rem] leading-relaxed text-ui-label-2", !full && "line-clamp-3")}>{alert.summary}</p>

      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-ui-label-3">
        <span>{CHANNEL_LABEL[alert.channel]}</span>
        {alert.suburb ? (
          <span className="inline-flex items-center gap-1">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
            {alert.suburb.name}
          </span>
        ) : (
          <span>Across Hume</span>
        )}
        {alert.publishedAt ? <span>Published {formatDate(alert.publishedAt)}</span> : null}
      </p>
    </>
  );

  if (full) {
    return <article className={cn("rounded-ui bg-ui-card p-5", className)}>{body}</article>;
  }

  return (
    <Link to={`${ROUTES.alerts}/${alert.reference}`} className={cn("block rounded-ui bg-ui-card p-4 transition-colors hover:bg-ui-card-hover", className)}>
      {body}
    </Link>
  );
}
