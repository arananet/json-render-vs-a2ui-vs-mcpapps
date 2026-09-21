/**
 * json-render host page.
 *
 * Renders the scenario's real `Spec` through `createRenderer` from
 * `@json-render/react`, so what Playwright inspects is json-render's own React
 * output — element keys, prop resolution, action bindings and all.
 */

import { createRoot } from "react-dom/client";
import { createRenderer } from "@json-render/react";
import { catalog } from "../src/adapters/json-render/catalog.ts";
import { JsonRenderAdapter } from "../src/adapters/json-render/adapter.ts";
import { Tracer } from "../src/orchestrator/trace.ts";
import { runSurfaceHandoff } from "../src/scenarios/s1-surface-handoff.ts";
import { runConcurrentComposition } from "../src/scenarios/s2-concurrent-composition.ts";
import { runActionRoundTrip } from "../src/scenarios/s3-action-roundtrip.ts";
import { SCENARIO_SURFACES, markReady, scenarioFromUrl } from "./scenario.ts";

const Renderer = createRenderer(catalog, {
  Block: ({ element, children }) => (
    <section className="block" data-block={element.props.blockId} data-written-by={element.props.writtenBy}>
      <h2>
        {element.props.title}
        <span className="agent-tag" data-agent={element.props.writtenBy}>
          {element.props.writtenBy}
        </span>
      </h2>
      {children}
    </section>
  ),
  Row: ({ element }) => (
    <div className="row" data-row={element.props.rowId}>
      <span className="label">{element.props.label}</span>
      <span className="value" data-value={element.props.rowId}>
        {element.props.value}
      </span>
    </div>
  ),
  Button: ({ element, emit }) => (
    // `emit` is json-render's own event resolution: it looks up the element's
    // `on.press` binding and dispatches the action through the renderer.
    <button type="button" data-control={element.props.controlId} onClick={() => emit("press")}>
      {element.props.label}
    </button>
  ),
});

const scenario = scenarioFromUrl();
const surface = SCENARIO_SURFACES[scenario];
const adapter = new JsonRenderAdapter(new Tracer(scenario, "json-render"));

const runner = {
  "s1-surface-handoff": runSurfaceHandoff,
  "s2-concurrent-composition": runConcurrentComposition,
  "s3-action-roundtrip": async (a: JsonRenderAdapter) => (await runActionRoundTrip(a)).orchestrator,
}[scenario];

const log: string[] = [];
const logEl = document.getElementById("log")!;
logEl.dataset["logLabel"] = "action dispatched by the renderer";

/**
 * Scenario 3 dispatches its actions through the adapter before the page is
 * interactive, so without this the log would mix replayed events with the
 * reader's own click and look like a bug.
 */
let live = false;

await runner(adapter);
live = true;

const root = document.getElementById("root")!;
createRoot(root).render(
  <Renderer
    spec={adapter.specFor(surface)}
    onAction={(name, params) => {
      // The whole event, as json-render delivers it: a catalog action name and
      // its params. No agent, no surface, no addressee.
      log.push(`${live ? "click" : "scenario"} · action=${name} params=${JSON.stringify(params)}`);
      logEl.textContent = log.join("\n");
      logEl.dataset["lastAction"] = JSON.stringify({ name, params });
    }}
  />,
);

// Give React a frame to commit before telling Playwright the page is settled.
requestAnimationFrame(() => {
  markReady(root, { scenario, surfaces: 1, blocks: root.querySelectorAll("[data-block]").length });
});
