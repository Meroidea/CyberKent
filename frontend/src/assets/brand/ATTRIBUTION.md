# The CyberKent mark

`mark-source.png` is the master artwork the identity was approved from: two interlocking blades,
rendered with depth, in the studio's original teal and terracotta.

Nothing in the application loads it. It is kept here so the drawing that ships has a source to be
checked against — the mark in use is vector, and vector cannot be re-derived from a memory of what
the render looked like.

## What ships, and where it lives

| File | Role |
| --- | --- |
| `src/components/brand/markGeometry.ts` | The blade, as six cubic segments in a 65 × 100 box, plus the fold at its tail. One blade only — the second is the same path turned 180° about the centre. |
| `src/components/brand/MarkBody.tsx` | The drawing: the four shading layers, and the tone override for drawings that own their own light. |
| `src/components/brand/LogoMark.tsx` | The mark with a viewport of its own. Colour comes from the `--mark-*` tokens in `index.css`, so one component serves both themes. |
| `public/favicon.svg` | Tab icon: the same geometry on a `#0A0A0A` tile. |
| `public/logo.svg` | The mark alone, no ground, for a README or a partner deck. Follows the reader's colour scheme. |
| `public/favicon.ico`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | Raster icon set, rendered from the same geometry. |
| `public/og-image.png` | The 1200 × 630 share card. |

The blade was traced from the render and refitted with its tangents pinned vertical at each of the
six extremes, so the silhouette tracks the master to within 0.7% of its height while the control
handles stay well behaved enough to hint cleanly at 16px.

## The shading

The master is a lit 3D render, and the first pass flattened it to two solid fills — which threw away
the thing that made it a form rather than a silhouette. The shading was rebuilt by measuring the
render's luminance back out, per row, inside each blade's mask. Four terms came out of it, and each
is a real feature of the surface rather than a decoration:

| Term | What the measurement showed |
| --- | --- |
| Lengthwise ramp | Both blades run bright at the tip and fall away toward the tail — one key light, from above. |
| Sheen | A wide, soft highlight on the convex outer contour. Never near white: the master's whole range stays inside its hue, about 2.5:1 in lightness. |
| Occlusion | A deep pool on the concave inner contour, where the curl turns back on itself. |
| Reverse face | A hard colour break across the tail at y≈58, bowing 2.5 units lower through the middle. The one crisp edge in the drawing. |

Because the key light is fixed and the lower blade is the upper one turned a half turn, the two
folds are lit oppositely — the lower blade's faces up into the light at L≈190, the upper blade's
faces away at L≈60. That asymmetry is in the master, and reproducing it is what stops the shading
looking applied.

The cast shadow is an SVG filter rather than a CSS `drop-shadow`, so its offset and blur are in the
mark's own units and scale with it; in CSS pixels the same shadow would swamp a favicon and vanish
on a slide.

## Re-cutting the rasters

Every PNG and the `.ico` are `public/favicon.svg` rendered at a size — nothing about them is drawn
separately, which is what keeps the tab, the home screen and the share card from drifting apart.
Ground is `#0A0A0A`; the mark is centred, and its height is given as a fraction of the icon's side.

| Asset | Side | Mark height | Corner radius |
| --- | --- | --- | --- |
| `favicon.ico` | 16, 32, 48, 64 | 0.66 | 0.22 |
| `favicon-96.png` | 96 | 0.66 | 0.22 |
| `apple-touch-icon.png` | 180 | 0.60 | none — iOS masks it |
| `icon-192.png`, `icon-512.png` | 192, 512 | 0.64 | 0.22 |
| `icon-maskable-512.png` | 512 | 0.46 | none — the safe zone is the padding |

The mark's own colours in the rasters are the dark pair (`#67e8f9`→`#22d3ee`
upper, `#a5b4fc`→`#6366f1` lower), because every one of them sits on the dark
ground rather than on a page.

## The colour change

The master is teal and terracotta. Neither colour appears anywhere else on this site, and a mark
that shares no ink with the interface it sits in reads as a sticker on someone else's page.

The shipped mark is therefore drawn in the accent ramp the rest of the site is already built on —
indigo-600 → cyan-500 in light, lifted to the -300/-400 steps in dark so it stays lit against
near-black. Those are the same two colours as `.accent-gradient-text`, the header underline and
every primary button, so the mark and the wordmark beside it are demonstrably one palette rather
than approximately so.

Only the hue moved. Every lightness relationship the master had is kept: the upper blade is the
lighter of the two, the fold at the top of the lower blade is the brightest thing in the mark, and
the tail of the upper blade is the darkest.

Both themes carry the same ramp at different heights, and the cast shadow swaps with them. Over the
white page it is a real shadow. Over `#0A0A0A` a shadow is a shadow no one can see, and the mark
would sit flat on the page with its own modelling and nothing under it — so there the same filter
carries a faint bloom of the mark's own indigo at the offset the shadow would have had, because what
reads as contact on a dark surface is bounced light rather than darkness.

## The animation

Three pieces, all of which stop under `prefers-reduced-motion` through the global rule in
`index.css`:

- **The entrance.** The two blades arrive from opposite sides of the diagonal they are stacked on
  and counter-rotate into place, so what resolves is the interlock. One rotation applied to both
  would be a rigid turn of the whole mark — the halves are the same path a half turn apart, so they
  would never appear to move relative to each other. The upper blade is held back 110ms: two halves
  landing together read as one shape fading in.
- **The glint**, once every eight seconds — a band of light crossing both blades, clipped to them,
  in the same ambient register as the wordmark's shine. It idles off the left of the drawing, so a
  browser that never runs it is left with a mark and no band rather than a band frozen across one.
- **The hover.** The mark takes a small turn about its vertical axis and the blades ease apart along
  their diagonal: the gesture the mark is built from, played once. The entrance uses
  `animation-fill-mode: backwards` and never `forwards`, because a filled end state would outrank
  the hover rule in the cascade and leave the mark unable to answer a pointer.
