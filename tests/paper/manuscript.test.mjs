import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const manuscriptPath = resolve(root, "paper/manuscript.md");
const manuscript = readFileSync(manuscriptPath, "utf8");

test("manuscript identifies the author, affiliation, and review state", () => {
  assert.match(manuscript, /^author: Eduardo Arana$/m);
  assert.match(manuscript, /^subtitle: Arananet$/m);
  assert.match(manuscript, /human review pending/);
});

test("H1 is bounded to the actual fixed-order S2 script and existing assertions", () => {
  assert.match(manuscript, /H1:/);
  assert.match(manuscript, /fixed-order identifier-collision probe, not actual concurrency or a scheduling benchmark/);
  const source = readFileSync(resolve(root, "src/scenarios/s2-fixed-order-collision.ts"), "utf8");
  const writes = [...source.matchAll(/await orchestrator\.emit\(SURFACE, "(risk|finance)", \{\s+id: "([^"]+)"/g)];
  assert.deepEqual(writes.map((match) => [match[1], match[2]]), [
    ["risk", "risk-detail"], ["finance", "finance-detail"],
    ["risk", "summary"], ["finance", "summary"],
  ]);
  assert.doesNotMatch(source, /Promise\.all\(/);
  assert.doesNotMatch(source, /concurrent|parallel|interleav|schedule/i);
  for (const section of ["# Research questions", "## A falsifiable local hypothesis", "## RQ2: Fixed-order identifier collision", "# Conclusion"]) {
    const text = manuscript.split(section)[1].split(/\n#{1,2} /)[0].replace(/\s+/g, " ");
    assert.match(text, /only the one specified sequential write order/i);
    assert.match(text, /cannot generalize to alternative orders, scheduling or concurrency/);
  }
});

test("relative manuscript evidence links resolve to retained local files", () => {
  const links = [...manuscript.matchAll(/\]\((\.\.?\/[^)#]+)(?:#[^)]*)?\)/g)];
  assert.ok(links.length >= 3);
  for (const match of links) {
    assert.ok(existsSync(resolve(dirname(manuscriptPath), match[1])), match[1]);
  }
});

test("manuscript contains the scientific and reproducibility sections", () => {
  for (const section of [
    "Abstract", "Introduction", "Research questions", "Methodology",
    "Bounded observed results", "Claim-evidence mapping", "Related work",
    "Threats to validity", "Reproducibility", "Conclusion",
    "AI-assistance disclosure", "References",
  ]) {
    assert.ok(manuscript.includes(`\n# ${section}\n`), section);
  }
  for (const reference of manuscript.matchAll(/\[R(\d+)\]/g)) {
    assert.ok(manuscript.includes(`\nR${reference[1]}. `), `Unresolved R${reference[1]}`);
  }
});

test("paper version claims match locked and installed SDKs", () => {
  const lock = JSON.parse(readFileSync(resolve(root, "package-lock.json"), "utf8"));
  for (const [name, version] of Object.entries({
    "@json-render/core": "0.21.0", "@json-render/react": "0.21.0",
    "@a2ui/web_core": "0.11.0", "@a2ui/lit": "0.11.0",
    "@modelcontextprotocol/ext-apps": "2.0.0",
    "@modelcontextprotocol/client": "2.0.0", "@modelcontextprotocol/core": "2.0.0",
    "@modelcontextprotocol/server": "2.0.0",
  })) {
    assert.equal(lock.packages[`node_modules/${name}`].version, version, name);
    const installed = JSON.parse(readFileSync(resolve(root, `node_modules/${name}/package.json`), "utf8"));
    assert.equal(installed.version, version, name);
    assert.ok(manuscript.includes(`\`${version}\``), version);
  }
});
