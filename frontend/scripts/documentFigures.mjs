import {
  bulletsBySubheading,
  column,
  findTable,
  leadingNumber,
  requirementIds,
  subheadings,
  tables,
  tally,
} from "./documentData.mjs";

/**
 * Which figures each document carries, and where they go.
 *
 * An entry is `{ anchor, spec }`: `anchor` is the opening of a heading in that
 * document, and the figure is placed after the first paragraph beneath it — so
 * a section still introduces itself in words before it is drawn.
 *
 * Specs are built from the document's own Markdown by the extractors in
 * `documentData.mjs`, so the numbers in a figure are the numbers in the text.
 * A builder that cannot find its data returns `null` and the figure is dropped:
 * a document that has been restructured loses a diagram, which is recoverable,
 * rather than gaining a wrong one, which is not.
 */

/** "Delivered (indicator matching pending)" and "Delivered" are one status. */
function baseStatus(value) {
  return value.split("(")[0].replace(/[*]/g, "").trim();
}

function count(markdown, pattern) {
  return [...markdown.matchAll(pattern)].length;
}

/* ------------------------------------------------------- requirements -- */

function requirementsFigures(markdown) {
  const ids = requirementIds(markdown);
  const modules = [...markdown.matchAll(/^\*\s+(.+?)\s+module\s*$/gim)].map((match) => match[1]);
  const qualities = bulletsBySubheading(markdown, "Non-Functional Requirements \\(NFRs\\)");
  const nonFunctional = qualities ? qualities.reduce((sum, entry) => sum + entry.value, 0) : null;

  const figures = [];

  figures.push({
    anchor: "Project Brief",
    spec: {
      kind: "stats",
      title: "The requirements baseline at a glance",
      caption:
        "The size of the commissioned system, counted from this document: the modules it is divided into, the behaviour it must exhibit, and the qualities that behaviour must have.",
      items: [
        { value: modules.length, label: "System modules", sub: "The functional decomposition" },
        { value: ids.length, label: "Functional requirements", sub: `FR1–FR${ids[ids.length - 1] ?? 0}` },
        { value: nonFunctional ?? "—", label: "Non-functional requirements", sub: "The qualities that behaviour must have" },
        {
          value: qualities ? qualities.length : "—",
          label: "Quality attributes",
          sub: "Performance through compliance",
        },
      ],
    },
  });

  if (modules.length > 0) {
    figures.push({
      anchor: "System Features",
      /* After the list it summarises, not before it. */
      place: "end",
      spec: {
        kind: "grid",
        title: "The module map",
        caption:
          "Every module the client brief divides the system into. Each one owns its own data and its own rules; a module never reaches into another module's tables.",
        items: modules.map((label) => ({ label })),
      },
    });
  }

  if (qualities) {
    figures.push({
      anchor: "Non-Functional Requirements",
      spec: {
        kind: "donut",
        title: "Non-functional requirements by quality attribute",
        caption:
          "Where the quality burden actually falls. Security and compliance together outweigh performance, which is what a service handling reports of fraud should expect.",
        slices: qualities,
      },
    });
  }

  return figures;
}

/* ------------------------------------------------------- architecture -- */

/**
 * What each layer is built from.
 *
 * The layer *names* are read out of the document — it gives each one its own
 * section — so the stack can never show a layer the architecture no longer has.
 * Only the technology beneath each name is stated here, and a layer with no
 * entry simply draws without one.
 */
const LAYER_ITEMS = {
  "Frontend Layer": ["React", "Vite", "Tailwind", "Framer Motion"],
  "API Layer": ["Express", "Routing", "Validation", "Rate limiting"],
  "Business Layer": ["Services", "Domain rules", "Orchestration"],
  "Database Layer": ["PostgreSQL", "Migrations", "Audit trail"],
  "AI Intelligence Layer": ["NLP", "Computer vision", "Threat intelligence", "Recommendations"],
};

function architectureFigures(markdown) {
  const principles = subheadings(markdown, "Architectural Principles");
  const phases = [...markdown.matchAll(/^##\s+(Phase\s+\d+)\s*$\n+([\s\S]*?)(?=^#{1,2}\s|\n---)/gm)];
  const pipelines = count(markdown, /^#\s+.*Pipeline\s*$/gm);
  const layers = [...markdown.matchAll(/^#\s+(.+?\sLayer)\s*$/gm)].map((match) => ({
    name: match[1],
    items: LAYER_ITEMS[match[1]] ?? [],
  }));

  const figures = [
    {
      anchor: "Executive Summary",
      spec: {
        kind: "stats",
        title: "The shape of the system",
        caption:
          "A modular monolith with service-oriented boundaries: one deployable unit today, drawn along the seams it would be split on tomorrow.",
        items: [
          { value: layers.length || "—", label: "Architectural layers", sub: "Each defined in its own section" },
          { value: principles?.length || "—", label: "Architectural principles", sub: "Applied to every module" },
          { value: pipelines || "—", label: "Processing pipelines", sub: "Evidence, analysis, URL, analytics" },
          { value: phases.length || "—", label: "Scalability phases", sub: "Single container to multi-region" },
        ],
      },
    },
  ];

  if (layers.length > 0) {
    figures.push({
      anchor: "Layered Architecture",
      spec: {
        kind: "layers",
        title: "The layer stack",
        caption:
          "Each layer may call only the layer beneath it. The rule is what keeps a change to the database from reaching the browser, and what lets the AI layer be replaced without touching the business rules.",
        layers,
      },
    });
  }

  if (phases.length > 0) {
    figures.push({
      anchor: "Scalability Strategy",
      spec: {
        kind: "timeline",
        title: "The scalability roadmap",
        caption:
          "Growth is staged rather than designed in up front. Each phase is entered when the previous one is measurably the constraint — not before, because capacity nobody needs is cost nobody approved.",
        items: phases.map((match, index) => ({
          when: match[1],
          what: firstLine(match[2]),
          note: bulletList(match[2]),
          state: index === 0 ? "Current" : "Planned",
        })),
      },
    });
  }

  return figures;
}

/** The first sentence of a phase block, used as its heading in the timeline. */
function firstLine(block) {
  const line = block
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.length > 0 && !entry.startsWith("-") && !entry.startsWith("```"));

  return line ? line.replace(/[.:]$/, "") : "—";
}

/** The bullets beneath it, joined into the timeline's supporting line. */
function bulletList(block) {
  const items = [...block.matchAll(/^\s*[-*]\s+(.+)$/gm)].map((match) => match[1].trim());
  const plain = block
    .split("\n")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && !entry.startsWith("-") && !entry.startsWith("```"));

  const rest = items.length > 0 ? items : plain.slice(1);
  return rest.length > 0 ? rest.join(" · ") : undefined;
}

/* ----------------------------------------------------------------- SRS -- */

function srsFigures(markdown) {
  const ids = requirementIds(markdown);
  const baseline = ids.filter((id) => id <= 72);
  const enhanced = ids.filter((id) => id > 72);
  const modules = count(markdown, /^##\s+5\.\d+\s+Module\s+\d+/gm);
  const findings = count(markdown, /^##\s+4\.\d+\s+Finding\s+\d+/gm);

  const figures = [
    {
      anchor: "1.1 Purpose",
      spec: {
        kind: "stats",
        title: "What this specification carries",
        caption:
          "The approved baseline and the proposed extension are counted separately throughout, because only one of the two has been authorised.",
        items: [
          { value: baseline.length, label: "Baseline requirements", sub: "Approved — FR1–FR72" },
          { value: enhanced.length || "—", label: "Enhanced requirements", sub: "Proposed — awaiting approval" },
          { value: modules || "—", label: "Functional modules", sub: "Each with acceptance criteria" },
          { value: findings || "—", label: "Conformance findings", sub: "Raised against the client brief" },
        ],
      },
    },
  ];

  /*
   * Section 5 carries one table per module, and every requirement in it ends
   * with a status marker. Read together they are the delivery position of the
   * whole baseline — a number this document states requirement by requirement
   * but never totals, which is exactly what a chart is for.
   */
  const moduleTables = tables(markdown).filter((table) => /^5\.\d+\s+Module\s+\d+/.test(table.heading));
  const marks = moduleTables.flatMap((table) => column(table, "Status") ?? []);

  if (marks.length > 0) {
    figures.push({
      anchor: "5. Functional requirements",
      spec: {
        kind: "donut",
        title: "The baseline by build status",
        caption:
          "Specification is not delivery. Most of this document describes behaviour that is specified, with its database tables built and migrated, and no interface yet — and it says so rather than reporting completion.",
        slices: tally(marks, buildStatus),
      },
    });

    figures.push({
      anchor: "5.1 Module 1",
      spec: {
        kind: "bars",
        title: "Requirements implemented, by module",
        unit: "Requirements passing their acceptance criterion, out of six per module",
        caption:
          "Delivery has gone depth-first: the two modules a resident touches without an account are complete, and the rest wait behind them.",
        series: moduleTables.map((table) => ({
          label: table.heading.replace(/^5\.\d+\s+Module\s+\d+\s+—\s+/, ""),
          value: (column(table, "Status") ?? []).filter((mark) => buildStatus(mark) === "Implemented").length,
        })),
      },
    });
  }

  return figures;
}

/**
 * The specification marks each requirement with a symbol. Colour and symbol
 * are never the only carrier here — each one resolves to a written status, and
 * that written status is what the legend and the screen reader get.
 */
function buildStatus(mark) {
  if (mark.startsWith("✅")) { return "Implemented"; }
  if (mark.startsWith("🟡")) { return "Partly implemented"; }
  if (mark.startsWith("⚠️")) { return "At risk"; }
  if (mark.startsWith("⬜")) { return "Specified, not built"; }
  return "Other";
}

/* ------------------------------------------------- features and plan -- */

function featuresFigures(markdown) {
  const figures = [];

  const position = findTable(markdown, { heading: "Current status", columns: ["Measure", "Position"] });

  if (position) {
    figures.push({
      anchor: "1. Purpose of this document",
      spec: {
        kind: "stats",
        title: "Where the project has actually got to",
        caption:
          "Taken from the status table later in this document. The gap between what is specified and what a resident can use today is stated plainly, because a delivery record that reports intent as achievement is not a record.",
        items: position.rows.slice(0, 4).map((row) => ({
          value: leadingNumber(row[1] ?? "") ?? row[1],
          label: row[0],
          sub: /\(([^)]+)\)/.exec(row[1] ?? "")?.[1],
        })),
      },
    });
  }

  const modules = findTable(markdown, { heading: "modules", columns: ["Module", "Status"] });
  const statuses = modules ? column(modules, "Status") : null;

  if (statuses) {
    figures.push({
      anchor: "5. The twelve functional modules",
      place: "end",
      spec: {
        kind: "donut",
        title: "The twelve modules by delivery state",
        caption:
          "Two modules are in a resident's hands. Two more are partly there. The remaining eight are specified, with their database tables built and migrated, and no interface yet.",
        slices: tally(statuses, baseStatus),
      },
    });
  }

  const deliverables = findTable(markdown, { heading: "Deliverables", columns: ["Deliverable", "Date"] });

  if (deliverables) {
    figures.push({
      anchor: "7. Deliverables",
      place: "end",
      spec: {
        kind: "timeline",
        title: "The deliverable register",
        caption:
          "Every artefact the project owes its client, with the state each one is actually in. Two are late; both are named here rather than left to be discovered.",
        items: deliverables.rows.map((row) => ({
          when: row[3] ?? "",
          what: `${row[0]} — ${row[1]}`,
          note: row[2] ? `Milestone ${row[2]}` : undefined,
          state: baseStatus(row[4] ?? "Planned"),
        })),
      },
    });
  }

  const schedule = findTable(markdown, { heading: "Delivery schedule", columns: ["Milestone", "Date"] });

  if (schedule) {
    figures.push({
      anchor: "8. Delivery schedule",
      place: "end",
      spec: {
        kind: "timeline",
        title: "The delivery schedule",
        caption:
          "Twenty-two weeks, milestone by milestone. Modules 3 and 4 landed ahead of schedule; the enhanced requirements approval did not, and everything behind it moves with it.",
        items: schedule.rows.map((row) => ({
          when: `${row[0]} · ${row[2] ?? ""}`.trim(),
          what: row[1] ?? "",
          state: baseStatus(row[3] ?? "Planned"),
        })),
      },
    });
  }

  return figures;
}

const REGISTER = {
  "project-requirements": requirementsFigures,
  "architecture-and-system-design": architectureFigures,
  "final-srs-report": srsFigures,
  "project-features-and-deliverables": featuresFigures,
};

/** The figures for one document, with anything undrawable already dropped. */
export function figuresFor(id, markdown) {
  const build = REGISTER[id];

  if (!build) {
    return [];
  }

  return build(markdown).filter((entry) => hasData(entry.spec));
}

function hasData(spec) {
  const rows = spec.items ?? spec.slices ?? spec.layers ?? spec.steps ?? spec.series ?? [];
  return rows.length > 0;
}
