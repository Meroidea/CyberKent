import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

interface DecryptedTextProps {
  text: string;
  /** Milliseconds between reveal steps. */
  speed?: number;
  /** Milliseconds to wait after entering view before starting. */
  delay?: number;
  /** Class for the settled characters. */
  className?: string;
  /** Class for the characters still scrambling. */
  encryptedClassName?: string;
  /** Class for the bright characters at the decryption front. */
  edgeClassName?: string;
  /**
   * Called once, when the last character has resolved. For an effect that has
   * to follow this one: the reveal is interval-driven, so how long it takes is
   * a property of the device rather than of the text, and nothing downstream
   * can be scheduled against a fixed duration.
   */
  onSettle?: () => void;
}

/** Characters at the decryption front, rendered lit rather than as cipher. */
const EDGE_LENGTH = 2;

/**
 * Steps the reveal is allowed to take, regardless of length.
 *
 * Revealing a fixed number of characters per tick makes the duration a function
 * of how long the headline happens to be, so a short title lands in a moment
 * and a long one crawls. Dividing the string across a fixed step count instead
 * gives every headline on the page the same tempo.
 */
const MAX_STEPS = 26;

/**
 * Scrambles each word into an anagram of itself, which is what makes the effect
 * free of layout shift.
 *
 * Substituting arbitrary characters changes how wide a word draws — caps and
 * symbols run wider than the narrow lower-case a headline is mostly made of.
 * Measured on the closing headline, that pushed it from two lines to three and
 * shunted everything beneath it down by 32px, twice, on the way past. Permuting
 * a word's own characters keeps its glyph multiset, so it occupies exactly the
 * width it will settle at and line breaking never moves.
 */
function scrambleWords(input: string): string {
  return input.replace(/\S+/g, (word) => {
    const chars = Array.from(word);

    for (let i = chars.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j] as string, chars[i] as string];
    }

    return chars.join("");
  });
}

/**
 * Headline that resolves out of scrambled characters when it scrolls into view.
 *
 * Two departures from the usual implementation of this effect, both deliberate:
 *
 * The visually-hidden copy carries the real `text`, not the scrambled frame.
 * Mirroring the scrambled string into the accessibility tree — as the reference
 * implementation does — means a screen reader announces gibberish, and announces
 * it repeatedly as the string mutates.
 *
 * The output is three spans — settled text, decryption edge, trailing cipher —
 * rather than one span per character. Per-character markup means a headline
 * re-renders forty-odd nodes on every tick of every instance on the page; this
 * re-renders three regardless of length.
 */
export function DecryptedText({
  text,
  speed = 38,
  delay = 0,
  className,
  encryptedClassName,
  edgeClassName,
  onSettle,
}: DecryptedTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(() => (prefersReducedMotion ? text.length : 0));
  /*
   * Seeded with the scrambled string rather than empty. An empty tail before the
   * observer fires means the headline paints at zero height and then jumps to
   * full when the reveal starts — the element has to occupy its final box from
   * the very first frame for the page beneath it not to move.
   */
  const [tail, setTail] = useState(() => (prefersReducedMotion ? "" : scrambleWords(text)));

  useEffect(() => {
    /* Reduced motion gets the resolved headline and no churn at all. */
    if (prefersReducedMotion) {
      setRevealed(text.length);
      setTail("");
      return;
    }

    const node = containerRef.current;

    if (!node) {
      return;
    }

    const scramble = (from: number) => scrambleWords(text.slice(from));

    let interval = 0;
    let startTimer = 0;

    const run = () => {
      const perStep = Math.max(1, Math.ceil(text.length / MAX_STEPS));
      let count = 0;

      setTail(scramble(0));

      interval = window.setInterval(() => {
        count = Math.min(text.length, count + perStep);
        setRevealed(count);
        setTail(scramble(count));

        if (count >= text.length) {
          window.clearInterval(interval);
          setTail("");
        }
      }, speed);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            /* Once only — a headline that re-scrambles every time it scrolls
               back past is a distraction, not an entrance. */
            observer.disconnect();
            startTimer = window.setTimeout(run, delay);
          }
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      window.clearTimeout(startTimer);
    };
  }, [delay, prefersReducedMotion, speed, text]);

  const settled = revealed >= text.length && tail === "";

  /* Announced from an effect rather than from the interval, so it is one
     statement about the rendered state — including the reduced-motion case,
     where the headline is settled before the interval has ever run. */
  useEffect(() => {
    if (settled) {
      onSettle?.();
    }
  }, [settled, onSettle]);

  /*
   * Once settled the headline is just its own text — no hidden twin, no
   * `aria-hidden`. The duplicate is only needed while the visible characters are
   * gibberish, and leaving it in place permanently would mean the headline is
   * found twice by find-in-page and copied twice by a selection.
   */
  if (settled) {
    return (
      <span ref={containerRef} className={className}>
        {text}
      </span>
    );
  }

  return (
    /* A plain inline span, not `display: contents`: an element generating no
       box is never reported by an IntersectionObserver, so the reveal would
       simply never fire. Inline keeps the headline wrapping naturally. */
    <span ref={containerRef}>
      <span className="sr-only">{text}</span>
      {/*
       * Three zones, not two: settled text, a bright leading edge, then the
       * cipher trailing off behind it. The edge is what turns a field of
       * jumbled characters into something with a direction — it reads as a
       * decryption front travelling through the line rather than as text that
       * has failed to load.
       */}
      <span aria-hidden="true">
        <span className={className}>{text.slice(0, revealed)}</span>
        {tail ? (
          <>
            <span className={cn("decrypt-edge", edgeClassName)}>{tail.slice(0, EDGE_LENGTH)}</span>
            <span className={cn("decrypt-cipher", encryptedClassName)}>
              {tail.slice(EDGE_LENGTH)}
            </span>
          </>
        ) : null}
      </span>
    </span>
  );
}
