#!/usr/bin/env bash
# Run only from an outer terminal with browser/listener permissions.
set -euo pipefail
export COPYFILE_DISABLE=1
cd "$(dirname "$0")/.."
browser_evidence=$(mktemp -d "$PWD/paper/evidence/browser-s2-fixed-order-XXXXXXXX")
printf 'Evidence: %s\n' "$browser_evidence"
cp scripts/paper-browser-run.sh "$browser_evidence/commands.txt"
captured_at=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
head=$(git rev-parse HEAD)
printf '%s\n%s\n' "$captured_at" "$head" > "$browser_evidence/provenance.txt"
git status --short >> "$browser_evidence/provenance.txt"
node --version >> "$browser_evidence/provenance.txt"
npm --version >> "$browser_evidence/provenance.txt"
node --input-type=module - "$browser_evidence/environment.json" "$captured_at" "$head" <<'EOF'
import { writeFileSync } from "node:fs";
const [destination, capturedAt, head] = process.argv.slice(2);
writeFileSync(destination, JSON.stringify({
  capturedAt,
  head,
  node: process.version,
  executable: process.execPath,
  npm: process.env.npm_config_user_agent ?? null,
  platform: process.platform,
  architecture: process.arch,
}, null, 2) + "\n", { flag: "wx" });
EOF
node scripts/paper-browser-evidence.mjs source "$browser_evidence/source-before.json"
node --input-type=module -e 'import {readFileSync} from "node:fs"; for (const [path, hash] of Object.entries(JSON.parse(readFileSync(process.argv[1])).sources)) console.log(`${hash}  ${path}`)' "$browser_evidence/source-before.json" >> "$browser_evidence/provenance.txt"
tar -cf "$browser_evidence/historical-screenshots.tar" docs/screenshots
shasum -a 256 docs/screenshots/*.png > "$browser_evidence/historical-screenshots.sha256"
preview_pid=
cleanup() {
  if [ -n "$preview_pid" ]; then kill "$preview_pid" 2>/dev/null || true; wait "$preview_pid" 2>/dev/null || true; fi
  tar -xf "$browser_evidence/historical-screenshots.tar"
  shasum -a 256 -c "$browser_evidence/historical-screenshots.sha256" > "$browser_evidence/historical-restoration.txt"
}
trap cleanup EXIT
npm run build > "$browser_evidence/build.stdout.txt" 2> "$browser_evidence/build.stderr.txt"
node scripts/paper-browser-evidence.mjs built "$browser_evidence/built-before.json"
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5178 --strictPort > "$browser_evidence/preview-ipv4.log" 2>&1 &
preview_pid=$!
preview_ready=0
for ((attempt=0; attempt<60; attempt++)); do
  kill -0 "$preview_pid" 2>/dev/null || exit 1
  if grep -q 'http://127.0.0.1:5178/' "$browser_evidence/preview-ipv4.log" && curl -fsS http://127.0.0.1:5178/index.html >/dev/null 2>&1; then preview_ready=1; break; fi
  sleep 1
done
[ "$preview_ready" -eq 1 ]
# Ensure the responding port belongs to the preview just started, not an older server.
kill -0 "$preview_pid"
set +e
env -u CI PLAYWRIGHT_JSON_OUTPUT_FILE="$browser_evidence/playwright-ipv4.json" node node_modules/@playwright/test/cli.js test tests/browser/render.spec.ts tests/browser/screenshots.spec.ts --reporter=line,json --output="$browser_evidence/ipv4-test-results" > "$browser_evidence/playwright-ipv4.stdout.txt" 2> "$browser_evidence/playwright-ipv4.stderr.txt"
browser_status=$?
set -e
printf 'PLAYWRIGHT_EXIT_CODE=%s\n' "$browser_status" > "$browser_evidence/exit-status.txt"
tar -cf "$browser_evidence/ipv4-post-run-screenshots.tar" docs/screenshots
shasum -a 256 docs/screenshots/*.png > "$browser_evidence/ipv4-post-run-screenshots.sha256"
node scripts/paper-browser-evidence.mjs built "$browser_evidence/source-after.json"
printf 'Return this directory unchanged: %s (Playwright exit %s)\n' "$browser_evidence" "$browser_status"
exit "$browser_status"
