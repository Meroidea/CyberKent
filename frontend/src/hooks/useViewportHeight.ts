import { useEffect, useState } from "react";

/**
 * Current viewport height in pixels, tracked across resize and orientation
 * change. Returns 0 before the first measurement so callers can tell "not
 * measured yet" from a real value.
 *
 * Used where a scroll distance has to be expressed in pixels but should still
 * feel identical on a laptop and a phone.
 */
export function useViewportHeight(): number {
  const [height, setHeight] = useState(() =>
    typeof window === "undefined" ? 0 : window.innerHeight,
  );

  useEffect(() => {
    const update = () => setHeight(window.innerHeight);

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return height;
}
