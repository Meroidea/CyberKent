import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckModal } from "@/components/check/CheckModal";
import { ROUTES } from "@/config/site";

export interface CheckModalValue {
  /** Opens the checker over whatever page the reader is on. */
  open: () => void;
  /** Closes it — for an action inside the verdict that moves to another page. */
  close: () => void;
}

export const CheckModalContext = createContext<CheckModalValue | null>(null);

/**
 * Hosts the scam checker as a dialog over whatever page is open.
 *
 * There is no checker page. Checking is a thing you do to a message you are
 * holding, wherever you happen to be reading — sending someone to a separate
 * destination to do it costs them the page they were on and gains nothing, so
 * the whole flow lives in one dialog above the site.
 *
 * Mounted once, at the top: two copies would mean two globes, two
 * `WebGLRenderingContext`s and two scroll holds fighting over the same body.
 */
export function CheckModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);
  const value = useMemo<CheckModalValue>(() => ({ open: () => setOpen(true), close }), [close]);

  /*
   * Every "check a message" call to action on the site is intercepted here
   * rather than rewired individually.
   *
   * They are spread across the header menu, the footer, the mobile menu, the
   * document pages and the not-found page, and several come from `config/site`
   * as data rather than markup. One delegated listener keeps them all pointing
   * at the same dialog, and — because they remain real links to a real route —
   * a middle click, a bookmark or a visit with scripts still loading lands on
   * the redirect in `App`, which opens this from the other side.
   */
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest?.("a");

      if (!anchor || anchor.target === "_blank") {
        return;
      }

      if (new URL(anchor.href, window.location.origin).pathname !== ROUTES.checkMessage) {
        return;
      }

      event.preventDefault();
      setOpen(true);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <CheckModalContext.Provider value={value}>
      {children}
      <CheckModal open={open} onClose={close} />
    </CheckModalContext.Provider>
  );
}
