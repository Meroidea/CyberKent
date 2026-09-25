import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, RotateCcw, SendHorizonal, ShieldAlert, User, WifiOff } from "lucide-react";
import { sendAssistantMessage } from "@/lib/ai/api";
import type { ChatMessage } from "@/lib/ai/types";
import { useAiStatus } from "@/components/ai/useAiStatus";
import { cn } from "@/lib/cn";
import { providerInfo } from "@/lib/ai/provider";

/** Questions residents actually arrive with, as one-tap starting points. */
const STARTERS = [
  "I clicked a link in a text about a toll. What should I do now?",
  "How can I tell if an invoice with new bank details is fake?",
  "Someone says they are from the ATO and I owe tax. Is that real?",
  "How do I help my parents avoid phone scams?",
];

const MAX_LENGTH = 2000;

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi, I'm the CyberSafe Assistant. Ask me about a message you're unsure of, what to do after a scam, or how to keep your accounts safe. Please don't share passwords, codes or card numbers with me.",
};

/**
 * The CyberSafe Assistant — a chatbot for scam and online-safety questions.
 *
 * The conversation lives in this component's state and nowhere else: it is sent
 * to the gateway on each turn, never stored by Council, and gone when the page
 * is closed. The greeting is local and is never sent to the model.
 */
export function AssistantChat() {
  const { status } = useAiStatus();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  /* Keep the newest turn in view without moving the page itself. */
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const send = async (content: string) => {
    const question = content.trim();

    if (!question || pending) {
      return;
    }

    const next: ChatMessage[] = [...messages, { role: "user", content: question.slice(0, MAX_LENGTH) }];
    setMessages(next);
    setDraft("");
    setError(null);
    setPending(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const reply = await sendAssistantMessage(next, controller.signal);
      setMessages((current) => [...current, { role: "assistant", content: reply.reply }]);
    } catch (failure) {
      if (failure instanceof DOMException && failure.name === "AbortError") {
        return;
      }

      setError(failure instanceof Error ? failure.message : "The assistant is unavailable right now.");
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send(draft);
  };

  /* Enter sends; Shift+Enter is a new line, as in every chat people already use. */
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send(draft);
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setPending(false);
  };

  const unavailable = status !== null && !status.available;
  const shown = [GREETING, ...messages];

  return (
    <div className="flex h-[min(40rem,calc(100svh-10rem))] min-h-[26rem] flex-col overflow-hidden rounded-ui bg-ui-card">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-900/[0.06] px-4 py-3 sm:px-5 dark:border-white/10">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 text-white">
            <Bot className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">CyberSafe Assistant</p>
            <p className="truncate text-[0.6875rem] text-slate-500 dark:text-slate-400">
              {status === null ? "Connecting…" : unavailable ? "Unavailable" : `Powered by ${providerInfo(status.provider).name} · ${status.model ?? ""}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={messages.length === 0}
          className="interactive inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-caption font-medium text-slate-600 disabled:opacity-40 dark:border-white/10 dark:text-slate-300"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">New conversation</span>
          <span className="sm:hidden">Clear</span>
        </button>
      </div>

      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5"
        data-lenis-prevent
        role="log"
        aria-live="polite"
        aria-label="Conversation with the CyberSafe Assistant"
      >
        <ul className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {shown.map((message, index) => (
              <motion.li
                key={`${index}-${message.role}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn("flex items-end gap-2", message.role === "user" && "flex-row-reverse")}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    message.role === "user"
                      ? "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                      : "bg-indigo-500/10 text-indigo-600 dark:bg-cyan-400/10 dark:text-cyan-300",
                  )}
                  aria-hidden="true"
                >
                  {message.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </span>
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[0.875rem] leading-relaxed",
                    message.role === "user"
                      ? "rounded-br-md bg-gradient-to-r from-indigo-600 to-cyan-500 text-white dark:from-indigo-500 dark:to-cyan-400 dark:text-slate-950"
                      : "rounded-bl-md border border-slate-900/[0.06] bg-white/80 text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200",
                  )}
                >
                  <span className="sr-only">{message.role === "user" ? "You said: " : "Assistant said: "}</span>
                  {message.content}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>

          {pending ? (
            <li className="flex items-center gap-2 pl-9 text-caption text-slate-500 dark:text-slate-400" role="status">
              <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              The assistant is writing…
            </li>
          ) : null}
        </ul>

        {messages.length === 0 && !unavailable ? (
          <div className="mt-5">
            <p className="text-caption font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Try asking</p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {STARTERS.map((starter) => (
                <li key={starter}>
                  <button
                    type="button"
                    onClick={() => void send(starter)}
                    className="interactive w-full rounded-xl border border-slate-200 bg-white/60 px-3 py-2.5 text-left text-caption text-slate-600 hover:border-indigo-300 hover:text-indigo-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-cyan-400/40 dark:hover:text-cyan-300"
                  >
                    {starter}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {error || unavailable ? (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-caption text-amber-800 dark:text-amber-300">
            <WifiOff className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error ?? "The assistant is unavailable right now. You can still check a message, and Scamwatch (scamwatch.gov.au) has guidance on every common scam."}
          </p>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="shrink-0 border-t border-slate-900/[0.06] px-3 py-3 sm:px-4 dark:border-white/10">
        <div className="flex items-end gap-2">
          <label htmlFor="assistant-input" className="sr-only">
            Your question
          </label>
          <textarea
            id="assistant-input"
            ref={inputRef}
            rows={1}
            value={draft}
            maxLength={MAX_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            disabled={unavailable}
            placeholder={unavailable ? "The assistant is unavailable" : "Ask about a scam or online safety…"}
            className="glass-surface max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-2xl px-3.5 py-2.5 text-[0.9375rem] text-slate-700 placeholder:text-slate-400 dark:text-slate-200"
          />
          <button
            type="submit"
            disabled={!draft.trim() || pending || unavailable}
            aria-label="Send"
            className="interactive flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-600/20 disabled:opacity-40 dark:from-indigo-500 dark:to-cyan-400 dark:text-slate-950"
          >
            <SendHorizonal className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-[0.6875rem] leading-snug text-slate-500 dark:text-slate-400">
          <ShieldAlert className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
          General guidance from an AI, not professional advice. Not stored by Council. In danger? Call 000.
        </p>
      </form>
    </div>
  );
}
