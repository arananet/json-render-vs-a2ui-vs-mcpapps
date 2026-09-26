import assert from "node:assert/strict";
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { assertFresh, bundleFiles, createSourceBundle, engineArgs, latexPath, portableTableWidths, renderLatex, root, run } from "../../scripts/paper.mjs";

test("source bundle contains only root TeX and preconverted used figures", () => {
  const destination = resolve(mkdtempSync(resolve(tmpdir(), "paper-bundle-test-")), "source.tar.gz");
  createSourceBundle(destination);
  assert.deepEqual(execFileSync("tar", ["-tzf", destination], { encoding: "utf8" }).trim().split("\n"), bundleFiles);
  const tex = execFileSync("tar", ["-xOzf", destination, "manuscript.tex"], { encoding: "utf8" });
  assert.doesNotMatch(tex, /\\today|\\write18|\\input\{|\\include\{|javascript:/);
  for (const match of tex.matchAll(/\\includegraphics\[[^\]]*\]\{\.\/([^}]+)\}/g)) {
    assert.ok(bundleFiles.includes(match[1]), match[1]);
  }
  assert.ok(!bundleFiles.includes("manuscript.pdf"));
});

test("table widths use e-TeX dimensions without a calc package dependency", () => {
  assert.equal(portableTableWidths('p{(\\linewidth - 4\\tabcolsep) * \\real{0.3333}}'),
    'p{0.3333\\dimexpr\\linewidth-4\\tabcolsep\\relax}');
});

test("local bundle selection preserves cached-only and untrusted compilation", () => {
  assert.deepEqual(engineArgs(root), [
    "--only-cached", "--untrusted", "--keep-logs", "--bundle", root, "manuscript.tex",
  ]);
  assert.throws(() => engineArgs(latexPath), /local directory/);
  assert.throws(() => engineArgs("https://example.com/bundle"));
});

test("generated LaTeX corresponds to the editable manuscript", () => {
  const generated = renderLatex();
  assertFresh(readFileSync(latexPath, "utf8"), generated);
  assert.match(generated, /\\author\{Eduardo Arana\}/);
  assert.match(generated, /Independent researcher/);
});

test("freshness rejects any stale derivative", () => {
  assert.throws(() => assertFresh("older paper", "revised paper"), /LaTeX is stale/);
  assert.doesNotThrow(() => assertFresh("same paper", "same paper"));
});

test("the build tool fails closed on an unknown operation or missing input", () => {
  assert.throws(() => run("publish"), /Usage:/);
  assert.throws(() => renderLatex("paper/nonexistent-input.md"), /Pandoc failed/);
});
