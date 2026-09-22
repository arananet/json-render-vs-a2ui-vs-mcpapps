# Reproduction guide

This guide accompanies [the English manuscript](manuscript.md) by Eduardo Arana,
Arananet. It re-executes existing local checks; it is not an independent-person
reproduction or a replication of another study. See [EXECUTION.md](EXECUTION.md)
for commands actually run and the limits of the evidence.

## Inputs and prerequisites

- Current editorial HEAD: `b5d06eafcd4cf9cb0ed49131add55cbdecbd4b7c`, plus the
  locally ignored paper package. Earlier execution sections retain their own
  historical revision. Record `git rev-parse HEAD` and
  `git status --short --untracked-files=all` for your own run.
- Node >=22, npm, the existing `package-lock.json`, Bash, Git, Ruby >=2.6 for
  OpenSpec, and local dependencies. A fresh installation normally uses
  `npm ci --no-audit --no-fund`; it may require network access. Do not interpret
  an existing `node_modules` directory as evidence that this command ran.
- Pandoc (recorded version 3.11) for LaTeX generation/freshness; Tectonic (0.16.9)
  with cached TeX resources for an offline PDF build; Poppler's `pdfinfo`,
  `pdffonts`, `pdftotext`, and `pdftoppm` for inspection. Graphviz 13.1.0 renders
  the editable Mermaid subset to vector figures without a browser.
- Browser checks need the browser matching installed Playwright and permission
  to start the configured Vite listener (locally resolving to `::1:5178`) and
  reach `127.0.0.1:5178`. Inspect `playwright.config.ts`. `CHROMIUM_PATH` may
  select an existing executable; otherwise Playwright uses its normal cache.
  This machine has `$HOME/Library/Caches/ms-playwright`; `/opt/pw-browsers`
  must not be assumed. No browser download or sandbox bypass is part of this run.

On the recorded machine, select Node explicitly in each shell:

```bash
export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"
node --version
npm --version
```

The default shell's Node 18.20.5 does not meet this repository's prerequisite.
Installed and locked versions were compared; exact dependency versions and
hashes are in the execution materials. Preserve the lockfile.

`paper/`, both `scripts/paper*.mjs` files, and `tests/paper/` are locally excluded
through `.git/info/exclude`. A clean Git status is not a complete inventory of
these inputs. OpenSpec fingerprints omit them, so run the focused paper checks
and inspect `evidence/editorial-20260921/artifacts.sha256` independently. The
canonical current PDF input manifest is `evidence/pdf-visuals/pdf-build-manifest.json`.
Earlier logs and checksum manifests remain historical evidence; the pre-revision
manuscript, derivatives, figure assets, and PDF manifest are archived under
`evidence/editorial-20260921/previous/`, not additional editable manuscript sources.

The current editorial regression checks explicitly retain partial C3/C6 and
proposed C9, distinguish A2UI writer bookkeeping from a rendered headline,
and check the configuration-specific thesis and pending human review. They
guard documentation consistency, not protocol correctness or completed review.

## Checks requiring host permissions

Both current sandbox retries failed before their intended checks: tsx could
not create its IPC listener for `report:check`; Vite could not listen on
`::1:5178` for `test:browser`. No assertions or configuration were weakened.
For an authorized human-run terminal outside this sandbox, from this repository
root, the exact pending command is:

```bash
PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH" npm run report:check && PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH" npm run test:browser
```

This command is documented, not executed outside the sandbox. It requires local
IPC/network-listener and browser-launch permissions, not paid services or new
experiments. A later browser pass supports only its actual assertions; it does
not establish provenance of retained screenshots or every-control routing.

## Commands

Run from the repository root, recording stdout, stderr, exit status, and UTC time.
Stop the affected workflow on a failed assertion or unavailable prerequisite;
retain the failure and do not weaken tests or modify adapters to obtain a pass.
Independent documentation inspection can still establish partial evidence.

```bash
node scripts/paper-figures.mjs
node scripts/paper.mjs latex
node scripts/paper.mjs check
node scripts/paper.mjs pdf
node --test tests/paper/*.test.mjs
node scripts/paper.mjs bundle
npm test -- tests/protocol/scenarios.test.ts -t S2
npm test
npm run typecheck
npm run report:check
npm run test:browser
pdfinfo paper/manuscript.pdf
pdffonts paper/manuscript.pdf
pdftotext -layout paper/manuscript.pdf .scratch/paper/manuscript.txt
bash scripts/openspec check
bash scripts/openspec verify reproducible-protocol-comparison-paper
bash scripts/openspec status reproducible-protocol-comparison-paper
```

The focused tests use Node's built-in runner and are separate from the existing
Vitest configuration. Run `latex` before the tests if no generated LaTeX is
present. `check` regenerates LaTeX in memory and compares it without rewriting;
`pdf` requires fresh LaTeX and uses Tectonic's `--only-cached --untrusted` mode.
Set the local bundle/cache environment described below on this machine. PDF
tests require a successful build, its build manifest and the engine log. If a
build prerequisite is unavailable, record it rather than passing those checks.
`bundle` packages only the generated TeX and the two used PDF figures; the
archive is `paper/arxiv-source.tar.gz` (ignored by the repository archive rule).
Only `paper/manuscript.md` is an editable manuscript. Do not hand-edit generated
`paper/manuscript.tex` or `paper/manuscript.pdf`.

Inspect extracted PDF text for Eduardo Arana, Arananet, all sections, missing
glyphs, and unresolved references (`??`, undefined citations). Inspect build
warnings and representative page images, especially the tables, where available.
These checks do not replace human proofreading. If generation fails, preserve
the Markdown and LaTeX already produced, record the exact failure, and report
the PDF as unavailable rather than substituting another artifact silently.

## Safe local TeX resources

The original default-bundle invocation panicked during network-client setup,
even with `--only-cached`. The successful follow-up explicitly selected a local
directory bundle; it did not relax sandbox or shell-escape restrictions. The
cached resource subset lacked `size10.clo`, `textcomp.sty`, and `calc.sty` needed
by intermediate drafts. The final 11-point template uses available standard
packages and native e-TeX table dimensions. It does not download replacements.

The already prepared local environment is:

```bash
export PAPER_TEX_BUNDLE="$PWD/.scratch/paper-local-tex/bundle"
export TECTONIC_CACHE_DIR="$PWD/.scratch/paper-local-tex/cache"
node scripts/paper.mjs pdf
```

For a new local resource directory, copy the existing cache into a fresh writable
directory and compute a resource-set identifier. Do not mutate the user's cache.
This identifier describes the copied subset, not a claimed complete upstream
TeX distribution. On another machine, point `PAPER_TEX_SOURCE` at its actual
existing resource directory; missing resources remain a prerequisite failure.

```bash
export PAPER_TEX_SOURCE="$HOME/Library/Caches/Tectonic/bundles/data/6ffe055852f8faf66c0acbe1a7fb27f87b869a90bad1204f3bf4d9683f597c7c"
mkdir -p .scratch
paper_tex_work=$(mktemp -d "$PWD/.scratch/paper-tex.XXXXXX")
export PAPER_TEX_BUNDLE="$paper_tex_work/bundle"
export TECTONIC_CACHE_DIR="$paper_tex_work/cache"
mkdir -p "$PAPER_TEX_BUNDLE" "$TECTONIC_CACHE_DIR"
cp -R "$PAPER_TEX_SOURCE/." "$PAPER_TEX_BUNDLE/"
node --input-type=module <<'NODE'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const directory = process.env.PAPER_TEX_BUNDLE;
const entries = readdirSync(directory).filter(name => name !== 'SHA256SUM').sort()
  .map(name => `${createHash('sha256').update(readFileSync(`${directory}/${name}`)).digest('hex')}  ${name}\n`).join('');
writeFileSync(`${directory}/SHA256SUM`, createHash('sha256').update(entries).digest('hex') + '\n');
NODE
node scripts/paper.mjs pdf
```

The [Tectonic directory-bundle implementation](https://raw.githubusercontent.com/tectonic-typesetting/tectonic/master/crates/bundles/src/dir.rs)
documents the local bundle fingerprint file. The current run's resource hashes
are retained in `evidence/pdf-visuals/tex-resources.sha256`. This native engine
path succeeds within the existing sandbox; no outside-sandbox PDF command is
required. Mermaid CLI remains blocked, but the native Graphviz fallback works;
see [figure provenance](figures/README.md).

## Source bundle and presentation

The preparation follows the inspected [official arXiv TeX guidance](https://info.arxiv.org/help/submit_tex.html):
readable single spacing, an explicit date, preconverted PDF figures included
with `graphicx`, and source-root compilation. `paper/arxiv-source.tar.gz` contains
only `manuscript.tex`, `figures/topology.pdf`, and `figures/s2.pdf`. The preamble
is self-contained and uses standard TeX packages. There is no runtime conversion,
JavaScript, network fetch, shell escape, auxiliary file, log, or compiled main PDF
in the archive. The bundle was compiled locally from its extracted root.

The editable Markdown, template, Lua presentation filter, Mermaid sources,
converter, and scientific evidence remain in the repository. Repository-relative
evidence hyperlinks require this checkout; they are not compilation inputs.
Local Tectonic success is not arXiv TeX Live validation. No upload, submission,
publication decision, licensing selection, or acceptance claim is made. The
repository license is unchanged; author human review remains pending.

## Expected semantic outcomes

S1's json-render and A2UI snapshots contain both blocks in `trip`; MCP has
`trip::planner` and `trip::booking`. S2 has four sequential awaited writes. Its
json-render snapshot retains finance's summary and both detail blocks; A2UI's
Node assertion checks the finance writer, and its browser assertion checks the
finance headline. MCP retains both summary headlines in separate instances.
S3 shared-state routing uses the orchestrator table. MCP bridge tests reject
the model-only call with the enforcing host and allow it in the permissive
variant. Read the manuscript for the first-instance routing caveat and the
weaker evidence behind confirmation and provenance labels.

The nine retained screenshots and `docs/COMPARISON.md` are existing artifacts,
not fresh captures. `report:check` checks consistency without rewriting that
report. The normal browser command excludes `@screenshot`; do not regenerate
screenshots for this paper. Browser MCP fixtures are not identical to the Node
scenario, particularly the omitted S2 detail blocks.

## Evidence accounting

Successful tests support only their assertions. Preserve failures, skips,
warnings, environment differences, and missing prerequisites. Adapter labels
are not independent measurements. Preserve semantic distinctions between
snapshot bookkeeping, actual DOM, host refusal, and protocol requirements.

The report normalizes A2UI timestamps. A fresh raw action trace need not be
byte-identical to an earlier one; a PDF need not be byte-identical across TeX
versions. Same-toolchain LaTeX freshness is checked byte-for-byte. Hashes identify
retained files, not the truth of scientific claims. No new experimental matrix,
performance measurement, LLM run, or assertion about independent human work is
part of this procedure.

OpenSpec verification runs configured `npm test` with a fingerprint of repository
inputs. Its records live in ignored `.openspec/runs/`. Run verification after
final edits: changing tracked/nonignored files after verification makes it stale.
`status` must be inspected without subsequently altering paper inputs. A passed
command explicitly leaves acceptance criteria unproven and human review pending.
