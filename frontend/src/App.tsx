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
import { ConsoleFooter } from "@/components/settings/ConsoleFooter";
import { CheckModalProvider } from "@/components/check/CheckModalProvider";
import { useCheckModal } from "@/components/check/useCheckModal";
import { LandingPage } from "@/pages/LandingPage";
import { DocumentsPage } from "@/pages/DocumentsPage";
import { DocumentPage } from "@/pages/DocumentPage";
import { LearnPage } from "@/pages/LearnPage";
import { LearnArticlePage } from "@/pages/LearnArticlePage";
import { AssistantPage } from "@/pages/AssistantPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { SignInPage } from "@/pages/auth/SignInPage";
import { VerifyEmailPage } from "@/pages/auth/VerifyEmailPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { ReportPage } from "@/pages/report/ReportPage";
import { DashboardPage } from "@/pages/account/DashboardPage";
import { ReportDetailPage } from "@/pages/account/ReportDetailPage";
import { AccountDeletedPage, AccountSettingsPage } from "@/pages/account/AccountSettingsPage";
import { RequireRole } from "@/components/auth/RequireRole";
import { CouncilOverviewPage } from "@/pages/council/CouncilOverviewPage";
import { ReviewQueuePage } from "@/pages/council/ReviewQueuePage";
import { CouncilReportPage } from "@/pages/council/CouncilReportPage";
import { UsersPage } from "@/pages/council/UsersPage";
import { CategoriesPage } from "@/pages/council/CategoriesPage";
import { AuditPage } from "@/pages/council/AuditPage";
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

/**
 * Everything below the router that needs to know which route is showing.
 *
 * Split out of `App` because `App` is what mounts `BrowserRouter`, and
 * `useLocation` is only available underneath it.
 */
function AppShell({ booting }: { booting: boolean }) {
  const { pathname } = useLocation();

  /**
   * Every screen except the landing page is a console screen.
   *
   * A denylist of one rather than a list of console routes: the console is the
   * service, and the landing page is the single exception to it. Written the
   * other way, adding a screen would mean remembering to enrol it here, and
   * forgetting would give it the marketing backdrop and no sidebar — a
   * difference nobody would notice until a reader did.
   */
  const isConsole = pathname !== ROUTES.home;

  return (
    <div className="relative min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-indigo-600 focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      {/*
       * Two surfaces, chosen by route.
       *
       * The landing page is a pitch and keeps the five-layer backdrop — the
       * glitch field, the particles, the drifting blooms. Every screen behind
       * it is a settings pane, a form or a verdict, and that backdrop actively
       * costs the reader there: it moves under body copy they are trying to
       * read, and it tints the white cards the grouped lists are built from.
       * Those routes get a flat ground instead, which is also what makes the
       * cards read as cards.
       */}
      {isConsole ? (
        <div aria-hidden="true" className="fixed inset-0 z-0 bg-ui-grouped" />
      ) : (
        <PageBackground />
      )}

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
              <Route path={ROUTES.checkMessage} element={<CheckRedirect />} />
              <Route path={ROUTES.documents} element={<DocumentsPage />} />
              {/* Each published document reads inside the site, under the
                same header and footer as every other page. */}
              <Route path={`${ROUTES.documents}/:slug`} element={<DocumentPage />} />

              {/* The awareness library, and each guide in it. The landing
                page's Learn section is a preview of this list. */}
              <Route path={ROUTES.learn} element={<LearnPage />} />
              <Route path={`${ROUTES.learn}/:slug`} element={<LearnArticlePage />} />

              {/* The OpenAI-backed CyberSafe Assistant. */}
              <Route path={ROUTES.assistant} element={<AssistantPage />} />

              {/* Checking is free and anonymous; reporting needs a free
                account. The report screen explains that to a guest itself,
                so it is not behind the guard — the account screens are. */}
              <Route path={ROUTES.reportScam} element={<ReportPage />} />
              <Route path={ROUTES.register} element={<RegisterPage />} />
              <Route path={ROUTES.signIn} element={<SignInPage />} />
              <Route path={ROUTES.verifyEmail} element={<VerifyEmailPage />} />
              <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
              <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
              <Route path={ROUTES.account} element={<RequireAuth><DashboardPage /></RequireAuth>} />
              <Route path={ROUTES.accountSettings} element={<RequireAuth><AccountSettingsPage /></RequireAuth>} />
              <Route path={`${ROUTES.accountReport}/:reference`} element={<RequireAuth><ReportDetailPage /></RequireAuth>} />
              <Route path={`${ROUTES.account}/deleted`} element={<AccountDeletedPage />} />

              {/* Council's console. The guard is a courtesy; the API re-checks
                the role from the database on every one of these requests. */}
              <Route path={ROUTES.council} element={<RequireRole roles={["OFFICER", "ADMIN"]}><CouncilOverviewPage /></RequireRole>} />
              <Route path={ROUTES.councilQueue} element={<RequireRole roles={["OFFICER", "ADMIN"]}><ReviewQueuePage /></RequireRole>} />
              <Route path={`${ROUTES.councilReport}/:reference`} element={<RequireRole roles={["OFFICER", "ADMIN"]}><CouncilReportPage /></RequireRole>} />
              <Route path={ROUTES.councilUsers} element={<RequireRole roles={["ADMIN"]}><UsersPage /></RequireRole>} />
              <Route path={ROUTES.councilCategories} element={<RequireRole roles={["ADMIN"]}><CategoriesPage /></RequireRole>} />
              <Route path={ROUTES.councilAudit} element={<RequireRole roles={["ADMIN"]}><AuditPage /></RequireRole>} />

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

          {/*
           * The console's sidebar already lists every screen the marketing
           * footer does, so repeating that index under a settings pane is a
           * second index that will eventually disagree with the first. What
           * the console does still need is the legal line — the reader and
           * article pages keep their own layouts and have no sidebar, which
           * would otherwise leave the accessibility statement unreachable
           * from the longest documents on the site.
           */}
          {isConsole ? <ConsoleFooter /> : <SiteFooter />}
        </>
      )}
    </div>
  );
}

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
      <AuthProvider>
        <CheckModalProvider>
          <ScrollToTop />
          <AppShell booting={booting} />
        </CheckModalProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
