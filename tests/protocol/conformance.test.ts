/**
 * Guards against the two ways this comparison could quietly become fiction:
 * an adapter drifting away from the protocol's own schema, and the committed
 * matrix drifting away from the adapters.
 */

import { describe, expect, it } from "vitest";
import { A2uiMessageSchema } from "@a2ui/web_core/v0_9";
import { A2uiAdapter } from "../../src/adapters/a2ui/adapter.ts";
import { JsonRenderAdapter } from "../../src/adapters/json-render/adapter.ts";
import { catalog } from "../../src/adapters/json-render/catalog.ts";
import { Tracer } from "../../src/orchestrator/trace.ts";
import { runSurfaceHandoff, SURFACE } from "../../src/scenarios/s1-surface-handoff.ts";
import { buildReport } from "../../src/report/generate.ts";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

describe("schema conformance", () => {
  it("every A2UI message the agents emit validates against A2uiMessageSchema", async () => {
    const adapter = new A2uiAdapter(new Tracer("s1-surface-handoff", "a2ui"));
    await runSurfaceHandoff(adapter);

    expect(adapter.messages.length).toBeGreaterThan(0);
    for (const message of adapter.messages) {
      const parsed = A2uiMessageSchema.safeParse(message);
      expect(parsed.success, `rejected: ${JSON.stringify(message)}`).toBe(true);
    }

    // All four v0.9 message kinds should be exercised by a handoff run except
    // deleteSurface, which no scenario performs.
    const kinds = new Set(adapter.messages.flatMap((m) => Object.keys(m).filter((k) => k !== "version")));
    expect([...kinds].sort()).toEqual(["createSurface", "updateComponents", "updateDataModel"]);

    await adapter.dispose?.();
  });

  it("the json-render spec the agents build validates against the catalog", async () => {
    const adapter = new JsonRenderAdapter(new Tracer("s1-surface-handoff", "json-render"));
    await runSurfaceHandoff(adapter);

    const result = catalog.validate(adapter.specFor(SURFACE));
    expect(result.error?.message ?? null).toBeNull();
    expect(result.success).toBe(true);
  });

  it("json-render updates are RFC 6902 patches against a shared element map", async () => {
    const adapter = new JsonRenderAdapter(new Tracer("s1-surface-handoff", "json-render"));
    await runSurfaceHandoff(adapter);

    expect(adapter.patchLog.length).toBeGreaterThan(0);
    for (const { patch } of adapter.patchLog) {
      const op = patch as { op: string; path: string };
      expect(["add", "replace"]).toContain(op.op);
      expect(op.path.startsWith("/elements/")).toBe(true);
    }

    // The successor agent patched the same keyspace the originator did — the
    // structural fact behind both the handoff win and the collision loss.
    const writers = new Set(adapter.patchLog.map((p) => p.agent));
    expect(writers).toEqual(new Set(["planner", "booking"]));
  });
});

describe("report freshness", () => {
  it("docs/COMPARISON.md matches what the traces currently produce", async () => {
    const generated = await buildReport();
    const committed = await readFile(
      resolve(import.meta.dirname, "../../docs/COMPARISON.md"),
      "utf-8",
    );
    expect(
      committed,
      "docs/COMPARISON.md is stale — run `npm run report`",
    ).toBe(generated);
  });
});
