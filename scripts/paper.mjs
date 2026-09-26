import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, statSync, mkdirSync, mkdtempSync, copyFileSync, readdirSync, lstatSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateBrowserEvidence } from "./paper-browser-evidence.mjs";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const latexPath = resolve(root, "paper/manuscript.tex");

export function renderLatex(source = "paper/manuscript.md") {
  const result = spawnSync("pandoc", [
    source, "--from=markdown", "--to=latex", "--standalone",
    "--number-sections", "--pdf-engine=tectonic",
    "--template=paper/template.tex",
    "--lua-filter=paper/figures.lua",
  ], { cwd: root, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Pandoc failed (${result.status}): ${result.stderr}`);
  if (result.stderr) process.stderr.write(result.stderr);
  return portableTableWidths(result.stdout);
}

export function portableTableWidths(latex) {
  return latex.replace(/\(\\linewidth - (\d+)\\tabcolsep\) \* \\real\{([\d.]+)\}/g,
    (_, spacing, fraction) => `${fraction}\\dimexpr\\linewidth-${spacing}\\tabcolsep\\relax`);
}

export function assertFresh(actual, expected) {
  if (actual !== expected) throw new Error("Generated LaTeX is stale; run node scripts/paper.mjs latex");
}

export function engineArgs(bundle = process.env.PAPER_TEX_BUNDLE) {
  const args = ["--only-cached", "--untrusted", "--keep-logs"];
  if (bundle) {
    if (!statSync(bundle).isDirectory()) throw new Error("PAPER_TEX_BUNDLE must be a local directory");
    args.push("--bundle", resolve(bundle));
  }
  return [...args, "manuscript.tex"];
}

export function run(mode) {
  if (mode === "private-bundle") {
    createPrivateBundle(resolve(root, "paper/private-review.tar.gz"));
    process.stdout.write("Generated paper/private-review.tar.gz (private local inputs; dependencies external)\n");
    return;
  }
  if (!["latex", "check", "pdf", "bundle"].includes(mode)) {
    throw new Error("Usage: node scripts/paper.mjs <latex|check|pdf|bundle|private-bundle>");
  }
  const generated = renderLatex();
  if (mode === "latex") {
    writeFileSync(latexPath, generated);
    process.stdout.write("Generated paper/manuscript.tex\n");
    return;
  }
  assertFresh(readFileSync(latexPath, "utf8"), generated);
  if (mode === "bundle") {
    createSourceBundle(resolve(root, "paper/arxiv-source.tar.gz"));
    process.stdout.write("Generated paper/arxiv-source.tar.gz (local source bundle only)\n");
    return;
  }
  if (mode === "pdf") {
    const result = spawnSync("tectonic", engineArgs(), { cwd: resolve(root, "paper"), stdio: "inherit" });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Tectonic failed (${result.status})`);
    const inputs = [
      "paper/manuscript.md", "paper/manuscript.tex", "paper/template.tex", "paper/figures.lua",
      "scripts/paper.mjs", "scripts/paper-figures.mjs",
      ...["topology", "s2"].flatMap(name => ["mmd", "dot", "pdf"].map(extension => `paper/figures/${name}.${extension}`)),
      "scripts/paper-matrix.mjs", "docs/COMPARISON.md", "paper/figures/matrix.dot", "paper/figures/matrix.pdf",
    ];
    const hashes = Object.fromEntries([...inputs, "paper/manuscript.pdf"].map(path => [path,
      createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex"),
    ]));
    // Current derivative metadata lives outside the immutable execution ledgers.
    const evidence = resolve(root, "paper");
    mkdirSync(evidence, { recursive: true });
    writeFileSync(resolve(evidence, "pdf-build-manifest.json"), JSON.stringify({
      generatedAt: new Date().toISOString(), command: ["tectonic", ...engineArgs()],
      cwd: "paper", node: process.version, hashes,
    }, null, 2) + "\n");
  }
  process.stdout.write(mode === "check" ? "LaTeX is fresh\n" : "Generated paper/manuscript.pdf\n");
}

export const bundleFiles = ["manuscript.tex", "figures/topology.pdf", "figures/s2.pdf", "figures/matrix.pdf"];

export function createSourceBundle(destination) {
  const directory = mkdtempSync(resolve(tmpdir(), "paper-source-"));
  mkdirSync(resolve(directory, "figures"));
  for (const name of bundleFiles) copyFileSync(resolve(root, "paper", name), resolve(directory, name));
  const result = spawnSync("tar", ["-czf", resolve(destination), ...bundleFiles], {
    cwd: directory, encoding: "utf8", env: { ...process.env, COPYFILE_DISABLE: "1" },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Source packaging failed: ${result.stderr}`);
}

export const browserEvidence = process.env.PAPER_BROWSER_EVIDENCE;

export function privateBundleFiles() {
  const walk = (directory, extensions) => readdirSync(resolve(root, directory), { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
      const path = `${directory}/${entry.name}`;
      if (entry.isSymbolicLink()) throw new Error(`Unexpected symlink: ${path}`);
      return entry.isDirectory() ? walk(path, extensions) : extensions.test(entry.name) ? [path] : [];
    });
  return [
    "README.md", "LICENSE", "package.json", "package-lock.json", "tsconfig.json",
    "vite.config.ts", "vitest.config.ts", "playwright.config.ts", "docs/COMPARISON.md",
    ...walk("src", /\.tsx?$/), ...walk("web", /\.(tsx?|html|css)$/),
    ...walk("tests/protocol", /\.ts$/), ...walk("tests/browser", /\.ts$/),
    ...walk("docs/screenshots", /\.png$/),
    "scripts/paper.mjs", "scripts/paper-figures.mjs", "scripts/paper-browser-evidence.mjs", "scripts/paper-browser-run.sh",
    ...["build", "editorial", "figures", "manuscript", "pdf", "private-bundle", "browser-provenance"].map(name => `tests/paper/${name}.test.mjs`),
    ...["manuscript.md", "REPRODUCTION.md", "EXECUTION.md", "template.tex", "figures.lua", "manuscript.tex", "manuscript.pdf", "pdf-build-manifest.json"].map(name => `paper/${name}`),
    "paper/figures/README.md", "paper/figures/mermaid-config.json",
    ...["topology", "s2"].flatMap(name => ["mmd", "dot", "pdf", "svg"].map(ext => `paper/figures/${name}.${ext}`)),
    "scripts/paper-matrix.mjs", ...["dot", "pdf", "svg"].map(ext => `paper/figures/matrix.${ext}`),
    ...["commands.txt", "provenance.txt", "build.stdout.txt", "build.stderr.txt",
      "source-before.json", "built-before.json", "source-after.json", "exit-status.txt",
      "playwright-ipv4.json", "playwright-ipv4.stdout.txt",
      "playwright-ipv4.stderr.txt", "preview-ipv4.log", "ipv4-post-run-screenshots.tar",
      "ipv4-post-run-screenshots.sha256", "historical-restoration.txt", "environment.json"].map(name => `${browserEvidence}/${name}`),
    ...["npm-test.txt", "browser.txt", "pdf-build.txt", "environment.json"].map(name => `paper/evidence/${name}`),
    // Retrospective paper checks still cite these immutable pre-rename records.
    ...["playwright-ipv4.json", "playwright-ipv4.stdout.txt", "playwright-ipv4.stderr.txt", "ipv4-commands.txt", "provenance.txt"].map(name => `paper/evidence/browser-terminal-20260922T013449Z-zH4HTK/${name}`),
  ].filter((path, index, files) => files.indexOf(path) === index).sort();
}

export function createPrivateBundle(destination) {
  if (!browserEvidence) throw new Error("Set PAPER_BROWSER_EVIDENCE to the committed source execution directory");
  // Fail before writing any archive: historical execution cannot verify renamed sources.
  const browserProvenance = validateBrowserEvidence(browserEvidence);
  assertFresh(readFileSync(latexPath, "utf8"), renderLatex());
  const pdfBuild = JSON.parse(readFileSync(resolve(root, "paper/pdf-build-manifest.json")));
  for (const [path, expected] of Object.entries(pdfBuild.hashes)) {
    if (createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex") !== expected) {
      throw new Error(`Stale PDF build input: ${path}`);
    }
  }
  const directory = mkdtempSync(resolve(tmpdir(), "paper-private-"));
  const files = privateBundleFiles();
  const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
  try {
    const entries = files.map(path => {
      if (!lstatSync(resolve(root, path)).isFile()) throw new Error(`Not a regular file: ${path}`);
      const bytes = readFileSync(resolve(root, path));
      mkdirSync(dirname(resolve(directory, path)), { recursive: true });
      writeFileSync(resolve(directory, path), bytes);
      return { path, sha256: sha256(bytes), bytes: bytes.length,
        provenance: path.startsWith("paper/evidence/") ? "immutable historical execution evidence" :
          path.startsWith("docs/") || path === "README.md" ? "retained harness documentation; not revised scientific claims" : "current local input or generated derivative; not a historical source snapshot" };
    });
    const version = (command, args) => {
      const result = spawnSync(command, args, { cwd: root, encoding: "utf8" });
      return { command: [command, ...args], status: result.status, output: result.stdout?.trim(), stderr: result.stderr?.trim(), error: result.error?.message };
    };
    const manifest = {
      schema: 2, generatedAt: new Date().toISOString(), private: true, browserProvenance,
      head: browserProvenance.head, node: process.version,
      tools: ["npm", "pandoc", "tectonic"].map(tool => version(tool, ["--version"])),
      graphviz: version("dot", ["-V"]),
      commandsToRunNotExecutionEvidence: ["node scripts/paper.mjs private-bundle", "npm ci --no-audit --no-fund", "npm test", "npm run typecheck", "node scripts/paper-figures.mjs", "node scripts/paper.mjs latex", "node scripts/paper.mjs check", "node scripts/paper.mjs pdf"],
      browserCommands: `${browserEvidence}/commands.txt`,
      instructions: "paper/REPRODUCTION.md",
      externalDependencies: "Node >=22, npm packages pinned in package-lock.json, matching Playwright Chromium, listener permission, Pandoc, Graphviz, Tectonic and separately supplied TeX resources, Poppler. No dependencies or TeX caches included.",
      limits: "Local private packaging, not publication or independent reproduction. Historical logs may contain absolute execution paths: provenance, not portable paths. Current fixture hashes do not retroactively attest the historical fixture bytes. Historical links outside this selected evidence set need the original private workspace. External auditor configuration, internals, reports and integration test are excluded; that test remains unchanged in the workspace and is a known blocker. OpenSpec tooling is not bundled: run its checks in the original checkout.",
      files: entries,
    };
    writeFileSync(resolve(directory, "PRIVATE-MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n");
    const result = spawnSync("tar", ["-czf", resolve(destination), "PRIVATE-MANIFEST.json", ...files], {
      cwd: directory, encoding: "utf8", env: { ...process.env, COPYFILE_DISABLE: "1" },
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Private packaging failed: ${result.stderr}`);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    run(process.argv[2]);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
