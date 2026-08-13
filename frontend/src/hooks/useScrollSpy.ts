import { useEffect, useState } from "react";

/** Where the "heading being read" line sits, in pixels below the viewport top. */
const READING_LINE = 140;

/**
 * Which heading the reader is currently looking at.
 *
 * An observer band biased to the upper third of the viewport does the work, so
 * the highlight follows the heading under the reader's eye rather than the one
 * technically nearest the top. When nothing is in the band — which is most of
 * the time, part-way through a long section — it falls back to the last heading
 * scrolled past, because a contents rail that highlights nothing is worse than
 * one that is a beat behind.
 */
export function useScrollSpy(ids: string[], ready: boolean) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || ids.length === 0) {
      return;
    }

    const headings = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    const intersecting = new Set<string>();

    const choose = () => {
      const inBand = headings.find((heading) => intersecting.has(heading.id));

      if (inBand) {
        setActive(inBand.id);
        return;
      }

      let last: string | null = null;

      for (const heading of headings) {
        if (heading.getBoundingClientRect().top >= READING_LINE) {
          break;
        }
        last = heading.id;
      }

      setActive((current) => last ?? current);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            intersecting.add(entry.target.id);
          } else {
            intersecting.delete(entry.target.id);
          }
        }

        choose();
      },
      { rootMargin: "-120px 0px -66% 0px" },
    );

    for (const heading of headings) {
      observer.observe(heading);
    }

    choose();

    return () => observer.disconnect();
  }, [ids, ready]);

  return [active, setActive] as const;
}
