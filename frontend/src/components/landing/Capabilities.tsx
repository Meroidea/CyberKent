import { motion } from "framer-motion";
import { ArrowRight, Layers } from "lucide-react";
import { ROUTES } from "@/config/site";
import { ActionLink } from "@/components/ui/ActionLink";
import { GradientText } from "@/components/ui/GradientText";
import { DecryptedText } from "@/components/ui/DecryptedText";
import { Pill } from "@/components/ui/Pill";
import { Coverflow } from "@/components/landing/Coverflow";
import { WaveBackground } from "@/components/background/WaveBackground";
import { fadeUp, REVEAL_VIEWPORT, staggerParent } from "@/lib/motion";

export function Capabilities() {
  return (
    <section className="relative z-10 overflow-hidden py-section">
      <WaveBackground />

      <div className="container relative grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          variants={staggerParent(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={REVEAL_VIEWPORT}
          className="flex flex-col items-start gap-6"
        >
          <motion.div variants={fadeUp}>
            <Pill>
              <Layers className="h-3.5 w-3.5 text-indigo-600 dark:text-cyan-400" aria-hidden="true" />
              What the service covers
            </Pill>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="display-depth text-balance font-display text-display-2 font-bold text-slate-900 dark:text-white"
          >
            <DecryptedText text="Scams do not arrive one way, so the service" />{" "}
            <GradientText>
              <DecryptedText text="does not either." delay={260} />
            </GradientText>
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="max-w-xl text-lede text-slate-600 dark:text-slate-400"
          >
            A text about a toll. An invoice from a supplier you know. A call
            from someone claiming to be from the bank. Each arrives through a
            different door, and each leaves a different trace — so checking,
            reporting, alerting and recovering are built as one connected
            service rather than four separate forms.
          </motion.p>

          <motion.div variants={fadeUp}>
            <ActionLink href={ROUTES.checkMessage}>
              Start with a check
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ActionLink>
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={REVEAL_VIEWPORT}
        >
          <Coverflow />
        </motion.div>
      </div>
    </section>
  );
}
