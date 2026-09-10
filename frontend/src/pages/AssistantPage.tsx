import { motion } from "framer-motion";
import { Bot, LifeBuoy, Phone, ScanSearch } from "lucide-react";
import { ROUTES } from "@/config/site";
import { AssistantChat } from "@/components/ai/AssistantChat";
import { GradientText } from "@/components/ui/GradientText";
import { Pill } from "@/components/ui/Pill";
import { fadeUp, staggerParent } from "@/lib/motion";

/** Where the assistant hands people on to when a conversation is not enough. */
const HANDOFFS = [
  { Icon: ScanSearch, title: "Check the message itself", body: "Paste it into the scam checker for a scored, explained result.", href: ROUTES.checkMessage },
  { Icon: LifeBuoy, title: "Money has already moved", body: "Call your bank on the number on your card, then follow the first-hour checklist.", href: "/learn/first-hour" },
  { Icon: Phone, title: "Identity documents taken", body: "IDCARE gives free, confidential support on 1800 595 160.", href: "https://www.idcare.org" },
];

/**
 * The CyberSafe Assistant page.
 *
 * On a phone the chat comes first and the hand-offs follow it; on a wide screen
 * they sit beside it. Either way the conversation is the page — the column of
 * links is where the assistant sends people, not a second thing to read first.
 */
export function AssistantPage() {
  return (
    <section className="relative z-10 pb-section pt-24 sm:pt-32">
      <div className="container">
        <motion.header
          variants={staggerParent(0.1)}
          initial="hidden"
          animate="visible"
          className="flex max-w-3xl flex-col items-start"
        >
          <motion.div variants={fadeUp}>
            <Pill>
              <Bot className="h-3.5 w-3.5 text-indigo-600 dark:text-cyan-400" aria-hidden="true" />
              AI assistant
            </Pill>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="display-depth mt-6 text-balance font-display text-display-2 font-bold text-slate-900 dark:text-white"
          >
            Ask about a scam, <GradientText>any time.</GradientText>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-4 max-w-2xl text-lede text-slate-600 dark:text-slate-400">
            Plain answers about suspicious messages, what to do after being targeted, and keeping your accounts safe —
            for residents, small businesses and community groups in Hume.
          </motion.p>
        </motion.header>

        <div className="mt-8 grid gap-6 sm:mt-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <AssistantChat />

          <aside aria-label="Other places to get help" className="flex flex-col gap-3">
            {HANDOFFS.map(({ Icon, title, body, href }) => (
              <a
                key={title}
                href={href}
                {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                className="glass-surface interactive flex items-start gap-3 rounded-2xl p-4 hover:border-indigo-300 dark:hover:border-cyan-400/40"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-cyan-400" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
                  <span className="mt-0.5 block text-caption text-slate-600 dark:text-slate-400">{body}</span>
                </span>
              </a>
            ))}
          </aside>
        </div>
      </div>
    </section>
  );
}
