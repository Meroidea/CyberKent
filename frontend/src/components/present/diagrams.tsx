import { motion, useReducedMotion } from "framer-motion";
import { DFD, ERD, GANTT, USE_CASE, WBS } from "@/content/diagrams";
import { cn } from "@/lib/cn";

/**
 * The project's analysis diagrams, drawn in black and white.
 *
 * No colour anywhere in this file, by requirement. That is a real constraint on
 * a diagram, not a palette swap: colour is normally what separates a *kind* of
 * thing from another kind, so with it gone the separation has to be carried by
 * form instead — shape for what a node is, fill weight for how much a bar
 * matters, and a dash for a boundary that is notional rather than drawn. Every
 * distinction below is one you could still read from a photocopy.
 *
 * Ink is taken from `currentColor` so a diagram inverts with the theme rather
 * than needing a second set of values: black on white in light, white on near
 * black in dark, and nothing in between that could read as a hue.
 */

/** The two ink weights every diagram is built from. */
const INK = "text-slate-900 dark:text-slate-100";
const MUTED = "text-slate-500 dark:text-slate-400";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ── Shared marks ─────────────────────────────────────────────────────────── */

/**
 * Arrowheads and the hatch pattern, defined once per diagram that needs them.
 *
 * `id` is prefixed per diagram: two SVGs on one page sharing a `marker` id take
 * whichever the document parsed last, and the second diagram loses its arrows.
 */
function Defs({ id }: { id: string }) {
  return (
    <defs>
      <marker
        id={`${id}-arrow`}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="5"
        markerHeight="5"
        orient="auto-start-reverse"
      >
        <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
      </marker>
      <marker
        id={`${id}-open`}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path d="M0 0 L10 5 L0 10" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </marker>
      <pattern id={`${id}-hatch`} width="4" height="4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="4" stroke="currentColor" strokeWidth="2" />
      </pattern>
    </defs>
  );
}

/** A UML stick actor. */
function StickActor({ x, y, label, role }: { x: number; y: number; label: string; role: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="0" cy="-26" r="7" />
        <path d="M0 -19 v16 M-11 -13 h22 M0 -3 l-9 14 M0 -3 l9 14" />
      </g>
      <text x="0" y="26" textAnchor="middle" className="fill-current text-[9px] font-bold uppercase tracking-wider">
        {label}
      </text>
      <text x="0" y="36" textAnchor="middle" className="fill-current text-[7.5px] opacity-60">
        {role}
      </text>
    </g>
  );
}

/* ── 1 · Level 1 data-flow diagram ────────────────────────────────────────── */

/**
 * Level 1 DFD, in Yourdon notation: a square is a thing outside the system, a
 * circle is a process inside it, and an open-ended rectangle is where data
 * rests. Those three shapes are the whole legend, which is why the diagram
 * survives losing its colour.
 */
export function DataFlowDiagram() {
  const reduced = useReducedMotion();

  return (
    <svg viewBox="0 0 1000 470" className={cn("h-full w-full", INK)} role="img" aria-label={DFD.title}>
      <Defs id="dfd" />

      {/* External entities — squares, top row */}
      <g strokeWidth="1.6" stroke="currentColor" fill="none">
        <rect x="60" y="12" width="300" height="42" rx="3" />
        <rect x="700" y="12" width="240" height="42" rx="3" />
      </g>
      <text x="210" y="39" textAnchor="middle" className="fill-current text-[13px] font-bold">
        USER (END-USER)
      </text>
      <text x="820" y="39" textAnchor="middle" className="fill-current text-[13px] font-bold">
        ADMINISTRATOR
      </text>

      {/* Processes — circles */}
      {[
        { cx: 150, cy: 250, p: DFD.processes[0] },
        { cx: 420, cy: 250, p: DFD.processes[1] },
        { cx: 640, cy: 400, p: DFD.processes[2] },
        { cx: 880, cy: 250, p: DFD.processes[3] },
      ].map(({ cx, cy, p }, index) => (
        <motion.g
          key={p.id}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 0.15 + index * 0.08, ease: EASE }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          <circle cx={cx} cy={cy} r="66" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <text x={cx} y={cy - 22} textAnchor="middle" className="fill-current text-[13px] font-bold">
            {p.id}
          </text>
          {p.name.split(" ").reduce<string[][]>((lines, word) => {
            const last = lines[lines.length - 1];
            if (last && last.join(" ").length + word.length < 18) {
              last.push(word);
            } else {
              lines.push([word]);
            }
            return lines;
          }, []).map((line, lineIndex, all) => (
            <text
              key={line.join(" ")}
              x={cx}
              y={cy - 6 + lineIndex * 11}
              textAnchor="middle"
              className="fill-current text-[8.5px] font-bold uppercase tracking-wide"
            >
              {line.join(" ")}
              {lineIndex === all.length - 1 ? null : null}
            </text>
          ))}
          <text x={cx} y={cy + 44} textAnchor="middle" className="fill-current text-[7px] opacity-55">
            {p.detail}
          </text>
        </motion.g>
      ))}

      {/* Data stores — open-ended rectangles with a ruled tab */}
      {[
        { x: 40, y: 410, s: DFD.stores[0] },
        { x: 560, y: 190, s: DFD.stores[1] },
        { x: 300, y: 410, s: DFD.stores[2] },
        { x: 800, y: 410, s: DFD.stores[3] },
      ].map(({ x, y, s }) => (
        <g key={s.id}>
          <line x1={x} y1={y} x2={x + 190} y2={y} stroke="currentColor" strokeWidth="1.4" />
          <line x1={x} y1={y + 28} x2={x + 190} y2={y + 28} stroke="currentColor" strokeWidth="1.4" />
          <line x1={x} y1={y} x2={x} y2={y + 28} stroke="currentColor" strokeWidth="1.4" />
          <line x1={x + 32} y1={y} x2={x + 32} y2={y + 28} stroke="currentColor" strokeWidth="1.4" />
          <text x={x + 16} y={y + 19} textAnchor="middle" className="fill-current text-[11px] font-bold">
            {s.id}
          </text>
          <text x={x + 42} y={y + 19} className="fill-current text-[10px] font-semibold uppercase tracking-wide">
            {s.name}
          </text>
        </g>
      ))}

      {/* Flows */}
      <g
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
        markerEnd="url(#dfd-arrow)"
        className="[&>path]:opacity-80"
      >
        <path d="M120 56 V182" />
        <path d="M186 182 V56" />
        <path d="M330 56 V182" />
        <path d="M395 182 V56" />
        <path d="M655 190 V60 H366" />
        <path d="M486 250 H556" />
        <path d="M556 268 H486" />
        <path d="M150 410 V318" />
        <path d="M420 316 V410" />
        <path d="M400 410 V318" />
        <path d="M655 218 V180" />
        <path d="M655 236 V352" />
        <path d="M814 182 V56" />
        <path d="M866 56 V182" />
        <path d="M814 250 H752" />
        <path d="M752 286 H814" />
        <path d="M880 316 V410" />
        <path d="M706 380 L500 300" />
      </g>

      {/* Flow labels — a DFD's arrows mean nothing unnamed */}
      <g className={cn("fill-current text-[8px]", MUTED)}>
        <text x="12" y="120">Registration details,</text>
        <text x="12" y="130">credentials</text>
        <text x="198" y="120">Account confirmation,</text>
        <text x="198" y="130">access token</text>
        <text x="236" y="120">Scam report details,</text>
        <text x="236" y="130">URLs, text, evidence</text>
        <text x="404" y="120">Report reference</text>
        <text x="404" y="130">number, status</text>
        <text x="530" y="98">Scam alerts,</text>
        <text x="530" y="108">awareness info</text>
        <text x="492" y="240">Store report data</text>
        <text x="492" y="284">Retrieve for duplicates</text>
        <text x="86" y="368">Credentials,</text>
        <text x="86" y="378">profiles</text>
        <text x="332" y="368">Upload evidence,</text>
        <text x="332" y="378">check privileges</text>
        <text x="600" y="172">User verification</text>
        <text x="600" y="336">Fetch scam trends</text>
        <text x="700" y="120">Verification decision,</text>
        <text x="700" y="130">admin request</text>
        <text x="880" y="120">Verified status,</text>
        <text x="880" y="130">audit data</text>
        <text x="756" y="240">Update status</text>
        <text x="756" y="300">Fetch reports</text>
        <text x="892" y="368">Log admin activity</text>
      </g>
    </svg>
  );
}

/* ── 2 · Entity-relationship diagram ──────────────────────────────────────── */

/**
 * The ERD, as four clustered tables rather than a wall of connectors.
 *
 * Twenty entities and their crow's feet do not survive being scaled to a
 * quarter of a slide: the lines cross into a mesh long before the labels become
 * unreadable. The clusters carry the same information — what belongs with what
 * — and the cardinalities are stated beneath in full, where they can be read.
 */
export function EntityDiagram() {
  return (
    <div className={cn("flex h-full w-full flex-col gap-2", INK)}>
      <div className="grid min-h-0 flex-1 grid-cols-4 gap-2">
        {ERD.clusters.map((cluster) => (
          <section
            key={cluster.id}
            className="flex min-h-0 flex-col rounded border border-slate-900/45 dark:border-white/40"
          >
            <h4 className="shrink-0 border-b border-slate-900/25 bg-slate-900/[0.06] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] dark:border-white/25 dark:bg-white/10">
              {cluster.name}
            </h4>

            <div className="flex min-h-0 flex-1 flex-col gap-[3px] p-1">
              {cluster.entities.map((entity) => (
                <table
                  key={entity.name}
                  className="w-full border-collapse border border-slate-900/35 dark:border-white/30"
                >
                  <thead>
                    <tr>
                      <th
                        colSpan={2}
                        className="border-b border-slate-900/25 bg-slate-900/[0.05] px-1.5 text-left text-[9px] font-bold leading-[1.5] dark:border-white/20 dark:bg-white/[0.08]"
                      >
                        {entity.name}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entity.fields.map((field) => (
                      <tr key={field.name}>
                        <td className="w-[15px] border-r border-slate-900/15 px-[3px] text-[7px] font-bold leading-[1.3] dark:border-white/15">
                          {field.key}
                        </td>
                        <td className="px-1.5 text-[8px] leading-[1.3]">
                          <span className={field.key ? "font-semibold" : ""}>{field.name}</span>
                          <span className="opacity-50"> · {field.type}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </div>
          </section>
        ))}
      </div>

      <ul className="flex shrink-0 flex-wrap gap-x-3.5 text-[8.5px] leading-[1.5]">
        {ERD.relations.map((relation) => (
          <li key={relation} className={MUTED}>
            {relation}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── 3 · Use-case diagram ─────────────────────────────────────────────────── */

/** The UML use-case diagram: two actors, one boundary, ellipses inside it. */
export function UseCaseDiagram() {
  const reduced = useReducedMotion();
  const userCases = USE_CASE.cases.filter((item) => item.actor === "user" || item.actor === "both");
  const adminCases = USE_CASE.cases.filter((item) => item.actor === "admin" || item.actor === "both");

  const ellipse = (list: typeof userCases, index: number, top: number) => ({
    cx: 300,
    cy: top + index * 46,
    item: list[index]!,
  });

  return (
    <svg viewBox="0 0 1000 430" className={cn("h-full w-full", INK)} role="img" aria-label={USE_CASE.title}>
      <Defs id="uc" />

      {/* Boundary — dashed, because a system boundary is notional */}
      <rect
        x="150"
        y="8"
        width="700"
        height="414"
        rx="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeDasharray="7 5"
        opacity="0.65"
      />
      <text x="500" y="26" textAnchor="middle" className="fill-current text-[9px] font-bold uppercase tracking-[0.2em]">
        {USE_CASE.boundary}
      </text>

      <StickActor x={70} y={120} label="User" role="end-user" />
      <StickActor x={70} y={320} label="Administrator" role="council staff" />

      {/* User-driven cases, left column inside the boundary */}
      {userCases.map((item, index) => {
        const { cx, cy } = ellipse(userCases, index, 60);
        return (
          <motion.g
            key={item.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : 0.1 + index * 0.05 }}
          >
            <ellipse
              cx={cx}
              cy={cy}
              rx="128"
              ry="19"
              fill="none"
              stroke="currentColor"
              strokeWidth={item.emphasis ? "2.2" : "1.3"}
            />
            <text
              x={cx}
              y={item.note ? cy - 1 : cy + 3}
              textAnchor="middle"
              className={cn("fill-current text-[9.5px]", item.emphasis && "font-bold")}
            >
              {item.name}
            </text>
            {item.note ? (
              <text x={cx} y={cy + 9} textAnchor="middle" className="fill-current text-[6.5px] opacity-60">
                ({item.note})
              </text>
            ) : null}
            <line x1="100" y1="120" x2={cx - 128} y2={cy} stroke="currentColor" strokeWidth="1" opacity="0.5" />
          </motion.g>
        );
      })}

      {/* Admin-driven cases, right column */}
      {adminCases.map((item, index) => {
        const cx = 690;
        const cy = 60 + index * 46;
        return (
          <motion.g
            key={item.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : 0.1 + index * 0.05 }}
          >
            <ellipse cx={cx} cy={cy} rx="140" ry="19" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <text
              x={cx}
              y={item.note ? cy - 1 : cy + 3}
              textAnchor="middle"
              className="fill-current text-[9.5px]"
            >
              {item.name}
            </text>
            {item.note ? (
              <text x={cx} y={cy + 9} textAnchor="middle" className="fill-current text-[6.5px] opacity-60">
                ({item.note})
              </text>
            ) : null}
            <line x1="100" y1="320" x2={cx - 140} y2={cy} stroke="currentColor" strokeWidth="1" opacity="0.35" />
          </motion.g>
        );
      })}

      {/* Includes — dashed, arrowed, and labelled, as UML requires */}
      <g stroke="currentColor" strokeWidth="1" strokeDasharray="5 4" fill="none" markerEnd="url(#uc-open)">
        <path d="M428 244 L550 152" />
        <path d="M428 250 L550 198" />
        <path d="M428 336 L550 290" />
        <path d="M428 152 L550 336" opacity="0.5" />
      </g>
      <g className="fill-current text-[6.5px] font-bold uppercase tracking-wider opacity-70">
        <text x="470" y="188">&#171;include&#187;</text>
        <text x="470" y="230">&#171;include&#187;</text>
        <text x="470" y="316">&#171;include&#187;</text>
      </g>
    </svg>
  );
}

/* ── 4 · Work breakdown structure ─────────────────────────────────────────── */

/** The WBS as a tree: root, five packages, their tasks, and the level-3 detail. */
export function WbsDiagram() {
  const reduced = useReducedMotion();

  return (
    <div className={cn("flex h-full w-full flex-col", INK)}>
      {/* Root */}
      <div className="flex shrink-0 justify-center">
        <div className="flex items-stretch border border-slate-900/60 dark:border-white/50">
          <span className="border-r border-slate-900/60 bg-slate-900/[0.07] px-3 py-1.5 font-mono text-[15px] font-bold dark:border-white/50 dark:bg-white/10">
            {WBS.root.id}
          </span>
          <span className="px-4 py-1.5 text-[16px] font-bold uppercase tracking-wide">{WBS.root.name}</span>
        </div>
      </div>

      {/* The spine and the five drops from it */}
      <div aria-hidden="true" className="relative h-5 shrink-0">
        <span className="absolute left-1/2 top-0 h-3 w-px bg-slate-900/60 dark:bg-white/50" />
        <span className="absolute left-[10%] top-2 h-px w-[80%] bg-slate-900/60 dark:bg-white/50" />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-5 gap-2">
        {WBS.packages.map((pack, index) => {
          const detail = WBS.detail.filter((entry) => entry.parent.startsWith(pack.id));

          return (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 0.35, delay: reduced ? 0 : 0.15 + index * 0.07, ease: EASE }}
              className="flex min-h-0 flex-col"
            >
              <span aria-hidden="true" className="mx-auto h-3 w-px shrink-0 bg-slate-900/60 dark:bg-white/50" />

              <div className="flex shrink-0 items-stretch border border-slate-900/50 dark:border-white/45">
                <span className="border-r border-slate-900/50 bg-slate-900/[0.06] px-2 py-1 font-mono text-[11px] font-bold dark:border-white/45 dark:bg-white/10">
                  {pack.id}
                </span>
                <span className="px-2 py-1 text-[11.5px] font-bold leading-tight">{pack.name}</span>
              </div>

              <ul className="mt-2 flex flex-1 flex-col gap-1.5">
                {pack.children.map((child) => {
                  const level3 = detail.find((entry) => entry.parent === child.id);

                  return (
                    <li key={child.id} className="flex flex-1 flex-col">
                      <div className="flex flex-1 items-stretch border border-slate-900/30 dark:border-white/25">
                        <span className="flex shrink-0 items-center border-r border-slate-900/20 px-1.5 font-mono text-[9px] dark:border-white/20">
                          {child.id}
                        </span>
                        <span className="flex flex-1 flex-col justify-center px-1.5 py-1 text-[10px] leading-tight">
                          {child.name}
                          {"meta" in child && child.meta ? (
                            <span className="block text-[8px] uppercase tracking-wider opacity-55">{child.meta}</span>
                          ) : null}
                        </span>
                      </div>

                      {/* Level 3, indented under the task it decomposes */}
                      {level3 ? (
                        <ul className="ml-2.5 mt-1 flex flex-col gap-0.5 border-l border-slate-900/25 pl-1.5 dark:border-white/20">
                          {level3.items.map((item) => (
                            <li key={item.id} className="flex gap-1.5 text-[8.5px] leading-tight">
                              <span className="font-mono opacity-55">{item.id}</span>
                              <span className="flex-1">{item.name}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          );
        })}
      </div>

      <p className={cn("mt-2 shrink-0 text-[9.5px] uppercase tracking-[0.14em]", MUTED)}>{WBS.note}</p>
    </div>
  );
}

/* ── 5 · Gantt chart ──────────────────────────────────────────────────────── */

/**
 * The schedule.
 *
 * The original separates Musts, Shoulds and continuous work by colour. Here the
 * same three classes are carried by fill weight — solid, hatched, outline —
 * which is a distinction that survives both greyscale and a bad projector.
 */
export function GanttDiagram() {
  const reduced = useReducedMotion();
  const total = GANTT.months.length;
  const pct = (value: number) => `${(value / total) * 100}%`;

  return (
    <div className={cn("flex h-full w-full flex-col", INK)}>
      {/* Calendar head */}
      <div className="grid shrink-0 grid-cols-[190px_1fr] border-b border-slate-900/45 dark:border-white/40">
        <span className="pb-1 text-[8px] font-bold uppercase tracking-[0.14em]">WBS task</span>
        <div>
          <div className="flex">
            {GANTT.quarters.map((quarter) => (
              <span
                key={quarter.label}
                style={{ width: pct(quarter.span) }}
                className="border-l border-slate-900/25 text-center text-[8px] font-bold uppercase tracking-wider dark:border-white/25"
              >
                {quarter.label}
              </span>
            ))}
          </div>
          <div className="flex">
            {GANTT.months.map((month) => (
              <span
                key={month}
                style={{ width: pct(1) }}
                className="border-l border-slate-900/15 text-center text-[7px] uppercase dark:border-white/15"
              >
                {month}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Rows */}
      <div className="relative grid min-h-0 flex-1 grid-cols-[190px_1fr]">
        <ul className="flex min-h-0 flex-col">
          {GANTT.rows.map((row) => (
            <li
              key={row.id}
              className={cn(
                "flex flex-1 items-center gap-1 truncate pr-1",
                row.group ? "text-[8px] font-bold" : "text-[7.5px]",
              )}
            >
              <span className="w-[42px] shrink-0 font-mono opacity-55">{row.id.startsWith("sprint") ? "" : row.id}</span>
              <span className="truncate">{row.name}</span>
            </li>
          ))}
        </ul>

        <div className="relative min-h-0">
          {/* Month grid, behind the bars */}
          <div aria-hidden="true" className="absolute inset-0 flex">
            {GANTT.months.map((month) => (
              <span
                key={month}
                style={{ width: pct(1) }}
                className="border-l border-slate-900/10 dark:border-white/10"
              />
            ))}
          </div>

          {/* Today */}
          <span
            aria-hidden="true"
            style={{ left: pct(GANTT.today) }}
            className="absolute inset-y-0 w-px bg-slate-900/60 dark:bg-white/50"
          />

          <ul className="relative flex h-full flex-col">
            {GANTT.rows.map((row, index) => (
              <li key={row.id} className="relative flex-1">
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : 0.2 + index * 0.03, ease: EASE }}
                  style={{ left: pct(row.start), width: pct(row.span), transformOrigin: "left" }}
                  className={cn(
                    "absolute inset-y-[3px] rounded-[2px] border border-slate-900/70 dark:border-white/60",
                    row.weight === "solid" && "bg-slate-900 dark:bg-white",
                    row.weight === "hatch" &&
                      "bg-[repeating-linear-gradient(45deg,currentColor_0_2px,transparent_2px_5px)]",
                    row.weight === "open" && "bg-transparent",
                    row.weight === "band" && "border-dashed bg-slate-900/[0.06] dark:bg-white/[0.09]",
                  )}
                />
              </li>
            ))}
          </ul>

          {/* Milestones — a diamond on the date it falls */}
          {GANTT.milestones.map((milestone) => (
            <span
              key={milestone.id}
              style={{ left: pct(milestone.at) }}
              title={milestone.label}
              className="absolute -top-px h-full w-0"
            >
              <span className="absolute -top-[3px] -left-[4px] h-2 w-2 rotate-45 border border-slate-900 bg-white dark:border-white dark:bg-slate-900" />
              <span className="absolute -top-[11px] -left-[9px] font-mono text-[6.5px] font-bold">
                {milestone.id}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <ul className="mt-1.5 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1">
        {GANTT.legend.map((entry) => (
          <li key={entry.label} className="flex items-center gap-1 text-[7.5px]">
            <span
              className={cn(
                "h-2.5 w-5 rounded-[2px] border border-slate-900/70 dark:border-white/60",
                entry.weight === "solid" && "bg-slate-900 dark:bg-white",
                entry.weight === "hatch" &&
                  "bg-[repeating-linear-gradient(45deg,currentColor_0_2px,transparent_2px_5px)]",
                entry.weight === "open" && "bg-transparent",
                entry.weight === "band" && "border-dashed bg-slate-900/[0.06] dark:bg-white/[0.09]",
              )}
            />
            {entry.label}
          </li>
        ))}
        <li className="flex items-center gap-1 text-[7.5px]">
          <span className="h-2 w-2 rotate-45 border border-slate-900 bg-white dark:border-white dark:bg-slate-900" />
          Milestone
        </li>
        {GANTT.milestones.map((milestone) => (
          <li key={milestone.id} className={cn("text-[7px]", MUTED)}>
            <span className="font-mono font-bold">{milestone.id}</span> {milestone.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
