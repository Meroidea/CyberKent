import { MonitorPlay, Play } from "lucide-react";
import { DECK_OUTLINE } from "@/components/present/manifest";

/**
 * The way into the deck, in the two places the page has room for it.
 *
 * The reader has two right-hand sides depending on width. Above 1400px there is
 * a rail beside the measure and the offer belongs in it, alongside the other
 * things a reader does with a document. Below that the rail is not rendered at
 * all, so the offer becomes a tab against the edge of the viewport — the only
 * piece of the page that is fixed rather than flowing, which is what keeps it
 * reachable from any point in a document this long without following the reader
 * down it.
 *
 * Both are the same button and open the same deck; only one is ever on screen.
 */

const COUNT = DECK_OUTLINE.length;

/** In the right rail, at the widths that have one. */
export function PresentCard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="glass-surface rounded-2xl p-4">
      <p className="mb-3 flex items-center gap-1.5 font-mono text-[0.625rem] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
        <MonitorPlay className="h-3.5 w-3.5" aria-hidden="true" />
        Present
      </p>

      <button
        type="button"
        onClick={onOpen}
        className="interactive group flex w-full items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-3 py-2.5 text-left text-white shadow-lg shadow-indigo-600/20 dark:from-indigo-500 dark:to-cyan-400 dark:text-slate-950"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 transition-transform duration-200 group-hover:scale-110">
          <Play className="ml-0.5 h-3 w-3 fill-current" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-[0.8125rem] font-bold leading-tight">Play the deck</span>
          <span className="block text-[0.6875rem] leading-tight text-white/80">
            {COUNT} slides, whole report
          </span>
        </span>
      </button>

      <p className="mt-2.5 text-[0.6875rem] leading-relaxed text-slate-500 dark:text-slate-400">
        The specification told in {COUNT} slides — arrow keys to move, F for fullscreen.
      </p>
    </div>
  );
}

/**
 * Against the right edge of the viewport, at the widths with no rail.
 *
 * Deliberately narrow. Below the rail breakpoint the measure runs nearly to the
 * edge of the screen, so anything fixed out there is over the document — and a
 * column of vertical type would be over it by 40px rather than by 8. It opens on
 * hover and on focus instead, which is where the room to explain itself is.
 */
export function PresentTab({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      /* `top-1/2` rather than a bottom offset: the middle is the one position on
         that edge which is neither under the masthead nor over the footer at any
         viewport height. */
      className="group fixed right-0 top-1/2 z-40 flex max-w-[2.75rem] -translate-y-1/2 items-center gap-2 overflow-hidden rounded-l-2xl border border-r-0 border-indigo-500/25 bg-white/85 py-2.5 pl-2.5 pr-2 shadow-xl shadow-slate-900/10 backdrop-blur-xl transition-[max-width,border-color] duration-300 ease-out-expo hover:max-w-[12rem] hover:border-indigo-400 focus-visible:max-w-[12rem] rails:hidden dark:border-cyan-400/25 dark:bg-[#111111]/85 dark:shadow-black/50 dark:hover:border-cyan-400/60"
      title={`Present this report as ${COUNT} slides`}
      aria-label={`Present this report as ${COUNT} slides`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-600/25 transition-transform duration-200 group-hover:scale-110 dark:from-indigo-500 dark:to-cyan-400 dark:text-slate-950">
        <Play className="ml-0.5 h-3.5 w-3.5 fill-current" aria-hidden="true" />
      </span>

      <span className="whitespace-nowrap text-left">
        <span className="block font-mono text-[0.625rem] font-bold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200">
          Present
        </span>
        <span className="block font-mono text-[0.5625rem] tabular-nums text-indigo-600 dark:text-cyan-400">
          {COUNT} slides
        </span>
      </span>
    </button>
  );
}
