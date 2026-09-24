/**
 * The host half of MCP Apps.
 *
 * In the other two protocols the host is a renderer. Here it is a piece of
 * security infrastructure: it owns the iframe, the CSP, and — critically — the
 * decision about which tool calls coming out of a view are allowed to reach a
 * server. The inspected SEP-1865 URL reports a host visibility requirement,
 * but this artifact has no archived copy or independent verification of that
 * external normative premise.
 *
 * That rule is not self-enforcing. `AppBridge.connect()` installs a default
 * `oncalltool` that forwards straight to the MCP client:
 *
 *     this.oncalltool = async (params, extra) =>
 *       this._client.request({ method: "tools/call", params }, ...)
 *
 * No visibility check. The SDK ships `isToolVisibilityModelOnly` for host
 * authors to apply themselves, so the local default forwards unless the host
 * installs `enforceVisibility` below. Scenario 3 exercises both local paths;
 * it does not independently establish an external specification requirement.
 */

import { Client, InMemoryTransport as ClientTransport } from "@modelcontextprotocol/client";
import { InMemoryTransport as ServerTransport, type McpServer } from "@modelcontextprotocol/server";
import { App } from "@modelcontextprotocol/ext-apps";
import { AppBridge, isToolVisibilityModelOnly } from "@modelcontextprotocol/ext-apps/app-bridge";
import { EXTENSION_ID, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import type { AgentId } from "../../orchestrator/types.ts";

export interface HostedApp {
  agent: AgentId;
  /** The host's MCP client for this agent's server. */
  client: Client;
  /** The host-side bridge to the view. */
  bridge: AppBridge;
  /** The view. In Node this is a real `App`; in the browser it runs in an iframe. */
  app: App;
  /** `ui://` template the view was instantiated from. */
  resourceUri: string;
  /** Calls the host refused on the view's behalf. */
  refusals: Array<{ tool: string; reason: string }>;
}

export interface HostOptions {
  /**
   * When false, the host leaves `AppBridge`'s default `oncalltool` in place —
   * the spec-violating path — so the harness can show what it costs.
   */
  enforceVisibility?: boolean;
}

/** Connect the host's MCP client to one agent's server. */
export async function connectAgentClient(server: McpServer): Promise<Client> {
  const [clientSide, serverSide] = ServerTransport.createLinkedPair();
  const client = new Client(
    { name: "harness-host", version: "0.1.0" },
    {
      capabilities: {
        // Capability negotiation as the spec describes it: the host advertises
        // the MCP Apps extension and the MIME types it can render.
        extensions: { [EXTENSION_ID]: { mimeTypes: [RESOURCE_MIME_TYPE] } },
      },
    },
  );
  await Promise.all([client.connect(clientSide), server.connect(serverSide)]);
  return client;
}

/**
 * Build the host-side bridge and install the visibility check the spec requires
 * but `AppBridge` does not provide.
 *
 * `connect` is passed in rather than performed here because the view leg differs by
 * environment: an in-memory pair under Node, a real `PostMessageTransport` to a
 * sandboxed iframe in the browser. The enforcement must be installed *after*
 * connect, since that is when the permissive default is set.
 */
export function createBridge(
  client: Client,
  options: HostOptions = {},
): { bridge: AppBridge; refusals: Array<{ tool: string; reason: string }>; enforce: () => void } {
  const { enforceVisibility = true } = options;

  const bridge = new AppBridge(
    client,
    { name: "harness-host", version: "0.1.0" },
    {},
    { hostContext: { theme: "light", displayMode: "inline" } },
  );

  const refusals: Array<{ tool: string; reason: string }> = [];

  const enforce = () => {
    if (!enforceVisibility) return;

    bridge.oncalltool = async (params, extra) => {
      const { tools } = await client.listTools();
      const tool = tools.find((t) => t.name === params.name);

      if (!tool) {
        refusals.push({ tool: params.name, reason: "unknown tool" });
        throw new Error(`Tool not found: ${params.name}`);
      }

      if (isToolVisibilityModelOnly(tool)) {
        refusals.push({
          tool: params.name,
          reason: 'tool visibility is ["model"]; apps may not call it',
        });
        throw new Error(
          `Host refused tools/call from app: "${params.name}" is model-visible only`,
        );
      }

      return client.request({ method: "tools/call", params }, { signal: extra.mcpReq.signal });
    };
  };

  return { bridge, refusals, enforce };
}

/**
 * Stand up the full MCP Apps triangle for one agent:
 *
 *     App (view)  <--ui/*-->  AppBridge (host)  <--MCP-->  Client  <-->  McpServer
 *
 * Every leg is the real SDK. Only the transports are in-memory, standing in for
 * postMessage on the view leg and stdio/HTTP on the server leg.
 */
export async function hostApp(
  agent: AgentId,
  server: McpServer,
  resourceUri: string,
  options: HostOptions = {},
): Promise<HostedApp> {
  const client = await connectAgentClient(server);
  const { bridge, refusals, enforce } = createBridge(client, options);

  const app = new App(
    { name: `${agent}-view`, version: "0.1.0" },
    { availableDisplayModes: ["inline"] },
    { autoResize: false },
  );

  const [appSide, hostSide] = ClientTransport.createLinkedPair();
  await Promise.all([bridge.connect(hostSide), app.connect(appSide)]);
  enforce();

  return { agent, client, bridge, app, resourceUri, refusals };
}

export async function closeHostedApp(hosted: HostedApp): Promise<void> {
  await hosted.app.close();
  await hosted.bridge.close();
  await hosted.client.close();
}
