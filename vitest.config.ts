import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/protocol/**/*.test.ts"],
    // The MCP Apps adapter stands up real servers, clients and bridges per run.
    testTimeout: 20_000,
  },
});
