import { motion, useScroll, useTransform } from "framer-motion";
import { LetterGlitch } from "@/components/background/LetterGlitch";
import { ParticleField } from "@/components/background/ParticleField";
import { TileGrid } from "@/components/background/TileGrid";

/**
 * Fixed five-layer backdrop shared by every page. DOM order is the stacking
 * order: gradient wash → letter glitch → tile grid → particles → parallax
 * blooms.
 *
 * Everything here is decorative and hidden from assistive technology. Only the
 * tile grid accepts pointer events, so its hover fill still works while no
 * layer can ever intercept a click meant for page content.
 */
export function PageBackground() {
  const { scrollY } = useScroll();
  const firstBloomY = useTransform(scrollY, [0, 1000], [0, 300]);
  const secondBloomY = useTransform(scrollY, [0, 1000], [0, -200]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.10] via-transparent to-cyan-400/[0.12]" />

      {/*
       * The glitch field is masked hollow through the middle of the screen,
       * which is the column every page actually sets its content in. It
       * therefore reads at the margins and fades to nothing behind body copy —
       * the effect is present without ever being something text has to compete
       * with.
       *
       * The hollow is opened wider on a phone. The cells are a fixed 12×22px,
       * so on a 375px screen they are nearly twice the share of the width they
       * take on a laptop, while the text column has gone the other way and runs
       * almost edge to edge. The same mask that clears the copy on a desktop
       * leaves characters sitting under the ends of every line there.
       */}
      <div className="absolute inset-0 opacity-[0.28] [mask-image:radial-gradient(ellipse_86%_52%_at_50%_44%,transparent_0%,transparent_56%,black_100%)] dark:opacity-[0.30] sm:[mask-image:radial-gradient(ellipse_68%_58%_at_50%_45%,transparent_0%,transparent_42%,black_100%)]">
        <LetterGlitch />
      </div>

      <div className="pointer-events-auto absolute inset-0">
        <TileGrid />
      </div>

      <ParticleField density={90} />

      <motion.div
        style={{ y: firstBloomY }}
        className="absolute -left-40 top-10 h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-[120px] dark:bg-indigo-600/20"
      />
      <motion.div
        style={{ y: secondBloomY }}
        className="absolute -right-32 top-[45%] h-[32rem] w-[32rem] rounded-full bg-cyan-400/20 blur-[130px] dark:bg-cyan-500/15"
      />
    </div>
  );
}
