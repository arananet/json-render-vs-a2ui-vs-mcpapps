# Local execution record

## Pending human decisions

- Network lookup and pinning of upstream R1–R3 commits.
- Whether to authorize any new experiment: matched topology, alternative orders,
  repeated runs, or adversarial tests.

The archived release is available at https://doi.org/10.5281/zenodo.22896881,
which resolves to the latest version. The harness code is released under the MIT
licence; the manuscript, figures and evidence records under CC BY 4.0. None of
the remaining decisions or experiments was performed in this update.

Current status: editorially revised 10-page English PDF and clean TeX source
bundle generated locally; human scientific/editorial review pending. The latest
operations are in **Editorial and evidence revision** below. Earlier sessions,
including their base revisions, status statements, checksums and failures, are
historical and remain intact. Browser/report-command restrictions persist. This is an
agent-assisted record, not a signed attestation or independent-person reproduction.
Successful commands and blocked requirements are recorded separately below.

## Provenance

Inspection began on 21 September 2026 (UTC). Actual HEAD:
`b895e57671e118fcd3a7f86892fc1b2526b78c9c`. Initial `git status --short` was empty.
The previously supplied historical revision was not used as current HEAD.
The paper and its checks are uncommitted additions on this initially clean base.
The review-ready spec was read before edits; all existing contents are preserved.
No harness, adapter, scenario, package dependency, or generated comparison
behavior is changed. No new experiment, commit, push, submission, external issue,
maintainer contact, paid-service activation, or sandbox bypass is part of this work.

Environment observed: Darwin 25.6.0, arm64; default Node 18.20.5; selected Node
22.23.2 under `$HOME/.nvm/versions/node/v22.23.2/bin`; npm 10.9.8; Pandoc 3.11;
Tectonic 0.16.9. Poppler inspection tools are present. Installed Playwright is
1.63.0 (manifest `^1.50.0`); Vitest 5.0.1; Vite 7.3.6; TypeScript 5.9.3.
The Playwright cache has Chromium revisions including 1243. Presence of a cache
alone does not prove a successful launch. No assumption about `/opt/pw-browsers`
is made. Dependency installation reported by a previous session was not rerun.

Initial SHA-256 values:

```text
ff16ef0f2c390aecce197ac381a347830c1529d915ab63c1216828c0c47eef14  package-lock.json
fff9627c485a96e57226a569ab062e024fd422ae4431d86f83a4f7e572fc6a7f  docs/COMPARISON.md
aa41a0fb79a911d9fa29a0dc6888a9368c4265a8bc0fe7d10433559b77f4e008  .openspec/specs/reproducible-protocol-comparison-paper.spec.yaml
```

## First edit and immediate validation

Before editing, the current instructions, configuration, spec, status, scenario,
nearby adapters, assertions, report logic, and tool prerequisites were inspected.
H1 was stated before the first edit: fixed-order shared summary writes retain
finance, while separate MCP instances retain both headlines. The first edit
added the research questions/methodology slice and three focused checks for
metadata, the four awaited S2 emissions, and local evidence links.

Immediately afterward, with the Node 22 PATH selected,
`node --test tests/paper/manuscript.test.mjs` exited 0: 3 passed, 0 failed.
Only then was the manuscript expanded. This check validated the document/source
contract; it was not a new experiment.

`npm test -- tests/protocol/scenarios.test.ts -t S2` exited 0 at local 16:57:39
(20:57:39 UTC): 1 test file passed, 3 tests passed, 10 skipped by the filter.
Raw output is retained locally in `.scratch/paper/s2.txt` (ignored).

## Reference inspection and deviations

The web reader inspected the json-render repository README, A2UI repository
README (redirecting from google/A2UI to a2ui-project/a2ui), MCP Apps repository
README, and the MCP Apps draft/apps.mdx visibility and sandbox/CSP sections.
Installed package manifests and selected READMEs were also inspected. The
manuscript cites these sources and separates mutable web documentation from
exact local package versions. Upstream commit hashes were not captured.
The pinned live-web specification is not archived or independently verified
within this artifact; its reported host-requirement premise remains external.

The methodological reference was unavailable. Web opens of the repository,
raw REPRODUCTION.md and NOVELTY.md, main-branch README.md, REPRODUCTION.md,
NOVELTY.md, and the paper directory returned cache misses. A local
`curl -L --fail --max-time 25 -sS` request to the raw main README URL exited 6:
`Could not resolve host: raw.githubusercontent.com`. No content was retrieved
by that command. The manuscript path could not be discovered; its contents
were not inspected. A search did not recover the requested repository.
No alternate SARC project's results are substituted. Practices suggested by
the user are attributed as intended methodological influence with direct
verification pending. This access failure does not invalidate the local code
inspection, but prevents claiming completion of reference inspection.

## Historical validation: initial manuscript session

All Node/npm commands use the explicit Node 22 PATH above. The initial full
validation batch began at 21:03:09 UTC. Raw output is retained in
`paper/evidence/` for the commands named below; the original transient copies
remain in ignored `.scratch/paper/`. Times and durations in runner output are
execution metadata, not performance results.

| Command | Exit / outcome | Evidence and limitation |
| --- | --- | --- |
| `node scripts/paper.mjs latex` | 0 | Pandoc generated `paper/manuscript.tex`. |
| `node --test tests/paper/*.test.mjs` | 0; 8 passed | Author/affiliation, sections, links, S2 source order, SDK versions, freshness, stale-output rejection, and error paths. |
| `node scripts/paper.mjs check` | 0 | Fresh Pandoc output equals the generated LaTeX; repeated after manuscript edits. |
| `npm test` | 0; 24 passed in 3 files | `evidence/npm-test.txt`; includes report freshness and existing bridge/scenario checks. |
| `npm run typecheck` | 0 | `evidence/typecheck.txt`. |
| `npm run report:check` | 1; blocked | `evidence/report-check.txt`; tsx IPC listener failed with `EPERM` before report execution. |
| `npm run test:browser` | 1; blocked | `evidence/browser.txt`; Vite build succeeded; preview listener failed with `EPERM` at `::1:5178`. No browser test success. |
| `node scripts/paper.mjs pdf` | 1; engine exit 101 | `evidence/pdf-build.txt`; Tectonic internal panic creating a NULL system-configuration object, then reqwest event-loop panic. |
| `git diff --check` | 0 | No whitespace errors at inspection. |

The browser attempt began at 21:03:21 UTC. Vite emitted two dependency annotation
warnings; Playwright emitted color-environment warnings before the server failure.
The installed Chromium executable was subsequently confirmed present at the
default macOS cache's revision 1243 path, but no launch success is inferred.
`CHROMIUM_PATH` was not set by this session. No alternate host binding, IPC
workaround, elevated execution, package install, or browser download was attempted.

Tectonic was invoked as `tectonic --only-cached --untrusted --keep-logs
paper/manuscript.tex`. Its panic occurred before a PDF was produced. Compilation
was stopped, with no engine/configuration workaround. Consequently `pdfinfo`
on a PDF, `pdftotext`, unresolved-reference inspection of extracted text, and
visual page-layout inspection were **not performed**. Poppler's availability
and version (26.09.0) are not evidence of a PDF build. LaTeX metadata and internal
manuscript reference labels are checked, but typeset layout remains unverified.
That attempt used the pre-ledger-update draft. Its input hash was not captured
before later manuscript edits; this is a provenance limitation. Final LaTeX was
regenerated and checked, but the failed PDF workflow was not retried on that
final draft. The artifact checksum list identifies the final retained files,
not the earlier failed build input.

The successful Vitest report-freshness assertion does not erase the standalone
`report:check` failure. Likewise, a successful Vite build does not stand in for
browser tests. Existing report and screenshot bytes are preserved. Full
verification is therefore partial, with concrete environment blockers.

An orchestration JavaScript syntax error occurred before launching the first
parallel validation batch; no shell command ran from that invocation. It was
corrected before the recorded batch. Two later manual patch attempts failed
context matching and made no changes; a subsequent exact-context patch succeeded.
These are editing/tool invocation errors, separate from harness test outcomes.

## Historical acceptance and retained artifacts

The English manuscript has the requested author/affiliation, research questions,
methodology, bounded results, evidence table, related work, limitations,
reproducibility, conclusion, and AI-assistance disclosure. It distinguishes SDK,
adapter, host policy, and protocol obligations and documents the actual S2 order.
The guide records prerequisites, semantic outcomes, provenance, failures and
unverified work. LaTeX is generated from the single editable Markdown source.
Focused checks cover metadata, required sections, links and LaTeX correspondence.
PDF generation was attempted but is blocked; that conditional requirement is
reported honestly rather than represented as a successful artifact.

Direct inspection of the requested methodological repository, fresh browser
assertions, standalone report-command execution, PDF output and its inspection,
and human scientific/editorial review remain incomplete. Human approval,
publication readiness, complete security validation and independent reproduction
are not claimed. No commit or push was performed.

File hashes in `evidence/artifacts.sha256` identify the manuscript, generated
LaTeX, reproduction materials, tooling/tests, reviewed spec, retained command
outputs, and existing harness/report/screenshots. The checksum list excludes
itself and ignored OpenSpec runtime records. It is not a signature. Changes to
these files require regeneration and fresh verification. See the next section
for OpenSpec command evidence and freshness handling.

## Historical OpenSpec verification

`bash scripts/openspec check` exited 0 and printed PASS for both the harness and
paper specs. `bash scripts/openspec verify reproducible-protocol-comparison-paper`
then ran configured `npm test` at 21:05:27–21:05:30 UTC and exited 0, recording
`passed`. The JSON explicitly has `acceptance_criteria_proven: false`.
`bash scripts/openspec status reproducible-protocol-comparison-paper` exited 0
and reported `passed`, `stale: false`, and `next_step: human_review` at that point.
Copies of this preliminary report, status, and test output are retained in
`evidence/openspec-preliminary.json`, `evidence/openspec-status.txt`, and
`evidence/openspec-tests.txt`. This passed result applies to the configured
protocol tests, not the blocked browser/PDF/reference requirements.

That report predates final ledger closure and checksum generation. The final
handoff evidence is the latest ignored runtime report named by
`bash scripts/openspec status reproducible-protocol-comparison-paper`, after
verification is repeated on the completed inputs. It is intentionally not copied
back into nonignored paper files afterward, because that would itself invalidate
the fingerprint. No paid execution adapter is enabled. Status remains `review`
in the spec; no human approval is fabricated.

## Illustrated PDF follow-up: 21 September 2026

The actual base HEAD is still `b895e57671e118fcd3a7f86892fc1b2526b78c9c`.
Unlike the initial session, this follow-up started with the previous paper work
already dirty/untracked. Those edits and all old evidence files were retained.
The user authorized source-backed visuals and local PDF work, not a publication
or licensing decision. The spec remains `review`, with added figure/presentation
criteria; no approval was fabricated. Harness code, adapters, scenarios, existing
outcomes, screenshots and `docs/COMPARISON.md` remain unchanged.

### Hypothesis and first check

The narrow build hypothesis was that the cached-only default bundle still
initialized a network client, causing the earlier system-configuration panic.
The exact old log, installed CLI help, cached files, and official Tectonic
directory-bundle source were inspected. The first edit added a checked local
`PAPER_TEX_BUNDLE` directory option while retaining `--only-cached --untrusted`,
plus spec criteria and a regression test. Immediately afterward,
`node --test tests/paper/build.test.mjs` passed all 4 checks, before expansion.

The initial explicit directory avoided the panic but lacked `SHA256SUM`.
Resources were copied into `.scratch/paper-local-tex/bundle`, with a computed
resource-set fingerprint, and the writable format cache was redirected using
`TECTONIC_CACHE_DIR`. No default-cache files were modified. The copied subset
identifier is `59a28378d49c98e0010322ea068a4f2148faed81ec89a76dabca3093c1909958`;
individual resource hashes are retained. This does not claim a complete upstream
bundle. Intermediate template attempts exposed missing `size10.clo`,
`textcomp.sty`, then `calc.sty`. The final template uses 11-point article layout,
available standard packages, and equivalent native e-TeX width expressions.
All engine invocations retained untrusted/cached-only mode. No TeX installation,
download, shell escape, permissions escalation, or sandbox bypass occurred.

### Current attempt ledger

Commands use Node 22.23.2/npm 10.9.8, Pandoc 3.11, Tectonic 0.16.9, native
Graphviz 13.1.0, and Poppler 26.09.0. Evidence below lives in `evidence/pdf-visuals/`.
For successful builds, `PAPER_TEX_BUNDLE` is the absolute path to
`.scratch/paper-local-tex/bundle` and `TECTONIC_CACHE_DIR` points to its sibling
`cache`. The successful engine command runs from `paper/`:

```text
tectonic --only-cached --untrusted --keep-logs --bundle <absolute-local-bundle> manuscript.tex
```

| Command / stage | Result | Retained output |
| --- | --- | --- |
| `node scripts/paper.mjs pdf`, original cache directory selected | Exit 1: missing directory fingerprint | `local-bundle-attempt.txt` |
| Same command, copied local bundle | Exit 1: missing `size10.clo` | `local-bundle-build.txt` |
| Minimal template attempt | Exit 1: missing `textcomp.sty` | `minimal-template-build.txt` |
| Figured template attempt | Exit 1: missing `calc.sty` | `figured-build.txt` |
| `mmdc -i paper/figures/topology.mmd -o paper/figures/topology.pdf -c paper/figures/mermaid-config.json -w 1200 -f` | Exit 1: Chromium sandbox initialization failed | `mermaid-attempt.txt` |
| `node scripts/paper-figures.mjs` | Exit 0: native vector PDF/SVG figures | Generated `.dot`, `.pdf`, `.svg` alongside `.mmd` |
| `node scripts/paper.mjs latex` and `check` | Exit 0: final generated TeX is current | `latex-freshness.txt` |
| `node scripts/paper.mjs pdf`, portable template | Exit 0: first illustrated PDF, with layout warnings | `portable-template-build.txt` |
| Layout refinement builds | Exit 0: corrected overflow and improved figure sizing/float placement | `layout-build.txt`, `final-build.txt` |
| Build with input/output hashing | Exit 0: final PDF, 10 pages | `verified-build.txt`, `pdf-build-manifest.json` |
| `node --test tests/paper/*.test.mjs` | Exit 0: 19 checks passed | `paper-checks.txt` |
| `npm test` | Exit 0: 24 tests passed in 3 files | `npm-test.txt`; started 21:22:15 UTC |
| `npm run typecheck` | Exit 0 | `typecheck.txt`; started 21:22:15 UTC |
| `node scripts/paper.mjs bundle` | Exit 0: local source archive | `paper/arxiv-source.tar.gz` |
| Tectonic from extracted archive root, same local bundle | Exit 0; extracted text equals main PDF text (`cmp` exit 0) | `bundle-build.txt` |

The complete final build command, UTC timestamp, and SHA-256 input/output hashes
are in `pdf-build-manifest.json`. Intermediate unsuccessful draft inputs were
not separately frozen; their output logs identify the actual errors, but cannot
reconstruct every draft byte. The later aggregate checksum file identifies final
retained work, not those transient inputs. A read-only discovery command also
encountered an unmatched shell glob; subsequent literal-directory inspection
confirmed the available packages without changing files.

The known failing standalone `report:check` and browser commands were not
repeated in the unchanged restricted environment. Their earlier `EPERM` logs
remain authoritative evidence of those attempts. The fresh passing Vitest suite
includes the existing report-freshness assertion; this is distinct from claiming
the standalone command passed. No browser assertions or screenshots were freshly
executed/captured. The earlier methodological-reference access failure remains
unresolved and is not concealed by successful PDF generation.

### Figure provenance and PDF inspection

The figures are original summaries of local source/assertions. Figure 1 shows
the configured shared state, local identity mapping, and post-connect visibility
handler; Figure 2 shows the four awaited S2 writes and retained summary states.
Tests check write order, fixture text, enforcement order, Mermaid-to-DOT
correspondence, and invalid syntax. They are not numerical outcome charts or
new experiments. Chromium-based Mermaid rendering failed once; no browser
sandbox-disabling flag was tried. A deliberately limited Mermaid flowchart
converter uses native Graphviz and rejects unsupported syntax. This renders
the editable Mermaid sources without browser host functions. Its provenance
and limitations are documented in `figures/README.md`.

`pdfinfo` confirms 10 letter-size pages, Eduardo Arana metadata, PDF 1.7,
no encryption and no JavaScript. `pdftotext -layout` confirms Eduardo Arana,
Arananet, both numbered captions and references; checks find no `??`, replacement
characters, undefined references/citations, missing-glyph warnings or overfull
boxes in the final engine log. `pdffonts` reports all fonts embedded, including
Cairo-generated Type 3 subsets alongside the text fonts; no claim of a separate
font compliance audit is made. These outputs are retained as `pdfinfo.txt`,
`pdffonts.txt`, `extracted-text.txt`, and `engine-log.txt`.

All 10 pages were rendered at montage scale and visually inspected. Title page 1,
topology page 4, S2 page 6, and dense evidence table page 7 were also inspected at
120 dpi. Figure assets were inspected separately. Labels, shapes and dashed
lines remain interpretable in grayscale; no clipped text, overlapping table
cells, or missing caption/reference was observed. The original overfull paragraph
was repaired by rephrasing without changing its claim. Two underfull-paragraph
warnings remain (badness 1178 and 2181). Tectonic's TeX image scan also warns
about PDF 1.7 figures against its initial 1.5 setting; the actual output is 1.7,
set by the document's PDF-version special. These notices are retained, not
suppressed. Human proofreading and scientific review are still pending.

### Source packaging and final verification

The clean archive contains exactly root `manuscript.tex` and the two PDF figures;
it excludes the compiled main PDF, logs, auxiliary files, build scripts and
unused assets. The generated TeX preamble is self-contained and uses standard
packages. No runtime conversion, JavaScript, network or shell escape is required.
Root compilation and equivalent extracted text were checked locally. This
implements relevant preparation practices from the inspected official arXiv
guidance, but does not establish arXiv TeX Live validation or acceptance.
No licensing choice was made and the repository's MIT license is untouched.

Current checksum evidence is `evidence/pdf-visuals/artifacts.sha256`; the older
`evidence/artifacts.sha256` remains an explicitly historical snapshot. Current
OpenSpec check output is retained with this follow-up. Final `verify`/`status`
evidence resides in ignored `.openspec/runs/`, following the same freshness
procedure documented above: no nonignored evidence is rewritten afterward.
No commit, push, upload, submission, paid tool, or publication action occurred.

## Editorial and evidence revision — 21 September 2026

### Scope, revision and preservation

Actual starting and pre-verification HEAD:
`b5d06eafcd4cf9cb0ed49131add55cbdecbd4b7c`. Tracked/untracked-nonignored status
was empty; tracked and index diffs remain empty. This revision did not perform
the earlier documentation commit. The current AGENTS.md, configuration,
review-ready paper spec, status, exclusions, relevant source/assertions, current
build scripts/tests and prior failure evidence were read before changes. The
existing spec already covers this editorial/evidence work; no tracked spec,
README or CHANGELOG change was needed. Their existing local-paper links remain.

`.git/info/exclude` still protects `/paper/`, `/scripts/paper.mjs`,
`/scripts/paper-figures.mjs`, and `/tests/paper/`. The clean Git status therefore
does not mean the paper is committed or fingerprinted by OpenSpec. No adapter,
scenario, harness assertion, lockfile, generated comparison report, license,
or build-tool behavior changed. No experiment was added and C9 was not performed.

Current evidence lives under `evidence/editorial-20260921/`. Before editing,
the earlier manuscript, TeX, PDF, engine log, archive and PDF build manifest were
copied to its `previous/` subdirectory; both figures' earlier sources and
derivatives were copied before rerendering. These are immutable historical
snapshots, not editable manuscript alternatives. Older failure logs and checksum
manifests remain untouched. The canonical PDF manifest was refreshed by the
existing build script; its previous contents remain in `previous/`.

### First edit and editorial changes

The falsifiable local hypothesis stated before editing was that the abstract
could state configuration-specific findings while preserving partial C3/C6
and proposed C9. The cheapest check was a focused documentation test of the
abstract and claim-table statuses. The first substantive edit revised only the
abstract and added two tests. Immediately afterward,
`node --test tests/paper/editorial.test.mjs` passed **2/2**, with no skips or
failures (`first-edit.txt`), before the broader revision.

The introduction now leads with findings and the thesis naming adapter mapping,
namespace/topology and enforcement site alongside SDK/protocol. Results,
captions and conclusion preserve the C3/C6 limits; H1 is explicitly only
partially supported overall. The C1–C9 status table was audited and its statuses
were not upgraded. Agent-to-user narration and external reproduction attribution
were removed. AI assistance and pending human scientific/editorial review remain
explicit. Repeated framing caveats were consolidated without removing the
methodological and validity limits.

The two original grayscale-safe Mermaid diagrams remain source-derived
illustrations, not experimental observations. Only the S2 shared-state box
wording changed: json-render's checked headline is now separate from A2UI's
writer-map-only evidence and pending DOM check. Existing offline Mermaid-subset
to Graphviz tooling regenerated vector assets; the topology content is unchanged.
One regression assertion guards the S2 wording. No charts of performance or
adapter-label scores, screenshot captures, or raw conversations were added.

### Current execution results

Selected environment: Node **22.23.2**, npm **10.9.8**, Pandoc **3.11**,
Tectonic **0.16.9**, Graphviz **13.1.0**, Poppler **26.09.0**, Darwin arm64.
Exact environment, HEAD, clean diffs, exclusions and comparison/lockfile hashes
are in `environment-worktree.txt`. Commands used the Node 22 PATH in the guide.
The existing local TeX bundle and writable cache were selected with
`PAPER_TEX_BUNDLE=$PWD/.scratch/paper-local-tex/bundle` and
`TECTONIC_CACHE_DIR=$PWD/.scratch/paper-local-tex/cache`. No installation,
resource download, network build, shell escape, or relaxed sandbox was used.

| Actual command | Result | Current evidence file |
| --- | --- | --- |
| `node --test tests/paper/editorial.test.mjs` immediately after first edit | Exit 0; 2 passed | `first-edit.txt` |
| `node --test tests/paper/editorial.test.mjs tests/paper/manuscript.test.mjs` | Exit 0; 10 passed | `editorial-checks.txt` |
| `node scripts/paper-figures.mjs` | Exit 0; two vector figures regenerated | `figures.txt` |
| `node --test tests/paper/figures.test.mjs` | Exit 0; 5 passed | `figure-checks.txt` |
| `npm run report:check` | Exit 1; tsx IPC listener `EPERM`, before report check | `report-check.txt` |
| `npm run test:browser` | Exit 1; page build succeeded, preview listener `EPERM` on `::1:5178`; no browser tests ran | `browser.txt` |
| `npm test` | Exit 0; 24 tests in 3 files passed | `npm-test.txt` |
| `npm run typecheck` | Exit 0 | `typecheck.txt` |
| `node scripts/paper.mjs latex && node scripts/paper.mjs check && node scripts/paper.mjs pdf && node scripts/paper.mjs bundle` | Exit 0; fresh TeX, PDF and source archive | `pdf-build.txt` |
| `node --test tests/paper/*.test.mjs` | Exit 0; 24 passed, no failures/skips | `paper-checks.txt` |
| `bash scripts/openspec check` | Exit 0; both repository specs pass | `openspec-check.txt` |

Blocked workflows were stopped after their single current retries. The passing
Vitest report assertion is not a successful standalone `report:check` invocation.
No browser run or historical screenshot provenance is newly established. C3 and
C6 remain partial; a later browser pass alone would not prove every-control
routing. The guide supplies the exact pending human-run command for a terminal
with IPC, preview-listener and browser-launch permissions. No outside-sandbox
command was executed.

The methodological reference retry remains blocked: direct web requests for
README.md, REPRODUCTION.md, NOVELTY.md and
`paper5-authority-derivation-draft-v0.6.6.md` returned cache misses; GitHub API
access did not provide a commit, and shell curl reported DNS error 6. Details,
including the pipeline's zero status despite curl failure, are in
`reference-access.md`. No revision was verified, no direct source inspection is
claimed, and no wrapper-reported inspection is promoted to verified evidence.
The manuscript now contains only a limited acknowledgment, not substantive
scientific attribution or external reproduction credit.

### PDF, visual inspection and source bundle

`pdfinfo paper/manuscript.pdf` confirms **10 letter-size pages**, Eduardo Arana
metadata, PDF 1.7 and no JavaScript. `pdftotext -layout` confirms the English
revision, Arananet, both numbered figure captions and resolved references.
`pdffonts` and the PDF tests confirm all reported fonts embedded (including
the retained vector figures' Type 3 subsets). Evidence is `pdfinfo.txt`,
`extracted-text.txt`, `pdffonts.txt`, `engine-log.txt`, and `pdf-build-manifest.json`.
No overfull boxes, missing characters, undefined references/citations or `??`
were found. Two underfull paragraph warnings remain (badness 1178 and 2181).
Tectonic also retains its PDF-1.7-figure/initial-1.5 warning; actual output is 1.7.
These notices were not suppressed or represented as a clean warning-free build.

`pdftoppm -r 100 -png paper/manuscript.pdf` rendered all ten pages; a local PIL
contact sheet is retained in `pages/montage.png`. All pages were visually
inspected at montage scale, and pages **1, 4, 6 and 7** (title, topology, S2,
claim table) were inspected individually at 100 dpi. No clipping, overlaps,
unreadable figure labels, or broken table rows were observed. This assistant
inspection is not human proofreading or scientific approval.

The clean `paper/arxiv-source.tar.gz` contains only root `manuscript.tex` and
`figures/topology.pdf`, `figures/s2.pdf`. It was extracted into a fresh local
directory and compiled from that root with
`tectonic --only-cached --untrusted --keep-logs --bundle "$PAPER_TEX_BUNDLE" manuscript.tex`.
The compile and byte comparison of extracted text against the main PDF both
exited 0 (`bundle-check.txt`); PDF byte identity is not asserted. No main PDF,
log, auxiliary file or runtime converter enters the archive. Local success is
not arXiv TeX Live validation, acceptance or publication approval.

### Evidence freeze and final OpenSpec handoff

`artifacts.sha256` in the current evidence directory identifies the ignored
paper package, its historical evidence, scripts and tests, plus selected tracked
inputs and exclusions. It excludes itself. Earlier checksum lists are
historical snapshots, not assertions that older generated files remain current.
The current PDF build manifest independently binds manuscript, TeX, tooling,
figures and PDF. Final focused checks and checksum validation precede OpenSpec.

After freezing these inputs, the required commands are
`bash scripts/openspec verify reproducible-protocol-comparison-paper` and
`bash scripts/openspec status reproducible-protocol-comparison-paper`, under
Node 22. Their actual final results belong to native ignored `.openspec/runs/`
records and the terminal handoff, not a predeclared pass in this record. No
paper or evidence rewrite follows that final verification. OpenSpec tests only
the configured `npm test` contract and excludes this ignored paper from its
fingerprint; passing command evidence does not prove acceptance criteria.
Human scientific/editorial review, reference verification and the two blocked
commands remain pending. No commit, push, publication, upload, license change,
paid service or sandbox bypass was performed.

## Browser evidence incorporation — 22 September 2026 UTC

This appended entry supersedes earlier *current-status* descriptions of C3 and
browser availability, without rewriting those failed runs. Dates in this entry
are UTC; the browser execution occurred on 21 September in America/New_York.
The new evidence is the existing outer-terminal run, not a browser retry in
this manuscript-editing session and not an independent-person reproduction.

### Inspected execution and falsifiable local hypothesis

Before editing, the local hypothesis was: the successful existing browser
assertions support C3 and H1 for the three tested configurations, while C6,
json-render consent, and C9 retain their previous limits. A failed report,
changed test hash, or an A2UI assertion that did not check headline visibility
would defeat this evidence update. The cheap check was the focused editorial
and manuscript test command immediately after the first substantive edit.

Evidence directory: [browser-terminal-20260922T013449Z-zH4HTK](evidence/browser-terminal-20260922T013449Z-zH4HTK/).
Inspected `provenance.txt`, `commands.txt`, `ipv4-commands.txt`, both JSON reports,
IPv4 stdout/stderr, preview log, build stdout/stderr, screenshot archives/hash
lists, and `historical-restoration.txt`. The recorded browser/config/package
source hashes matched the current files; the initial manuscript hash also
matched before editing. The provenance file's missing `veritas.yaml`
hash is retained as a missing file, not a successful provenance check.

- `npm run build`: exit 0, with the retained Rollup annotation warnings.
- Default managed preview: exit 1, timed out after 60000 ms; zero tests.
- Explicit preview: `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5178 --strictPort`.
- `env -u CI PLAYWRIGHT_JSON_OUTPUT_FILE=<absolute-evidence>/playwright-ipv4.json node node_modules/@playwright/test/cli.js test tests/browser/render.spec.ts tests/browser/screenshots.spec.ts --reporter=line,json --output=<absolute-evidence>/ipv4-test-results`: exit 0, **18 passed in 8.9 s**; 9 render and 9 screenshot tests, no skips, failures or flaky tests. JSON start: `2026-09-22T01:38:00.178Z`; stderr empty. Existing `reuseExistingServer` used; server stopped afterward.
- All nine PNG payload hashes matched `ipv4-post-run-screenshots.sha256` in the
  new capture archive. All nine historical archive hashes also matched both
  the historical hash list and restored `docs/screenshots` files. Fresh captures
  are not historical reproduction. No raw browser evidence was rewritten.

The guide now documents an equivalent IPv4 command with capture preservation,
archiving and restoration. Neither test file, browser configuration, adapter,
scenario nor security assertion changed. A2UI S2 checks finance visible and
risk absent within the surface; its title overstates node counting. C3 is
**supported**, and H1 is supported only for the directly tested configurations
and fixed order. C6 remains **partial** because Node first-instance routing and
the distinct browser fixture do not establish every-control ownership. C7
consent remains **partial**; C9 remains **proposed, not performed**. Adapter and
topology confounding remain explicit; no isolated protocol superiority follows.

### Current manuscript and build validation

New logs only: [manuscript-browser-update-20260922](evidence/manuscript-browser-update-20260922/).
Commands used Node 22.23.2 through the guide's PATH. PDF commands used
`PAPER_TEX_BUNDLE=$PWD/.scratch/paper-local-tex/bundle` and
`TECTONIC_CACHE_DIR=$PWD/.scratch/paper-local-tex/cache`.

| Command | Actual result | Evidence |
| --- | --- | --- |
| `node --test tests/paper/editorial.test.mjs tests/paper/manuscript.test.mjs` immediately after first edit | Exit 0; 11 passed | Session terminal |
| `node scripts/paper-figures.mjs` | Exit 0; both original figures regenerated | Session terminal |
| `node --test tests/paper/editorial.test.mjs tests/paper/manuscript.test.mjs tests/paper/figures.test.mjs` | Exit 0; 16 passed | Session terminal |
| `node scripts/paper.mjs latex` and `node scripts/paper.mjs check` | Both exit 0; fresh TeX | `latex.txt`, `latex-freshness.txt` |
| `node scripts/paper.mjs pdf` and `node scripts/paper.mjs bundle` | Both exit 0 | `pdf-build.txt`, `source-bundle.txt` |
| `node --test tests/paper/build.test.mjs tests/paper/pdf.test.mjs` | Exit 0; 9 passed | `build-checks.txt` |
| `node --test tests/paper/*.test.mjs` | Historical: Exit 1; 25 passed, 1 failed file | `paper-checks.txt`; superseded by the current transcript below. |
| `npm test` | Exit 0; 24 passed across 3 files | `npm-test.txt` |
| `npm run typecheck` | Exit 0 | `typecheck.txt` |
| `bash scripts/openspec check` | Exit 0; both specs valid | `openspec-check.txt` |
| `tectonic --only-cached --untrusted --keep-logs --bundle "$PAPER_TEX_BUNDLE" manuscript.tex` from a fresh extracted source root | Exit 0; extracted PDF text identical to current main PDF | `bundle-compile.txt` |

The PDF has 10 letter-size pages, embedded fonts, Eduardo Arana metadata,
Arananet, resolved references and both numbered figures. No overfull boxes,
missing characters or undefined citations/references were found. Two underfull
paragraph warnings (1178, 2181) and the PDF-1.7 figure/initial-1.5 setting warning
remain; actual output is PDF 1.7. All ten rendered pages were inspected at
montage scale, and S2/claim-table pages 6 and 7 individually, with no observed
clipping or overlaps. This is assistant inspection, not human approval.
`pdfinfo.txt`, `pdffonts.txt`, `extracted-text.txt`, and `pages/` retain the checks.

The clean archive contains only `manuscript.tex`, `figures/topology.pdf`, and
`figures/s2.pdf`. The build tool now writes current derivative metadata to
`paper/pdf-build-manifest.json`; the historical manifest under
`paper/evidence/pdf-visuals/` was not overwritten. The current hash manifest
binds the updated manuscript, TeX, figure sources/assets, build tools and PDF.

### Paused historical review gate and provenance limits

The full local paper suite is **not green**: `veritas-inputs.test.mjs` fails at
module load because `veritas.yaml` is absent. Its later source-equality
assertion therefore did not execute. A separate read-only comparison found five
dated source views stale against current sources: `scripts/paper.mjs`,
`tests/paper/editorial.test.mjs`, `tests/paper/figures.test.mjs`,
`tests/paper/pdf.test.mjs`, and `paper/figures/s2.mmd`. All eleven historical views
still match their recorded hashes (`historical-review-views.json`). Those copies,
the private package manifest, selection, auditor, settings, gates, permissions,
reports and Veritas implementation remain untouched. The affected review gate
is left failed/paused, not weakened or relabeled as passed. No paid auditor ran.

The initial working HEAD was `b5d06eafcd4cf9cb0ed49131add55cbdecbd4b7c`, with an
already modified spec. During this work HEAD changed externally to
`f552114ef3ae7a3a94b601d8b246265daed3779e` (`updating .gitignore`), including the
spec update; this task issued no commit, staging, push or publication command.
The paper, its tools and tests remain Git-excluded. A read-only SHA-256 comparison
confirmed 187 protected historical evidence, Veritas, browser/config and source
files unchanged (`historical-integrity.txt`). The new spec criteria document
this bounded update; status remains `review`, with no claimed human approval.

Standalone `report:check`, external reference verification, human review, the
historical private-review gate, C6/C7 coverage and C9 remain open. Final OpenSpec
verification uses the configured `npm test` only; ignored paper checks and
acceptance criteria are not proven by that command. Native final results are
recorded below after execution.

`bash scripts/openspec verify reproducible-protocol-comparison-paper` exited 0
(`passed`). `bash scripts/openspec status reproducible-protocol-comparison-paper`
exited 0 and reported `passed`, `stale: false`, `next_step: human_review` at
`2026-09-22T01:47:35Z`. Native evidence:
`.openspec/runs/reproducible-protocol-comparison-paper/verify-126774386838000.json`.
The new `openspec-verify.txt` and `openspec-status.txt` retain these outputs.
The final protected-file check again found all 187 files unchanged, and every
entry of the current PDF build manifest matched. The full paper suite failure
above remains unresolved; these configured-command results do not clear it.

## Private artifact corrections, 22 September 2026 UTC

Current maintenance base: `f552114ef3ae7a3a94b601d8b246265daed3779e`.
New command outputs and exit codes are retained separately in
`evidence/private-corrections-pQO8WZyu/`; prior raw logs were not overwritten.
This is downstream private paper maintenance under the existing review spec.
Codex made no harness, adapter, scenario-execution or external-auditor changes.

The falsifiable local hypothesis was that the inspected Node and browser MCP
write sequences support separate fixture-specific claims, not common full-S2
validation. The cheapest check compared the existing sequences and assertions.
After the first manuscript/test patch, `node --test tests/paper/editorial.test.mjs`
passed all seven checks (`first-editorial-check.txt`). The sequences are:
Node risk-detail, finance-detail, risk/summary, finance/summary; browser MCP
risk/summary, finance/summary only. Both await writes in fixed order. The
json-render and A2UI browser hosts call the Node scenario function.

Corrections for the supplied external findings (not closure decisions):

| Finding | Artifact correction and verified limit |
| --- | --- |
| ADVERSARIAL-001 | Retained real IPv4 JSON/stdout, commands, provenance and nine captured PNGs are selected into the private archive. Existing evidence has 18 passes (9 render, 9 capture), exit 0, 8.9 s; no browser rerun. One assisted local run, not independent reproduction. |
| ADVERSARIAL-002 | Manuscript/guide distinguish publicly clonable harness, ignored private paper inputs and single-machine builds. `paper/private-review.tar.gz` packages current build/fixture sources and selected evidence; `PRIVATE-MANIFEST.json` records exact paths, hashes, provenance, dependencies and commands. No public or independent build is claimed. |
| ADVERSARIAL-003 | Abstract, H1, RQ2, C2, figure/caption, expected outcomes and conclusion explicitly separate four-write Node S2 from two-write browser MCP. Browser MCP does not validate full Node S2. C3 observes finance visible/risk absent, not an exact node count. |
| ADVERSARIAL-004 | Current scientific claims describe fixed-order sequential identifier collision, without scheduling, interleaving, randomization or a concurrency experiment. Legacy source/test names remain unchanged. Uniform inputs alone cannot isolate adapter/topology/protocol causality. |
| ADVERSARIAL-005 | Methodology distinguishes adapter-supplied capability labels, first-match selection, content assertions and actual bridge response/rejection checks. json-render S3 consent and permissive MCP scenario tests assert labels only; bridge tests provide separate response evidence. C6/C7 remain partial; C9 proposed/not performed. |

Validation: `npm test` passed 24 tests, `npm run typecheck` passed, and
`bash scripts/openspec check` passed. The full paper suite returned exit 1:
27 passing checks and one file-level failure because `veritas.yaml` is
absent (`paper-checks.txt`). Its existing test and historical source views were
left unchanged. Veritas was not executed; this local regression test only tried
to read the expected YAML. Stale historical views remain a separate known
limitation and were not rewritten. The final six in-scope paper test files
passed 27 checks after the last manuscript change (`final-paper-scope.txt`);
this does not clear the full-suite failure or the external findings.

Figures, LaTeX, PDF and the TeX-only bundle were regenerated with existing tools.
The current PDF has 10 pages; author, embedded fonts, resolved references,
freshness and input hashes passed existing checks. Figure 2 was visually
inspected on page 6 (`figure-page.png`): no overlap or clipping observed.
Tectonic retained PDF-version and underfull-box warnings, but no overfull boxes,
missing characters or undefined references were detected. Native cached TeX
resources were used; no cache or dependency bundle is distributed.

Private-package tests extracted into a temporary directory, verified all payload
hashes/current bytes and local imports, checked all nine fresh screenshot hashes
and historical browser test/config/package hashes, and ran LaTeX freshness from
the extracted root. The archive excludes external auditor materials and its
integration test; the workspace test remains in place and failing as above.
Dependencies (locked npm packages, matching Chromium, listener permissions,
Pandoc, Graphviz, Tectonic/TeX resources and Poppler) must be supplied externally.
No fresh dependency installation, clean-machine or independent reproduction was
performed. Historical fixture bytes are not retroactively attested by current
hashes. Absolute paths in preserved logs are execution provenance only.

OpenSpec `verify reproducible-protocol-comparison-paper` and `status` both
returned exit 0; status reported `passed`, `stale: false`, and
`next_step: human_review`. Native evidence is
`.openspec/runs/reproducible-protocol-comparison-paper/verify-128139831676000.json`.
These commands run configured `npm test`; ignored paper inputs and all acceptance
criteria are not proven by that result. Final archive integrity and status
outputs are retained separately in this new evidence directory.

No staging, commit, push, publication, paid judge, privacy-exclusion removal,
auditor configuration/selection/gate/report change or new experiment occurred.
Independent reevaluation of all five findings and human review remain pending.

### Private manifest input routing — 2026-09-22

The user authorized one artifact input addition to the active root `veritas.yaml`:
`paper/evidence/private-review-manifest.json`. This readable UTF-8 JSON is an
exact 26,893-byte copy of `PRIVATE-MANIFEST.json`, obtained with `tar -xOf` from
the current `paper/private-review.tar.gz`; no matching evidence copy existed.
All 94 listed member SHA256 hashes and byte lengths matched extracted bytes;
archive members have safe, unique relative paths and are regular files. The
archive itself remained unchanged. Member hashes describe file bytes, not the
archive digest, execution, or independent reproduction.

Immediate checks passed YAML parsing, config-relative file resolution, text
readability, exact archived-manifest equality, and structured before/after
comparison permitting only this single `artifact.paths` addition. All other
config bytes and settings remained unchanged. No Veritas/judge run, archive or
PDF rebuild, historical-view change, commit, push, or publication occurred.
The known test expecting removed `veritas.yaml` remains unchanged; this
routing check does not clear that historical regression blocker.

## S2 identity correction and provenance gap — 2026-09-22

Hypothesis: S2 already awaits one fixed sequential order; the concurrency claim
was naming/documentation drift. Initial `git status --short --untracked-files=all`
showed only the user's modified review-ready paper spec. Paper inputs are locally
excluded. Existing spec edits were preserved; no onboarding or new study was run.

Renamed `src/scenarios/s2-concurrent-composition.ts` to
`src/scenarios/s2-fixed-order-collision.ts`, scenario ID
`s2-concurrent-composition` to `s2-fixed-order-collision`, exported runner
`runConcurrentComposition` to `runFixedOrderCollision`, and trace/report key
`compose.concurrent-write` to `compose.identifier-collision`. The current title
is “Fixed-order sequential identifier collision”. Imports, browser query values,
tests, report/matrix, README, changelog, specs and figure source references follow
these identities. Source comparison against HEAD confirms the runner body is
byte-identical after substituting only ID, runner and title. No operation, write
order, fixture value, adapter decision or assertion changed. Node still awaits
risk detail, finance detail, risk summary, finance summary; browser MCP still
uses only the two summaries. H1/RQ2/results/conclusion explicitly cannot generalize
to alternative orders, scheduling or concurrency. Figure labels did not change,
so figure assets were not regenerated.

Evidence: [s2-rename-20260922T112406Z](evidence/s2-rename-20260922T112406Z/).
Immediately after the substantive rename, the obsolete-name search returned
no active matches (rg exit 1) and `npm run typecheck` passed. Subsequent checks:

| Command/check | Actual result |
| --- | --- |
| `npm test` | 24 passed, including report freshness; exit 0 |
| `npm test -- tests/protocol/scenarios.test.ts -t S2` | 3 passed, 10 skipped by the explicit filter; exit 0 |
| Focused manuscript/editorial/figure/provenance tests | Initial 19/20: new wording check mishandled sentence-initial “Only”; case handling corrected, then 20/20 passed |
| `npm run typecheck` (final) | Passed; exit 0 |
| `node scripts/paper.mjs latex` and `pdf` with recorded local TeX bundle/cache | Passed; PDF-only warnings about embedded PDF version and underfull boxes retained |
| `node --test tests/paper/*.test.mjs` | Historical: n=1 execution: 29 passed, 2 failed; exit 1; superseded by the current transcript below. |
| `git diff --check`; shell syntax | Passed |

The two full-paper failures are deliberately unresolved: private packaging now
rejects the pre-rename browser directory because current source/build snapshots
are missing, and the unchanged external integration test cannot read
`veritas.yaml`. Archive integrity assertions were retained, not bypassed.
No private archive was generated, including by the failing temporary package test.
PDF metadata/text/font and current PDF-input checks passed in that same suite.
No new browser run or preview was attempted in this sandbox.

## Current paper-suite result

The retained [current paper-suite transcript](evidence/paper-suite-current.txt)
records the current `node --test tests/paper/*.test.mjs` run: 33 tests, 30
passed and 3 failed. `generated LaTeX corresponds to the editable manuscript`
fails because `paper/manuscript.tex` is stale after Markdown edits. `PDF build
manifest matches the current manuscript, tooling, figures and PDF` fails because
the manifest contains the prior Markdown hash. `private archive extracts with
exact hashes, complete fixture inputs and real selected evidence` fails because
the run did not set `PAPER_BROWSER_EVIDENCE`. These are current n=1 execution
results, not a repeated-trial statistic.

The retained 18-pass browser report and captures remain historical facts only.
Their browser-test hashes no longer match the renamed tests; they cannot verify
the post-rename fixture. The private archive and its text manifest are stale and
remain unchanged. Packaging now requires a supplied `PAPER_BROWSER_EVIDENCE`
directory with complete matching source hashes before build and after execution,
stable built-asset hashes, both successful browser specs, new S2 titles, actual
exit status, and all nine capture hashes, plus fresh paper derivatives. Missing
or stale evidence fails before any archive write. Tests confirm rejection also
preserves an existing destination. No provisional verification claim is emitted.

Run the single outer-terminal command documented in [REPRODUCTION.md](REPRODUCTION.md):
`PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH" bash scripts/paper-browser-run.sh`.
It uses built Vite preview at `127.0.0.1:5178` with `--strictPort`, followed by
`env -u CI` Playwright and the existing server-reuse option. Return the complete
printed new evidence directory and exit status. It retains source/build hashes,
commands, raw logs/JSON, captures and restoration evidence. Inspect those actual
inputs before regenerating any private archive or extracting its text manifest.
This command is prepared, not executed.

The earlier SHA-256 comparison matched all 210 initial evidence/config/archive
files, including root `veritas.yaml` and its authorized manifest artifact path.
At final inspection, a change outside this assistant's edits added
`checks.citability` to root `veritas.yaml` (mtime 2026-09-22 07:33:29 local).
The final preservation assertion failed on that file; all other 209 hashes still
match, including the private archive, text manifest and historical evidence.
The drift is recorded in `external-drift.json`, not reverted or endorsed. The
authorized artifact path remains present. This assistant made no Veritas config,
behavior, judge/run, gate, report, permission or limit change.
No commit, push, publication, new scenario/order or experiment,
historical-log rewrite, or `paper/output-last-message` write occurred. The paper
spec remains `review`; browser provenance and human approval remain pending.

OpenSpec `check` passed both specs. `verify reproducible-protocol-comparison-paper`
passed configured `npm test`; `status` returned `passed`, `stale: false`, and
`next_step: human_review`, all exit 0. Native record:
`.openspec/runs/reproducible-protocol-comparison-paper/verify-161900129790000.json`.
These results do not prove the pending browser provenance, all acceptance
criteria or ignored paper inputs. Their command outputs are in the new evidence
directory; the actual full-paper failures above remain unresolved.

## Current-source browser execution — 2026-09-22 UTC

The outer-terminal command
`PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH" bash scripts/paper-browser-run.sh`
completed at `2026-09-22T11:42:17Z` with exit status 0. Its immutable execution
directory is `paper/evidence/browser-s2-fixed-order-Iyz55xbG/`. The record
contains source SHA-256 maps before build and after execution, stable `dist-web`
asset hashes, build and preview logs, the JSON report, command copy, exit status,
and a tar archive plus hashes for nine post-run screenshots. The JSON report has
18 expected passing tests (nine render and nine screenshot tests), with zero
unexpected, skipped, or flaky tests.

These are deterministic-suite counts from individual executions, not estimates
with run-to-run variance. The evidence index retains two completed 18-test
executions (`Iyz55xbG` and `QDL9iC9j`) and two attempts (`Na35q91S` and
`NnyjMAPl`) that aborted before a test body ran because of an `EPERM` listener
and a managed-preview timeout, respectively. The completed executions are not
independent reproductions and do not establish a browser pass-rate statistic.

This validates the renamed browser fixture against the recorded current source
and build inputs. It does not alter or rehabilitate the pre-rename browser logs,
the historical private archive, or the Veritas-routed text manifest. A temporary
private-package extraction test passed using this directory; no persistent
archive, manifest, Veritas configuration, paid review, commit, tag, push,
release, submission, DOI registration, clean-clone reproduction, or human review
was performed. The test suite that loads absent `veritas.yaml` remains an
unchanged external integration blocker.

## Current-source browser execution — 2026-09-25 UTC

The outer-terminal command
`PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH" bash scripts/paper-browser-run.sh`
completed with exit status 0. Its immutable execution directory is
`paper/evidence/browser-s2-fixed-order-cFIGKT5C/`; the wrapper atomically updated
`paper/evidence/current-browser-run` to that relative target only after
`validateBrowserEvidence` passed. `environment.json` and `provenance.txt` record
the source revision `378aabee42a69c61edc7d7a37c934465b4a66e30`, Node `v23.5.0`,
and capture time `2026-09-25T18:33:49Z`. An earlier same-source execution,
`00xCRFgA/`, remains immutable but is not canonical because the prior macOS
wrapper logic followed the existing symlink while replacing it; the corrected
wrapper produced this execution and the verified pointer update.

The retained Playwright JSON report records 18 expected tests, with 0 skipped,
unexpected, or flaky tests. The execution directory retains source snapshots
before and after the run, stable build hashes, the wrapper copy and logs, and
SHA-256 hashes for nine post-run screenshots. This is one local deterministic
execution, not a protocol ranking, causal inference, independent reproduction,
or security review. No historical evidence directory was changed or discarded.

## Commit-pinned browser execution — 22 September 2026 UTC

Source inputs were committed as `523941cb079e8f88f47011039e6e69d01bc1d414`
before the outer-terminal browser run. The run produced
`paper/evidence/browser-s2-fixed-order-T1RMZk03/` with exit status 0, 18
expected passing tests, stable build hashes, and nine screenshot hashes.
`provenance.txt` and `environment.json` both record that source commit. The
private-review manifest generated from this execution records the same hash; the
later evidence-retention commit is bookkeeping, not the tested source revision.

## Host-enforcement outcome evidence — 22 September 2026 UTC

The source commit `91a0b7a5191947a4ad284e276227564586c88f82` records the former
`ENFORCED_BY_CONFORMANT_HOST` S2 label. The recorded separation is structural
isolation from the adapter/topology; the tested host handler enforces tool
visibility, not a collision policy. Before
capture, S2 passed 3 tests, the complete harness passed 24 tests, typecheck and
the generated-report freshness check passed, and `bash scripts/openspec check`
passed.

The outer-terminal browser command produced an immutable run now exposed at
[current-browser-run](evidence/current-browser-run/) with Playwright exit status
0. `validateBrowserEvidence` verified matching source snapshots before and after
the run, stable build hashes, 18 expected passing browser tests, zero unexpected,
flaky, or skipped tests, and nine screenshot hashes. Its `provenance.txt` and
`environment.json` record the source commit above.

`node scripts/paper.mjs latex`, `check`, and `pdf` completed. The PDF build
retained only Tectonic warnings about included PDF version and underfull boxes.
`PAPER_BROWSER_EVIDENCE=paper/evidence/current-browser-run node
scripts/paper.mjs private-bundle` produced the local archive; the extracted
`paper/evidence/private-review-manifest.json` records the same source commit.
This is a local execution record, not an independent reproduction or human
review.

## Editorial and provenance drift corrections — 22 September 2026 UTC

- C3/manuscript was stale: the stable linked evidence is present and complete.
- The pre-rename literal assertion was stale: its report is historical and the current run exists.
- Provenance wording/test was stale: inputs, tooling, and evaluation configuration are versioned now; only pre-22-Sep commit provenance is incomplete.
