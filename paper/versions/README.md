# Frozen Markdown Versions

`paper/manuscript.md` is the only editable manuscript. A frozen version is a
byte-for-byte snapshot, never regenerated or edited. Corrections create a new
versioned file and a new manifest entry. The `populated` label means that the
snapshot contains the observations already present in the canonical manuscript;
it does not imply peer review, clean-clone reproduction, a release, or a DOI.

| Version | Snapshot | SHA-256 | Status |
| --- | --- | --- | --- |
| v0.1 | [populated Markdown](json-render-vs-a2ui-vs-mcpapps-v0.1-populated.md) | `8bbf8c014749b41212261e0a603a57a5022680cf2a2c2c700a7e6f89b940e0b5` | frozen 2026-09-22; review draft |

The v0.1 snapshot preserves the pre-publication wording and the browser
provenance gap known when it was frozen. A later outer-terminal browser
execution records current-source verification in
`paper/evidence/browser-s2-fixed-order-T1RMZk03/`; it does not alter the frozen
snapshot or establish clean-clone reproduction or review. The prior Zenodo
deposit at [DOI 10.5281/zenodo.22896882](https://doi.org/10.5281/zenodo.22896882)
predates the current-source evidence and is not the final archival record.

To validate the registry:

```bash
shasum -a 256 paper/versions/json-render-vs-a2ui-vs-mcpapps-v0.1-populated.md
```

Commit order is the canonical precedence record once commits exist; tags and
releases are convenience references, not replacements for history. See
[ADR 0003](../../docs/adr/0003-commit-order-precedence.md).
