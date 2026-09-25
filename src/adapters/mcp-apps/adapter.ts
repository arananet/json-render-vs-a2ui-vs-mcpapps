/**
 * MCP Apps adapter.
 *
 * The structural fact that drives every outcome below: an MCP App instance is
 * created by a tool call and is bound to the server that owns the tool. It is
 * not addressed by a surface id, and there is no message that means "draw into
 * the region someone else is already drawing into".
 *
 * That single design choice is simultaneously this protocol's best and worst
 * property for orchestration. Identity comes for free — the host always knows
 * which agent a view belongs to, because it holds the connection — so action
 * routing needs no lookup table and no trust in the payload. But surface
 * sharing is not merely unsupported, it is unspeakable: two agents mean two
 * iframes, and the composition problem moves up to the host's layout layer.
 */

import { APP_TOOL, PRIVILEGED_TOOL, RENDER_TOOL, createAgentServer, viewUri, type AgentServer } from "./agent-server.ts";
import { closeHostedApp, hostApp, type HostedApp } from "./host.ts";
import type {
  ActionReceipt,
  AgentId,
  ProtocolAdapter,
  RenderedSnapshot,
  SurfaceId,
  UiBlock,
  UserAction,
} from "../../orchestrator/types.ts";
import type { Tracer } from "../../orchestrator/trace.ts";

/**
 * A live view. The key point is that this is per (surface, agent) — asking for
 * one per surface is what the protocol refuses.
 */
interface AppInstance {
  key: string;
  surfaceId: SurfaceId;
  agent: AgentId;
  hosted: HostedApp;
  /** Blocks delivered to the view via ui/notifications/tool-result. */
  blocks: UiBlock[];
}

export interface McpAppsAdapterOptions {
  /** Set false to leave AppBridge's permissive default `oncalltool` in place. */
  enforceVisibility?: boolean;
}

export class McpAppsAdapter implements ProtocolAdapter {
  readonly id = "mcp-apps" as const;
  readonly sdk = "@modelcontextprotocol/ext-apps (SEP-1865) + @modelcontextprotocol/server";

  private readonly agentServers = new Map<AgentId, AgentServer>();
  private readonly instances = new Map<string, AppInstance>();
  /** Which agent opened each surface, from the host's own records. */
  private readonly surfaceOpenedBy = new Map<SurfaceId, AgentId>();

  constructor(
    private readonly tracer: Tracer,
    private readonly options: McpAppsAdapterOptions = {},
  ) {}

  async createSurface(surfaceId: SurfaceId, agent: AgentId): Promise<void> {
    this.surfaceOpenedBy.set(surfaceId, agent);
    await this.instanceFor(surfaceId, agent);
  }

  async emit(surfaceId: SurfaceId, agent: AgentId, block: UiBlock): Promise<void> {
    const otherAgentsOnSurface = [
      ...new Set(
        [...this.instances.values()]
          .filter((i) => i.surfaceId === surfaceId && i.agent !== agent)
          .map((i) => i.agent),
      ),
    ];

    const instance = await this.instanceFor(surfaceId, agent);

    if (otherAgentsOnSurface.length > 0 && !this.tracer.has("compose.shared-surface")) {
      this.tracer.record(
        "compose.shared-surface",
        "NOT_EXPRESSIBLE",
        `In this tested mapping, agents ${JSON.stringify(otherAgentsOnSurface)} and "${agent}" do not compose into one ` +
          `surface. Each has its own App instance, its own sandboxed iframe and its own origin, so ` +
          `what the user gets is N stacked panels rather than one view. Laying them out — ordering, ` +
          `sizing, deciding which is primary, reconciling their headings — is entirely the host's ` +
          `problem in this topology, and the inspected mapping uses only ` +
          `ui/notifications/size-changed. For an orchestrator whose whole job is to present several ` +
          `agents' work as one answer, this is the sharpest edge in MCP Apps.`,
        { surfaceId, separateInstances: [...otherAgentsOnSurface, agent] },
      );

      this.tracer.record(
        "compose.identifier-collision",
        "SUPPORTED_WITH_CAVEAT",
        `In this tested one-server-per-agent adapter/topology configuration, component ids live ` +
          `inside separate app instances, so "${agent}" reusing block id "${block.id}" does not overwrite ` +
          `anything ${JSON.stringify(otherAgentsOnSurface)} rendered. This is configuration-scoped ` +
          `instance separation, not protocol-level collision enforcement; a matched-topology comparison ` +
          `is required for that stronger claim.`,
        { surfaceId, blockId: block.id, isolatedInstances: [...otherAgentsOnSurface, agent] },
      );
    }

    // The orchestrator drives the agent's UI by calling its tool. The host then
    // pushes the tool's input and result down to the view, which is how an MCP
    // App learns what to draw.
    await instance.hosted.bridge.sendToolInput({ arguments: { block } });

    const result = await instance.hosted.client.callTool({
      name: RENDER_TOOL,
      arguments: { block },
    });

    await instance.hosted.bridge.sendToolResult({
      content: result.content,
      structuredContent: result.structuredContent as Record<string, unknown>,
    });

    instance.blocks.push(block);
  }

  async handoff(surfaceId: SurfaceId, from: AgentId, to: AgentId): Promise<void> {
    const originating = this.instances.get(instanceKey(surfaceId, from));

    // Ask the protocol the question honestly: is there any way for `to` to
    // continue drawing into the view `from` already owns?
    this.tracer.record(
      "handoff.continue-surface",
      "NOT_EXPRESSIBLE",
      `There is no message in SEP-1865 that means "agent ${to}, continue the view agent ${from} is ` +
        `rendering" in the inspected mapping. A view is instantiated by a tools/call and bound to ` +
        `the server that declared the tool and its ui:// resource; ${to} lives behind a different ` +
        `server, so calling ${to}'s render tool produces a second App instance with its own iframe, ` +
        `origin and bridge. The host can place the two boxes next to each other, but this tested ` +
        `topology does not continue the first instance. A matched-topology comparison would be ` +
        `required before treating that as a protocol-level result.`,
      {
        originatingResourceUri: originating?.hosted.resourceUri ?? viewUri(from),
        successorResourceUri: viewUri(to),
        distinctInstances: true,
      },
    );

    this.tracer.record(
      "handoff.provenance",
      "ENFORCED",
        `In this topology, attribution is not taken from an agent claim — it is a property of ` +
        `the connection. Each view is reachable only through the AppBridge the host created for one ` +
          `server, so the host knows a view is ${from}'s without reading payload content. This is a ` +
          `tested connection-binding observation, not a protocol-wide claim.`,
      { bindings: [...this.instances.values()].map((i) => ({ key: i.key, agent: i.agent })) },
    );

    this.tracer.record(
      "handoff.isolation",
      "ENFORCED",
        `The tested host creates separate sandboxed iframes with a host-constructed CSP. This is a ` +
          `configuration observation only: no adversarial, forged-identity, CSP, or cross-server test ` +
          `was run, so it is not a validated isolation defense.`,
      { defaultCsp: "default-src 'none'; connect-src 'none'; frame-src 'none'; object-src 'none'" },
    );

    await this.instanceFor(surfaceId, to);
  }

  async dispatchUserAction(action: UserAction): Promise<ActionReceipt> {
    const instance = this.findInstanceForSurface(action.surfaceId);
    if (!instance) return { routedTo: null, routedBy: "none" };

    const privileged = action.params?.["privileged"] === true;
    const toolName = privileged ? PRIVILEGED_TOOL : APP_TOOL;
    const args = privileged
      ? { ref: action.componentId, amount: 499 }
      : { blockId: action.componentId, rowId: action.name, value: "revised" };

    try {
      // This is the real view→host→server path: the App issues `tools/call`
      // over the ui/* bridge, and the host decides whether it may proceed.
      const result = await instance.hosted.app.callServerTool({ name: toolName, arguments: args });

      if (privileged) {
        // Reached only when the host left the permissive default in place.
        this.tracer.record(
          "action.approval-gate",
          "REQUIRES_OUT_OF_BAND",
          `The view called "${PRIVILEGED_TOOL}", declared visibility ["model"], and the call reached ` +
            `the server anyway. The inspected SEP-1865 URL reports a host visibility requirement, ` +
            `but that external premise is unverified within this artifact. AppBridge.connect() installs ` +
            `an oncalltool that forwards every request straight to the MCP client, and the local ` +
            `check is left to the host author. Whether it exists at runtime depends on the host ` +
            `installing it.`,
          { tool: toolName, visibility: ["model"], result },
        );
      }

      this.tracer.record(
        "action.routing-identity",
        "SUPPORTED",
        `The view's tools/call arrived over the AppBridge the host created for agent ` +
          `"${instance.agent}"'s server. The orchestrator therefore knows the originating agent from ` +
          `the channel the message came in on, with no control-id table to maintain and nothing in ` +
          `the payload to trust. This is a tested connection-binding observation, not a protocol-wide ` +
          `attribution claim.`,
        { agent: instance.agent, tool: toolName, boundResourceUri: instance.hosted.resourceUri },
      );

      return { routedTo: instance.agent, routedBy: "protocol", raw: result };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);

      this.tracer.record(
        "action.approval-gate",
        "ENFORCED",
        `The installed host handler refused the view's tools/call for "${toolName}": ${reason}. ` +
          `The tool's _meta.ui.visibility is ["model"]. This one rejection is measured handler ` +
          `behavior, not a security guarantee; SDK-default oncalltool forwards the corresponding call.`,
        { tool: toolName, visibility: ["model"], refusals: instance.hosted.refusals },
      );

      this.tracer.record(
        "action.routing-identity",
        "SUPPORTED",
        `Even the refused call was attributable: the host knew it came from agent ` +
          `"${instance.agent}" because of the bridge it arrived on.`,
        { agent: instance.agent },
      );

      return {
        routedTo: instance.agent,
        routedBy: "protocol",
        rejected: { reason },
        raw: { tool: toolName },
      };
    }
  }

  async snapshot(): Promise<RenderedSnapshot> {
    const surfaces: RenderedSnapshot["surfaces"] = {};

    for (const instance of this.instances.values()) {
      // Each (surface, agent) pair is its own visual region. Reporting them
      // under one surface id would paper over exactly the thing that matters,
      // so the instance's agent is part of the key the user would perceive.
      const key = `${instance.surfaceId}::${instance.agent}`;
      const blocks: RenderedSnapshot["surfaces"][string]["blocks"] = {};

      for (const block of instance.blocks) {
        const rows: Record<string, string> = {};
        for (const row of block.rows) rows[row.id] = row.value;
        blocks[block.id] = { title: block.title, rows, writtenBy: instance.agent };
      }

      surfaces[key] = { owner: instance.agent, blocks };
    }

    return { surfaces };
  }

  /** Agent servers, for tests that want to assert on server-side effects. */
  serverFor(agent: AgentId): AgentServer | undefined {
    return this.agentServers.get(agent);
  }

  async dispose(): Promise<void> {
    for (const instance of this.instances.values()) {
      await closeHostedApp(instance.hosted);
    }
    this.instances.clear();
  }

  private async instanceFor(surfaceId: SurfaceId, agent: AgentId): Promise<AppInstance> {
    const key = instanceKey(surfaceId, agent);
    const existing = this.instances.get(key);
    if (existing) return existing;

    let agentServer = this.agentServers.get(agent);
    if (!agentServer) {
      agentServer = createAgentServer(agent);
      this.agentServers.set(agent, agentServer);
    }

    const hosted = await hostApp(agent, agentServer.server, viewUri(agent), {
      enforceVisibility: this.options.enforceVisibility,
    });

    const instance: AppInstance = { key, surfaceId, agent, hosted, blocks: [] };
    this.instances.set(key, instance);
    return instance;
  }

  private findInstanceForSurface(surfaceId: SurfaceId): AppInstance | undefined {
    for (const instance of this.instances.values()) {
      if (instance.surfaceId === surfaceId) return instance;
  }
    return undefined;
  }
}

const instanceKey = (surfaceId: SurfaceId, agent: AgentId) => `${surfaceId}::${agent}`;
