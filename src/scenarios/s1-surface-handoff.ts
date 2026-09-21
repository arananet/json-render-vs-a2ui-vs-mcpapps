/**
 * Scenario 1 — Surface handoff.
 *
 * The orchestrator opens one surface with the `planner` agent, which draws a
 * partial itinerary. Partway through, the orchestrator decides `booking` should
 * finish the job and hands the surface over. `booking` then adds to what the
 * user is already looking at.
 *
 * This is the most common shape in real orchestration — a router agent starts a
 * response and a specialist finishes it — and it is where the three protocols
 * first diverge.
 */

import { Orchestrator } from "../orchestrator/orchestrator.ts";
import type { ProtocolAdapter } from "../orchestrator/types.ts";

export const SCENARIO_ID = "s1-surface-handoff";
export const SCENARIO_TITLE = "Surface handoff mid-render";

export const SURFACE = "trip";

export async function runSurfaceHandoff(adapter: ProtocolAdapter): Promise<Orchestrator> {
  const orchestrator = new Orchestrator(adapter, SCENARIO_ID, [
    { id: "planner", role: "Chooses the itinerary" },
    { id: "booking", role: "Turns an itinerary into reservations" },
  ]);

  await orchestrator.openSurface(SURFACE, "planner");

  await orchestrator.emit(SURFACE, "planner", {
    id: "itinerary",
    title: "Lisbon, 3 nights",
    rows: [
      { id: "depart", label: "Depart", value: "Thu 09:40" },
      { id: "return", label: "Return", value: "Sun 18:15" },
    ],
  });

  // The orchestrator changes its mind mid-render.
  await orchestrator.handoff(SURFACE, "planner", "booking");

  // The successor adds to the same conceptual surface. Whether it lands in the
  // same visual region is the thing under test.
  await orchestrator.emit(SURFACE, "booking", {
    id: "reservation",
    title: "Held for 20 minutes",
    rows: [
      { id: "flight", label: "Flight", value: "TP1234" },
      { id: "hotel", label: "Hotel", value: "Baixa House" },
    ],
    controls: [
      { id: "confirm", label: "Confirm booking", action: "confirmBooking", owner: "booking" },
    ],
  });

  return orchestrator;
}
