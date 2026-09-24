import { useState } from "react";
import { DatabaseZap, Loader2 } from "lucide-react";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import { apiRequest, ApiError } from "@/lib/api/client";
import type { Analysis } from "@/lib/scam/types";
import { formatDate } from "@/lib/report/labels";
import { cn } from "@/lib/cn";

type Item = { type: "URL" | "PHONE" | "EMAIL"; value: string };
type Result = Item & { matchedOn: "exact" | "domain" | null; reportCount: number; status: "UNVERIFIED" | "VERIFIED" | "DISPUTED" | "REJECTED" | null; lastReportedAt: string | null };

/* ER-13 — what each status means, said without accusing anyone. */
function verdict(result: Result): { text: string; tone: string } {
  if (!result.status || result.reportCount === 0) return { text: "Not reported to Council", tone: "text-ui-label-2" };
  const times = result.reportCount === 1 ? "once" : `${result.reportCount} times`;
  const where = result.matchedOn === "domain" ? " (this website)" : "";
  switch (result.status) {
    case "VERIFIED":
      return { text: `Confirmed as a scam by Council · reported ${times}${where}`, tone: "text-rose-600 dark:text-rose-300" };
    case "DISPUTED":
      return { text: `Reported ${times}${where}, but someone says it is theirs and was spoofed`, tone: "text-amber-600 dark:text-amber-300" };
    case "REJECTED":
      return { text: `Reported ${times}${where}, but Council found it is not used in scams`, tone: "text-emerald-600 dark:text-emerald-300" };
    default:
      return { text: `Reported to Council ${times}${where} · not yet confirmed by an officer`, tone: "text-amber-600 dark:text-amber-300" };
  }
}

/**
 * FR24 — matching what the message contains against what Hume has reported.
 *
 * Opt-in, and says exactly what it sends. The check itself ran on the device
 * and that promise stands: only the links, numbers and addresses go, only
 * when asked, and never the message around them.
 */
export function ReportedBefore({ analysis }: { analysis: Analysis }) {
  const items: Item[] = [
    ...analysis.links.map((link) => ({ type: "URL" as const, value: link.href })),
    ...analysis.extracted.phones.map((value) => ({ type: "PHONE" as const, value })),
    ...analysis.extracted.emails.map((value) => ({ type: "EMAIL" as const, value })),
  ].slice(0, 20);
  const [results, setResults] = useState<Result[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) return null;

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      setResults((await apiRequest<{ results: Result[] }>("/api/indicators/lookup", { method: "POST", body: { items } })).results);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Council's records could not be reached.");
    } finally {
      setBusy(false);
    }
  };

  const reported = results?.filter((result) => result.reportCount > 0).length ?? 0;

  return (
    <SettingsGroup
      title="Reported to Council before?"
      footer={
        results
          ? "A count is not proof. Scammers borrow real people's numbers and addresses, so only Council's confirmation means a detail is known to be used in scams."
          : `Sends only the ${items.length} link${items.length === 1 ? "" : "s"}, number${items.length === 1 ? "" : "s"} or address${items.length === 1 ? "" : "es"} found above — not your message — and nothing is kept.`
      }
    >
      {!results ? (
        <SettingsRow
          icon={busy ? Loader2 : DatabaseZap}
          iconClassName={cn("bg-violet-500", busy && "[&>svg]:animate-spin")}
          label="Check these details against Hume's reports"
          detail={error ?? "See whether other residents have reported them, and whether Council has confirmed them."}
          onClick={busy ? undefined : run}
          chevron
        />
      ) : (
        <>
          <p className="px-4 pt-3 text-[0.9375rem] font-medium text-ui-label">
            {reported ? `${reported} of ${results.length} ${results.length === 1 ? "has" : "have"} been reported to Council.` : "None of these has been reported to Council."}
          </p>
          <SettingsRows>
            {results.map((result) => {
              const said = verdict(result);
              return (
                <SettingsRow
                  key={`${result.type}:${result.value}`}
                  label={<span className="break-all font-mono text-[0.875rem]">{result.value}</span>}
                  detail={
                    <span className={said.tone}>
                      {said.text}
                      {result.lastReportedAt && result.reportCount > 0 ? <span className="text-ui-label-3"> · last {formatDate(result.lastReportedAt)}</span> : null}
                    </span>
                  }
                />
              );
            })}
          </SettingsRows>
        </>
      )}
    </SettingsGroup>
  );
}
