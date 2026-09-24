import { useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { Check, Mail } from "lucide-react";
import { SECTION_IDS, SITE } from "@/config/site";
import { GradientText } from "@/components/ui/GradientText";
import { DecryptedText } from "@/components/ui/DecryptedText";
import { SPRING_SOFT_OPTIONS, springSoft } from "@/lib/motion";
import { subscriptionsApi } from "@/lib/alerts/api";
import { ApiError } from "@/lib/api/client";

const TILT_DEGREES = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Closing call to action. Validation here is a courtesy for the person typing —
 * the address is validated again on the server before any subscription exists.
 */
export function SubscribeCta() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<null | "confirmed" | "pending" | "unavailable">(null);
  const [busy, setBusy] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [120, -120]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.86, 1, 0.86]);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(
    useTransform(pointerY, [-0.5, 0.5], [TILT_DEGREES, -TILT_DEGREES]),
    SPRING_SOFT_OPTIONS,
  );
  const rotateY = useSpring(
    useTransform(pointerX, [-0.5, 0.5], [-TILT_DEGREES, TILT_DEGREES]),
    SPRING_SOFT_OPTIONS,
  );

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = cardRef.current?.getBoundingClientRect();

    if (!bounds) {
      return;
    }

    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  const resetTilt = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  /* FR64 — every alert in Hume. A narrower subscription (a scam type, a
     suburb) is offered on the alerts page, where there is room to choose. */
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Enter an email address so we know where to send alerts.");
      return;
    }

    setError(null);
    setBusy(true);
    try {
      setSubmitted((await subscriptionsApi.subscribe({ email: email.trim(), scope: "ALL" })).status);
    } catch (caught) {
      setError(caught instanceof ApiError ? (caught.fields[0]?.message ?? caught.message) : "That did not work. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      id={SECTION_IDS.contact}
      ref={sectionRef}
      className="relative z-10 py-section"
      style={{ perspective: "1500px" }}
    >
      <div className="container">
        <motion.div style={{ y, scale }}>
          <motion.div
            ref={cardRef}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            onPointerMove={onPointerMove}
            onPointerLeave={resetTilt}
            className="glass-surface relative mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] px-6 py-14 text-center sm:px-12"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl"
            />

            <div className="relative flex flex-col items-center gap-6" style={{ transform: "translateZ(60px)" }}>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white dark:from-indigo-500 dark:to-cyan-400 dark:text-slate-950">
                <Mail className="h-6 w-6" aria-hidden="true" />
              </span>

              <h2 className="display-depth max-w-2xl text-balance font-display text-display-2 font-bold text-slate-900 dark:text-white">
                <DecryptedText text="Get the alert before the" />{" "}
                <GradientText>
                  <DecryptedText text="message does." delay={230} />
                </GradientText>
              </h2>

              <p className="max-w-xl text-balance text-lede text-slate-600 dark:text-slate-400">
                A short summary of what is circulating in Hume, sent only when
                there is something worth knowing. Unsubscribe from any message.
              </p>

              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={springSoft}
                    role="status"
                    className="flex flex-col items-center gap-3"
                  >
                    <span className="relative flex h-14 w-14 items-center justify-center">
                      <span aria-hidden="true" className="absolute inset-0 animate-pulse-ring rounded-full bg-emerald-500/40" />
                      <motion.span
                        initial={{ rotate: -90, scale: 0.6 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={springSoft}
                        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white"
                      >
                        <Check className="h-6 w-6" aria-hidden="true" />
                      </motion.span>
                    </span>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {submitted === "confirmed"
                        ? "You are subscribed to every alert in Hume."
                        : submitted === "pending"
                          ? `Almost done — confirm the link we just sent to ${email}.`
                          : "Saved — but this site cannot send email yet, so your address cannot be confirmed. Sign in to subscribe with your account's address."}
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={onSubmit}
                    noValidate
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex w-full max-w-md flex-col gap-3 text-center"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <label htmlFor="alert-email" className="sr-only">
                        Email address
                      </label>
                      <input
                        id="alert-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        aria-invalid={error !== null}
                        aria-describedby={error ? "alert-email-error" : undefined}
                        className="flex-1 rounded-full border border-gray-200 bg-white/80 px-5 py-3 text-sm text-slate-700 transition-colors duration-200 ease-out placeholder:text-slate-400 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-cyan-400/40"
                      />
                      <button
                        type="submit"
                        disabled={busy}
                        aria-busy={busy || undefined}
                        className="interactive disabled:opacity-60 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 dark:from-indigo-500 dark:to-cyan-400 dark:text-slate-950"
                      >
                        {busy ? "Subscribing…" : "Subscribe"}
                      </button>
                    </div>

                    {error ? (
                      <p id="alert-email-error" role="alert" className="text-caption text-rose-500">
                        {error}
                      </p>
                    ) : (
                      <p className="text-caption text-slate-500 dark:text-slate-400">
                        We use your address only to send the alerts you asked
                        for. Questions: {SITE.supportEmail}
                      </p>
                    )}
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
