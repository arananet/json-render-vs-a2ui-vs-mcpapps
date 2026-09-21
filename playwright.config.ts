import { defineConfig, devices } from "@playwright/test";

import { existsSync } from "node:fs";

/**
 * Browser suite.
 *
 * The suite builds the host pages and serves them over HTTP, because the MCP
 * Apps view has to be a real cross-origin sandboxed document rather than a
 * srcdoc blob — the isolation is part of what is being measured.
 *
 * `CHROMIUM_PATH`, or a Chromium preinstalled alongside this sandbox, is used
 * when present so the suite runs without downloading a browser. When the
 * preinstalled build does not match the pinned @playwright/test version,
 * pointing at the binary directly is the supported way to reconcile them.
 */
const PREINSTALLED_CHROMIUM = process.env["CHROMIUM_PATH"] ?? "/opt/pw-browsers/chromium";
const executablePath = existsSync(PREINSTALLED_CHROMIUM) ? PREINSTALLED_CHROMIUM : undefined;
export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: process.env["CI"] ? "line" : "list",
  use: {
    baseURL: "http://127.0.0.1:5178",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], launchOptions: { executablePath } },
    },
  ],
  webServer: {
    command: "npx vite preview --port 5178 --strictPort",
    url: "http://127.0.0.1:5178/index.html",
    reuseExistingServer: !process.env["CI"],
    timeout: 60_000,
  },
});
