import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// The capability matrix figure is drawn from docs/COMPARISON.md, which
// `npm run report` generates from the recorded adapter traces and
// `npm run report:check` keeps fresh. Nothing in the figure is typed by hand.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Outcome label -> [short text, fill]. Each cell carries its text label, so
// the figure does not depend on colour alone.
export const OUTCOMES = {
  "supported": ["supported", "#d9f0d3"],
  "caveat": ["caveat", "#fff2b3"],
  "out-of-band": ["out-of-band", "#fde0c5"],
  "not expressible": ["not expressible", "#e8e8e8"],
  "enforced": ["enforced", "#cfe2f3"],
  "write lost": ["write lost", "#f4c7c3"],
  "separate instances in tested topology": ["separate instances", "#d9d2e9"],
};

export function matrixFromReport(markdown) {
  const section = markdown.split("## The matrix")[1];
  if (!section) throw new Error("docs/COMPARISON.md has no matrix section");
  const lines = section.split("\n").filter(line => line.startsWith("| "));
  const header = lines[0].split("|").slice(2, -1).map(cell => cell.trim());
  const rows = lines.slice(2).map(line => {
    const cells = line.split("|").slice(1, -1).map(cell => cell.trim());
    const capability = cells[0].match(/\*\*(.+?)\*\*/)?.[1];
    if (!capability) throw new Error(`Unreadable matrix row: ${line}`);
    const outcomes = cells.slice(1).map(cell => {
      const label = cell.replace(/^[^\p{L}]+/u, "").trim();
      if (!(label in OUTCOMES)) throw new Error(`Unknown outcome '${cell}' in row '${capability}'`);
      return label;
    });
    return { capability, outcomes };
  });
  if (rows.length === 0 || header.length !== 3) throw new Error("Unexpected matrix shape");
  return { configurations: header, rows };
}

const escape = text => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function matrixToDot({ configurations, rows }) {
  const cell = (text, attrs = "") => `<td ${attrs}>${escape(text)}</td>`;
  const head = `<tr>${cell("Capability (adapter classification)", 'align="left"')}${configurations
    .map(name => cell(name, 'bgcolor="#f5f5f5"')).join("")}</tr>`;
  const body = rows.map(({ capability, outcomes }) =>
    `<tr>${cell(capability, 'align="left"')}${outcomes
      .map(label => cell(OUTCOMES[label][0], `bgcolor="${OUTCOMES[label][1]}"`)).join("")}</tr>`,
  ).join("\n");
  return [
    "digraph matrix {",
    'graph [margin=0, pad=0.05];',
    'node [shape=plaintext, fontname="Helvetica", fontsize=11];',
    `matrix [label=<<table border="0" cellborder="1" cellspacing="0" cellpadding="6">`,
    head,
    body,
    "</table>>];",
    "}",
    "",
  ].join("\n");
}

export function renderMatrix() {
  const report = readFileSync(resolve(root, "docs/COMPARISON.md"), "utf8");
  const dot = matrixToDot(matrixFromReport(report));
  const stem = resolve(root, "paper/figures/matrix");
  writeFileSync(`${stem}.dot`, dot);
  for (const format of ["pdf", "svg"]) {
    const result = spawnSync("dot", [`-T${format}`, "-o", `${stem}.${format}`], {
      input: dot, encoding: "utf8", cwd: root,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Graphviz failed: ${result.stderr}`);
  }
  process.stdout.write("Rendered matrix: docs/COMPARISON.md -> Graphviz -> PDF/SVG\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  renderMatrix();
}
