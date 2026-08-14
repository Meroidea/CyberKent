import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDropzone, type FileRejection } from "react-dropzone";
import { FileAudio, FileText, FileVideo, ImageIcon, UploadCloud, X } from "lucide-react";
import { kindOf } from "@/lib/scam/media";
import type { MediaKind } from "@/lib/scam/types";
import { springSnappy } from "@/lib/motion";
import { cn } from "@/lib/cn";

/** Held well below anything that would stall a phone doing OCR on it. */
export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const MAX_FILES = 4;

const ACCEPT = {
  "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".heic"],
  "audio/*": [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".amr"],
  "application/pdf": [".pdf"],
  "text/plain": [".txt"],
  /*
   * Deliberately permissive on the document side. The point of this field is
   * to check attachments people were sent, and the attachments worth checking
   * are exactly the ones a stricter list would refuse — an accept list that
   * blocks ".exe" would block the clearest scam signal there is.
   */
  "application/octet-stream": [],
} as const;

const KIND_ICONS: Record<MediaKind, typeof ImageIcon> = {
  image: ImageIcon,
  audio: FileAudio,
  video: FileVideo,
  document: FileText,
};

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** A picked file plus the object URL its thumbnail is drawn from. */
interface Preview {
  file: File;
  kind: MediaKind;
  url?: string;
}

interface MediaDropzoneProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

/**
 * Attachment picker for the checker.
 *
 * Thumbnails are generated with `URL.createObjectURL` and revoked when the item
 * goes away, so an image is previewed without ever being read into memory as a
 * data URL — a screenshot from a modern phone is large enough that the
 * difference is felt.
 */
export function MediaDropzone({ files, onChange, disabled }: MediaDropzoneProps) {
  const [rejected, setRejected] = useState<string | null>(null);

  const previews = useMemo<Preview[]>(
    () =>
      files.map((file) => ({
        file,
        kind: kindOf(file.type, file.name),
        url: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      })),
    [files],
  );

  /* Revoked on the way out, not on every render — an object URL that outlives
     its <img> is a leak that only shows up after a few checks. */
  useEffect(
    () => () => {
      for (const preview of previews) {
        if (preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      }
    },
    [previews],
  );

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      setRejected(null);

      if (rejections.length > 0) {
        const first = rejections[0]!;
        const code = first.errors[0]?.code;

        setRejected(
          code === "file-too-large"
            ? `"${first.file.name}" is larger than ${formatSize(MAX_FILE_BYTES)}.`
            : code === "too-many-files"
              ? `Up to ${MAX_FILES} files at a time.`
              : `"${first.file.name}" could not be added.`,
        );
      }

      if (accepted.length === 0) {
        return;
      }

      /* Same name and size twice is the same file picked twice. */
      const merged = [...files];

      for (const file of accepted) {
        const duplicate = merged.some(
          (existing) => existing.name === file.name && existing.size === file.size,
        );

        if (!duplicate) {
          merged.push(file);
        }
      }

      onChange(merged.slice(0, MAX_FILES));
    },
    [files, onChange],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: MAX_FILE_BYTES,
    maxFiles: MAX_FILES,
    multiple: true,
    disabled,
    /* The whole zone is a button already; a second click target inside it
       would open the picker twice on some browsers. */
    noClick: false,
    noKeyboard: false,
  });

  const remove = (index: number) => {
    setRejected(null);
    onChange(files.filter((_, position) => position !== index));
  };

  const full = files.length >= MAX_FILES;

  return (
    <div className="flex flex-col gap-3">
      <div
        {...getRootProps()}
        aria-label="Attach screenshots, photos, audio or files to check"
        className={cn(
          "interactive flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-colors duration-200",
          isDragActive
            ? "border-indigo-500 bg-indigo-500/[0.07] dark:border-cyan-400 dark:bg-cyan-400/[0.07]"
            : "border-slate-300 hover:border-indigo-400 dark:border-white/15 dark:hover:border-cyan-400/50",
          (disabled || full) && "pointer-events-none opacity-60",
        )}
      >
        <input {...getInputProps()} />

        <motion.div
          animate={isDragActive ? { y: -3, scale: 1.06 } : { y: 0, scale: 1 }}
          transition={springSnappy}
          className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600/10 to-cyan-500/10 text-indigo-600 dark:text-cyan-400"
        >
          <UploadCloud className="h-5 w-5" aria-hidden="true" />
        </motion.div>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-indigo-600 dark:text-cyan-400">Click to upload</span>{" "}
          or drag and drop
        </p>
        <p className="mt-1 text-caption text-slate-500 dark:text-slate-400">
          {full
            ? `${MAX_FILES} files is the limit — remove one to add another`
            : `Screenshots, photos, audio or attachments · up to ${MAX_FILES} files, ${formatSize(MAX_FILE_BYTES)} each`}
        </p>
      </div>

      {rejected ? (
        <p role="alert" className="text-caption text-rose-500">
          {rejected}
        </p>
      ) : null}

      <AnimatePresence initial={false}>
        {previews.length > 0 ? (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 overflow-hidden"
          >
            {previews.map((preview, index) => {
              const Icon = KIND_ICONS[preview.kind];

              return (
                <motion.li
                  key={`${preview.file.name}-${preview.file.size}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={springSnappy}
                  className="group relative flex w-[8.5rem] flex-col gap-1.5 rounded-xl border border-slate-200 bg-white/60 p-2 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="flex h-16 w-full items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-black/30">
                    {preview.url ? (
                      <img
                        src={preview.url}
                        alt=""
                        className="h-full w-full object-cover"
                        /* Decorative: the filename below already names it, and
                           a screen reader does not need the picture twice. */
                        aria-hidden="true"
                      />
                    ) : (
                      <Icon className="h-6 w-6 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                    )}
                  </div>

                  <p
                    title={preview.file.name}
                    className="truncate text-[0.6875rem] font-medium text-slate-700 dark:text-slate-200"
                  >
                    {preview.file.name}
                  </p>
                  <p className="text-[0.625rem] text-slate-500 dark:text-slate-400">
                    {formatSize(preview.file.size)}
                  </p>

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={`Remove ${preview.file.name}`}
                    className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-rose-300 hover:text-rose-500 dark:border-white/15 dark:bg-slate-900 dark:text-slate-300"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </motion.li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>

      {previews.some((preview) => preview.kind === "image") ? (
        <p className="text-caption text-slate-500 dark:text-slate-400">
          Text in your screenshots is read on this device and checked with the same rules as a
          pasted message.
        </p>
      ) : null}

      {/* A keyboard route that does not depend on the dropzone's own handling. */}
      <button type="button" onClick={open} disabled={disabled || full} className="sr-only">
        Choose files to check
      </button>
    </div>
  );
}
