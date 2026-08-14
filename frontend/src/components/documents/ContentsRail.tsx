import { useEffect, useRef } from "react";
import { ListTree } from "lucide-react";
import { cn } from "@/lib/cn";

export interface OutlineEntry {
  id: string;
  text: string;
  level: number;
}

interface ContentsRailProps {
  entries: OutlineEntry[];
  active: string | null;
  percent: number;
  onNavigate: (id: string) => void;
}

/**
 * The contents rail: a table of contents that doubles as a progress spine.
 *
 * The spine is scaled from `--reading-progress`, a custom property the reading
 * hook writes on the root element rather than passing through React — the value
 * changes on every scroll frame, and re-rendering a hundred-entry list that
 * often to move a gradient one pixel is work nobody sees.
 */
export function ContentsRail({ entries, active, percent, onNavigate }: ContentsRailProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const activeLink = useRef<HTMLAnchorElement>(null);

  /*
   * Keeps the highlighted entry in view on a long document. The rail is
   * scrolled directly rather than through `scrollIntoView`, which would be
   * free to scroll the page as well — and moving the page while someone is
   * reading it is the one thing this must never do.
   */
  useEffect(() => {
    const box = scroller.current;
    const link = activeLink.current;

    if (!box || !link) {
      return;
    }

    const top = link.offsetTop;
    const bottom = top + link.offsetHeight;

    if (top < box.scrollTop) {
      box.scrollTop = top - 8;
    } else if (bottom > box.scrollTop + box.clientHeight) {
      box.scrollTop = bottom - box.clientHeight + 8;
    }
  }, [active]);

  if (entries.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Table of contents">
      <p className="mb-3 flex items-center gap-1.5 font-mono text-[0.625rem] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
        <ListTree className="h-3.5 w-3.5" aria-hidden="true" />
        On this page
        <span className="ml-auto tabular-nums text-indigo-600 dark:text-cyan-400">{percent}%</span>
      </p>

      <div
        ref={scroller}
        className="no-scrollbar relative max-h-[calc(100vh-11rem)] overflow-y-auto"
        /* A long contents list scrolls itself under the pointer rather than
           taking the page with it. */
        data-lenis-prevent
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-px bg-slate-900/10 dark:bg-white/10"
        >
          <span
            className="block h-full w-px origin-top bg-gradient-to-b from-indigo-500 to-cyan-400 transition-transform duration-150 ease-linear"
            style={{ transform: "scaleY(var(--reading-progress, 0))" }}
          />
        </span>

        <ol>
          {entries.map((entry) => {
            const isActive = entry.id === active;

            return (
              <li key={entry.id}>
                <a
                  ref={isActive ? activeLink : undefined}
                  href={`#${entry.id}`}
                  aria-current={isActive ? "location" : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigate(entry.id);
                  }}
                  className={cn(
                    "-ml-px block border-l-2 py-1 pr-1 text-[0.8125rem] leading-snug transition-colors duration-200",
                    entry.level > 1 ? "pl-6 text-[0.78125rem]" : "pl-3",
                    isActive
                      ? "border-indigo-500 font-semibold text-indigo-600 dark:border-cyan-400 dark:text-cyan-400"
                      : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                  )}
                >
                  {entry.text}
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
