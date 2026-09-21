/**
 * Shared page wiring.
 *
 * Every host page takes `?scenario=` so one Playwright spec can drive all three
 * scenarios against all three protocols without the pages knowing about each
 * other.
 */

import type { ScenarioId } from "../src/scenarios/run.ts";

export const SCENARIO_SURFACES: Record<ScenarioId, string> = {
  "s1-surface-handoff": "trip",
  "s2-concurrent-composition": "briefing",
  "s3-action-roundtrip": "checkout",
};

export function scenarioFromUrl(): ScenarioId {
  const value = new URLSearchParams(location.search).get("scenario");
  if (value && value in SCENARIO_SURFACES) return value as ScenarioId;
  return "s1-surface-handoff";
}

/** Signal to Playwright that the page has finished its scenario. */
export function markReady(root: HTMLElement, detail: Record<string, unknown> = {}): void {
  root.dataset["state"] = "ready";
  for (const [key, value] of Object.entries(detail)) {
    root.dataset[key] = String(value);
  }
}
