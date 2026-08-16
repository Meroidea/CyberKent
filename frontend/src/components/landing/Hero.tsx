import { useCallback, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { ROUTES, SITE } from "@/config/site";
import { ActionLink } from "@/components/ui/ActionLink";
import { GradientText } from "@/components/ui/GradientText";
import { DecryptedText } from "@/components/ui/DecryptedText";
import { Pill } from "@/components/ui/Pill";
import { StrokeFillText } from "@/components/ui/StrokeFillText";
import { HeroDivider } from "@/components/landing/HeroDivider";
import { RotatingLine } from "@/components/landing/RotatingLine";
import { fadeUp, staggerParent } from "@/lib/motion";

/**
 * Full-viewport opening. Content occupies the upper ~70svh; the lower 30svh is
 * a reserved "peek zone" that the console section pulls itself up into, so the
 * tilted device always crests the fold by the same proportion on any screen.
 *
 * `svh` rather than `vh` keeps the composition intact while iOS Safari's
 * address bar collapses.
 */
/** Decrypting clauses in the headline. The fill waits for all of them. */
const HEADLINE_CLAUSES = 2;

export function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 150]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  /* Counted rather than flagged: the clauses are separate reveals of unequal
     length, and the shorter one settling first is not the headline settling.
     `useCallback` keeps the identity stable, so each clause reports once. */
  const [settled, setSettled] = useState(0);
  const noteSettled = useCallback(() => setSettled((count) => count + 1), []);

  return (
    <section className="min-h-viewport relative flex flex-col">
      <motion.div
        style={{ y, opacity }}
        variants={staggerParent(0.12, 0.15)}
        initial="hidden"
        animate="visible"
        /*
         * Sized to fit the 70svh the hero actually owns. It previously ran
         * ~90px past that, which pushed the whole section taller than the
         * viewport and left the console nothing to rise into — the device could
         * only ever show a sliver above the fold without covering this copy.
         *
         * Top padding clears the fixed masthead *plus* breathing room: when it
         * matched the bar exactly the pill sat flush against it on a phone,
         * which read as an overlap rather than a composition. It is deliberately
         * not reduced alongside the bar — the column height is what the console
         * section is pulled up against, so trimming it here would drag the
         * device up the fold. The bar losing 1rem simply becomes 1rem more air.
         */
        className="container flex flex-1 flex-col items-center justify-center-safe gap-3 pb-2 pt-28 text-center short:gap-3 short:pt-24 sm:gap-6 sm:pb-4 sm:pt-28 sm:short:pt-24"
      >
        <motion.div variants={fadeUp}>
          <Pill withDot>
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-cyan-400" aria-hidden="true" />
            A {SITE.owner} service
          </Pill>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="flex max-w-4xl flex-col items-center gap-3 font-display font-bold text-slate-900 sm:gap-5 dark:text-white"
        >
          {/*
           * The eyebrow is set at a fixed caption size rather than scaling with
           * the headline: it is a label, and letting it grow with the display
           * step made it compete with the line it is meant to introduce.
           */}
          <span className="text-eyebrow font-semibold uppercase text-slate-500 dark:text-slate-400">
            <DecryptedText text="Online scam detection & reporting" speed={26} />
          </span>
          {/*
           * Deliberately not balanced. The line wants to break between the two
           * clauses, and balancing optimises for even line lengths instead —
           * which strands "real?" at the head of the second line.
           *
           * Two effects, in order: the line resolves out of its cipher as an
           * outline, and is inked in once both clauses have stopped changing.
           */}
          <StrokeFillText
            start={settled >= HEADLINE_CLAUSES}
            className="display-depth text-display-1"
          >
            <DecryptedText text="Not sure if it’s real?" onSettle={noteSettled} />{" "}
            <GradientText className="animate-gradient-drift bg-[length:200%_100%]">
              <DecryptedText text="Check it first." delay={260} onSettle={noteSettled} />
            </GradientText>
          </StrokeFillText>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="max-w-2xl text-balance text-lede text-slate-600 dark:text-slate-400"
        >
          {SITE.description}
        </motion.p>

        <motion.div variants={fadeUp} className="flex flex-col gap-3 sm:flex-row">
          <ActionLink href={ROUTES.checkMessage}>
            Check a message
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ActionLink>
          <ActionLink href={ROUTES.reportScam} variant="secondary">
            Report a scam
          </ActionLink>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="flex w-full flex-col items-center gap-3 short:hidden sm:gap-4"
        >
          <HeroDivider />
          <RotatingLine />
        </motion.div>
      </motion.div>

      {/* Reserved peek zone — the console section is pulled up by exactly this. */}
      <div aria-hidden="true" className="hero-peek-zone shrink-0" />
    </section>
  );
}
