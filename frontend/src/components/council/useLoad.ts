import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";

/**
 * Loads one resource for a console screen, and reloads it on demand.
 *
 * Every Council screen does the same three things — fetch on mount and when
 * its inputs change, abort the fetch it no longer needs, and keep what it
 * showed while the next one loads so a filter change does not blank the page.
 * `key` is what the request depends on; a new key is a new request.
 */
export function useLoad<T>(load: (signal: AbortSignal) => Promise<T>, key: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const loader = useRef(load);
  loader.current = load;
  const controller = useRef<AbortController | null>(null);

  const run = useCallback(() => {
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    setLoading(true);

    loader
      .current(next.signal)
      .then((value) => {
        if (next.signal.aborted) return;
        setData(value);
        setError(null);
        setLoading(false);
      })
      .catch((caught: unknown) => {
        if (next.signal.aborted || (caught instanceof DOMException && caught.name === "AbortError")) return;
        setError(caught instanceof ApiError ? caught : new ApiError("This could not be loaded.", 0));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    run();
    return () => controller.current?.abort();
  }, [key, run]);

  return { data, setData, error, loading, reload: run };
}
