# Local response to the latest Veritas REVISE report

This is an assistant-maintained action-status note, not an evaluator verdict,
author approval or replacement for the preserved report. Human scientific and
editorial review remains pending. No Veritas action was dispatched or resumed.

## Actual inputs and authority boundary

- [Latest evaluation report](.veritas/loops/loop-2026-09-22T004944Z-18f0/iteration-001/evaluation/report.md):
  0 critical, 19 major, 25 minor and 6 informational findings; gate **REVISE**.
- [Actual repair plan](.veritas/loops/loop-2026-09-22T004944Z-18f0/iteration-001/repair-plan.json):
  50 actions, 39 not marked human-only, **11 requiring human approval**.
- [Loop report](.veritas/loops/loop-2026-09-22T004944Z-18f0/loop-report.md):
  dry-run stopped at `human_decision_required`; the older `.veritas/report.md`
  is not this evaluation. No action or gate record was rewritten.

All 50 findings, evidence excerpts, recommendations and action classifications
were inspected. An autonomous classification is not permission to change the
harness, scientific claims or methodology. The narrower current user scope
governs. Related requests appearing under multiple action IDs do not override
a human-only refusal. In particular, none of the eleven actions below was
silently completed through a differently labeled recommendation.

## Classification and permitted work

**Already bounded in the actual manuscript, not newly resolved by this task:**
ACTION-001/002 describe fixed-order and configuration-versus-protocol limits
already stated in Methodology. ACTION-004/009 concern browser evidence and H1,
whose gap is explicit; ACTION-013/014 concern C6/C7, already partial.
ACTION-023 distinguishes installed package from wire/schema version;
ACTION-034/038/046 disclose the ignored-input fingerprint boundary and
`acceptance_criteria_proven: false`. ACTION-045/050 acknowledge unavailable
reference access. ACTION-047/048/049 themselves report consistency with the
S2 sequence, host handler and C6 caveat. These observations do not close any
finding or establish missing evidence. No manuscript change was necessary to
retain those qualifications, and no claim status was upgraded or downgraded.

**Local packaging improvements completed:**

| Actions | Permitted change | Remaining boundary |
| --- | --- | --- |
| 017 | Selected the existing cited `EXECUTION.md`, rather than removing the reference. | The record includes historical attempts, not additional successful runs. |
| 005, 018 | Selected existing build/test source views and documented private-package scope in `REPRODUCTION.md`. | No commit, publication, distribution or independent reproduction. The distribution recommendation remains unmet. |
| 036 | Documented the `paper/` evaluation root versus repository-relative paths; selected template and figure provenance/source views. | The text-only CLI does not visually evaluate PDFs or SVGs. |
| 044 | Added a current readable private-package integrity manifest mapping ignored sources and review views. | Checksums identify bytes, not availability from Git or scientific correctness. |

The new `.txt` source views exist only because the actual reader excludes
`.mjs`, `.lua` and `.mmd`. Each is byte-identical to an existing original; there
is one selected textual representation per source. They add no experiment or
measurement. The manuscript, generated TeX/PDF/archive, report generator,
adapters, scenarios and protocol/browser assertion semantics were not changed.

**Other recommendations remain pending:**

- ACTION-006/007/008/020/021/022/024/030/033/039 concern citation stability,
  supporting standards or literature. No read-only citation fetch was performed
  in this task; no revision was invented or access claimed. The existing four
  mutable references, SEP-1865/draft attribution and unverified besanson pointer
  remain review limitations. Any expanded literature review is author work,
  not a new finding generated here.
- ACTION-015/019/041: the recorded IPC/preview-listener `EPERM` failures precede
  the intended checks. They are environment/prerequisite failures, not failed
  protocol assertions, and not successful verification. A later existing-suite
  run needs an authorized environment. It would still not reconcile the Node
  and browser MCP fixtures, establish historical screenshot provenance, prove
  every-control routing, or exercise confirmation consent beyond its assertions.
  Existing negative logs remain selected; no workaround or browser probe ran.
- ACTION-016/025/028/032 would alter generated report guidance, consent/routing
  wording or trace presentation. No generator/report change is authorized here;
  related human-only ACTION-029 remains pending. The existing report's broad
  advice is not independently established by this three-configuration note.
- ACTION-042: no fresh clean dependency installation was performed. Installed
  version evidence and a lockfile do not certify `npm ci` at this revision.
- ACTION-043: local Tectonic resource prerequisites remain; a self-contained
  manuscript source bundle is not a complete portable TeX distribution.

## Genuine human decisions — all remain pending

These are suggestions for the author, **not approvals or executed alternatives**.

| Human-only actions | Author decision or missing evidence |
| --- | --- |
| 003, 012 | Keep the acknowledged adapter-classification limitation, or separately authorize/design independent observable measurement; do not fabricate an independent matrix. |
| 010 | The authorized behavior-preserving S2 rename is implemented. Alternative write orders or overlapping execution remain separate, unperformed research. Browser provenance must be refreshed externally. |
| 011 | Decide whether to retain C9 as proposed, remove it through authorized scientific editing, or commission a separate matched-topology study. C9 stays proposed. |
| 026 | Decide what external corroboration is needed for protocol-level statements; no human-only citation action is silently executed. |
| 027 | Decide whether/how to obtain missing A2UI rendered-value evidence. H1/C3 stay partial. |
| 029 | Decide how to handle overbroad downstream recommendations. Neither generator prose nor scientific manuscript conclusions were rewritten. |
| 031 | Decide whether to redefine the surface metric or request visual measurements. Snapshot counts were not relabeled or turned into user evidence. |
| 035 | Decide whether to authorize disagreement checks across scenarios. No new assertion changes the measurement semantics. |
| 037 | Review the aggregate test-count narrative; the plan marks this human-only despite existing separate pass/failure disclosures. No override is inferred. |
| 040 | Decide whether to authorize adding the existing generated comparison report to judge inputs. It remains excluded, not deleted or altered. |

No new evidence is supplied for ACTION-003/012. Disabled experiment permissions
for ACTION-010/011 remain disabled, as do all other permissions. The current
request is not approval of any human-only action.

## Local verification and handoff

The local falsifiable hypothesis was that adding the cited execution record
would extend only the explicit input list without changing controls or including
historical manuscript copies. Immediately after that first edit, the real
`veritas files . --json` in `paper/` matched exactly the previous 27 inputs plus
`EXECUTION.md`: **28 files / 176,476 characters**, exit zero. The final listing
matches **42 files / 214,575 characters** with no extra/missing inputs. Raw
listings are under `evidence/veritas-review-20260922/`.

- `node --test tests/paper/veritas-inputs.test.mjs`: **6 passed**, no failures.
- `node --test tests/paper/*.test.mjs`: **30 passed**, no failures; this includes
  metadata/text/font and current PDF-input hash checks.
- `node scripts/paper.mjs check`: **LaTeX fresh**, exit zero. The untouched PDF
  and source archive retain their existing build-manifest hashes.
- `npm test`: **24 passed across 3 files**, exit zero. No new scenario or
  experimental assertion was introduced.
- `bash scripts/openspec check`: both review-ready repository specs pass.

Raw command outputs accompany the listings. Historical execution failures and
manifests are preserved. Current package/selection hashes are separate; none
claim the ignored package is covered by the OpenSpec fingerprint. Final
`verify`/`status` command evidence resides in native `.openspec/runs/` records;
passing that configured command is not scientific or human approval.

The installed CLI currently emits no truncation notice for this selection;
read-only inspection found its current 400,000-character default. Neither that
default nor the previously reported 24,000-character limit was changed here.
The complete control configuration, including the user's existing
`env_passthrough`, is preserved and tested against the pre-edit snapshot.

The pre-existing tracked spec edit stays review-ready and uncommitted; this
follow-up adds no tracked file edit. All private exclusions remain. No paid
judge, loop, resume, API call, upload, installation, new experimental evidence,
gate/permission/limit change, commit, push, license change or publication ran.
**REVISE and human decisions remain unresolved:** only an explicitly authorized
future evaluation could issue a new evaluator verdict.
