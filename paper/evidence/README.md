# Browser Evidence Status

The current-source browser execution is the directory named in the committed
private-review manifest. It contains matching source and build snapshots, a
successful 18-test Playwright report, nine screenshot hashes, and an
`environment.json` whose commit hash matches `provenance.txt` and the manifest.

All other `browser-s2-fixed-order-*` directories are retained historical
execution records. Their source snapshots do not match the current repository
and they must not be cited as current-source verification. The
`browser-terminal-20260922T013449Z-zH4HTK/` directory is likewise pre-rename
historical evidence.