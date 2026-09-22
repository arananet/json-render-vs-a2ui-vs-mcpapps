import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import test from "node:test";
import { root } from "../../scripts/paper.mjs";

const paper = resolve(root, "paper");
const config = JSON.parse(execFileSync("ruby", [
  "-ryaml", "-rjson", "-e", "puts JSON.generate(YAML.safe_load(File.read(ARGV.fetch(0))))",
  resolve(paper, "veritas.yaml"),
], { encoding: "utf8" }));
const paths = config.artifact.paths;
const evidence = "evidence/editorial-20260921";
const reviewEvidence = "evidence/veritas-review-20260922";

test("Veritas inputs are explicit local files with one canonical manuscript", () => {
  assert.equal(new Set(paths).size, paths.length);
  assert.deepEqual(paths.filter(path => /manuscript\.(?:md|tex|pdf)$/.test(path)), ["manuscript.md"]);
  for (const path of paths) {
    assert.doesNotMatch(path, /[?*\[\]]|(?:^|\/)previous\/|extracted-text|engine-log/);
    const target = resolve(paper, path);
    const repositoryPath = relative(root, target);
    assert.ok(!isAbsolute(repositoryPath) && !repositoryPath.startsWith(".."), path);
    assert.ok(statSync(target).isFile(), path);
  }
});

test("Veritas retains current check evidence, failures and partial-claim assertions", () => {
  for (const path of [
    `${evidence}/environment-worktree.txt`, `${evidence}/npm-test.txt`,
    `${evidence}/final-paper-checks.txt`, `${evidence}/browser.txt`,
    `${evidence}/report-check.txt`, `${evidence}/reference-access.md`,
    "../tests/protocol/scenarios.test.ts", "../tests/browser/render.spec.ts",
    "../src/adapters/mcp-apps/adapter.ts", "../src/adapters/mcp-apps/host.ts",
  ]) assert.ok(paths.includes(path), path);
  for (const name of ["browser.txt", "report-check.txt"]) {
    assert.match(readFileSync(resolve(paper, evidence, name), "utf8"), /EPERM/);
  }
});

test("actual Veritas files listing exactly matches the configured selection", () => {
  const listing = JSON.parse(readFileSync(resolve(paper, reviewEvidence, "files-after.json"), "utf8"));
  assert.deepEqual(listing.paths, paths);
  const listed = listing.files.map(entry => relative(listing.artifact, resolve(listing.artifact, entry.path))).sort();
  assert.deepEqual(listed, [...paths].sort());
});

test("private build/test review views are exact copies of the existing local sources", () => {
  const manifest = JSON.parse(readFileSync(resolve(paper, reviewEvidence, "private-package.json"), "utf8"));
  assert.equal(manifest.publiclyDistributed, false);
  assert.equal(manifest.independentReproduction, false);
  assert.equal(manifest.sourceViews.length, 11);
  for (const entry of manifest.sourceViews) {
    const source = readFileSync(resolve(root, entry.source));
    const view = readFileSync(resolve(paper, entry.view));
    assert.deepEqual(view, source, entry.source);
    assert.equal(createHash("sha256").update(source).digest("hex"), entry.sha256, entry.source);
    assert.ok(paths.includes(entry.view), entry.view);
    assert.ok(!paths.includes(relative(paper, resolve(root, entry.source))), entry.source);
  }
});

test("execution record and private-package provenance are selected without publishing inputs", () => {
  for (const path of ["EXECUTION.md", "template.tex", "figures/README.md", `${reviewEvidence}/private-package.json`]) {
    assert.ok(paths.includes(path), path);
  }
  const ignored = execFileSync("git", ["check-ignore", "paper/veritas.yaml", "scripts/paper.mjs", "scripts/paper-figures.mjs", "tests/paper/veritas-inputs.test.mjs"], { cwd: root, encoding: "utf8" });
  assert.equal(ignored.trim().split("\n").length, 4);
});

test("only artifact paths changed; gates, permissions, model and limit settings are preserved", () => {
  const before = JSON.parse(execFileSync("ruby", [
    "-ryaml", "-rjson", "-e", "puts JSON.generate(YAML.safe_load(File.read(ARGV.fetch(0))))",
    resolve(paper, reviewEvidence, "before/veritas.yaml"),
  ], { encoding: "utf8" }));
  const withoutPaths = value => ({ ...value, artifact: { ...value.artifact, paths: [] } });
  assert.deepEqual(withoutPaths(config), withoutPaths(before));
});
