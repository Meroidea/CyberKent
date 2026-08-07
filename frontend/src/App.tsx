import { useEffect, useState } from "react";
import { PageBackground } from "@/components/background/PageBackground";
import { BootScreen } from "@/components/boot/BootScreen";
import { PageSkeleton } from "@/components/boot/PageSkeleton";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LandingPage } from "@/pages/LandingPage";

/**
 * How long the boot sequence holds before handing over.
 *
 * Long enough that the dial is read as a deliberate piece of the interface
 * rather than a flicker on the way to the page.
 */
const BOOT_DURATION_MS = 3400;

export default function App() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), BOOT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  /*
   * The page cannot be scrolled while it is still assembling — there is nothing
   * under the fold yet but placeholders, and letting the wheel move them means
   * the real content arrives somewhere the reader did not leave it.
   */
  useEffect(() => {
    if (!booting) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [booting]);

  return (
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
       * behind a curtain would spend those entrances where nobody can see them —
       * the page would arrive already finished.
       */}
      {booting ? (
        <PageSkeleton />
      ) : (
        <>
          <SiteHeader />

          <main id="main" className="relative z-10">
            <LandingPage />
          </main>

          <SiteFooter />
        </>
      )}
    </div>
  );
}
