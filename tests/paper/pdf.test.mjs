import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { root } from "../../scripts/paper.mjs";

const pdf = resolve(root, "paper/manuscript.pdf");

test("PDF build manifest matches the current manuscript, tooling, figures and PDF", () => {
  const manifest = JSON.parse(readFileSync(resolve(root, "paper/pdf-build-manifest.json"), "utf8"));
  for (const [path, expected] of Object.entries(manifest.hashes)) {
    assert.equal(createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex"), expected, path);
  }
  assert.ok(manifest.command.includes("--untrusted"));
  assert.ok(manifest.command.includes("--only-cached"));
});

test("PDF contains author, affiliation, numbered figures and resolved references", () => {
  const info = execFileSync("pdfinfo", [pdf], { encoding: "utf8" });
  assert.match(info, /Author:\s+Eduardo Arana/);
  assert.match(info, /JavaScript:\s+no/);
  const text = execFileSync("pdftotext", ["-layout", pdf, "-"], { encoding: "utf8" }).normalize("NFKC");
  for (const phrase of ["Eduardo Arana", "Independent researcher", "Figure 1:", "Figure 2:", "Claim-evidence mapping", "The author reviewed all claims"]) {
    assert.ok(text.includes(phrase), phrase);
  }
  assert.doesNotMatch(text, /\?\?|\uFFFD/);
  const log = readFileSync(resolve(root, "paper/manuscript.log"), "utf8");
  assert.doesNotMatch(log, /Overfull \\[hv]box|Missing character|undefined references|undefined citations|Undefined control sequence/i);
});

test("all fonts reported by Poppler are embedded", () => {
  const fonts = execFileSync("pdffonts", [pdf], { encoding: "utf8" }).trim().split("\n").slice(2);
  assert.ok(fonts.length > 0);
  for (const font of fonts) assert.match(font, /\s+yes\s+(?:yes|no)\s+(?:yes|no)\s+\d+\s+\d+\s*$/, font);
});
