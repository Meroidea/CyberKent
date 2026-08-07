import type { Config } from "tailwindcss";

/**
 * Design tokens are declared as HSL channels in `src/index.css` (`:root` / `.dark`)
 * and mapped here to semantic names, so every surface reads the same variable set
 * in both themes. Raw palette utilities remain available for the marketing pages.
 */
const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "80rem" },
    },
    extend: {
      screens: {
        /**
         * Height-based, not width-based. The hero is one column of copy whose
         * height barely varies, so on a short screen — a small phone, or any
         * laptop in a split window — it overruns the fold and leaves the
         * console nothing to crest into. This lets that case shed its
         * decorative rows rather than the layout breaking.
         */
        short: { raw: "(max-height: 720px)" },
        tall: { raw: "(min-height: 721px)" },
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Sora", "Inter", "ui-sans-serif", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      /**
       * One fluid type scale for the whole surface.
       *
       * Each step carries its own line-height and tracking, because the two are
       * a function of size: display sizes need negative tracking and a leading
       * near 1, body sizes need neutral tracking and a leading near 1.6. Baking
       * that into the token is what stops the pairing drifting between sections.
       *
       * `clamp()` rather than breakpoint jumps — headlines then scale with the
       * viewport instead of snapping at 640/768/1024 and being mis-sized either
       * side of each step.
       */
      fontSize: {
        /* Hero. The lower bound is held down deliberately: at 375px the hero
           line runs to three rows, and every point of type size there costs
           roughly three points of the space the console needs to crest. */
        "display-1": [
          "clamp(2.125rem, 1.35rem + 4.6vw, 4.75rem)",
          { lineHeight: "1.05", letterSpacing: "-0.035em" },
        ],
        /* Section headlines. */
        "display-2": [
          "clamp(1.875rem, 1.15rem + 2.9vw, 3.25rem)",
          { lineHeight: "1.1", letterSpacing: "-0.028em" },
        ],
        /* Card titles and sub-headings. */
        "display-3": [
          "clamp(1.125rem, 1.02rem + 0.42vw, 1.375rem)",
          { lineHeight: "1.3", letterSpacing: "-0.015em" },
        ],
        /* Supporting paragraph under a headline. */
        lede: [
          "clamp(1rem, 0.96rem + 0.2vw, 1.125rem)",
          { lineHeight: "1.65", letterSpacing: "-0.005em" },
        ],
        /* Default body copy inside cards and panels. */
        copy: ["0.875rem", { lineHeight: "1.65" }],
        /* All-caps label above a headline. Tracking is held at 0.18em rather
           than the wider setting the style would take: past that, the longest
           eyebrow on the site wraps to two lines inside a 375px gutter. */
        eyebrow: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.18em" }],
        /* Metadata, timestamps, footnotes. */
        caption: ["0.75rem", { lineHeight: "1.5" }],
      },
      spacing: {
        /**
         * Vertical rhythm between major sections. Fluid so the page breathes on
         * a wide desktop without wasting a phone screen, and a single token so
         * the rhythm cannot drift section to section.
         */
        section: "clamp(4.5rem, 2.6rem + 6.2vw, 8rem)",
        /**
         * Rhythm for a section that is supporting material rather than a
         * destination — it still needs to breathe, but it should not claim the
         * same share of the page as the sections carrying the service itself.
         */
        "section-tight": "clamp(3rem, 2rem + 3.2vw, 4.75rem)",
        /** Headline block to the content it introduces. */
        "section-gap": "clamp(2.5rem, 1.7rem + 2.4vw, 3.75rem)",
      },
      transitionTimingFunction: {
        /** Matches EASE_OUT_EXPO in src/lib/motion.ts. */
        "out-expo": "cubic-bezier(0.22, 1, 0.36, 1)",
        /** Slight overshoot for press release. */
        "out-back": "cubic-bezier(0.34, 1.4, 0.64, 1)",
      },
      keyframes: {
        "shine-sweep": {
          "0%": { transform: "translateX(-120%) skewX(-18deg)" },
          "100%": { transform: "translateX(320%) skewX(-18deg)" },
        },
        "gradient-drift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.85)", opacity: "0.7" },
          "100%": { transform: "scale(2.1)", opacity: "0" },
        },
        "caret-blink": {
          "0%, 45%": { opacity: "1" },
          "50%, 95%": { opacity: "0" },
        },
        /* Exactly one copy plus one gap, so the next copy lands where the
           previous started and the reset cannot be seen. */
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" },
        },
      },
      animation: {
        "shine-sweep": "shine-sweep 7.5s ease-in-out infinite",
        "gradient-drift": "gradient-drift 5s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.22, 1, 0.36, 1) infinite",
        "caret-blink": "caret-blink 1.1s step-end infinite",
        marquee: "marquee var(--duration) linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
