/**
 * Scenario 2 — Fixed-order identifier collision.
 *
 * Two scripted specialists use the same "summary" identifier. Each emission
 * is awaited: risk detail, finance detail, risk summary, then finance summary.
 * This fixture observes only that sequential order and records whether a write
 * is lost under the adapter's namespace mapping. No alternative order is tested.
 */

import { Orchestrator } from "../orchestrator/orchestrator.ts";
import type { ProtocolAdapter } from "../orchestrator/types.ts";

export const SCENARIO_ID = "s2-fixed-order-collision";
export const SCENARIO_TITLE = "Fixed-order sequential identifier collision";

export const SURFACE = "briefing";

export async function runFixedOrderCollision(adapter: ProtocolAdapter): Promise<Orchestrator> {
  const orchestrator = new Orchestrator(adapter, SCENARIO_ID, [
    { id: "risk", role: "Summarises exposure" },
    { id: "finance", role: "Summarises cost" },
  ]);

  await orchestrator.openSurface(SURFACE, "risk");

  // Each agent writes its own uncontested block first. Both should survive in
  // every protocol; this establishes the baseline.
  await orchestrator.emit(SURFACE, "risk", {
    id: "risk-detail",
    title: "Exposure",
    rows: [{ id: "var", label: "Value at risk", value: "£1.2m" }],
  });

  await orchestrator.emit(SURFACE, "finance", {
    id: "finance-detail",
    title: "Cost",
    rows: [{ id: "run", label: "Run rate", value: "£84k/mo" }],
  });

  // Now the collision. Both agents independently decide to write "summary".
  await orchestrator.emit(SURFACE, "risk", {
    id: "summary",
    title: "Summary",
    rows: [{ id: "headline", label: "Headline", value: "Exposure exceeds appetite" }],
  });

  await orchestrator.emit(SURFACE, "finance", {
    id: "summary",
    title: "Summary",
    rows: [{ id: "headline", label: "Headline", value: "Spend is within budget" }],
  });

  return orchestrator;
}
