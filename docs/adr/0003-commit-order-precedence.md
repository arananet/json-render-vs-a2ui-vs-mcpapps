# ADR 0003: Use Commit Order for Research-Record Precedence

**Date:** 2026-09-22
**Status:** Accepted

## Context

Tags and release pages may be added, moved, or omitted. The research record
needs one precedence rule for future frozen manuscripts and preregistration
amendments.

## Decision

Once committed, Git commit ancestry and order establish record precedence.
Tags, release pages, and archival deposits are references to commits, not the
source of precedence. Before the first commit, documents remain an uncommitted
working record and have no release precedence.

## Consequences

Every frozen artifact must record its path and hash. A later correction gets a
new artifact and commit rather than altering an earlier record.
