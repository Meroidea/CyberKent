import { FileSearch, MapPinOff } from "lucide-react";
import type { MediaDescriptor } from "@/lib/scam/types";

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * What each attachment turned out to be, read from its own bytes.
 *
 * Shown because the Lecturer asked for image metadata to be read reliably, and
 * a reading nobody can see is not one anyone can rely on. The fingerprint is
 * what makes "consistent" checkable: the same file shows the same hash under
 * any name, on any device.
 *
 * Location is reported as present or absent, never as coordinates. The service
 * does not read them, so it cannot show them.
 */
export function FileDetails({ media }: { media: MediaDescriptor[] }) {
  const described = media.filter((file) => file.metadata);

  if (described.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-caption font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        What the files really are
      </h3>
      <ul className="mt-3 flex flex-col gap-2.5">
        {described.map((file) => {
          const meta = file.metadata!;
          const rows: [string, string][] = [
            ["Content", meta.detected?.label ?? "Not a recognised format"],
            ["Declared as", meta.declaredType || "nothing (browser gave no type)"],
            ["Size", formatBytes(meta.sizeBytes)],
          ];

          if (meta.width && meta.height) {
            rows.push(["Dimensions", `${meta.width} × ${meta.height} px`]);
          }

          if (meta.exif?.make || meta.exif?.model) {
            rows.push(["Camera", [meta.exif.make, meta.exif.model].filter(Boolean).join(" ")]);
          }

          if (meta.exif?.software) {
            rows.push(["Made with", meta.exif.software]);
          }

          if (meta.exif?.takenAt) {
            rows.push(["Recorded", meta.exif.takenAt]);
          }

          rows.push(["Fingerprint", `SHA-256 ${meta.sha256.slice(0, 16)}…`]);

          return (
            <li
              key={meta.sha256}
              className="rounded-xl border border-slate-900/[0.08] bg-slate-900/[0.02] p-3 dark:border-white/10 dark:bg-black/20"
            >
              <p className="flex items-center gap-2 break-all text-sm font-semibold text-slate-900 dark:text-white">
                <FileSearch className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                {file.name}
              </p>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.75rem]">
                {rows.map(([term, value]) => (
                  <div key={term} className="contents">
                    <dt className="text-slate-500 dark:text-slate-400">{term}</dt>
                    <dd className="min-w-0 break-words font-mono text-slate-700 dark:text-slate-200">{value}</dd>
                  </div>
                ))}
              </dl>
              {meta.exif?.hasLocation ? (
                <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-500/10 px-2 py-1.5 text-[0.6875rem] text-amber-700 dark:text-amber-300">
                  <MapPinOff className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  This photo records where it was taken. The location was not read, and it is removed
                  before any image is sent for an AI second opinion.
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
