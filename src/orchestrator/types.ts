/**
 * Protocol-agnostic vocabulary shared by every adapter.
 *
 * Nothing in here is specific to json-render, A2UI or MCP Apps. The scenarios
 * are written against these types only, so a difference in a recorded outcome
 * is a difference in the protocol rather than a difference in the test.
 */

/** Identity of an agent inside the orchestrator's graph. */
export type AgentId = string;

/** Identity of a rendered region a user can see. */
export type SurfaceId = string;

/**
 * Fixed vocabulary for what a protocol did when a scenario asked something of
 * it. Adapters never work around a missing capability — they record it.
 */
export const OUTCOMES = [
  /** The protocol expressed the request directly, with no loss. */
  "SUPPORTED",
  /** Expressed, but something the orchestrator cares about was weakened. */
  "SUPPORTED_WITH_CAVEAT",
  /** Only works because the orchestrator keeps state the protocol does not carry. */
  "REQUIRES_OUT_OF_BAND",
  /** The protocol has no way to say this at all. */
  "NOT_EXPRESSIBLE",
  /** The protocol actively enforced a rule (an authorization or isolation win). */
  "ENFORCED",
  /** A conformant host structurally enforced the outcome. */
  "ENFORCED_BY_CONFORMANT_HOST",
  /** A write was silently dropped or overwritten. */
  "LOST",
] as const;

export type Outcome = (typeof OUTCOMES)[number];

/** One recorded fact about how a protocol behaved. */
export interface TraceEntry {
  scenario: string;
  protocol: ProtocolId;
  /** The capability being probed, e.g. "handoff.continue-surface". */
  capability: string;
  outcome: Outcome;
  /** Why the adapter recorded this outcome. Shows up verbatim in the report. */
  detail: string;
  /**
   * The protocol-level evidence for the claim: the actual message, metadata or
   * error the SDK produced. Keeps the matrix falsifiable.
   */
  evidence?: unknown;
}

export type ProtocolId = "json-render" | "a2ui" | "mcp-apps";

/** A user interaction replayed against a rendered surface. */
export interface UserAction {
  surfaceId: SurfaceId;
  /** Stable id of the control the user activated. */
  componentId: string;
  /** Action name as the emitting agent declared it. */
  name: string;
  params?: Record<string, unknown>;
}

/**
 * What the orchestrator learns when a user action comes back from the UI.
 *
 * `routedTo` is the crux of scenario 3: an orchestrator with many agents needs
 * to know which one to wake. If the protocol's event does not carry enough to
 * answer that, the adapter must say so via `routedBy`.
 */
export interface ActionReceipt {
  routedTo: AgentId | null;
  /**
   * How the agent was identified.
   * - `protocol`   — the event itself carried the identity.
   * - `out-of-band` — the orchestrator had to consult its own table.
   * - `none`       — the action never reached the orchestrator.
   */
  routedBy: "protocol" | "out-of-band" | "none";
  /** Set when the host refused the action before it reached any agent. */
  rejected?: { reason: string };
  raw?: unknown;
}

/**
 * A piece of UI an agent wants drawn, described in neutral terms.
 *
 * Deliberately close to the intersection of the three protocols: a titled block
 * with some text rows and optional controls. Anything richer would advantage
 * whichever protocol it was modelled on.
 */
export interface UiBlock {
  /** Stable id. Scenarios reuse ids on purpose to provoke collisions. */
  id: string;
  title: string;
  rows: Array<{ id: string; label: string; value: string }>;
  controls?: Array<{
    id: string;
    label: string;
    /** Action name dispatched when the user activates the control. */
    action: string;
    params?: Record<string, unknown>;
    /** Agent that should handle the action, from the orchestrator's point of view. */
    owner: AgentId;
    /**
     * When set, the orchestrator considers this action privileged: it must not
     * be invocable by the UI without the host's consent.
     */
    privileged?: boolean;
  }>;
}

/**
 * The narrow port every protocol adapter implements.
 *
 * The orchestrator only ever calls these five methods, so the same scenario
 * script drives all three stacks.
 */
export interface ProtocolAdapter {
  readonly id: ProtocolId;
  /** Human-readable name of the SDK actually being driven. */
  readonly sdk: string;

  /** Prepare a surface owned by `agent`. */
  createSurface(surfaceId: SurfaceId, agent: AgentId): Promise<void>;

  /** `agent` draws `block` into `surfaceId`. */
  emit(surfaceId: SurfaceId, agent: AgentId, block: UiBlock): Promise<void>;

  /**
   * The orchestrator hands control of `surfaceId` from `from` to `to`.
   * Adapters that cannot express this record NOT_EXPRESSIBLE and return.
   */
  handoff(surfaceId: SurfaceId, from: AgentId, to: AgentId): Promise<void>;

  /** Replay a user interaction and report what the orchestrator learned. */
  dispatchUserAction(action: UserAction): Promise<ActionReceipt>;

  /**
   * Everything currently drawn, flattened for comparison. Used to detect writes
   * that one agent lost to another.
   */
  snapshot(): Promise<RenderedSnapshot>;

  /** Release any SDK resources (transports, servers, iframes). */
  dispose?(): Promise<void>;
}

/**
 * Normalised view of what a user would actually see, per surface.
 *
 * `blocks` is keyed by block id so a collision shows up as a missing or
 * overwritten entry rather than as a formatting difference.
 */
export interface RenderedSnapshot {
  surfaces: Record<
    SurfaceId,
    {
      /** Agent the adapter believes owns the surface, if the protocol tracks it. */
      owner: AgentId | null;
      blocks: Record<string, { title: string; rows: Record<string, string>; writtenBy: AgentId }>;
    }
  >;
}
