/**
 * Capability tracing.
 *
 * Adapters call `record` whenever a scenario asks the protocol for something.
 * The report is generated from these entries, so a claim in docs/COMPARISON.md
 * can always be traced back to the line of adapter code that produced it.
 */

import type { Outcome, ProtocolId, TraceEntry } from "./types.ts";

export class Tracer {
  private readonly _entries: TraceEntry[] = [];

  constructor(
    private readonly scenario: string,
    private readonly protocol: ProtocolId,
  ) {}

  record(capability: string, outcome: Outcome, detail: string, evidence?: unknown): void {
    this._entries.push({
      scenario: this.scenario,
      protocol: this.protocol,
      capability,
      outcome,
      detail,
      evidence,
    });
  }

  get entries(): readonly TraceEntry[] {
    return this._entries;
  }

  /** Look up a single recorded outcome. Throws when the capability was never probed. */
  outcomeOf(capability: string): Outcome {
    const entry = this._entries.find((e) => e.capability === capability);
    if (!entry) {
      throw new Error(
        `capability "${capability}" was never recorded for ${this.protocol}/${this.scenario}`,
      );
    }
    return entry.outcome;
  }

  has(capability: string): boolean {
    return this._entries.some((e) => e.capability === capability);
  }
}
