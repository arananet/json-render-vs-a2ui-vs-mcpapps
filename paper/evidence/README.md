# Browser Evidence Status

[current-browser-run](current-browser-run/) is the tracked relative symlink to the canonical
current-source browser execution. Its source snapshots, stable build hashes,
successful 18-test Playwright report, and nine screenshot hashes document that
run; its `environment.json` commit hash matches `provenance.txt` and the
private-review manifest.

`scripts/paper-browser-run.sh` retains every newly created suffixed directory.
Only after a zero-exit run passes `validateBrowserEvidence` does it atomically
replace `current-browser-run` with a relative symlink to that directory. Live
documentation and packaging should use this stable path; immutable ledgers may
name their original suffixed run for historical provenance.

The collector wrapper is itself a provenance input. Therefore, after changing
that wrapper, the existing target remains an immutable record but cannot
validate the modified checkout; the next successful outer-terminal run advances
the pointer only after validation against its captured sources.

Three further `browser-s2-fixed-order-*` directories are retained, and they are
not equivalent to one another:

- `Iyz55xbG/` (07:42 UTC) completed with 18 expected tests, 0 unexpected and 0
  skipped, against an earlier source state. Its snapshot differs from the
  canonical run in the evidence-collection scripts and in the code under test:
  `src/adapters/mcp-apps/adapter.ts`, `src/orchestrator/types.ts` and
  `src/report/generate.ts` changed with the host-enforcement outcome label.
  It is retained as an execution record, not as a replication of the canonical
  result.
  `T1RMZk03/` was canonical for its source revision because it is bound to the recorded build and
  screenshot hashes.
- `Na35q91S/` and `NnyjMAPl/` (07:41 UTC) aborted before any test body ran and
  contain no Playwright report. The causes — an `EPERM` sandbox listener and a
  managed-preview timeout — are recorded in `EXECUTION.md`.

No completed execution was discarded. The snapshot format records the
evidence-collection scripts alongside the code under test, so a revision to the
tooling changes a snapshot hash without changing what was measured.

The `browser-terminal-20260922T013449Z-zH4HTK/` directory is pre-rename
historical evidence and must not be cited as current-source verification.
