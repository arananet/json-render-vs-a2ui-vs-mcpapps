import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname } from "node:path";
import test from "node:test";
import { root, browserEvidence, createPrivateBundle, privateBundleFiles } from "../../scripts/paper.mjs";

test("private archive extracts with exact hashes, complete fixture inputs and real selected evidence", () => {
  const temporary = mkdtempSync(resolve(tmpdir(), "private-review-test-"));
  const hash = bytes => createHash("sha256").update(bytes).digest("hex");
  try {
    const archive = resolve(temporary, "review.tar.gz");
    createPrivateBundle(archive);
    const names = execFileSync("tar", ["-tzf", archive], { encoding: "utf8" }).trim().split("\n");
    assert.deepEqual(names, ["PRIVATE-MANIFEST.json", ...privateBundleFiles()]);
    assert.equal(new Set(names).size, names.length);
    for (const name of names) {
      assert.ok(!name.startsWith("/") && !name.split("/").includes(".."));
      assert.doesNotMatch(name, /(?:veritas|node_modules|\.env|\.git|\.scratch|cache|source-views|previous|extracted-text)/i);
    }
    const extracted = resolve(temporary, "extracted");
    mkdirSync(extracted);
    execFileSync("tar", ["-xzf", archive, "-C", extracted]);
    const manifest = JSON.parse(readFileSync(resolve(extracted, "PRIVATE-MANIFEST.json")));
    assert.equal(manifest.browserProvenance.status, "current-source-browser-execution");
    assert.equal(manifest.browserProvenance.directory, browserEvidence);
    for (const entry of manifest.files) {
      const bytes = readFileSync(resolve(extracted, entry.path));
      assert.equal(bytes.length, entry.bytes, entry.path);
      assert.equal(hash(bytes), entry.sha256, entry.path);
      assert.equal(hash(bytes), hash(readFileSync(resolve(root, entry.path))), entry.path);
    }
    for (const path of ["package-lock.json", "playwright.config.ts", "vite.config.ts", "vitest.config.ts", "tsconfig.json", "web/mcp-apps.ts", "web/scenario.ts", "src/scenarios/s2-fixed-order-collision.ts", "tests/browser/render.spec.ts", "tests/protocol/scenarios.test.ts", "paper/manuscript.md", "paper/REPRODUCTION.md", "scripts/paper.mjs", "paper/template.tex", "paper/figures.lua", "paper/figures/s2.mmd"]) assert.ok(names.includes(path), path);
    // Every relative import in the packaged harness must resolve inside the archive.
    for (const path of names.filter(name => /\.(ts|tsx|mjs)$/.test(name))) {
      const source = readFileSync(resolve(extracted, path), "utf8");
      for (const match of source.matchAll(/(?:from\s+|import\s*)["'](\.[^"']+)["']/g)) {
        assert.ok(names.some(name => resolve(extracted, name) === resolve(extracted, dirname(path), match[1])), `${path}: ${match[1]}`);
      }
    }
    const report = JSON.parse(readFileSync(resolve(extracted, browserEvidence, "playwright-ipv4.json")));
    assert.equal(report.stats.expected, 18);
    assert.equal(report.stats.unexpected, 0);
    const captures = resolve(temporary, "captures");
    mkdirSync(captures);
    execFileSync("tar", ["-xf", resolve(extracted, browserEvidence, "ipv4-post-run-screenshots.tar"), "-C", captures]);
    const hashes = readFileSync(resolve(extracted, browserEvidence, "ipv4-post-run-screenshots.sha256"), "utf8").trim().split("\n");
    assert.equal(hashes.length, 9);
    for (const line of hashes) {
      const [, expected, path] = line.match(/^([a-f0-9]{64})\s+(.+)$/);
      assert.equal(hash(readFileSync(resolve(captures, path))), expected, path);
    }
    const provenance = readFileSync(resolve(extracted, browserEvidence, "provenance.txt"), "utf8");
    for (const match of provenance.matchAll(/^([a-f0-9]{64})\s+((?:tests\/browser\/|playwright\.config|package\.json)[^\n]*)$/gm)) {
      assert.equal(hash(readFileSync(resolve(extracted, match[2]))), match[1], match[2]);
    }
    // Build inputs must work from the extracted root without the original checkout.
    assert.match(execFileSync(process.execPath, ["scripts/paper.mjs", "check"], {
      cwd: extracted, encoding: "utf8",
    }), /LaTeX is fresh/);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
