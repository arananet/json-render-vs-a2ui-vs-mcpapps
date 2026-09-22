/**
 * The comparison itself, asserted cell by cell.
 *
 * These tests are the reason the matrix in docs/COMPARISON.md can be trusted:
 * every claim it makes is pinned here against a run of the real SDKs. If an SDK
 * changes its behaviour, a cell flips and a test fails rather than the document
 * quietly going stale.
 */

import { describe, expect, it } from "vitest";
import { runScenario } from "../../src/scenarios/run.ts";
import type { Outcome, ProtocolId } from "../../src/orchestrator/types.ts";

/** Read one recorded outcome, failing loudly when the capability was not probed. */
function outcomeOf(
  traces: ReadonlyArray<{ capability: string; outcome: Outcome }>,
  capability: string,
): Outcome {
  const entry = traces.find((t) => t.capability === capability);
  if (!entry) throw new Error(`capability "${capability}" was never recorded`);
  return entry.outcome;
}

describe("S1 — surface handoff mid-render", () => {
  const cases: Array<{
    protocol: ProtocolId;
    continueSurface: Outcome;
    provenance: Outcome;
    /** How many distinct visual regions the user ends up looking at. */
    regions: number;
  }> = [
    { protocol: "json-render", continueSurface: "SUPPORTED_WITH_CAVEAT", provenance: "NOT_EXPRESSIBLE", regions: 1 },
    { protocol: "a2ui", continueSurface: "SUPPORTED", provenance: "NOT_EXPRESSIBLE", regions: 1 },
    { protocol: "mcp-apps", continueSurface: "NOT_EXPRESSIBLE", provenance: "ENFORCED", regions: 2 },
  ];

  for (const c of cases) {
    it(`${c.protocol}: continue=${c.continueSurface}, provenance=${c.provenance}`, async () => {
      const run = await runScenario("s1-surface-handoff", c.protocol);

      expect(outcomeOf(run.traces, "handoff.continue-surface")).toBe(c.continueSurface);
      expect(outcomeOf(run.traces, "handoff.provenance")).toBe(c.provenance);

      // The user-visible consequence, not just the adapter's opinion of it.
      expect(Object.keys(run.snapshot.surfaces)).toHaveLength(c.regions);

      await run.adapter.dispose?.();
    });
  }

  it("json-render and A2UI keep both agents' blocks in one surface", async () => {
    for (const protocol of ["json-render", "a2ui"] as const) {
      const run = await runScenario("s1-surface-handoff", protocol);
      const surface = run.snapshot.surfaces["trip"];

      expect(surface, `${protocol} should have a single "trip" surface`).toBeDefined();
      expect(Object.keys(surface!.blocks).sort()).toEqual(["itinerary", "reservation"]);
      expect(surface!.blocks["itinerary"]!.writtenBy).toBe("planner");
      expect(surface!.blocks["reservation"]!.writtenBy).toBe("booking");

      await run.adapter.dispose?.();
    }
  });

  it("MCP Apps splits the handoff into two bound, separately-owned views", async () => {
    const run = await runScenario("s1-surface-handoff", "mcp-apps");

    expect(run.snapshot.surfaces["trip::planner"]?.owner).toBe("planner");
    expect(run.snapshot.surfaces["trip::booking"]?.owner).toBe("booking");
    // No single region holds both agents' work — that is the gap.
    expect(run.snapshot.surfaces["trip"]).toBeUndefined();

    await run.adapter.dispose?.();
  });
});

describe("S2 — fixed-order identifier collision", () => {
  it("json-render loses a write to the shared flat element map", async () => {
    const run = await runScenario("s2-fixed-order-collision", "json-render");

    expect(outcomeOf(run.traces, "compose.identifier-collision")).toBe("LOST");

    const summary = run.snapshot.surfaces["briefing"]!.blocks["summary"]!;
    // finance wrote last, so risk's headline is simply gone.
    expect(summary.writtenBy).toBe("finance");
    expect(summary.rows["headline"]).toBe("Spend is within budget");

    // The uncontested blocks did compose, which is the other half of the story.
    expect(Object.keys(run.snapshot.surfaces["briefing"]!.blocks).sort()).toEqual([
      "finance-detail",
      "risk-detail",
      "summary",
    ]);

    await run.adapter.dispose?.();
  });

  it("A2UI loses the same write: surfaces are scoped, component ids are not", async () => {
    const run = await runScenario("s2-fixed-order-collision", "a2ui");

    expect(outcomeOf(run.traces, "compose.identifier-collision")).toBe("LOST");
    expect(outcomeOf(run.traces, "compose.shared-surface")).toBe("SUPPORTED");

    const summary = run.snapshot.surfaces["briefing"]!.blocks["summary"]!;
    expect(summary.writtenBy).toBe("finance");

    await run.adapter.dispose?.();
  });

  it("MCP Apps cannot lose a write, and cannot compose either", async () => {
    const run = await runScenario("s2-fixed-order-collision", "mcp-apps");

    expect(outcomeOf(run.traces, "compose.identifier-collision")).toBe("ENFORCED");
    expect(outcomeOf(run.traces, "compose.shared-surface")).toBe("NOT_EXPRESSIBLE");

    // Both agents' "summary" blocks survive — in different iframes.
    expect(run.snapshot.surfaces["briefing::risk"]!.blocks["summary"]!.rows["headline"]).toBe(
      "Exposure exceeds appetite",
    );
    expect(run.snapshot.surfaces["briefing::finance"]!.blocks["summary"]!.rows["headline"]).toBe(
      "Spend is within budget",
    );

    await run.adapter.dispose?.();
  });
});

describe("S3 — action round-trip", () => {
  it("json-render: the event names a handler, not an agent", async () => {
    const run = await runScenario("s3-action-roundtrip", "json-render");

    expect(outcomeOf(run.traces, "action.routing-identity")).toBe("REQUIRES_OUT_OF_BAND");
    // The orchestrator had to keep a table to deliver anything at all.
    expect(run.orchestrator.outOfBandRoutingEntries).toBeGreaterThan(0);
    expect(run.orchestrator.deliveryLog.every((d) => d.viaOutOfBandTable)).toBe(true);

    await run.adapter.dispose?.();
  });

  it("json-render: confirm gates the privileged action, but the agent declares it", async () => {
    const run = await runScenario("s3-action-roundtrip", "json-render");
    expect(outcomeOf(run.traces, "action.approval-gate")).toBe("SUPPORTED_WITH_CAVEAT");
    await run.adapter.dispose?.();
  });

  it("A2UI: the event carries surface and component, still no agent and no gate", async () => {
    const run = await runScenario("s3-action-roundtrip", "a2ui");

    expect(outcomeOf(run.traces, "action.routing-identity")).toBe("REQUIRES_OUT_OF_BAND");
    expect(outcomeOf(run.traces, "action.approval-gate")).toBe("NOT_EXPRESSIBLE");

    // The envelope A2UI does provide, asserted against the real client action.
    const trace = run.traces.find((t) => t.capability === "action.routing-identity")!;
    const action = trace.evidence as Record<string, unknown>;
    expect(action).toMatchObject({ surfaceId: "checkout", name: "editBasket" });
    expect(action["sourceComponentId"]).toBeTypeOf("string");
    expect(action["timestamp"]).toBeTypeOf("string");
    expect(action).not.toHaveProperty("agent");

    await run.adapter.dispose?.();
  });

  it("MCP Apps: identity comes from the connection and the host refuses the privileged call", async () => {
    const run = await runScenario("s3-action-roundtrip", "mcp-apps");

    expect(outcomeOf(run.traces, "action.routing-identity")).toBe("SUPPORTED");
    expect(outcomeOf(run.traces, "action.approval-gate")).toBe("ENFORCED");

    // Routed without consulting the orchestrator's table.
    expect(run.orchestrator.deliveryLog.some((d) => !d.viaOutOfBandTable)).toBe(true);

    await run.adapter.dispose?.();
  });

  it("MCP Apps: a host that keeps AppBridge's default oncalltool lets the privileged call through", async () => {
    // The same scenario, same SDK, one host decision changed. This is the
    // difference between "the spec says MUST" and "the runtime does".
    const run = await runScenario("s3-action-roundtrip", "mcp-apps", {
      mcpApps: { enforceVisibility: false },
    });

    expect(outcomeOf(run.traces, "action.approval-gate")).toBe("REQUIRES_OUT_OF_BAND");

    await run.adapter.dispose?.();
  });
});
