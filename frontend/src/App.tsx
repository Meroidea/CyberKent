import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { PageBackground } from "@/components/background/PageBackground";
import { BootScreen } from "@/components/boot/BootScreen";
import { PageSkeleton } from "@/components/boot/PageSkeleton";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CheckModalProvider } from "@/components/check/CheckModalProvider";
import { useCheckModal } from "@/components/check/useCheckModal";
import { LandingPage } from "@/pages/LandingPage";
import { DocumentsPage } from "@/pages/DocumentsPage";
import { DocumentPage } from "@/pages/DocumentPage";
import { LearnPage } from "@/pages/LearnPage";
import { LearnArticlePage } from "@/pages/LearnArticlePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { ROUTES } from "@/config/site";
import { holdScroll, jumpToTop, startSmoothScroll } from "@/lib/smoothScroll";

/**
 * How long the boot sequence holds before handing over.
 *
 * Long enough that the dial is read as a deliberate piece of the interface
 * rather than a flicker on the way to the page.
 */
const BOOT_DURATION_MS = 3400;

/**
 * Returns the window to the top on navigation.
 *
 * A client-side route change does not reset scroll the way a document load
 * does, so without this a reader who was halfway down the landing page arrives
 * halfway down the next one.
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    jumpToTop();
  }, [pathname]);

  return null;
}

/**
 * `/check` is not a page — it is the dialog, opened.
 *
 * The address is kept because it is what every call to action on the site
 * points at, and because bookmarks and shared links to it already exist. Anyone
 * arriving at it is put back on the landing page with the checker already open,
 * which is the same place the in-page listener would have left them.
 */
function CheckRedirect() {
  const { open } = useCheckModal();

  useEffect(open, [open]);

  return <Navigate to={ROUTES.home} replace />;
}

/** Modules that are specified and have tables, but no screens yet. */
const PLACEHOLDERS: {
  path: string;
  title: string;
  summary: string;
  requirements: string;
}[] = [
  {
    path: ROUTES.reportScam,
    title: "Report a scam to Council",
    summary:
      "Submit what happened with evidence attached, get a reference number, and track the report through review.",
    requirements: "Modules 5–8 · FR25–FR48",
  },
  {
    path: ROUTES.alerts,
    title: "Community alerts",
    summary:
      "Every scam circulating in Hume, published after a Council officer has reviewed the report and removed anything identifying.",
    requirements: "Module 9 · FR49–FR54",
  },
  {
    path: ROUTES.scamMap,
    title: "Scam map and trends",
    summary:
      "Where reports are clustering across the municipality, aggregated to suburb level so patterns show but people do not.",
    requirements: "Module 12 · FR70",
  },
  {
    path: ROUTES.recover,
    title: "Recovery checklists",
    summary:
      "Step-by-step actions ordered by what matters in the first hour, with your progress saved as you work through them.",
    requirements: "Module 10 · FR58–FR60",
  },
  {
    path: ROUTES.signIn,
    title: "Sign in",
    summary:
      "Track reports you have made and manage your alert subscriptions. An account is never required to check a message.",
    requirements: "Modules 1–2 · FR1–FR12",
  },
  {
    path: ROUTES.register,
    title: "Create an account",
    summary:
      "Register to track reports and choose which alerts reach you. Checking a message stays open to everyone.",
    requirements: "Modules 1–2 · FR1–FR12",
  },
  {
    path: ROUTES.privacy,
    title: "Privacy",
    summary:
      "What this service collects, why, how long it is kept, and how to have it erased.",
    requirements: "Compliance 29–30",
  },
  {
    path: ROUTES.accessibility,
    title: "Accessibility",
    summary:
      "How this service meets WCAG 2.1 Level AA, and how to tell us where it does not.",
    requirements: "NFR 13",
  },
  {
    path: ROUTES.terms,
    title: "Terms of use",
    summary:
      "The basis on which this service is offered, including that its results are advisory and not a professional assessment.",
    requirements: "Ethical requirements",
  },
];

export default function App() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), BOOT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  /*
   * Smoothing is installed once, for the life of the app, above the router —
   * it is a property of the window rather than of any page, and tearing it down
   * per route would drop the inertia mid-gesture on every navigation.
   */
  useEffect(startSmoothScroll, []);

  /*
   * The page cannot be scrolled while it is still assembling — there is nothing
   * under the fold yet but placeholders, and letting the wheel move them means
   * the real content arrives somewhere the reader did not leave it.
   */
  useEffect(() => {
    if (!booting) {
      return;
    }

    return holdScroll();
  }, [booting]);

  return (
    <BrowserRouter>
      <CheckModalProvider>
        <ScrollToTop />

        <div className="relative min-h-screen">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-indigo-600 focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
          >
            Skip to main content
          </a>

          <PageBackground />

          <BootScreen visible={booting} />

          {/*
           * The real page is not mounted until the sequence ends. Every section
           * below reveals itself on scroll or on entering view, and mounting them
           * behind a curtain would spend those entrances where nobody can see
           * them — the page would arrive already finished.
           */}
          {booting ? (
            <PageSkeleton />
          ) : (
            <>
              <SiteHeader />

              <main id="main" className="relative z-10">
                <Routes>
                  <Route path={ROUTES.home} element={<LandingPage />} />
                  <Route
                    path={ROUTES.checkMessage}
                    element={<CheckRedirect />}
                  />
                  <Route path={ROUTES.documents} element={<DocumentsPage />} />
                  {/* Each published document reads inside the site, under the
                    same header and footer as every other page. */}
                  <Route
                    path={`${ROUTES.documents}/:slug`}
                    element={<DocumentPage />}
                  />

                  {/* The awareness library, and each guide in it. The landing
                    page's Learn section is a preview of this list. */}
                  <Route path={ROUTES.learn} element={<LearnPage />} />
                  <Route
                    path={`${ROUTES.learn}/:slug`}
                    element={<LearnArticlePage />}
                  />

                  {PLACEHOLDERS.map((page) => (
                    <Route
                      key={page.path}
                      path={page.path}
                      element={
                        <PlaceholderPage
                          title={page.title}
                          summary={page.summary}
                          requirements={page.requirements}
                        />
                      }
                    />
                  ))}

                  {/* Anything unmatched. The host rewrites every path to
                    index.html, so this is what stops an unknown address being
                    answered with the landing page. */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>

              <SiteFooter />
            </>
          )}
        </div>
      </CheckModalProvider>
    </BrowserRouter>
  );
}
