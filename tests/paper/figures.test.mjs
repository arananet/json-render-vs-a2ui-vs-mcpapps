import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { mermaidToDot } from "../../scripts/paper-figures.mjs";
import { OUTCOMES, matrixFromReport, matrixToDot } from "../../scripts/paper-matrix.mjs";
import { root } from "../../scripts/paper.mjs";

const read = (path) => readFileSync(resolve(root, path), "utf8");

test("Mermaid conversion preserves labels, groups, decisions, and dashed edges", () => {
  const dot = mermaidToDot('flowchart TB\nsubgraph scope["Local"]\nsource["First\\nline"]\ntarget{"Check"}\nsource -.->|policy| target\nend');
  assert.match(dot, /subgraph cluster_scope/);
  assert.ok(dot.includes('label="First\\nline"'));
  assert.match(dot, /shape=diamond/);
  assert.match(dot, /source -> target \[style=dashed, label="policy"\]/);
});

test("unsupported or invalid Mermaid fails rather than silently changing a figure", () => {
  for (const source of [
    'flowchart LR\nnode["A"]',
    'flowchart TB\nnode["A"]\nnode --> missing',
    'flowchart TB\nnode["A"]\nstyle node fill:red',
    'flowchart TB\nsubgraph group["G"]\nnode["A"]',
  ]) assert.throws(() => mermaidToDot(source));
});

test("editable Mermaid and generated DOT correspond", () => {
  for (const name of ["topology", "s2"]) {
    assert.equal(read(`paper/figures/${name}.dot`), mermaidToDot(read(`paper/figures/${name}.mmd`)));
    assert.ok(readFileSync(resolve(root, `paper/figures/${name}.pdf`)).subarray(0, 5).equals(Buffer.from("%PDF-")));
  }
});

test("S2 figure order and retained values match the scenario and existing assertions", () => {
  const figure = read("paper/figures/s2.mmd");
  const source = read("src/scenarios/s2-fixed-order-collision.ts");
  const writes = [...source.matchAll(/await orchestrator\.emit\(SURFACE, "(risk|finance)", \{\s+id: "([^"]+)"/g)];
  writes.forEach((match, index) => assert.ok(figure.includes(`${index + 1}. ${match[1]} writes ${match[2]}`)));
  for (const value of ["Exposure exceeds appetite", "Spend is within budget"]) {
    assert.ok(figure.includes(value));
    assert.ok(source.includes(value));
    assert.ok(read("tests/protocol/scenarios.test.ts").includes(value));
  }
  assert.match(figure, /first --> second\s+second --> third\s+third --> fourth/);
  assert.match(figure, /A2UI DOM: finance visible\\nrisk absent; no node count/);
  const report = JSON.parse(read("paper/evidence/browser-terminal-20260922T013449Z-zH4HTK/playwright-ipv4.json"));
  assert.equal(report.stats.expected, 18);
  assert.equal(report.stats.unexpected, 0);
  assert.match(read("paper/figures/README.md"), /supports only pre-rename observations/);
});

test("topology states the local identity bound and correct enforcement installation order", () => {
  const figure = read("paper/figures/topology.mmd");
  assert.match(figure, /Connection-to-agent\\nmapping is local/);
  assert.match(figure, /AFTER\\nbridge.connect/);
  assert.match(figure, /permissive default:\\nforwards model-only call/);
  const host = read("src/adapters/mcp-apps/host.ts");
  assert.match(host, /await Promise\.all\(\[bridge\.connect\(hostSide\), app\.connect\(appSide\)\]\);\s+enforce\(\);/);
});

test("capability matrix figure is generated from the traced comparison report", () => {
  const matrix = matrixFromReport(read("docs/COMPARISON.md"));
  assert.deepEqual(matrix.configurations, ["json-render", "A2UI", "MCP Apps"]);
  assert.equal(matrix.rows.length, 7);
  assert.equal(read("paper/figures/matrix.dot"), matrixToDot(matrix));
  assert.ok(readFileSync(resolve(root, "paper/figures/matrix.pdf")).subarray(0, 5).equals(Buffer.from("%PDF-")));
  const collision = matrix.rows.find(row => row.capability.startsWith("Retain both summaries"));
  assert.deepEqual(collision.outcomes, ["write lost", "write lost", "separate instances in tested topology"]);
  const dot = matrixToDot(matrix);
  for (const row of matrix.rows) for (const label of row.outcomes) assert.ok(dot.includes(OUTCOMES[label][0]));
  assert.throws(() => matrixFromReport("## The matrix\n| A | B | C | D |\n| - | - | - | - |\n| **x** | ? | ? | ? |\n"));
});
