<img src="public/logo.svg" alt="" width="46" />

# CyberKent — frontend

Public marketing surface for **Hume City Council CyberSafe Services**, the
Online Scam Detection and Reporting System.

Stack per `TechStack.md`: React 18 · TypeScript · Vite · Tailwind CSS ·
framer-motion · lucide-react.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production bundle
npm run typecheck
npm run lint
```

## Structure

| Path | Purpose |
| --- | --- |
| `src/config/` | Brand, routes, contact details, shared layout constants. No component hardcodes these. |
| `src/content/` | Page copy and illustrative data, separated from layout so wording can be reviewed independently. |
| `src/theme/` | Class-based light/dark theming (`ThemeProvider`, `useTheme`). |
| `src/lib/` | `cn()` class merge and the shared motion vocabulary. |
| `src/hooks/` | `useInterval`, `useScrollThreshold`, `useDeviceTier`, `useElementWidth`. |
| `src/components/brand/` | The mark: its geometry as one blade in `markGeometry.ts`, and `LogoMark` — the only component that draws it. |
| `src/components/ui/` | Reusable primitives: `ActionLink`, `GlassPanel`, `Pill`, `SectionHeading`, `GradientText`. |
| `src/components/background/` | Fixed page backdrop: gradient wash, tile grid, particle field, wave canvas. |
| `src/components/layout/` | Header, mobile navigation, theme toggle, footer. |
| `src/components/landing/` | The page sections. `console/` holds the demo control plane shown inside the device. |
| `src/pages/LandingPage.tsx` | Section composition and ordering. |

## Design system

Dark-first, with an accent swap: indigo leads in light mode, cyan in dark
(`text-indigo-600 dark:text-cyan-400`). Page base is `slate-50` / `#0A0A0A`;
surfaces are `white/70` / `#111111/80` behind `backdrop-blur-xl`. Status colours
are fixed site-wide — emerald safe, amber caution, rose threat, violet
automation. shadcn-convention HSL tokens are declared in `src/index.css` and
mapped in `tailwind.config.ts` for the application UI that follows.

The mark is two interlocking blades with 180° rotational symmetry, drawn from
a single path — the second blade is the first turned about the centre of the
box. It takes the same accent ramp as everything else: indigo-600 → cyan-500 in
light, lifted to the -300/-400 steps in dark, carried by the four `--mark-*`
custom properties in `src/index.css` so one component serves both themes.

Motion speeds are consistent: 150–250ms micro-interactions, 300–500ms component
transitions, 700–1300ms reveals, 2–6s ambient loops. Ambient animation stops
under `prefers-reduced-motion`, both in CSS and in the framer-driven sections.

## Brand assets

Everything in `public/` beside the app bundle is generated from the same six
cubic segments, so the mark cannot drift between the tab, the home screen and
the share card.

| File | Where it is used |
| --- | --- |
| `favicon.svg`, `favicon.ico`, `favicon-96.png` | Browser tab. The SVG is preferred; the `.ico` carries 16/32/48/64 for the browsers that will not take it. |
| `apple-touch-icon.png` | iOS home screen. Full bleed — iOS applies its own mask. |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | `site.webmanifest`, for an installed instance. |
| `og-image.png` | The 1200 × 630 card crawlers pull for a shared link. |
| `logo.svg` | The mark alone, for a README or a partner deck. Follows the reader's colour scheme. |

The four absolute `og:` URLs in `index.html` are the only place the deployed
origin is written down. They have to be absolute — a crawler resolves a
relative one against its own host and drops the card — so they are the one
thing to change when the service moves onto its Council address.

`src/assets/brand/` holds the master render the identity was approved from and
an `ATTRIBUTION.md` recording what was traced, what was kept and why the
palette moved off the original teal and terracotta. Nothing imports it.

## Notes on two deliberate decisions

- **The console is scaled, not reflowed.** It is laid out at a fixed
  1024×690 design size and scaled onto the device screen, so it keeps one
  composition at every viewport and never needs an inner scrollbar that would
  swallow page scroll. Its internals therefore carry no breakpoints.
- **The hero's reserved peek zone** (`HERO_PEEK_ZONE` in `src/config/layout.ts`)
  is both the hero's bottom spacer and the console section's negative top
  margin. Changing it in one place moves both.

Figures in the console and the alert cards are illustrative of the service, not
live data — the console is labelled `DEMO` on screen, and the page states
plainly that results are advisory guidance rather than a professional
cybersecurity assessment.
