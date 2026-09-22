import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { root } from "../../scripts/paper.mjs";
import { browserInputFiles, validateBrowserEvidence } from "../../scripts/paper-browser-evidence.mjs";

const historical = "paper/evidence/browser-terminal-20260922T013449Z-zH4HTK";
test("historical test hashes no longer match; old logs cannot verify renamed sources", () => {
  const provenance = readFileSync(resolve(root, historical, "provenance.txt"), "utf8");
  for (const path of ["tests/browser/render.spec.ts", "tests/browser/screenshots.spec.ts"]) {
    const old = provenance.split("\n").find(line => line.endsWith(`  ${path}`)).split(" ")[0];
    assert.notEqual(createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex"), old);
  }
  assert.throws(() => validateBrowserEvidence(historical), /Browser provenance gap/);
});

test("capture selection covers sources, browser assertions, dependencies, config and wrapper", () => {
  const files = browserInputFiles();
  for (const path of ["src/scenarios/s2-fixed-order-collision.ts", "web/mcp-apps.ts", "web/json-render.tsx", "web/a2ui.ts", "tests/browser/render.spec.ts", "tests/browser/screenshots.spec.ts", "package-lock.json", "vite.config.ts", "playwright.config.ts", "scripts/paper-browser-run.sh"]) assert.ok(files.includes(path), path);
});

test("missing fresh evidence cannot create or overwrite a private archive", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "paper-provenance-gap-"));
  const archive = resolve(directory, "review.tar.gz");
  const reject = () => {
    const result = spawnSync(process.execPath, ["--input-type=module", "-e",
      'await import("./scripts/paper.mjs").then(({ createPrivateBundle }) => createPrivateBundle(process.argv[1]));', archive],
    { cwd: root, encoding: "utf8", env: { ...process.env, PAPER_BROWSER_EVIDENCE: historical } });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Browser provenance gap/);
  };
  try {
    reject();
    assert.equal(existsSync(archive), false);
    writeFileSync(archive, "historical archive sentinel");
    reject();
    assert.equal(readFileSync(archive, "utf8"), "historical archive sentinel");
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
