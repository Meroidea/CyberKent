import { useEffect, useState } from "react";

/** True once the window has scrolled past `threshold` pixels. */
export function useScrollThreshold(threshold = 100): boolean {
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    const update = () => setPassed(window.scrollY > threshold);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);

  return passed;
}
