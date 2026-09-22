import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, lstatSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(resolve(root, path));
function walk(directory) {
  return readdirSync(resolve(root, directory)).sort().flatMap(name => {
    const path = `${directory}/${name}`;
    const stat = lstatSync(resolve(root, path));
    assert.ok(!stat.isSymbolicLink(), `Unexpected symlink: ${path}`);
    return stat.isDirectory() ? walk(path) : [path];
  });
}

export function browserInputFiles() {
  return ["package.json", "package-lock.json", "playwright.config.ts", "vite.config.ts", "tsconfig.json",
    "scripts/paper-browser-evidence.mjs", "scripts/paper-browser-run.sh",
    ...walk("src"), ...walk("web"), ...walk("tests/browser")].sort();
}

export function captureInputs(includeBuild = false) {
  return {
    schema: 1, capturedAt: new Date().toISOString(), node: process.version,
    sources: Object.fromEntries(browserInputFiles().map(path => [path, hash(read(path))])),
    ...(includeBuild ? { build: Object.fromEntries(walk("dist-web").map(path => [path, hash(read(path))])) } : {}),
  };
}

// These are local execution records, not signed attestations or independent reproduction.
export function validateBrowserEvidence(directory) {
  assert.ok(directory?.startsWith("paper/evidence/") && !directory.split("/").includes(".."),
    "Set PAPER_BROWSER_EVIDENCE to a fresh paper/evidence/ directory from the outer-terminal run; pre-rename evidence cannot substantiate current sources");
  const json = name => JSON.parse(read(`${directory}/${name}`));
  let before, built, after, environment;
  try {
    before = json("source-before.json"); built = json("built-before.json"); after = json("source-after.json");
    environment = json("environment.json");
  } catch (error) {
    throw new Error(`Browser provenance gap: fresh source/build snapshots required; pre-rename evidence cannot substantiate current sources (${error.message})`);
  }
  const provenance = read(`${directory}/provenance.txt`).toString().split("\n");
  assert.match(provenance[1] ?? "", /^[a-f0-9]{40}$/);
  assert.equal(environment.head, provenance[1], "Environment and provenance HEAD differ");
  const current = captureInputs().sources;
  for (const snapshot of [before, built, after]) assert.deepEqual(snapshot.sources, current, "Browser source hashes are stale or incomplete");
  assert.ok(Object.keys(built.build ?? {}).length > 0, "Missing built Vite asset hashes");
  assert.deepEqual(built.build, after.build, "Built browser assets changed during execution");
  assert.match(read(`${directory}/exit-status.txt`).toString(), /^PLAYWRIGHT_EXIT_CODE=0\n$/);
  const report = json("playwright-ipv4.json");
  assert.equal(report.stats.expected, 18);
  for (const key of ["unexpected", "flaky", "skipped"]) assert.equal(report.stats[key], 0);
  assert.deepEqual(report.errors, []);
  const specs = [];
  const visit = suites => suites.forEach(suite => { specs.push(...(suite.specs ?? [])); visit(suite.suites ?? []); });
  visit(report.suites);
  for (const file of ["render.spec.ts", "screenshots.spec.ts"]) {
    const selected = specs.filter(spec => spec.file === file);
    assert.equal(selected.length, 9, file);
    for (const spec of selected) for (const execution of spec.tests) {
      assert.equal(execution.status, "expected");
      assert.ok(execution.results.length > 0 && execution.results.every(result => result.status === "passed"));
    }
  }
  assert.ok(JSON.stringify(report.suites).includes("S2 — fixed-order identifier collision"), "Report predates S2 rename");
  const start = Date.parse(report.stats.startTime);
  assert.ok(Date.parse(before.capturedAt) <= Date.parse(built.capturedAt) && Date.parse(built.capturedAt) <= start);
  assert.ok(start + report.stats.duration <= Date.parse(after.capturedAt), "Execution must precede final snapshot");
  const archive = resolve(root, directory, "ipv4-post-run-screenshots.tar");
  const names = execFileSync("tar", ["-tf", archive], { encoding: "utf8" }).trim().split("\n");
  const lines = read(`${directory}/ipv4-post-run-screenshots.sha256`).toString().trim().split("\n");
  const expectedNames = [1, 2, 3].flatMap(n => ["json-render", "a2ui", "mcp-apps"].map(p => `docs/screenshots/s${n}-${p}.png`)).sort();
  assert.equal(lines.length, 9);
  assert.deepEqual(names.filter(name => !name.endsWith("/")).sort(), expectedNames);
  const paths = [];
  for (const line of lines) {
    const match = line.match(/^([a-f0-9]{64})\s+(docs\/screenshots\/s[123]-(?:json-render|a2ui|mcp-apps)\.png)$/);
    assert.ok(match, "Invalid capture hash path");
    paths.push(match[2]);
    assert.equal(hash(execFileSync("tar", ["-xOf", archive, match[2]])), match[1], match[2]);
  }
  assert.deepEqual(paths.sort(), expectedNames);
  return { status: "current-source-browser-execution", directory, head: environment.head, sources: current, build: built.build };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, destination] = process.argv.slice(2);
  if (!["source", "built"].includes(mode) || !destination) throw new Error("Usage: paper-browser-evidence.mjs <source|built> <snapshot.json>");
  writeFileSync(destination, JSON.stringify(captureInputs(mode === "built"), null, 2) + "\n", { flag: "wx" });
}
