/**
 * Scenario runner.
 *
 * One entry point that builds a fresh adapter per (scenario, protocol) pair and
 * returns everything the tests and the report need. Keeping construction here
 * means a test can never accidentally share state between protocols and read a
 * contaminated trace.
 */

import { JsonRenderAdapter } from "../adapters/json-render/adapter.ts";
import { A2uiAdapter } from "../adapters/a2ui/adapter.ts";
import { McpAppsAdapter, type McpAppsAdapterOptions } from "../adapters/mcp-apps/adapter.ts";
import { Tracer } from "../orchestrator/trace.ts";
import type { Orchestrator } from "../orchestrator/orchestrator.ts";
import type { ProtocolAdapter, ProtocolId, RenderedSnapshot, TraceEntry } from "../orchestrator/types.ts";

import { SCENARIO_ID as S1, SCENARIO_TITLE as S1_TITLE, runSurfaceHandoff } from "./s1-surface-handoff.ts";
import { SCENARIO_ID as S2, SCENARIO_TITLE as S2_TITLE, runConcurrentComposition } from "./s2-concurrent-composition.ts";
import { SCENARIO_ID as S3, SCENARIO_TITLE as S3_TITLE, runActionRoundTrip } from "./s3-action-roundtrip.ts";

export const PROTOCOLS: ProtocolId[] = ["json-render", "a2ui", "mcp-apps"];

export const SCENARIOS = [
  { id: S1, title: S1_TITLE },
  { id: S2, title: S2_TITLE },
  { id: S3, title: S3_TITLE },
] as const;

export type ScenarioId = (typeof SCENARIOS)[number]["id"];

export interface ScenarioRun {
  scenario: ScenarioId;
  protocol: ProtocolId;
  orchestrator: Orchestrator;
  adapter: ProtocolAdapter;
  snapshot: RenderedSnapshot;
  traces: TraceEntry[];
}

export interface RunOptions {
  /** Passed through to the MCP Apps adapter; ignored by the others. */
  mcpApps?: McpAppsAdapterOptions;
}

function createAdapter(
  protocol: ProtocolId,
  scenario: ScenarioId,
  options: RunOptions,
): { adapter: ProtocolAdapter; tracer: Tracer } {
  const tracer = new Tracer(scenario, protocol);
  switch (protocol) {
    case "json-render":
      return { adapter: new JsonRenderAdapter(tracer), tracer };
    case "a2ui":
      return { adapter: new A2uiAdapter(tracer), tracer };
    case "mcp-apps":
      return { adapter: new McpAppsAdapter(tracer, options.mcpApps), tracer };
  }
}

export async function runScenario(
  scenario: ScenarioId,
  protocol: ProtocolId,
  options: RunOptions = {},
): Promise<ScenarioRun> {
  const { adapter, tracer } = createAdapter(protocol, scenario, options);

  let orchestrator: Orchestrator;
  switch (scenario) {
    case S1:
      orchestrator = await runSurfaceHandoff(adapter);
      break;
    case S2:
      orchestrator = await runConcurrentComposition(adapter);
      break;
    case S3:
      orchestrator = (await runActionRoundTrip(adapter)).orchestrator;
      break;
  }

  const snapshot = await adapter.snapshot();

  return {
    scenario,
    protocol,
    orchestrator,
    adapter,
    snapshot,
    traces: [...tracer.entries],
  };
}

/** Every scenario against every protocol. Used by the report generator. */
export async function runAll(options: RunOptions = {}): Promise<ScenarioRun[]> {
  const runs: ScenarioRun[] = [];
  for (const { id } of SCENARIOS) {
    for (const protocol of PROTOCOLS) {
      const run = await runScenario(id, protocol, options);
      runs.push(run);
      await run.adapter.dispose?.();
    }
  }
  return runs;
}
