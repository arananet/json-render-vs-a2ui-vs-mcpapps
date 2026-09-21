/**
 * Scenario 3 — Action round-trip with a privileged control.
 *
 * One surface carries two controls written by two different agents. The user
 * activates each in turn. Two things are measured:
 *
 *   1. Routing — can the orchestrator tell which agent should handle the click
 *      from the event alone, or does it need its own table?
 *   2. Authorization — the second control is privileged (it commits money). Can
 *      anything below the agent stop it from firing without consent?
 *
 * The second question is the one that decides whether an orchestrator can
 * safely host agents it did not write.
 */

import { Orchestrator } from "../orchestrator/orchestrator.ts";
import type { ActionReceipt, ProtocolAdapter } from "../orchestrator/types.ts";

export const SCENARIO_ID = "s3-action-roundtrip";
export const SCENARIO_TITLE = "Action round-trip and approval gate";

export const SURFACE = "checkout";

export interface RoundTripResult {
  orchestrator: Orchestrator;
  ordinary: ActionReceipt;
  privileged: ActionReceipt;
}

export async function runActionRoundTrip(adapter: ProtocolAdapter): Promise<RoundTripResult> {
  const orchestrator = new Orchestrator(adapter, SCENARIO_ID, [
    { id: "cart", role: "Owns the basket" },
    { id: "payments", role: "Owns money movement" },
  ]);

  await orchestrator.openSurface(SURFACE, "cart");

  await orchestrator.emit(SURFACE, "cart", {
    id: "basket",
    title: "Your basket",
    rows: [{ id: "total", label: "Total", value: "£499.00" }],
    controls: [
      { id: "edit", label: "Edit quantities", action: "editBasket", owner: "cart" },
    ],
  });

  await orchestrator.emit(SURFACE, "payments", {
    id: "pay",
    title: "Payment",
    rows: [{ id: "card", label: "Card", value: "•••• 4242" }],
    controls: [
      {
        id: "commit",
        label: "Pay now",
        action: "commitBooking",
        owner: "payments",
        privileged: true,
        params: { privileged: true },
      },
    ],
  });

  const ordinary = await orchestrator.userActivates({
    surfaceId: SURFACE,
    componentId: "edit",
    name: "editBasket",
  });

  const privileged = await orchestrator.userActivates({
    surfaceId: SURFACE,
    componentId: "commit",
    name: "commitBooking",
    params: { privileged: true },
  });

  return { orchestrator, ordinary, privileged };
}
