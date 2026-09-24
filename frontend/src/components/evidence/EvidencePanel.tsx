import { useEffect, useRef, useState } from "react";
import { FileText, ImageIcon, Loader2, Paperclip, ShieldCheck, Trash2, Upload } from "lucide-react";
import { FormAlert } from "@/components/forms/fields";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { ApiError } from "@/lib/api/client";
import { evidenceApi, formatBytes, openBlob, type EvidenceFile, type EvidenceLimits } from "@/lib/evidence/api";
import { cn } from "@/lib/cn";

/**
 * FR31–FR34 — the reporter attaching screenshots, photos, PDFs or exported
 * text to their report, and seeing what they have attached.
 *
 * Checked in the browser as a courtesy (size, count, type) and properly by
 * the API, which reads the file's type from its bytes. Photos lose their
 * location and camera data before any officer opens them.
 */
export function EvidencePanel({ reference, canAdd, canRemove }: { reference: string; canAdd: boolean; canRemove: boolean }) {
  const [limits, setLimits] = useState<EvidenceLimits | null>(null);
  const [files, setFiles] = useState<EvidenceFile[] | null>(null);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    evidenceApi.limits().then(setLimits).catch(() => undefined);
    evidenceApi
      .list(reference, controller.signal)
      .then(({ evidence }) => setFiles(evidence))
      .catch(() => setFiles([]));
    return () => controller.abort();
  }, [reference]);

  const upload = async (picked: FileList | null) => {
    if (!picked?.length || !limits) return;
    setMessage(null);
    let added = 0;

    for (const file of Array.from(picked)) {
      if ((files?.length ?? 0) + added >= limits.maxFiles) {
        setMessage({ tone: "error", text: `A report can have up to ${limits.maxFiles} files.` });
        break;
      }
      if (file.size > limits.maxBytes) {
        setMessage({ tone: "error", text: `${file.name} is ${formatBytes(file.size)}. Files can be up to ${formatBytes(limits.maxBytes)} — a screenshot is usually well under.` });
        continue;
      }
      setUploading(file.name);
      try {
        const { file: saved } = await evidenceApi.upload(reference, file, description.trim() || undefined);
        setFiles((current) => [...(current ?? []), saved]);
        added += 1;
      } catch (caught) {
        setMessage({ tone: "error", text: `${file.name}: ${caught instanceof ApiError ? caught.message : "could not be attached."}` });
      }
    }

    setUploading(null);
    if (added) {
      setDescription("");
      setMessage({ tone: "success", text: `${added} file${added === 1 ? "" : "s"} attached. Only you and Council's CyberSafe officers can open ${added === 1 ? "it" : "them"}.` });
    }
    if (input.current) input.current.value = "";
  };

  const remove = async (file: EvidenceFile) => {
    setRemoving(file.id);
    try {
      setFiles((await evidenceApi.remove(reference, file.id)).evidence);
    } catch (caught) {
      setMessage({ tone: "error", text: caught instanceof ApiError ? caught.message : "That file could not be removed." });
    } finally {
      setRemoving(null);
    }
  };

  const open = (file: EvidenceFile) =>
    evidenceApi
      .open(reference, file.id)
      .then(openBlob)
      .catch(() => setMessage({ tone: "error", text: "That file could not be opened." }));

  const accept = limits?.accepted.flatMap((kind) => [kind.mime, ...kind.extensions.map((ext) => `.${ext}`)]).join(",");
  const busy = uploading !== null || removing !== null;

  return (
    <SettingsGroup
      title="Evidence"
      footer={
        <span className="inline-flex items-start gap-1.5">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Stored encrypted. Only you and Council's CyberSafe officers can open these, and every time anyone does, it is logged. Location and camera details are removed from photos.
        </span>
      }
    >
      {files === null ? (
        <div className="m-4 h-10 animate-pulse rounded-lg bg-ui-fill" />
      ) : files.length ? (
        <ul className="divide-y divide-ui-separator">
          {files.map((file) => {
            const Icon = file.mimeType.startsWith("image/") ? ImageIcon : FileText;
            return (
              <li key={file.id} className="flex items-center gap-3 px-4 py-3">
                <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ui-fill text-ui-label-2">
                  <Icon className="h-4 w-4" />
                </span>
                <button type="button" onClick={() => void open(file)} className="min-w-0 flex-1 text-left hover:opacity-80">
                  <span className="block truncate text-[0.9375rem] text-ui-label">{file.originalName}</span>
                  <span className="block text-[0.75rem] text-ui-label-2">
                    {formatBytes(file.sizeBytes)}
                    {file.description ? ` · ${file.description}` : ""}
                  </span>
                </button>
                {canRemove ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void remove(file)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-ui-label-3 hover:bg-ui-fill hover:text-rose-500 disabled:opacity-40"
                    aria-label={`Remove ${file.originalName}`}
                  >
                    {removing === file.id ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Trash2 aria-hidden="true" className="h-4 w-4" />}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="flex items-center gap-2 px-4 pt-3.5 text-[0.9375rem] text-ui-label-2">
          <Paperclip aria-hidden="true" className="h-4 w-4" />
          No files attached yet.
        </p>
      )}

      {canAdd ? (
        limits && !limits.available ? (
          <p className="px-4 py-3.5 text-[0.875rem] text-ui-label-2">Attaching files is not switched on for this site yet. Keep screenshots and receipts safe — an officer may ask for them.</p>
        ) : (
          <div className="flex flex-col gap-3 px-4 py-3.5">
            <label className="block">
              <span className="text-[0.8125rem] font-medium text-ui-label-2">What is it? (optional)</span>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={500}
                placeholder="For example: screenshot of the text message"
                className="mt-1 block w-full rounded-[0.625rem] bg-ui-fill px-3 py-2 text-[0.9375rem] text-ui-label placeholder:text-ui-label-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-tint"
              />
            </label>
            <input ref={input} type="file" multiple accept={accept} onChange={(event) => void upload(event.target.files)} className="sr-only" id={`evidence-${reference}`} />
            <label
              htmlFor={`evidence-${reference}`}
              className={cn(
                "flex cursor-pointer items-center justify-center gap-2 rounded-ui border-2 border-dashed border-ui-separator px-4 py-4 text-[0.9375rem] font-medium text-ui-tint transition-colors hover:bg-ui-fill",
                busy && "pointer-events-none opacity-60",
              )}
            >
              {uploading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Upload aria-hidden="true" className="h-4 w-4" />}
              {uploading ? `Attaching ${uploading}…` : "Attach screenshots, photos or documents"}
            </label>
            {limits ? (
              <p className="text-[0.75rem] text-ui-label-3">
                {limits.accepted.map((kind) => kind.label).join(", ")} · up to {formatBytes(limits.maxBytes)} each · {limits.maxFiles} per report
              </p>
            ) : null}
          </div>
        )
      ) : null}

      {message ? <FormAlert tone={message.tone} className="mx-4 mb-4">{message.text}</FormAlert> : null}
    </SettingsGroup>
  );
}
