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
import { SiteNoticeBanner } from "@/components/layout/SiteNoticeBanner";
import { AdminHubPage } from "@/pages/admin/AdminHubPage";
import { AnalyticsPage } from "@/pages/admin/AnalyticsPage";
import { ArticleEditorPage } from "@/pages/admin/ArticleEditorPage";
import { ContentPage } from "@/pages/admin/ContentPage";
import { RadarPage } from "@/pages/admin/RadarPage";
import { TasksPage } from "@/pages/admin/TasksPage";
import { TeamPage } from "@/pages/admin/TeamPage";
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
import { LegalPage } from "@/pages/LegalPage";
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
import { AlertDeskPage } from "@/pages/council/AlertDeskPage";
import { AlertEditorPage } from "@/pages/council/AlertEditorPage";
import { AlertsPage } from "@/pages/alerts/AlertsPage";
import { AlertDetailPage } from "@/pages/alerts/AlertDetailPage";
import { SubscriptionLinkPage } from "@/pages/alerts/SubscriptionLinkPage";
import { RecoverPage } from "@/pages/recover/RecoverPage";
import { ChecklistPage } from "@/pages/recover/ChecklistPage";
import { ScamMapPage } from "@/pages/ScamMapPage";
import { ROUTES } from "@/config/site";
import { holdScroll, jumpToTop, startSmoothScroll } from "@/lib/smoothScroll";
import { ADMIN_ROLES, STAFF_ROLES } from "@/lib/roles";

/**
 * How long the boot sequence holds before handing over.
 *
 * Long enough that the dial is read as a deliberate piece of the interface
 * rather than a flicker, short enough that readable content arrives well
 * inside NFR 1's three-second budget. It was 3.4 s, which alone broke it.
 */
const BOOT_DURATION_MS = 1200;

/**
 * The boot sequence is the landing page's entrance, so it plays only there.
 *
 * Someone who follows a link straight to a guide, a checklist or the sign-in
 * form came for that page, and any wait in front of it is pure delay. Read once
 * from the address the app was loaded at, so a later visit to the home page
 * through the router does not replay it.
 */
const BOOTS_ON_LOAD = window.location.pathname === ROUTES.home;

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
          <SiteNoticeBanner />

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

              {/* The AI-backed CyberSafe Assistant. */}
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

              {/* Module 9 — public. The two link pages are matched ahead of
                an alert reference because static segments outrank dynamic ones. */}
              <Route path={ROUTES.alerts} element={<AlertsPage />} />
              <Route path={`${ROUTES.alerts}/subscribe/confirm`} element={<SubscriptionLinkPage mode="confirm" />} />
              <Route path={`${ROUTES.alerts}/unsubscribe`} element={<SubscriptionLinkPage mode="unsubscribe" />} />
              <Route path={`${ROUTES.alerts}/:reference`} element={<AlertDetailPage />} />

              {/* FR70 — the public, suburb-level picture. */}
              <Route path={ROUTES.scamMap} element={<ScamMapPage />} />

              {/* Module 10 — recovery checklists (FR58–FR60). */}
              <Route path={ROUTES.recover} element={<RecoverPage />} />
              <Route path={`${ROUTES.recover}/:slug`} element={<ChecklistPage />} />

              {/* Council's console. The guard is a courtesy; the API re-checks
                the role from the database on every one of these requests. */}
              <Route path={ROUTES.council} element={<RequireRole roles={STAFF_ROLES}><CouncilOverviewPage /></RequireRole>} />
              <Route path={ROUTES.councilQueue} element={<RequireRole roles={STAFF_ROLES}><ReviewQueuePage /></RequireRole>} />
              <Route path={`${ROUTES.councilReport}/:reference`} element={<RequireRole roles={STAFF_ROLES}><CouncilReportPage /></RequireRole>} />
              <Route path={ROUTES.councilAlerts} element={<RequireRole roles={STAFF_ROLES}><AlertDeskPage /></RequireRole>} />
              <Route path={`${ROUTES.councilAlerts}/:id`} element={<RequireRole roles={STAFF_ROLES}><AlertEditorPage /></RequireRole>} />
              <Route path={ROUTES.councilTasks} element={<RequireRole roles={STAFF_ROLES}><TasksPage /></RequireRole>} />
              <Route path={ROUTES.councilRadar} element={<RequireRole roles={STAFF_ROLES}><RadarPage /></RequireRole>} />
              <Route path={ROUTES.councilAnalytics} element={<RequireRole roles={STAFF_ROLES}><AnalyticsPage /></RequireRole>} />
              <Route path={ROUTES.admin} element={<RequireRole roles={ADMIN_ROLES}><AdminHubPage /></RequireRole>} />
              <Route path={ROUTES.adminTeam} element={<RequireRole roles={ADMIN_ROLES}><TeamPage /></RequireRole>} />
              <Route path={ROUTES.adminContent} element={<RequireRole roles={ADMIN_ROLES}><ContentPage /></RequireRole>} />
              <Route path={`${ROUTES.adminContent}/guides/:id`} element={<RequireRole roles={ADMIN_ROLES}><ArticleEditorPage /></RequireRole>} />
              <Route path={ROUTES.councilUsers} element={<RequireRole roles={ADMIN_ROLES}><UsersPage /></RequireRole>} />
              <Route path={ROUTES.councilCategories} element={<RequireRole roles={ADMIN_ROLES}><CategoriesPage /></RequireRole>} />
              <Route path={ROUTES.councilAudit} element={<RequireRole roles={ADMIN_ROLES}><AuditPage /></RequireRole>} />

              {/* The service's statements. */}
              <Route path={ROUTES.privacy} element={<LegalPage slug="privacy" />} />
              <Route path={ROUTES.accessibility} element={<LegalPage slug="accessibility" />} />
              <Route path={ROUTES.terms} element={<LegalPage slug="terms" />} />

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
  const [booting, setBooting] = useState(BOOTS_ON_LOAD);

  useEffect(() => {
    if (!BOOTS_ON_LOAD) {
      return;
    }

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
