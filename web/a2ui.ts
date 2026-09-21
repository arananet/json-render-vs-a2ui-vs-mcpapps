/**
 * A2UI host page.
 *
 * The same `A2uiAdapter` the protocol tests use, constructed with the Lit
 * `basicCatalog` instead of the schema-only one. The messages the agents emit
 * are therefore identical to the Node run; the only difference is that a real
 * `<a2ui-surface>` element renders them into the DOM.
 */

import { basicCatalog } from "@a2ui/lit/v0_9";
import { A2uiSurface } from "@a2ui/lit/v0_9";
import { injectBasicCatalogStyles } from "@a2ui/web_core/v0_9/basic_catalog";
import { A2uiAdapter } from "../src/adapters/a2ui/adapter.ts";
import { Tracer } from "../src/orchestrator/trace.ts";
import { runSurfaceHandoff } from "../src/scenarios/s1-surface-handoff.ts";
import { runConcurrentComposition } from "../src/scenarios/s2-concurrent-composition.ts";
import { runActionRoundTrip } from "../src/scenarios/s3-action-roundtrip.ts";
import { SCENARIO_SURFACES, markReady, scenarioFromUrl } from "./scenario.ts";

// Referenced so the bundler keeps the custom element registration.
void A2uiSurface;
injectBasicCatalogStyles();

const scenario = scenarioFromUrl();
const surfaceId = SCENARIO_SURFACES[scenario];
const adapter = new A2uiAdapter(new Tracer(scenario, "a2ui"), basicCatalog);

const runner = {
  "s1-surface-handoff": runSurfaceHandoff,
  "s2-concurrent-composition": runConcurrentComposition,
  "s3-action-roundtrip": async (a: A2uiAdapter) => (await runActionRoundTrip(a)).orchestrator,
}[scenario];

const log: string[] = [];
const logEl = document.getElementById("log")!;
logEl.dataset["logLabel"] = "client-to-server action, as A2UI emits it";

/** See the note in json-render.tsx — the scenario dispatches before the click. */
let live = false;

// Subscribe before running so the round-trip scenario's clicks are captured.
adapter.model.onAction.subscribe((action) => {
  // The real client-to-server envelope: surfaceId and sourceComponentId, but
  // no agent. This is what an orchestrator would have to route on.
  log.push(`${live ? "click" : "scenario"} · ${JSON.stringify(action)}`);
  logEl.textContent = log.join("\n");
  logEl.dataset["lastAction"] = JSON.stringify(action);
});

await runner(adapter);
live = true;

const root = document.getElementById("root")!;
const surface = adapter.model.getSurface(surfaceId);

const element = document.createElement("a2ui-surface") as A2uiSurface;
element.surface = surface as never;
root.appendChild(element);

// Let Lit flush its first update before Playwright looks at the DOM.
await element.updateComplete;
requestAnimationFrame(() => {
  markReady(root, { scenario, surfaces: adapter.model.surfacesMap.size });
});
