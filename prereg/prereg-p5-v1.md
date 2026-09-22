# Preregistration P5 v1

**Status:** Retrospective governance record; not a preregistration of completed runs.

**Date:** 2026-09-22

## Scope

Before any new confirmatory execution, run the built browser suite after the
S2 fixed-order identity correction. Preserve source and built-asset hashes,
command output, JSON report, screenshot archive, restoration record, duration,
and exit status. The planned outcome is only whether the existing assertions
pass for the specified fixture bytes.

## Exclusions

This record does not authorize a new scenario, alternate write order,
concurrency/scheduling claim, adapter change, protocol-causality claim,
performance score, tag, release, DOI registration, or publication.

## Analysis Rule

Report the exact test count, pass/fail/skip/flaky counts, elapsed time as
execution metadata, and SHA-256 values. If source hashes differ during the run,
or a test is skipped or fails, record the result and do not regenerate the
private review archive as current verification.
