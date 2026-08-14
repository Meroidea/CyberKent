import { useEffect, useRef, useState } from "react";
import {
  Check,
  ClipboardCopy,
  Download,
  LifeBuoy,
  Megaphone,
  Printer,
  RotateCcw,
  Share2,
} from "lucide-react";
import { ROUTES } from "@/config/site";
import { ActionLink } from "@/components/ui/ActionLink";
import type { Analysis, Submission } from "@/lib/scam/types";
import {
  formatReport,
  formatSubject,
  formatSummary,
  reportFilename,
} from "@/lib/scam/format";
import { cn } from "@/lib/cn";

/** How long a button holds its "done" state before returning to its label. */
const CONFIRM_MS = 2200;

const SECONDARY_BUTTON =
  "interactive inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-700 dark:border-white/10 dark:text-slate-300 dark:hover:border-cyan-400/40 dark:hover:text-cyan-300";

interface ReportActionsProps {
  analysis: Analysis;
  submission: Submission;
  generatedAt: Date;
  /** Offered where there is a form to go back to, i.e. the modal. */
  onCheckAnother?: () => void;
}

/**
 * What a reader can do with a verdict once they have one.
 *
 * The order is deliberate and is not the order of convenience: reporting comes
 * first because it is the only action that helps anyone other than the person
 * reading, and recovery comes second on the bands where money may already have
 * moved. Keeping, sending and copying follow — they are useful, but they are
 * things a reader does for themselves and none of them is urgent.
 */
export function ReportActions({
  analysis,
  submission,
  generatedAt,
  onCheckAnother,
}: ReportActionsProps) {
  const [done, setDone] = useState<"copied" | "downloaded" | "shared" | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const timerRef = useRef(0);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const confirm = (what: "copied" | "downloaded" | "shared") => {
    setFailed(null);
    setDone(what);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setDone(null), CONFIRM_MS);
  };

  const input = { analysis, submission, generatedAt };

  const onDownload = () => {
    /*
     * Plain text rather than PDF. It opens on every device without a reader,
     * it can be attached to a bank's dispute form or pasted into one, and it
     * costs the bundle nothing — a PDF writer is a large dependency to carry
     * for a document that is a page of prose.
     */
    const blob = new Blob([formatReport(input)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = reportFilename(analysis, generatedAt);
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    /* Freed on the next turn, once the download has taken the reference. */
    window.setTimeout(() => URL.revokeObjectURL(url), 0);

    confirm("downloaded");
  };

  const onShare = async () => {
    const text = formatSummary(input);
    const title = formatSubject(analysis);

    /*
     * The Web Share API where the device has it — on a phone that is the sheet
     * with the reader's own messaging apps in it, which is where a warning to a
     * family member actually gets sent from.
     */
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text });
        confirm("shared");
        return;
      } catch (error) {
        /* A dismissed sheet is a choice, not a failure. */
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    /*
     * Otherwise the reader's mail client, with no recipient filled in. Council
     * is not put in the To: field: the service's promise is that nothing goes
     * to Council unless it is reported deliberately, and pre-addressing this
     * would make an email to a relative one mistaken keystroke from breaking
     * that.
     */
    const body = text.length > 1400 ? `${text.slice(0, 1400)}\n\n[…truncated]` : text;
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    confirm("shared");
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatSummary(input));
      confirm("copied");
    } catch {
      setDone(null);
      setFailed("Could not copy — your browser blocked clipboard access.");
    }
  };

  /* Print is offered as the route to a PDF, which is what a bank or an insurer
     tends to ask for. */
  const onPrint = () => window.print();

  /* Only where money moving is a live possibility. On a low or inconclusive
     result it would read as alarm the verdict does not support. */
  const showRecovery = analysis.band === "high" || analysis.band === "medium";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <ActionLink href={ROUTES.reportScam}>
          <Megaphone className="h-4 w-4" aria-hidden="true" />
          Report this to Council
        </ActionLink>

        {showRecovery ? (
          <ActionLink href={ROUTES.recover} variant="secondary">
            <LifeBuoy className="h-4 w-4" aria-hidden="true" />
            If you have already paid
          </ActionLink>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onDownload} className={SECONDARY_BUTTON}>
          {done === "downloaded" ? (
            <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          {done === "downloaded" ? "Saved" : "Download report"}
        </button>

        <button type="button" onClick={onShare} className={SECONDARY_BUTTON}>
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Share or email
        </button>

        <button type="button" onClick={onCopy} className={SECONDARY_BUTTON}>
          {done === "copied" ? (
            <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
          ) : (
            <ClipboardCopy className="h-4 w-4" aria-hidden="true" />
          )}
          {done === "copied" ? "Copied" : "Copy summary"}
        </button>

        <button type="button" onClick={onPrint} className={cn(SECONDARY_BUTTON, "hidden sm:inline-flex")}>
          <Printer className="h-4 w-4" aria-hidden="true" />
          Print or save as PDF
        </button>

        {onCheckAnother ? (
          <button type="button" onClick={onCheckAnother} className={SECONDARY_BUTTON}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Check another
          </button>
        ) : null}
      </div>

      {/* One region for both outcomes, so a screen reader hears the result of
          whichever button was pressed without a second live region racing it. */}
      <p role="status" aria-live="polite" className="min-h-[1.25rem] text-caption">
        {failed ? <span className="text-rose-500">{failed}</span> : null}
        {!failed && done === "downloaded" ? (
          <span className="text-slate-500 dark:text-slate-400">
            Report saved to your downloads. It stays on this device.
          </span>
        ) : null}
        {!failed && done === "copied" ? (
          <span className="text-slate-500 dark:text-slate-400">Summary copied to the clipboard.</span>
        ) : null}
        {!failed && done === "shared" ? (
          <span className="text-slate-500 dark:text-slate-400">Handed to your own app to send.</span>
        ) : null}
      </p>
    </div>
  );
}
