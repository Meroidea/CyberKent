/**
 * The figure library for published documents.
 *
 * Every builder returns a self-contained block of HTML that the reader page
 * injects into the document body. They are markup and CSS custom properties
 * only — never inline styles that carry colour, and never a canvas — for three
 * reasons: the figures must re-theme with the page, they must survive being
 * printed, and a chart library in the client bundle would make publishing a
 * document a build of the app.
 *
 * The animation contract is one attribute: `data-reveal` on the `<figure>`.
 * The reader adds `is-visible` when it scrolls into view, and every transition
 * in `styles/document.css` hangs off that class, staggered by the `--i` index
 * each item carries. Nothing animates on a loop and nothing animates before it
 * is seen.
 */

const ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>`;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

/**
 * The shared frame.
 *
 * `role="group"` with the caption as its accessible name, so a screen reader
 * announces the figure as one thing with a name rather than as a run of loose
 * labels — a diagram read out as twelve orphaned words is worse than no
 * diagram at all.
 */
function frame({ title, body, caption, number, wide = false }) {
  const label = `Figure ${number}`;
  const heading = title ? `<p class="fig-title">${escapeHtml(title)}</p>` : "";

  return `<figure class="fig${wide ? " fig-wide" : ""}" data-reveal role="group" aria-label="${label} — ${escapeHtml(caption)}">
  <div class="fig-frame">${heading}${body}</div>
  <figcaption><span class="fig-number">${label}</span>${escapeHtml(caption)}</figcaption>
</figure>`;
}

/**
 * A sequence of stages.
 *
 * Reads top-down on a phone and left-to-right from `sm` upward — the same flow
 * either way, because a pipeline drawn horizontally on a 375px screen is a
 * pipeline nobody can read.
 */
export function flowFigure({ title, caption, steps }, number) {
  const body = steps
    .map((step, index) => {
      const note = step.note ? `<span class="flow-note">${escapeHtml(step.note)}</span>` : "";
      const arrow = index === 0 ? "" : `<span class="flow-arrow" aria-hidden="true">${ARROW}</span>`;

      return `${arrow}<span class="flow-step" style="--i:${index}">
        <span class="flow-index">${String(index + 1).padStart(2, "0")}</span>
        <span class="flow-label">${escapeHtml(step.label)}</span>${note}
      </span>`;
    })
    .join("");

  return frame({ title, caption, number, body: `<div class="fig-flow">${body}</div>` });
}

/**
 * A ranked bar chart.
 *
 * Horizontal bars, because every label here is a phrase rather than a word:
 * vertical bars would need the labels rotated, and a chart you tilt your head
 * to read is a chart that does not get read.
 */
export function barFigure({ title, caption, unit, series }, number) {
  const highest = series.reduce((found, item) => Math.max(found, item.value), 0) || 1;

  const rows = series
    .map(
      (item, index) => `<div class="bar-row" style="--i:${index};--value:${((item.value / highest) * 100).toFixed(1)}%">
        <span class="bar-label">${escapeHtml(item.label)}</span>
        <span class="bar-track"><span class="bar-fill"></span></span>
        <span class="bar-value">${escapeHtml(String(item.value))}</span>
      </div>`,
    )
    .join("");

  const legend = unit ? `<p class="fig-unit">${escapeHtml(unit)}</p>` : "";

  return frame({ title, caption, number, body: `<div class="fig-bars">${rows}</div>${legend}` });
}

/**
 * A donut, for a whole divided into parts.
 *
 * The radius is chosen so the circumference is exactly 100, which lets every
 * slice be expressed as its own percentage — no arc maths, and the dash values
 * in the markup are the same numbers as the legend.
 */
export function donutFigure({ title, caption, slices }, number) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  let offset = 0;

  const arcs = slices
    .map((slice, index) => {
      const share = (slice.value / total) * 100;
      /* Rotated as an SVG attribute rather than in CSS, so the arcs start at
         twelve o'clock while the labels inside them stay upright. */
      const arc = `<circle class="donut-slice" cx="21" cy="21" r="15.915" transform="rotate(-90 21 21)" style="--i:${index};--dash:${share.toFixed(2)};--offset:${(-offset).toFixed(2)};--tone:${index}"></circle>`;
      offset += share;
      return arc;
    })
    .join("");

  const legend = slices
    .map((slice, index) => {
      const share = Math.round((slice.value / total) * 100);
      return `<li style="--tone:${index}">
        <span class="key" aria-hidden="true"></span>
        <span class="key-label">${escapeHtml(slice.label)}</span>
        <span class="key-value">${slice.value} · ${share}%</span>
      </li>`;
    })
    .join("");

  const body = `<div class="fig-donut">
      <svg viewBox="0 0 42 42" aria-hidden="true">
        <circle class="donut-track" cx="21" cy="21" r="15.915"></circle>
        ${arcs}
        <text class="donut-total" x="21" y="20.5">${total}</text>
        <text class="donut-caption" x="21" y="25">total</text>
      </svg>
      <ul class="donut-legend">${legend}</ul>
    </div>`;

  return frame({ title, caption, number, body });
}

/** Headline figures, for the numbers a reader should leave with. */
export function statFigure({ title, caption, items }, number) {
  const tiles = items
    .map(
      (item, index) => `<div class="stat" style="--i:${index}">
        <span class="stat-value">${escapeHtml(String(item.value))}</span>
        <span class="stat-label">${escapeHtml(item.label)}</span>
        ${item.sub ? `<span class="stat-sub">${escapeHtml(item.sub)}</span>` : ""}
      </div>`,
    )
    .join("");

  return frame({ title, caption, number, body: `<div class="fig-stats">${tiles}</div>` });
}

/** A stack, drawn as a stack: the top layer at the top. */
export function layerFigure({ title, caption, layers }, number) {
  const rows = layers
    .map(
      (layer, index) => `<div class="layer" style="--i:${index}">
        <span class="layer-name">${escapeHtml(layer.name)}</span>
        <span class="layer-items">${layer.items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</span>
      </div>`,
    )
    .join("");

  return frame({ title, caption, number, body: `<div class="fig-layers">${rows}</div>` });
}

/** A schedule, with each entry's state carried as text as well as colour. */
export function timelineFigure({ title, caption, items }, number) {
  const rows = items
    .map(
      (item, index) => `<li style="--i:${index}" data-state="${escapeHtml(item.state ?? "planned")}">
        <span class="tl-dot" aria-hidden="true"></span>
        <span class="tl-when">${escapeHtml(item.when)}</span>
        <span class="tl-what">${escapeHtml(item.what)}</span>
        ${item.note ? `<span class="tl-note">${escapeHtml(item.note)}</span>` : ""}
        <span class="tl-state">${escapeHtml(item.state ?? "Planned")}</span>
      </li>`,
    )
    .join("");

  return frame({ title, caption, number, body: `<ol class="fig-timeline">${rows}</ol>` });
}

/**
 * A map of parts — the modules of a system, drawn as a numbered grid.
 *
 * A fourteen-item bulleted list is a list you scroll past; the same fourteen
 * items in a grid are a system you can see the size of.
 */
export function gridFigure({ title, caption, items }, number) {
  const cards = items
    .map(
      (item, index) => `<div class="grid-card" style="--i:${index}">
        <span class="grid-index">${String(index + 1).padStart(2, "0")}</span>
        <span class="grid-label">${escapeHtml(item.label)}</span>
        ${item.note ? `<span class="grid-note">${escapeHtml(item.note)}</span>` : ""}
      </div>`,
    )
    .join("");

  return frame({ title, caption, number, body: `<div class="fig-grid">${cards}</div>` });
}

/** Dispatch by `kind`, so the figure register stays plain data. */
const BUILDERS = {
  flow: flowFigure,
  bars: barFigure,
  donut: donutFigure,
  stats: statFigure,
  layers: layerFigure,
  timeline: timelineFigure,
  grid: gridFigure,
};

export function buildFigure(spec, number) {
  const builder = BUILDERS[spec.kind];

  if (!builder) {
    throw new Error(`Unknown figure kind: ${spec.kind}`);
  }

  return builder(spec, number);
}
