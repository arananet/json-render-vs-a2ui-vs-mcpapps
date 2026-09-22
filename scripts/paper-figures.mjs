import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { root } from "./paper.mjs";

const quote = (value) => JSON.stringify(value).replaceAll("\\\\n", "\\n");

export function mermaidToDot(source) {
  const output = [
    "digraph figure {",
    'graph [rankdir=TB, bgcolor="white", pad=0.15, nodesep=0.25, ranksep=0.32, fontname="Arial", fontsize=15];',
    'node [shape=box, style=filled, fillcolor="white", color="#333333", fontname="Arial", fontsize=14, margin="0.14,0.10"];',
    'edge [color="#333333", fontname="Arial", fontsize=12, arrowsize=0.7];',
  ];
  const nodes = new Set();
  const edges = [];
  let groups = 0;
  let header = false;
  for (const original of source.split(/\r?\n/)) {
    const line = original.trim();
    if (!line) continue;
    if (line === "flowchart TB" && !header) {
      header = true;
      continue;
    }
    let match;
    if ((match = line.match(/^subgraph (\w+)\["([^"]+)"\]$/))) {
      output.push(`subgraph cluster_${match[1]} { label=${quote(match[2])}; color="#777777"; style=rounded; margin=14;`);
      groups += 1;
    } else if (line === "end" && groups > 0) {
      output.push("}");
      groups -= 1;
    } else if ((match = line.match(/^(\w+)(\[|\{)"([^"]+)"(\]|\})$/))) {
      if ((match[2] === "[") !== (match[4] === "]")) throw new Error(`Mismatched shape: ${line}`);
      if (nodes.has(match[1])) throw new Error(`Duplicate node: ${match[1]}`);
      nodes.add(match[1]);
      output.push(`${match[1]} [label=${quote(match[3])}, shape=${match[2] === "{" ? "diamond" : "box"}];`);
    } else if ((match = line.match(/^(\w+) (-->|-\.->|~~~)(?:\|([^|]+)\|)? (\w+)$/))) {
      edges.push([match[1], match[4]]);
      const style = { "-.->": "dashed", "-->": "solid", "~~~": "invis" }[match[2]];
      output.push(`${match[1]} -> ${match[4]} [style=${style}, label=${quote(match[3] ?? "")}];`);
    } else {
      throw new Error(`Unsupported Mermaid statement: ${line}`);
    }
  }
  if (!header || groups !== 0 || nodes.size === 0) throw new Error("Incomplete Mermaid flowchart");
  for (const [from, to] of edges) {
    if (!nodes.has(from) || !nodes.has(to)) throw new Error(`Unknown endpoint: ${from} -> ${to}`);
  }
  return [...output, "}"].join("\n") + "\n";
}

export function renderFigures() {
  for (const name of ["topology", "s2"]) {
    const stem = resolve(root, `paper/figures/${name}`);
    const dot = mermaidToDot(readFileSync(`${stem}.mmd`, "utf8"));
    writeFileSync(`${stem}.dot`, dot);
    for (const format of ["pdf", "svg"]) {
      const result = spawnSync("dot", [`-T${format}`, "-o", `${stem}.${format}`], {
        input: dot, encoding: "utf8", cwd: root,
      });
      if (result.error) throw result.error;
      if (result.status !== 0) throw new Error(`Graphviz failed: ${result.stderr}`);
      if (result.stderr) process.stderr.write(result.stderr);
    }
    process.stdout.write(`Rendered ${name}: Mermaid subset -> Graphviz -> PDF/SVG\n`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  renderFigures();
}
