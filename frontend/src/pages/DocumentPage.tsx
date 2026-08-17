import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, ListTree } from "lucide-react";
import { DOCUMENTS } from "@/content/documents";
import { ROUTES } from "@/config/site";
import { ContentsDrawer } from "@/components/documents/ContentsDrawer";
import { ContentsRail, type OutlineEntry } from "@/components/documents/ContentsRail";
import { DocumentFrontMatter } from "@/components/documents/DocumentFrontMatter";
import { PresentCard, PresentTab } from "@/components/documents/PresentAction";
import { ShareRail } from "@/components/documents/ShareRail";
import { PRESENTABLE_DOCUMENT_ID } from "@/components/present/manifest";
import { ActionLink } from "@/components/ui/ActionLink";
import { DECK_MIN_WIDTH, RAIL_BREAKPOINT } from "@/config/layout";
import { useEdgeSwipe } from "@/hooks/useEdgeSwipe";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { refreshSmoothScroll, smoothScrollTo } from "@/lib/smoothScroll";
import { NotFoundPage } from "@/pages/NotFoundPage";
import "@/styles/document.css";

/**
 * The published content of one document, produced by `scripts/build-documents.mjs`.
 */
interface DocumentContent {
  id: string;
  title: string;
  subtitle: string;
  minutes: number;
  entries: OutlineEntry[];
  html: string;
}

/**
 * The deck is loaded on the click, not on the page.
 *
 * Ten slide compositions and the content behind them are a chunk of their own,
 * and the reader who came to read has no use for it. Splitting it here keeps the
 * document page's cost the document (G6).
 */
const PresentationDeck = lazy(() =>
  import("@/components/present/PresentationDeck").then((module) => ({
    default: module.PresentationDeck,
  })),
);

/** The register is keyed by href; the route carries only the final segment. */
function findDocument(slug: string | undefined) {
  return DOCUMENTS.find((document) => document.href === `${ROUTES.documents}/${slug}`);
}

/**
 * A project document, read inside the service.
 *
 * The body is fetched rather than bundled: the specification alone is a quarter
 * of a megabyte of HTML, and shipping it in the app bundle would charge every
 * visitor to the home page for a document they have not opened. It is injected
 * as HTML because it *is* HTML — generated at build time from Markdown the
 * project authors, from a repository the app cannot reach at runtime, and never
 * from anything a visitor supplies.
 */
export function DocumentPage() {
  const { slug } = useParams();
  const document = findDocument(slug);

  const [content, setContent] = useState<DocumentContent | null>(null);
  const [failed, setFailed] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [contentsOpen, setContentsOpen] = useState(false);

  const body = useRef<HTMLElement>(null);
  const percent = useReadingProgress(body);

  useEffect(() => {
    if (!document) {
      return;
    }

    /* Guards against a slow response for a document the reader has already
       navigated away from overwriting the one they are now looking at. */
    let current = true;

    setContent(null);
    setFailed(false);

    fetch(`${ROUTES.documents}/data/${document.id}.json`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((data: DocumentContent) => {
        if (current) {
          setContent(data);
        }
      })
      .catch(() => {
        if (current) {
          setFailed(true);
        }
      });

    return () => {
      current = false;
    };
  }, [document]);

  const entries = useMemo(() => content?.entries ?? [], [content]);
  const ids = useMemo(() => entries.map((entry) => entry.id), [entries]);
  const [active, setActive] = useScrollSpy(ids, content !== null);

  /*
   * Below the rail breakpoint the contents have nowhere to sit beside the
   * measure, so they move into a drawer. The same query gates both the drawer
   * and the gesture: above it, no listener is installed at all.
   */
  const hasDrawer = useMediaQuery(`(max-width: ${RAIL_BREAKPOINT - 0.02}px)`);

  /* The deck has a legibility floor rather than a responsive fallback — see
     `DECK_MIN_WIDTH`. Below it there is nothing to offer. */
  const wideEnoughToPresent = useMediaQuery(`(min-width: ${DECK_MIN_WIDTH}px)`);

  useEdgeSwipe({
    enabled: hasDrawer && entries.length > 0,
    onOpen: () => setContentsOpen(true),
    onClose: () => setContentsOpen(false),
  });

  useRevealOnScroll(body, content !== null);

  /* Rotating a tablet to portrait, or dragging a window narrow, crosses the
     floor with the deck already open. It closes rather than carrying on at a
     size it was just declared unreadable at. */
  useEffect(() => {
    if (!wideEnoughToPresent) {
      setPresenting(false);
    }
  }, [wideEnoughToPresent]);

  /* A hash in the address bar is followed once the body it points into exists. */
  useEffect(() => {
    if (!content) {
      return;
    }

    /* The body is fetched, so the page has just grown from a shell to its full
       height. The smoothing has to be told, or it holds the reader at the
       bottom the shell had. */
    refreshSmoothScroll();

    if (window.location.hash) {
      scrollToHeading(window.location.hash.slice(1));
    }
  }, [content]);

  if (!document) {
    return <NotFoundPage />;
  }

  const others = DOCUMENTS.filter((entry) => entry.id !== document.id);
  const index = DOCUMENTS.findIndex((entry) => entry.id === document.id);
  const next = DOCUMENTS[(index + 1) % DOCUMENTS.length];
  const presentable = document.id === PRESENTABLE_DOCUMENT_ID && wideEnoughToPresent;

  const navigate = (id: string) => {
    scrollToHeading(id);
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    /* Top padding is set rather than inherited from `py-section`: this page
       opens with front matter rather than a hero, and the fixed 4rem header
       would otherwise cover the status pill on a small screen. */
    <section className="relative z-10 pb-section pt-28 sm:pt-32">
      {/*
       * The rails are additive: they take the dead space either side on a wide
       * screen and never reflow the measure, which stays at 48rem at every
       * width. Below their breakpoints they are not rendered at all, rather
       * than rendered off-screen.
       */}
      <div className="mx-auto grid max-w-[100rem] gap-x-8 px-4 sm:px-6 lg:px-8 rail:grid-cols-[14rem_minmax(0,48rem)] rail:justify-center rails:grid-cols-[14rem_minmax(0,48rem)_17rem]">
        <aside className="hidden rail:block">
          <div className="sticky top-24">
            <ContentsRail entries={entries} active={active} percent={percent} onNavigate={navigate} />
          </div>
        </aside>

        <div className="w-full min-w-0 max-w-3xl">
          <DocumentFrontMatter
            document={document}
            subtitle={content?.subtitle ?? document.navDescription}
            minutes={content?.minutes ?? 0}
          />

          {/* The way into the drawer for anyone who does not think to swipe. A
              gesture nobody is told about is a gesture nobody uses. */}
          {entries.length > 0 ? (
            <button
              type="button"
              onClick={() => setContentsOpen(true)}
              className="glass-surface interactive mb-10 flex w-full items-center gap-2 rounded-2xl px-4 py-3.5 text-left font-mono text-caption font-bold uppercase tracking-[0.16em] text-slate-900 rail:hidden dark:text-white"
            >
              <ListTree className="h-4 w-4 shrink-0" aria-hidden="true" />
              On this page
              <span className="ml-auto flex items-center gap-1.5 font-normal normal-case tracking-normal text-slate-400 dark:text-slate-500">
                <span className="hidden sm:inline">swipe right to open</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </button>
          ) : null}

          {failed ? (
            <p className="glass-surface rounded-2xl p-6 text-copy text-slate-600 dark:text-slate-400">
              This document could not be loaded. It is published at{" "}
              <a className="font-semibold text-indigo-600 dark:text-cyan-400" href={document.href}>
                {document.href}
              </a>
              — try again, or return to the home page.
            </p>
          ) : null}

          {!content && !failed ? <BodySkeleton /> : null}

          <motion.article
            ref={body}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: content ? 1 : 0, y: content ? 0 : 20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="doc-prose"
            /* Build-time output from the project's own Markdown; never a value
               that originates with a visitor. */
            dangerouslySetInnerHTML={{ __html: content?.html ?? "" }}
          />

          {/* Absent only if this is the sole document in the register, where
              "read next" would point back at the page already open. */}
          {next && next.id !== document.id ? (
            <section className="mt-16 border-t border-slate-900/[0.08] pt-10 dark:border-white/10">
              <a
                href={next.href}
                {...(next.format === "PDF" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="glass-surface card-lift group flex items-center gap-4 rounded-2xl p-5 hover:border-indigo-300 dark:hover:border-cyan-400/40"
              >
                <span>
                  <span className="block font-mono text-[0.625rem] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-cyan-400">
                    Read next
                  </span>
                  <span className="mt-1 block font-display text-display-3 font-bold text-slate-900 transition-colors duration-200 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-cyan-300">
                    {next.title}
                  </span>
                </span>
                <ArrowRight
                  className="ml-auto h-5 w-5 shrink-0 text-indigo-600 transition-transform duration-200 group-hover:translate-x-1 dark:text-cyan-400"
                  aria-hidden="true"
                />
              </a>
            </section>
          ) : null}

          <p className="mt-10 border-t border-slate-900/[0.08] pt-6 text-caption leading-relaxed text-slate-400 dark:border-white/10 dark:text-slate-500">
            CyberKent — Online Scam Detection and Reporting System, prepared by Group CyberKent for
            Hume City Council CyberSafe Services. This is a project document describing an advisory
            service; it does not constitute professional cybersecurity certification.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ActionLink href={ROUTES.checkMessage}>Check a message</ActionLink>
            <ActionLink href={ROUTES.home} variant="secondary">
              Back to the home page
            </ActionLink>
          </div>
        </div>

        <aside className="hidden rails:block">
          <div className="sticky top-24 flex flex-col gap-4">
            {presentable ? <PresentCard onOpen={() => setPresenting(true)} /> : null}
            <ShareRail document={document} others={others} />
          </div>
        </aside>
      </div>

      {/* The tab hides itself at the width the rail appears, so exactly one of
          the two entry points is ever on screen. */}
      {presentable ? <PresentTab onOpen={() => setPresenting(true)} /> : null}

      {/* Only where the static rail is absent — above 1180px the contents are
          already beside the measure, and a drawer over them would be a second
          copy of something the reader can see. */}
      <ContentsDrawer
        open={contentsOpen && hasDrawer}
        onClose={() => setContentsOpen(false)}
        entries={entries}
        active={active}
        percent={percent}
        onNavigate={navigate}
      />

      {presenting ? (
        <Suspense fallback={null}>
          <PresentationDeck onClose={() => setPresenting(false)} />
        </Suspense>
      ) : null}
    </section>
  );
}

/** Scrolls a heading clear of the fixed header, without a second native jump. */
function scrollToHeading(id: string) {
  const target = window.document.getElementById(id);

  if (!target) {
    return;
  }

  smoothScrollTo(target);
}

/**
 * Holds the shape of the body while it loads.
 *
 * A document is fetched, so there is a moment with nothing in the column. An
 * empty column reads as a broken page; a column of settling lines reads as one
 * that is nearly there.
 */
function BodySkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <div
          key={row}
          className="h-4 animate-pulse rounded bg-slate-900/[0.06] dark:bg-white/[0.06]"
          style={{ width: `${100 - (row % 3) * 12}%`, animationDelay: `${row * 90}ms` }}
        />
      ))}
    </div>
  );
}
