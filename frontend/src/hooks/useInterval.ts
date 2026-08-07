import { useEffect, useRef } from "react";

/**
 * Declarative setInterval. Pass `delay: null` to pause without unmounting,
 * which is how the console demos stop animating for reduced-motion users.
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) {
      return;
    }

    const id = window.setInterval(() => savedCallback.current(), delay);
    return () => window.clearInterval(id);
  }, [delay]);
}
