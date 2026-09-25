import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { root } from "../../scripts/paper.mjs";

const manuscript = readFileSync(resolve(root, "paper/manuscript.md"), "utf8");
const abstract = manuscript.split("# Abstract\n")[1].split("\n# Introduction")[0].replace(/\s+/g, " ");

test("abstract leads with configuration-specific findings and their interpretation", () => {
  assert.match(abstract, /^ Under the tested configurations and one fixed write order/);
  assert.match(abstract, /overwrites in the shared json-render and A2UI mappings and is retained in separate MCP App instances/);
  assert.match(abstract, /tested configurations/);
  assert.match(abstract, /adapter mapping, namespace\/topology, and enforcement site/);
  assert.match(abstract, /installed enforcing host handler rejects one model-only tool call; SDK-default `oncalltool` forwards/);
  assert.match(abstract, /empirical technical note with private local evidence/);
  assert.match(abstract, /does not validate the Node four-write scenario/);
  assert.match(abstract, /Node assertions establish the four-write outcome/);
  assert.match(abstract, /corroborates the rendered outcome only for that fixture/);
});

test("abstract and claim table support concrete C3 while retaining partial C6/C7 and proposed C9", () => {
  const claims = [...manuscript.matchAll(/^\| (C\d+)[^|]*\| (Supported|Partial|Proposed) \|/gm)];
  assert.equal(claims.length, 9);
  const statuses = Object.fromEntries(claims.map(match => [match[1], match[2]]));
  assert.equal(statuses.C3, "Supported");
  assert.equal(statuses.C6, "Partial");
  assert.equal(statuses.C7, "Partial");
  assert.equal(statuses.C9, "Proposed");
  assert.match(abstract, /finance's headline visible and risk's absent/);
  assert.match(abstract, /every intended control owner remains partial/);
  assert.match(abstract, /intervention remains proposed, not performed/);
});

test("results, S2 caption and conclusion distinguish writer maps from rendered evidence", () => {
  assert.match(manuscript, /H1 has fixture-specific support/);
  const caption = manuscript.match(/!\[(S2[^\]]+)\]/)[1];
  assert.match(caption, /finance's headline visible and risk's absent/);
  assert.match(caption, /C3, supported/);
  assert.match(caption, /not an exact node count/);
  const conclusion = manuscript.split("# Conclusion\n")[1].split("\n# AI-assistance disclosure")[0].replace(/\s+/g, " ");
  assert.match(conclusion, /Under the tested configurations and one fixed write order/);
  assert.match(conclusion, /overwrites in the shared json-render and A2UI mappings and is retained in separate MCP App instances/);
  assert.match(conclusion, /cannot validate the Node four-write fixture/);
  assert.match(conclusion, /every control remains only partially checked/);
  assert.match(conclusion, /Future experiments are explicitly pending/);
  assert.match(conclusion, /Protocol effects cannot be separated from adapter and topology here/);
});

test("browser MCP executes only summaries while Node S2 has four sequential writes", () => {
  const read = path => readFileSync(resolve(root, path), "utf8");
  const node = read("src/scenarios/s2-fixed-order-collision.ts");
  const browser = read("web/mcp-apps.ts").split('"s2-fixed-order-collision": [')[1].split('"s3-action-roundtrip"')[0];
  assert.deepEqual([...node.matchAll(/await orchestrator\.emit\(SURFACE, "(\w+)", \{\s+id: "([^"]+)"/g)].map(m => [m[1], m[2]]), [
    ["risk", "risk-detail"], ["finance", "finance-detail"], ["risk", "summary"], ["finance", "summary"],
  ]);
  assert.deepEqual([...browser.matchAll(/agent: "(\w+)",\s+block: \{\s+id: "([^"]+)"/g)].map(m => [m[1], m[2]]), [
    ["risk", "summary"], ["finance", "summary"],
  ]);
  assert.match(manuscript, /Every browser run instead exercises a separate two-write summary fixture/);
  for (const host of ["web/a2ui.ts", "web/json-render.tsx"]) {
    assert.match(read(host), /"s2-fixed-order-collision": runFixedOrderCollision/);
  }
});

test("pre-rename browser evidence is historical while the current run verifies the renamed fixture", () => {
  const directory = resolve(root, "paper/evidence/browser-terminal-20260922T013449Z-zH4HTK");
  const report = JSON.parse(readFileSync(resolve(directory, "playwright-ipv4.json"), "utf8"));
  assert.equal(report.stats.expected, 18);
  for (const key of ["unexpected", "flaky", "skipped"]) assert.equal(report.stats[key], 0);
  assert.deepEqual(report.errors, []);
  assert.match(manuscript, /pre-rename `browser-terminal-20260922T013449Z-zH4HTK\/` records are historical\s+only and are not claim-support evidence for this fixture/);
  assert.match(manuscript, /\[current browser run\]\(\.\/evidence\/current-browser-run\/\).*?bind the\s+current browser claim for this fixture/s);
  const specs = [];
  const visit = suites => suites.forEach(suite => { specs.push(...(suite.specs ?? [])); visit(suite.suites ?? []); });
  visit(report.suites);
  for (const file of ["render.spec.ts", "screenshots.spec.ts"]) {
    const selected = specs.filter(spec => spec.file === file);
    assert.equal(selected.length, 9);
    for (const spec of selected) for (const test of spec.tests) {
      assert.equal(test.status, "expected");
      assert.ok(test.results.every(result => result.status === "passed"));
    }
  }
  const source = readFileSync(resolve(root, "tests/browser/render.spec.ts"), "utf8");
  const a2ui = source.split('test("A2UI: finance\'s headline visible')[1].split('\n  test(')[0];
  assert.match(a2ui, /getByText\("Spend is within budget"\)\)\.toBeVisible\(\)/);
  assert.match(a2ui, /getByText\("Exposure exceeds appetite"\)\)\.toHaveCount\(0\)/);
  assert.doesNotMatch(a2ui, /toHaveCount\(1\)/);
  assert.match(manuscript, /18 passed tests: nine render assertions and nine screenshot tests/);
  assert.match(manuscript, /does not assert an exact summary node count/);
  assert.match(manuscript, /do not\nestablish historical reproduction/);
});

test("manuscript removes agent-to-user narration without claiming human review", () => {
  assert.doesNotMatch(manuscript, /at the user.s request|user.s description|credited there to Eduardo|invocation request|catalog description/i);
  const disclosure = manuscript.split("# AI-assistance disclosure\n")[1].split("\n# References")[0].replace(/\s+/g, " ");
  assert.match(disclosure, /OpenAI Codex coding assistant/);
  assert.match(disclosure, /Human scientific and editorial review remains pending/);
  assert.match(disclosure, /no LLM participates/);
});

test("unverified reference and historical commit provenance are explicit", () => {
  const normalized = manuscript.replace(/\s+/g, " ");
  assert.match(normalized, /Reference review remains pending/);
  assert.match(normalized, /Inputs, tooling, and evaluation configuration are versioned now; commit-level provenance before 22 September 2026 does not identify the complete paper workspace/);
  assert.match(normalized, /Separate paper checks and SHA-256 manifests/);
});
