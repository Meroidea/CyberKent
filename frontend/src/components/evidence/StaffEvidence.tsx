import { useState } from "react";
import { Eye, FileText, History, ImageIcon, Loader2, Paperclip, ShieldCheck } from "lucide-react";
import { FormAlert } from "@/components/forms/fields";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { ApiError } from "@/lib/api/client";
import { evidenceApi, formatBytes, openBlob } from "@/lib/evidence/api";
import type { CouncilReport } from "@/lib/council/types";
import { formatDateTime } from "@/lib/report/labels";

const ACTION: Record<string, string> = {
  uploaded: "Uploaded",
  viewed_by_staff: "Opened by staff",
  viewed_by_reporter: "Opened by the reporter",
  removed_by_reporter: "Removed by the reporter",
};

/**
 * FR35, FR36 for officers: open a file (which is logged, and says so before
 * the click) and see everyone who has opened it.
 */
export function StaffEvidence({ report }: { report: CouncilReport }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, { action: string; at: string; by: string }[]>>({});
  const [error, setError] = useState<string | null>(null);

  const open = async (id: string) => {
    setBusy(id);
    setError(null);
    try {
      openBlob(await evidenceApi.staffOpen(report.reference, id));
      if (logs[id]) await showLog(id);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "That file could not be opened.");
    } finally {
      setBusy(null);
    }
  };

  const showLog = async (id: string) => {
    try {
      const { log } = await evidenceApi.staffLog(report.reference, id);
      setLogs((current) => ({ ...current, [id]: log }));
    } catch {
      setError("The access log could not be loaded.");
    }
  };

  return (
    <SettingsGroup
      title={`Evidence (${report.evidence.length})`}
      footer={
        <span className="inline-flex items-start gap-1.5">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Opening a file is recorded against your name. Photos are served with location and camera metadata removed; the original is kept, encrypted, and is never served.
        </span>
      }
    >
      {error ? <FormAlert className="m-3">{error}</FormAlert> : null}
      {report.evidence.length === 0 ? (
        <p className="flex items-center gap-2 px-4 py-3.5 text-[0.9375rem] text-ui-label-2">
          <Paperclip aria-hidden="true" className="h-4 w-4" />
          No files attached.
        </p>
      ) : (
        <ul className="divide-y divide-ui-separator">
          {report.evidence.map((file) => {
            const Icon = file.mimeType.startsWith("image/") ? ImageIcon : FileText;
            return (
              <li key={file.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ui-fill text-ui-label-2">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.9375rem] text-ui-label">{file.originalName}</span>
                    <span className="block text-[0.75rem] text-ui-label-2">
                      {formatBytes(file.sizeBytes)} · {formatDateTime(file.createdAt)}
                      {file.description ? ` · ${file.description}` : ""}
                    </span>
                  </span>
                  <button type="button" onClick={() => void open(file.id)} disabled={busy !== null} className="inline-flex items-center gap-1 rounded-full bg-ui-fill px-3 py-1 text-[0.8125rem] font-semibold text-ui-tint hover:bg-ui-fill-strong disabled:opacity-50">
                    {busy === file.id ? <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : <Eye aria-hidden="true" className="h-3.5 w-3.5" />}
                    Open
                  </button>
                  <button type="button" onClick={() => void showLog(file.id)} className="flex h-8 w-8 items-center justify-center rounded-full text-ui-label-2 hover:bg-ui-fill" aria-label={`Who has opened ${file.originalName}`} title="Access log">
                    <History aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
                {logs[file.id] ? (
                  <ol className="mt-2 ml-11 flex flex-col gap-1 rounded-lg bg-ui-fill px-3 py-2 text-[0.75rem] text-ui-label-2">
                    {logs[file.id]!.map((entry, index) => (
                      <li key={`${entry.at}-${index}`}>
                        {formatDateTime(entry.at)} · {ACTION[entry.action] ?? entry.action} · {entry.by}
                      </li>
                    ))}
                  </ol>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </SettingsGroup>
  );
}
