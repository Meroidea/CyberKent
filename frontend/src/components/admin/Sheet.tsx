import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * A side sheet for detail and editing, over the page it came from.
 *
 * Portalled to the body: the page's <main> is its own stacking context, and a
 * sheet drawn inside it sat under the fixed site header, hiding its title and
 * close button. Escape and the backdrop close it; focus moves into it on open and back to
 * where it was on close, so a keyboard user never loses their place in the
 * board or list underneath.
 */
export function Sheet({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean }) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        tabIndex={-1}
        className={`relative flex h-full w-full ${wide ? "max-w-[44rem]" : "max-w-[34rem]"} flex-col bg-ui-grouped shadow-2xl outline-none`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-ui-separator bg-ui-card px-5 py-3.5">
          <div className="min-w-0 text-[1rem] font-semibold text-ui-label">{title}</div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-ui-label-2 hover:bg-ui-fill" aria-label="Close">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
