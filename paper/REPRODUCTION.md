# Reproduction guide

This guide accompanies [the English manuscript](manuscript.md) by Eduardo Arana,
Arananet. It re-executes existing local checks; it is not an independent-person
reproduction or a replication of another study. See [EXECUTION.md](EXECUTION.md)
for commands actually run and the limits of the evidence.

## Inputs and prerequisites

- Actual tested HEAD for the immutable recorded browser execution:
  `91a0b7a5191947a4ad284e276227564586c88f82`, as recorded in that execution's
  `environment.json` and `provenance.txt`. The earlier maintenance base
  `f552114ef3ae7a3a94b601d8b246265daed3779e` and later bookkeeping commits are
  historical records, not the tested browser revision. Record `git rev-parse HEAD`
  and `git status --short --untracked-files=all` for your own run.
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

`paper/`, `scripts/paper.mjs`, `scripts/paper-figures.mjs`, and `tests/paper/` are
now intended for version control;
The canonical editable manuscript is `paper/manuscript.md`; immutable Markdown
snapshots and their hashes are listed in `paper/versions/README.md`. OpenSpec
validation and the focused paper checks cover different contracts, so run both.
The canonical current PDF input manifest is `pdf-build-manifest.json`. The build
tool writes this current derivative metadata outside historical evidence;
`evidence/pdf-visuals/pdf-build-manifest.json` remains unchanged as a past build.
Earlier logs and checksum manifests remain historical evidence; the pre-revision
manuscript, derivatives, figure assets, and PDF manifest are archived under
`evidence/editorial-20260921/previous/`, not additional editable manuscript sources.

The current editorial regression checks require supported C3, partial C6/C7 and
proposed C9, distinguish A2UI writer bookkeeping from the executed DOM assertions,
and check the configuration-specific thesis and pending human review. They
guard documentation consistency, not protocol correctness or completed review.
The new browser wrapper and source-hash helper are not covered by those local
exclusions. Repository `.gitignore` rules were unchanged; prior local excludes
were removed so these inputs can be intentionally versioned.

### Historical private review package, not a distributed release

Earlier execution records describe a private local review package. This
repository now prepares the manuscript and evidence for version control, but no
commit, tag, archival release, DOI registration, or independent reproduction has
occurred. Hashes identify retained bytes; they do not establish a clean-clone
reproduction or human review.

The historical private archive and manifest are retained in the execution
ledger as pre-rename evidence only. Conclusions in this guide exclude reliance
on those unavailable private materials. A current private bundle and readable
manifest may be regenerated from the post-rename browser execution, but neither
package establishes independent reproduction or review.

Private packaging fails closed unless `PAPER_BROWSER_EVIDENCE` selects an
actual outer-terminal execution directory. The validator requires complete
source SHA-256 maps before build and after execution, stable built-asset hashes,
18 successful tests from both specs with no skips/failures, the new S2 title,
zero exit status, and all nine archived screenshot hashes. Missing/stale inputs
are errors. It also requires fresh LaTeX and matching PDF build-input hashes.
Archive path safety, exact member hashes/sizes, fixture coverage, relative imports,
and screenshot integrity checks remain required; a local record is not a signed
attestation or independent reproduction.

The reviewed repository package includes the immutable execution directory
[`paper/evidence/browser-s2-fixed-order-QDL9iC9j/`](evidence/browser-s2-fixed-order-QDL9iC9j/).
`current-browser-run` is a mutable relative symlink that currently targets this
directory; it is not an immutable citation. Inspect this directory's JSON report,
stdout/stderr, preview/build logs, source/build snapshots, command record, exit
status, capture hashes and restoration record. Use its repository-relative path
as `PAPER_BROWSER_EVIDENCE` for the private-bundle test
and any future generation. Rebuild current paper derivatives first. The current
archive's readable manifest is `paper/evidence/private-review-manifest.json`; it
is an exact extraction of the archive's `PRIVATE-MANIFEST.json`. Do not rewrite
historical logs, change external review configuration, or use old browser bytes
as current proof.
The private archive is not a publicly distributed release.
The archive includes locked dependencies as manifests, not installed packages;
Node >=22, matching Chromium, npm dependencies, Pandoc, Graphviz, Tectonic with
local TeX resources, and Poppler remain external prerequisites. Paper inputs are
prepared for version control; availability and independent reproduction remain
unproven.

The historical Veritas review package was prepared from `paper/`: `manuscript.md` and `EXECUTION.md` in its
listing are `paper/manuscript.md` and `paper/EXECUTION.md` relative to the
repository. Its recorded selection includes the execution record and local
build/test sources. The installed text reader skips `.mjs`, `.lua` and `.mmd`,
so byte-identical `.txt` review views carry those sources, one representation
per selected original. `evidence/veritas-review-20260922/private-package.json`
maps each view to its repository path and SHA-256 and inventories other private
build assets. It is not an additional manuscript or new experimental evidence.
`node --test tests/paper/veritas-inputs.test.mjs` checks the mapping and
the captured file selection. Historical source views are not current sources;
they retain their historical hashes. The dated source views and hashes must not be
overwritten to make the gate pass.
selection, historical view, or auditor setting is changed by this update.
That external integration test remains unchanged in the workspace and is not
included in the private archive. Its failure is reported separately; passing
package checks do not clear it or any external-auditor finding.

The local source bundle still relies on installed TeX resources and dependencies;
including build sources does not establish a clean-install or cross-machine
reproduction. Original figures/PDF remain local assets, not visual inputs to
this text-only listing. The historical checksum records remain historical;
the new manifest supplements, rather than rewrites, their provenance.

## Checks requiring host permissions

The retained sandbox retries failed before their intended checks: tsx could
not create its IPC listener for `report:check`; Vite could not listen on
`::1:5178` for `test:browser`. No assertions or configuration were weakened.
For an authorized human-run terminal outside this sandbox, from this repository
root, the standalone report check remains pending:

```bash
PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH" npm run report:check
```

This command is environment-blocked in the recorded sandbox, not a primary
success criterion for this artifact. The historical browser prerequisite was satisfied for the pre-rename fixture
only; the complete current-fixture execution is available through
[`paper/evidence/current-browser-run/`](evidence/current-browser-run/).

### Historical pre-rename browser specs with an IPv4 preview

The [commands and exit status](evidence/browser-terminal-20260922T013449Z-zH4HTK/ipv4-commands.txt),
[JSON report](evidence/browser-terminal-20260922T013449Z-zH4HTK/playwright-ipv4.json),
[stdout](evidence/browser-terminal-20260922T013449Z-zH4HTK/playwright-ipv4.stdout.txt),
[empty stderr](evidence/browser-terminal-20260922T013449Z-zH4HTK/playwright-ipv4.stderr.txt),
and the immutable current-source [JSON report](evidence/browser-s2-fixed-order-QDL9iC9j/playwright-ipv4.json)
record the retained browser result.
The default managed preview had timed out after 60000 ms with zero tests;
localhost resolved to IPv6 first. The successful wrapper used the existing
`reuseExistingServer` option with an explicitly started IPv4 listener. No browser
test, assertion, adapter, or configuration file changed. The server was stopped.

### Recorded current execution after the S2 rename

The following command was run from the repository root in an outer terminal
with browser/listener permissions:

```bash
PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH" bash scripts/paper-browser-run.sh
```

It completed at `2026-09-22T11:42:17Z` with exit status 0, 18 expected passing
tests and no skipped, flaky, or unexpected tests. The wrapper builds with
`npm run build`, starts exactly
`node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5178 --strictPort`,
then runs `env -u CI PLAYWRIGHT_JSON_OUTPUT_FILE=<new-directory>/playwright-ipv4.json
node node_modules/@playwright/test/cli.js test tests/browser/render.spec.ts
tests/browser/screenshots.spec.ts --reporter=line,json --output=<new-directory>/ipv4-test-results`.
Unsetting CI selects the existing `reuseExistingServer` behavior. It creates a
unique `paper/evidence/browser-s2-fixed-order-*` directory, records commands,
HEAD/tool versions, source hashes before build and after execution, built-asset
hashes before/after the suite, actual logs/JSON and exit status, and nine captures.
It restores existing screenshots on exit and verifies their hashes. After a
successful complete provenance validation, it atomically advances
`paper/evidence/current-browser-run` to that immutable directory. Do not edit
sources or rebuild assets while it runs. Preserve the printed directory path and
actual exit status; do not regenerate the historical private archive or text
manifest from this record.

The immutable current-source [capture hashes](evidence/browser-s2-fixed-order-QDL9iC9j/ipv4-post-run-screenshots.sha256)
and [restoration evidence](evidence/browser-s2-fixed-order-QDL9iC9j/historical-restoration.txt)
identify the retained PNG captures. These captures do not
confirms the preexisting screenshots were restored. These captures do not
establish historical reproduction or every-control routing. These bytes predate
the rename and cannot substantiate the post-rename source; the recorded current
execution above supplies fixture-specific provenance only.

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
# Optional/blocked: do not treat this as a primary reproduction command. The
# supplied artifact lacks the historical `paper/veritas.yaml`; use the stable
# repository-root `veritas.yaml` for the current artifact configuration.
# node --test tests/paper/*.test.mjs
node scripts/paper.mjs bundle
node scripts/paper.mjs private-bundle
npm test -- tests/protocol/scenarios.test.ts -t S2
npm test
npm run typecheck
# Environment-blocked in the recorded sandbox (tsx IPC-listener EPERM); see
# the host-permissions section above.
# npm run report:check
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
archive is generated by `bundle` and is ignored by the repository archive rule;
it is not supplied as a stable repository artifact.
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
with `graphicx`, and source-root compilation. The generated, ignored source
bundle contains only `manuscript.tex`, `figures/topology.pdf`, and `figures/s2.pdf`.
The preamble
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
`trip::planner` and `trip::booking`. Node S2 has four sequential awaited writes:
risk-detail, finance-detail, risk/summary, finance/summary. Its
json-render snapshot retains finance's summary and both detail blocks; A2UI's
Node assertion checks the finance writer, and its browser assertion checks the
finance headline visible and risk headline absent, not an exact node count.
The json-render and A2UI browser hosts call that same Node scenario function.
Node MCP retains both summary headlines in separate instances. Browser MCP
instead executes only risk/summary then finance/summary: no detail writes.
Its headline checks do not validate full Node S2. H1 and C2 are fixture-specific;
neither fixture tests concurrency, scheduling, interleaving, or randomization.
S2 is now named `s2-fixed-order-collision`, with runner `runFixedOrderCollision`.
Only the one specified sequential order is observed; outcomes cannot generalize
to alternative orders. Even uniform inputs would not isolate adapter, topology
and protocol causality. C6 routing/C7 consent remain partial; C9 is not performed.
S3 shared-state routing uses the orchestrator table. MCP bridge tests reject
the model-only call with the enforcing host and allow it in the permissive
variant. Read the manuscript for the first-instance routing caveat and the
weaker evidence behind confirmation and provenance labels.

The nine restored screenshots are historical artifacts. `docs/COMPARISON.md`
now reflects the corrected S2 identity and report key; its images remain historical.
The retained IPv4 archive contains pre-rename captures. `report:check` checks
consistency without rewriting that report. The normal browser command excludes
`@screenshot`; the documented two-spec command includes it. Browser MCP fixtures are not identical to the Node
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
