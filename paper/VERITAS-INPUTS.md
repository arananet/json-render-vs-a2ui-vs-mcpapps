# Local Veritas input selection

The evaluation root is `/`; its configuration is `veritas.yaml`.
Only `artifact.paths` changed. Provider/model settings, execution allowlist,
repair permissions and loop settings were not changed or exercised. This work
lists possible inputs; it does not authorize an evaluation or repair run.

## Selection and rationale

- `manuscript.md` is the sole current manuscript input. Generated TeX/PDF and
  extracted PDF text are not additional judge inputs.
- `REPRODUCTION.md` supplies command semantics and limitations. Following the
  latest review, `EXECUTION.md` is explicitly selected because the paper cites
  it; it distinguishes the historical sessions from their later revisions.
- `evidence/editorial-20260921/` is not recursively included. Explicit entries
  select the latest manuscript-editing run's environment/revision, 24-test
  harness result, final 24-test paper result and LaTeX freshness, typecheck,
  OpenSpec check, blocked browser/report commands, and failed reference access.
  The pinned native OpenSpec verification JSON records that run's command,
  revision, fingerprint and `acceptance_criteria_proven: false`; an older
  duplicate npm/OpenSpec test log is unnecessary. These are dated paper-run
  evidence, not assertions that an evaluation or a new browser run happened.
- Two older records remain for distinct purposes: `evidence/s2.txt` is the
  historical focused run supporting three passes and ten filtered skips;
  `evidence/environment.json` records the installed/locked dependency versions
  and ranges. Its older HEAD is not the current revision; the selected editorial
  environment log supplies the latter. Old eight-test paper output is excluded.
- Compact PDF build output retains warnings; the build manifest, bundle check,
  PDF metadata and font report support different build claims without sending
  either full engine log or duplicate extracted manuscript text. No PDF rebuild
  was needed for this configuration-only change.
- Nine selected source/assertion files provide the S2 sequence, three adapter
  mappings, host enforcement, report classification and scenario/bridge/browser
  assertions. These let readers inspect C3's bookkeeping-versus-DOM limitation,
  C6's first-instance routing and other bounded claims rather than trusting
  adapter verdict labels. Browser assertions are source, not passed execution.
- No recursive figures input remains. This installed CLI does not read `.mmd`,
  `.dot`, `.svg` or PDF as text. The original editable/vector figures remain
  local; this listing is not a visual review of them.

No snapshots under `previous/`, generated manuscript copies, extracted-text
copies or full engine logs are selected. Historical artifacts were not deleted
or rewritten. The two reported engine logs are each 17,893 bytes but are **not
byte-identical**: SHA-256 is `255027f6ff322e59a5a21391e46a595cad3ddf06f5902701a57a9d2138bd57c6`
for the editorial log and `7d50145700b71f9c75392a016a60ad20dd32ad4f398d69a84816b787122c5d0e`
for the pdf-visuals log. Neither needs to be sent in addition to compact build
output and focused PDF checks.

## Initial listing-only verification on 22 September 2026 (historical)

The initial hypothesis was that recursive directory inclusion mixed manuscript
versions; replacing directories with existing individual files should remove
that ambiguity while preserving negative evidence. The first substantive edit
changed only the artifact paths. Immediately afterward, the real CLI's
`veritas files . --json`, run in `/`, exited zero. Every returned file was
checked against the complete allowlist, with no extras, omissions or repeated
paths. Before/after JSON output is retained in `evidence/veritas-selection-20260922/`.

The CLI is installed at
`/Users/ESAranaEd/Scripts/veritas-gate/.venv/bin/veritas`, not on the default PATH.
Its actual `files --help` and implementation were inspected. An initial attempt
exited 4 because three required model-name environment variables were unset;
no listing or evaluation occurred in that attempt. Successful listing commands
provided only the existing model names read from that installation's local
configuration, not API keys. No model was selected or changed, and no provider
client or judging command was invoked.

```bash
cd paper
PYTHONDONTWRITEBYTECODE=1 \
VERITAS_DEFAULT_MODEL=claude-opus-4-7 \
VERITAS_ADVERSARIAL_MODEL=gpt-5.6-terra \
VERITAS_META_MODEL=gemini-3.1-pro \
/Users/ESAranaEd/Scripts/veritas-gate/.venv/bin/veritas files . --json
```

The actual selection shrank from **67 files / 296,864 characters** to
**27 files / 147,409 characters**. These are CLI character counts, not measured
token usage, billing or bytes. Source/assertion evidence accounts for much of
the retained input; it is intentionally not replaced with favorable verdicts.
The displayed token figure is only the CLI's rough estimate; no seven-judge
run or cost was incurred by listing.

**Limitation at that run:** the CLI flagged inputs longer than 24,000 characters
as truncated for judge prompts. The canonical Markdown has 27,760 characters.
This change does not resolve that pre-existing prompt limit, alter manuscript
text or modify the external tool. A complete manuscript evaluation must resolve
that separately before authorization to judge; a successful listing is not
evidence that a future judge would see every section.

Focused regression checks use `node --test tests/paper/veritas-inputs.test.mjs`;
they check explicit files, canonical input, negative evidence and correspondence
with the captured actual CLI listing. They add no scenario or scientific test.
The current review-ready paper spec adds only selection/listing criteria.
OpenSpec's final command records remain in `.openspec/runs/`; no automatic
evaluation, experiment, upload, commit, push or publication was performed.
The config, this note, evidence and tests retain the existing local exclusions.
Historical manifests remain historical; selection-specific SHA-256 evidence
is recorded separately without rewriting them or the paper/PDF build manifest.

## Follow-up to the actual REVISE report

The latest report is under
`.veritas/loops/loop-2026-09-22T004944Z-18f0/iteration-001/evaluation/report.md`,
not the older `.veritas/report.md`. It remains REVISE. See
[local action status](REVIEW-ACTIONS.md) for the 11 human-only actions and the
strictly local improvements; no evaluator was rerun.

The first edit added only `EXECUTION.md`, immediately verified as exactly one
additional file by the real `veritas files . --json` command in `/`.
The final explicit selection contains **42 files / 214,575 characters**.
It adds the existing template, figure provenance, a private-source manifest
and 11 byte-identical text views of scripts, focused tests, the Lua filter and
Mermaid sources. The installed reader skips their native extensions; these
views are their only judge-readable representations, not extra manuscripts.
Original sources remain authoritative and private. The manifest maps and hashes
each view; focused checks verify its bytes against its source. To refresh a
view after an authorized source edit, copy that exact source to the manifest's
`view` path, refresh its SHA-256, capture a new listing and rerun the checks.
Preserve earlier manifests instead of relabeling them as fresh evidence.

The current installed CLI reports no truncation for this selection. Read-only
inspection found a 400,000-character default in that installation, unlike the
earlier 24,000-character warning. This task did not change either setting,
Veritas implementation, gates, model/provider settings, permissions or budgets.
It used only `files`/help, never `loop`, `resume` or judging. All controls in the
current config are compared against the captured pre-edit config by a test.

Historical selections, logs, snapshots and manifests remain intact, including
all failures. No recursive evidence directory, previous manuscript, extracted
PDF text or engine log is selected. The old 24-paper-test run remains dated
evidence; the newly added selection guards are packaging checks, not new
scenario tests or experimental observations. The original Markdown, TeX, PDF,
figures and source archive are unchanged; no PDF regeneration was needed.
