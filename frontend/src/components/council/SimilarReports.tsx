import { Link } from "react-router-dom";
import { Copy, GitMerge, Link2, Loader2, Unlink } from "lucide-react";
import { OfficerStatus } from "@/components/council/Badges";
import { useLoad } from "@/components/council/useLoad";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { ROUTES } from "@/config/site";
import { councilApi } from "@/lib/council/api";
import type { CouncilReport } from "@/lib/council/types";
import { formatDate } from "@/lib/report/labels";
import { cn } from "@/lib/cn";

/**
 * FR43–FR48 in the report workspace: what else looks like this report, why,
 * and the officer's call on each. Suggestions are recomputed whenever the
 * report changes; nothing is ever merged, only linked.
 */
export function SimilarReports({
  report,
  busy,
  onLink,
  onUnlink,
}: {
  report: CouncilReport;
  busy: boolean;
  onLink: (target: string, kind: "DUPLICATE" | "RELATED") => void;
  onUnlink: (target: string) => void;
}) {
  const { data, loading } = useLoad((signal) => councilApi.similar(report.reference, signal), `${report.reference}|${report.links.length}|${report.links.map((l) => l.kind).join()}`);
  const suggestions = data?.candidates.filter((candidate) => !candidate.linked) ?? [];

  const button = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.75rem] font-semibold transition-colors disabled:opacity-40";

  return (
    <>
      {report.links.length > 0 ? (
        <SettingsGroup title={`Linked reports (${report.links.length})`} footer="Linked by an officer. Duplicates are the same report made twice; related reports describe the same campaign.">
          <ul className="divide-y divide-ui-separator">
            {report.links.map((link) => (
              <li key={link.reference} className="flex items-center gap-3 px-4 py-3">
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.4375rem] text-white", link.kind === "DUPLICATE" ? "bg-violet-500" : "bg-sky-500")} aria-hidden="true">
                  {link.kind === "DUPLICATE" ? <Copy className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                </span>
                <Link to={`${ROUTES.councilReport}/${link.reference}`} className="min-w-0 flex-1 hover:opacity-80">
                  <span className="block truncate text-[0.9375rem] text-ui-label">{link.title}</span>
                  <span className="block text-[0.75rem] text-ui-label-2">
                    <span className="font-mono">{link.reference}</span> · {link.kind === "DUPLICATE" ? "Duplicate" : "Related"}
                  </span>
                </Link>
                <OfficerStatus status={link.status} />
                <button type="button" disabled={busy} onClick={() => onUnlink(link.reference)} className={cn(button, "text-ui-label-2 hover:bg-ui-fill")} aria-label={`Unlink ${link.reference}`}>
                  <Unlink aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </SettingsGroup>
      ) : null}

      <SettingsGroup
        title="Possible duplicates and related reports"
        footer={data ? `Compared with ${data.compared} report${data.compared === 1 ? "" : "s"} from the ${data.windowDays} days around this one, by wording, shared phone numbers, emails and websites (including ones only mentioned in the text), and reporter.` : undefined}
      >
        {loading && !data ? (
          <p className="flex items-center gap-2 px-4 py-3.5 text-[0.9375rem] text-ui-label-2">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            Comparing with other reports…
          </p>
        ) : suggestions.length === 0 ? (
          <p className="px-4 py-3.5 text-[0.9375rem] text-ui-label-2">Nothing else looks like this report.</p>
        ) : (
          <ul className="divide-y divide-ui-separator">
            {suggestions.map((candidate) => (
              <li key={candidate.reference} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <Link to={`${ROUTES.councilReport}/${candidate.reference}`} className="block text-[0.9375rem] text-ui-label hover:opacity-80">
                    {candidate.title}
                  </Link>
                  <p className="mt-0.5 text-[0.75rem] text-ui-label-2">
                    <span className="font-mono">{candidate.reference}</span> · {formatDate(candidate.submittedAt)} · match {Math.round(candidate.score * 100)}%
                    {candidate.suggestion === "DUPLICATE" ? <span className="ml-1.5 font-semibold text-violet-600 dark:text-violet-300">· looks like a duplicate</span> : null}
                  </p>
                  <p className="mt-1.5 flex flex-wrap gap-1">
                    {candidate.reasons.map((reason) => (
                      <span key={reason} className="break-all rounded-md bg-ui-fill px-1.5 py-0.5 text-[0.6875rem] font-medium text-ui-label-2">{reason}</span>
                    ))}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button type="button" disabled={busy} onClick={() => onLink(candidate.reference, "DUPLICATE")} className={cn(button, "bg-violet-500/15 text-violet-700 hover:bg-violet-500/25 dark:text-violet-300")}>
                    <GitMerge aria-hidden="true" className="h-3.5 w-3.5" />
                    Duplicate
                  </button>
                  <button type="button" disabled={busy} onClick={() => onLink(candidate.reference, "RELATED")} className={cn(button, "bg-sky-500/15 text-sky-700 hover:bg-sky-500/25 dark:text-sky-300")}>
                    <Link2 aria-hidden="true" className="h-3.5 w-3.5" />
                    Related
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SettingsGroup>
    </>
  );
}
