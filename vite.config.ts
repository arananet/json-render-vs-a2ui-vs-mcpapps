import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import type { Plugin } from "vite";

/**
 * Serve every asset with `Access-Control-Allow-Origin: *`.
 *
 * The MCP Apps view runs in an iframe sandboxed without `allow-same-origin`,
 * so its document has an opaque origin and its module scripts are fetched with
 * `Origin: null`. Without this header the browser blocks them and the view
 * never boots. This is not a way around the sandbox — the isolation under test
 * is exactly what creates the requirement. A production host hits the same
 * constraint, which is why SEP-1865 has hosts serve app content from a
 * dedicated origin (`_meta.ui.domain`) rather than from the host's own.
 */
const corsForSandboxedViews = (): Plugin => ({
  name: "cors-for-sandboxed-views",
  configureServer: (server) => {
    server.middlewares.use((_req, res, next) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      next();
    });
  },
  configurePreviewServer: (server) => {
    server.middlewares.use((_req, res, next) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      next();
    });
  },
});

/**
 * Three host pages, one per protocol, plus the MCP Apps view that is loaded
 * into a sandboxed iframe. Each is a real entry point so Playwright drives a
 * genuine page rather than a test double.
 */
export default defineConfig({
  root: resolve(import.meta.dirname, "web"),
  plugins: [react(), corsForSandboxedViews()],
  build: {
    outDir: resolve(import.meta.dirname, "dist-web"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, "web/index.html"),
        jsonRender: resolve(import.meta.dirname, "web/json-render.html"),
        a2ui: resolve(import.meta.dirname, "web/a2ui.html"),
        mcpApps: resolve(import.meta.dirname, "web/mcp-apps.html"),
        mcpView: resolve(import.meta.dirname, "web/mcp-view.html"),
      },
    },
  },
  server: { port: 5178 },
});
