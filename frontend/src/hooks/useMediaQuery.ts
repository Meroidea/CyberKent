import { useEffect, useState } from "react";

/**
 * Whether a media query currently matches.
 *
 * For the cases a CSS breakpoint cannot answer on its own: a listener that
 * should not be installed at all above a width, a component that should not be
 * mounted rather than merely hidden. Where the answer only changes *styling*,
 * the Tailwind variant is the better tool — this is for behaviour.
 *
 * Seeded from `matchMedia` on the first render rather than from `false`, so a
 * component does not mount in the wrong state and correct itself a frame later.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const update = (event: MediaQueryListEvent | MediaQueryList) => setMatches(event.matches);

    update(list);
    list.addEventListener("change", update);

    return () => list.removeEventListener("change", update);
  }, [query]);

  return matches;
}
