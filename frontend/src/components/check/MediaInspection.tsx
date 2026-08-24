import { FileWarning, Image as ImageIcon, Paperclip, ScanLine } from "lucide-react";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import type { MediaDescriptor } from "@/lib/scam/types";
import { cn } from "@/lib/cn";

/**
 * What was read out of each attachment, in the order it was read.
 *
 * Metadata first, because that is the order the pipeline now runs in and the
 * order matters to the reader too: the type a file claims and the type its
 * bytes actually are is the first question, and everything after it —
 * recognised text, the wording rules, the score — is downstream of the answer.
 *
 * Facts and findings are drawn differently on purpose. Most of what is here is
 * context, not evidence: an absent EXIF block is what a screenshot looks like,
 * and colouring it as a warning would teach people to distrust every screenshot
 * they have ever taken. Only a genuine contradiction is given the warning tint.
 */

const KIND_ICON = {
  image: ImageIcon,
  audio: Paperclip,
  video: Paperclip,
  document: Paperclip,
} as const;

export function MediaInspection({ media }: { media: MediaDescriptor[] }) {
  if (media.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-7">
      {media.map((file) => {
        const metadata = file.metadata;
        const Icon = metadata?.disguised ? FileWarning : KIND_ICON[file.kind];
        const read = file.extractedText?.trim() ?? "";

        return (
          <SettingsGroup
            key={file.name}
            title={media.length > 1 ? file.name : "The attachment, examined"}
            action={
              metadata?.disguised ? (
                <span className="rounded-md bg-rose-500/12 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-rose-600 dark:text-rose-400">
                  not what it claims
                </span>
              ) : null
            }
            footer={
              metadata?.gaps.length
                ? metadata.gaps.join(" ")
                : "Read from the file itself on your device. Nothing was uploaded."
            }
          >
            <SettingsRows inset={52}>
              <SettingsRow
                icon={Icon}
                iconClassName={metadata?.disguised ? "bg-rose-500" : "bg-slate-500"}
                label={file.name}
                detail={
                  metadata?.disguised
                    ? "The name and the contents of this file describe different things."
                    : "Metadata was read before anything else was done with this file."
                }
              />

              {(metadata?.fields ?? []).map((field, index) => (
                <SettingsRow
                  key={`${field.label}-${index}`}
                  label={field.label}
                  detail={field.note}
                  value={
                    <span
                      className={cn(
                        "font-mono text-[0.8125rem]",
                        field.value === "Disagree" || field.value === "Yes"
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-ui-label-2",
                      )}
                    >
                      {field.value}
                    </span>
                  }
                />
              ))}

              <SettingsRow
                icon={ScanLine}
                iconClassName={read ? "bg-emerald-500" : "bg-slate-400"}
                label={read ? "Text recognised in this file" : "No text was read"}
                detail={
                  read
                    ? `${read.length} characters were recognised and put through the same wording rules as a pasted message.`
                    : (file.unreadable ??
                      "The contents of this file were not opened — only its envelope was examined.")
                }
              />
            </SettingsRows>
          </SettingsGroup>
        );
      })}
    </div>
  );
}
