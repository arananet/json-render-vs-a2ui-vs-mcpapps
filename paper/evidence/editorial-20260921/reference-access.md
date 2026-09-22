# Methodological reference access — editorial revision

Attempted 21 September 2026, before the first manuscript edit. This is a
manually recorded access ledger, not retrieved repository content. No verified
revision or manuscript contents were obtained in this invocation.

- Web reader: `https://github.com/besanson/sarc-authority-derivation` returned
  cache miss; `https://api.github.com/repos/besanson/sarc-authority-derivation/commits/main`
  could not be opened.
- Web reader: each of the following paths under
  `https://raw.githubusercontent.com/besanson/sarc-authority-derivation/main/`
  returned cache miss: `README.md`, `REPRODUCTION.md`, `NOVELTY.md`, and
  `paper5-authority-derivation-draft-v0.6.6.md`.
- Shell command:
  `curl --connect-timeout 8 --max-time 15 -sS https://api.github.com/repos/besanson/sarc-authority-derivation/commits/main | head -c 300`
  emitted `curl: (6) Could not resolve host: api.github.com`. The pipeline
  itself exited zero through `head`; that is not successful retrieval.

An earlier wrapper's reported inspection is not treated as direct access by
this invocation, a pinned revision, or verified scientific evidence. The paper
now uses only a limited acknowledgment. Substantive reference inspection and
revision pinning remain pending. No external reproduction result is attributed
to this repository or its author. No manuscript content was sent to these services.
