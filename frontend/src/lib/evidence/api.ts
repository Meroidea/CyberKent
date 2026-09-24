import { apiBlob, apiRequest, apiUpload } from "@/lib/api/client";

export interface EvidenceFile {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  description: string | null;
  metadataStripped: boolean;
  createdAt: string;
}

export interface EvidenceLimits {
  available: boolean;
  maxBytes: number;
  maxFiles: number;
  accepted: { mime: string; extensions: string[]; label: string }[];
}

let limitsCache: Promise<EvidenceLimits> | null = null;

const base = (reference: string) => `/api/reports/${encodeURIComponent(reference)}/evidence`;

/** FR31–FR36. The reporter's calls, then Council's. */
export const evidenceApi = {
  limits() {
    limitsCache ??= apiRequest<EvidenceLimits>("/api/reports/evidence/limits").catch((error: unknown) => {
      limitsCache = null;
      throw error;
    });
    return limitsCache;
  },
  list(reference: string, signal?: AbortSignal) {
    return apiRequest<{ evidence: EvidenceFile[] }>(base(reference), { signal });
  },
  upload(reference: string, file: File, description?: string) {
    return apiUpload<{ file: EvidenceFile }>(base(reference), file, {
      "X-File-Name": encodeURIComponent(file.name),
      ...(description ? { "X-Description": encodeURIComponent(description) } : {}),
    });
  },
  remove(reference: string, id: string) {
    return apiRequest<{ evidence: EvidenceFile[] }>(`${base(reference)}/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
  open(reference: string, id: string) {
    return apiBlob(`${base(reference)}/${encodeURIComponent(id)}`);
  },
  staffOpen(reference: string, id: string) {
    return apiBlob(`/api/council/reports/${encodeURIComponent(reference)}/evidence/${encodeURIComponent(id)}`);
  },
  staffLog(reference: string, id: string) {
    return apiRequest<{ log: { action: string; at: string; by: string; role: string | null; ipAddress: string | null }[] }>(
      `/api/council/reports/${encodeURIComponent(reference)}/evidence/${encodeURIComponent(id)}/log`,
    );
  },
};

/** Opens fetched bytes in a new tab; the object URL is released once it has loaded. */
export function openBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const tab = window.open(url, "_blank", "noopener");
  if (!tab) window.location.assign(url);
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
