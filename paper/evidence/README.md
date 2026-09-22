# Browser Evidence Status

`browser-s2-fixed-order-QDL9iC9j/` is the canonical current-source browser
execution for the host-enforcement outcome update. Its source snapshots, stable
build hashes, successful 18-test Playwright report, and nine screenshot hashes
are validated by `scripts/paper-browser-evidence.mjs`. Its `environment.json`
commit hash matches `provenance.txt` and the private-review manifest.

Three further `browser-s2-fixed-order-*` directories are retained, and they are
not equivalent to one another:

- `Iyz55xbG/` (07:42 UTC) completed with 18 expected tests, 0 unexpected and 0
  skipped. Its snapshot of the code under test — adapters, scenarios and browser
  specs — is byte-identical to the earlier canonical run's. The two snapshots differ
  only in the evidence-collection scripts themselves
  (`scripts/paper-browser-evidence.mjs`, `scripts/paper-browser-run.sh`), which
  were revised between the two runs. It is therefore a replication of the
  canonical result under the same tested source, retained in full.
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
