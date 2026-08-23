# The CyberKent mark

`mark-source.png` is the master artwork the identity was approved from: two interlocking blades,
rendered with depth, in the studio's original teal and terracotta.

Nothing in the application loads it. It is kept here so the drawing that ships has a source to be
checked against — the mark in use is vector, and vector cannot be re-derived from a memory of what
the render looked like.

## What ships, and where it lives

| File | Role |
| --- | --- |
| `src/components/brand/markGeometry.ts` | The blade, as six cubic segments in a 65 × 100 box. One blade only — the second is the same path turned 180° about the centre. |
| `src/components/brand/LogoMark.tsx` | The mark in the app. Colour comes from the `--mark-*` tokens in `index.css`, so one component serves both themes. |
| `public/favicon.svg` | Tab icon: the same geometry on a `#0A0A0A` tile. |
| `public/logo.svg` | The mark alone, no ground, for a README or a partner deck. Follows the reader's colour scheme. |
| `public/favicon.ico`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | Raster icon set, rendered from the same geometry. |
| `public/og-image.png` | The 1200 × 630 share card. |

The blade was traced from the render and refitted with its tangents pinned vertical at each of the
six extremes, so the silhouette tracks the master to within 0.7% of its height while the control
handles stay well behaved enough to hint cleanly at 16px.

## Re-cutting the rasters

Every PNG and the `.ico` are the vector at a size, so they can be re-cut in any
tool from these numbers alone. Ground is `#0A0A0A`; the mark is centred, and its
height is given as a fraction of the icon's side.

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

Shading follows the geometry rather than a single light source: both blades take the same gradient
axis and let the half-turn carry it, which keeps the shading as symmetric as the drawing.
