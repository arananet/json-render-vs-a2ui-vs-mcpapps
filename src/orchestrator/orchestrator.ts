/**
 * A deterministic stand-in for a real multi-agent orchestrator.
 *
 * It has no model in it on purpose. The question the harness answers is what
 * the *protocol* can carry between an orchestrator and its UI-capable agents,
 * and an LLM in the loop would only add noise to that measurement.
 *
 * What it does keep is the part of a real orchestrator that matters here: a
 * graph of named agents, a notion of who owns which surface, and a mailbox per
 * agent so we can see whether a user's click actually woke the right one.
 */

import type {
  ActionReceipt,
  AgentId,
  ProtocolAdapter,
  SurfaceId,
  TraceEntry,
  UiBlock,
  UserAction,
} from "./types.ts";
import { Tracer } from "./trace.ts";

export interface AgentDefinition {
  id: AgentId;
  /** Free-text role, shown in the report to make the scenarios readable. */
  role: string;
}

/** A message the orchestrator delivered to an agent because of a user action. */
export interface Delivery {
  agent: AgentId;
  action: UserAction;
  /** True when the orchestrator only knew the recipient from its own bookkeeping. */
  viaOutOfBandTable: boolean;
}

export class Orchestrator {
  readonly tracer: Tracer;
  private readonly agents = new Map<AgentId, AgentDefinition>();

  /**
   * The orchestrator's own element -> agent table.
   *
   * Its existence is the finding, not an implementation detail: every entry
   * here is identity the protocol failed to carry, which the orchestrator must
   * now keep in sync by itself.
   */
  private readonly routingTable = new Map<string, AgentId>();

  private readonly surfaceOwner = new Map<SurfaceId, AgentId>();
  private readonly deliveries: Delivery[] = [];

  constructor(
    readonly adapter: ProtocolAdapter,
    readonly scenario: string,
    agents: AgentDefinition[],
  ) {
    this.tracer = new Tracer(scenario, adapter.id);
    for (const a of agents) this.agents.set(a.id, a);
  }

  agent(id: AgentId): AgentDefinition {
    const found = this.agents.get(id);
    if (!found) throw new Error(`unknown agent: ${id}`);
    return found;
  }

  /** Number of entries the orchestrator had to keep because the protocol did not. */
  get outOfBandRoutingEntries(): number {
    return this.routingTable.size;
  }

  get deliveryLog(): readonly Delivery[] {
    return this.deliveries;
  }

  ownerOf(surfaceId: SurfaceId): AgentId | null {
    return this.surfaceOwner.get(surfaceId) ?? null;
  }

  async openSurface(surfaceId: SurfaceId, owner: AgentId): Promise<void> {
    this.agent(owner);
    this.surfaceOwner.set(surfaceId, owner);
    await this.adapter.createSurface(surfaceId, owner);
  }

  /**
   * Have `agent` draw a block. Every control in the block is also recorded in
   * the out-of-band table so we can measure, in scenario 3, how much the
   * orchestrator had to remember on the protocol's behalf.
   */
  async emit(surfaceId: SurfaceId, agent: AgentId, block: UiBlock): Promise<void> {
    this.agent(agent);
    for (const control of block.controls ?? []) {
      this.routingTable.set(`${surfaceId}#${control.id}`, control.owner);
    }
    await this.adapter.emit(surfaceId, agent, block);
  }

  /** Delegate an in-progress surface to another agent. */
  async handoff(surfaceId: SurfaceId, from: AgentId, to: AgentId): Promise<void> {
    this.agent(from);
    this.agent(to);
    this.surfaceOwner.set(surfaceId, to);
    await this.adapter.handoff(surfaceId, from, to);
  }

  /**
   * Replay a user interaction.
   *
   * The adapter reports who the *protocol* says should handle it. When the
   * protocol could not say, the orchestrator falls back to its own table — and
   * that fallback is recorded, because an orchestrator that must maintain this
   * table cannot safely accept agents it did not itself render.
   */
  async userActivates(action: UserAction): Promise<ActionReceipt> {
    const receipt = await this.adapter.dispatchUserAction(action);

    if (receipt.rejected) return receipt;

    let agent = receipt.routedTo;
    let viaTable = false;

    if (agent === null) {
      agent = this.routingTable.get(`${action.surfaceId}#${action.componentId}`) ?? null;
      viaTable = agent !== null;
    }

    if (agent !== null) {
      this.deliveries.push({ agent, action, viaOutOfBandTable: viaTable });
    }

    return {
      ...receipt,
      routedTo: agent,
      routedBy: receipt.routedBy === "protocol" ? "protocol" : viaTable ? "out-of-band" : "none",
    };
  }

  /** Traces recorded by both the orchestrator and its adapter. */
  get traces(): readonly TraceEntry[] {
    return this.tracer.entries;
  }

  async dispose(): Promise<void> {
    await this.adapter.dispose?.();
  }
}
