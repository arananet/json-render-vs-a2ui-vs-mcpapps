# ADR 0002: Freeze Research Manuscript Versions

**Date:** 2026-09-22
**Status:** Accepted

## Context

The canonical manuscript evolves during review, while a reader needs stable
bytes for a particular research claim and evidence state.

## Decision

Keep `paper/manuscript.md` editable. Store every released-for-review Markdown
snapshot under `paper/versions/` with a SHA-256 entry in `manifest.json`. Frozen
snapshots are never regenerated or edited; corrections create a new version.

## Consequences

Readers can identify exact manuscript bytes. A hash proves identity, not review,
reproduction, release, or DOI assignment.
