import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = path => readFileSync(resolve(root, path), "utf8");

test("frozen paper snapshots match their registry hashes", () => {
  const manifest = JSON.parse(read("paper/versions/manifest.json"));
  assert.equal(manifest.canonicalEditableSource, "paper/manuscript.md");
  assert.equal(manifest.versions.length, 1);
  for (const version of manifest.versions) {
    assert.equal(version.kind, "populated");
    const bytes = readFileSync(resolve(root, version.path));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), version.sha256);
  }
});

test("research governance is explicit about pending provenance and no DOI", () => {
  for (const path of ["FINAL-AUDIT.md", "NOVELTY.md", "prereg/README.md", "prereg/prereg-p5-v1.md", "docs/adr/0002-freeze-research-manuscript-versions.md", "docs/adr/0003-commit-order-precedence.md"]) {
    assert.ok(existsSync(resolve(root, path)), path);
  }
  const audit = read("FINAL-AUDIT.md");
  assert.match(audit, /not a final approval/);
  assert.match(audit, /cannot\s+attest the renamed fixture/);
  assert.match(audit, /current-source and build hashes, 18 passing tests/);
  assert.match(audit, /No Git commit, tag, push/);
  assert.match(read("README.md"), /no project DOI\s+yet/);
  assert.match(read("prereg/prereg-p5-v1.md"), /not a preregistration of completed runs/);
});