/**
 * One MCP server per agent.
 *
 * This is the shape MCP Apps pushes an orchestrator into, and it is worth being
 * explicit about why. An MCP App is not a message an agent sends to a renderer;
 * it is an HTML resource a *server* declares, bound to a *tool* that server
 * exposes, instantiated by a *tool call*. So "a UI-capable agent" in MCP Apps
 * terms is a server with a `ui://` resource and at least one tool wired to it.
 *
 * Built entirely with the real helpers from `@modelcontextprotocol/ext-apps`:
 * `registerAppResource`, `registerAppTool`, `RESOURCE_MIME_TYPE`.
 */

import { McpServer } from "@modelcontextprotocol/server";
import {
  RESOURCE_MIME_TYPE,
  registerAppResource,
  registerAppTool,
} from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import type { AgentId, UiBlock } from "../../orchestrator/types.ts";

export const viewUri = (agent: AgentId) => `ui://${agent}/view.html`;

/** The tool the orchestrator calls to make this agent draw. */
export const RENDER_TOOL = "render_block";
/** A tool the *view* may call — marked app-visible. */
export const APP_TOOL = "revise_row";
/** A privileged tool the view must NOT be able to call — model-visible only. */
export const PRIVILEGED_TOOL = "commit_booking";

export interface AgentServer {
  agent: AgentId;
  server: McpServer;
  /** Blocks this agent has been asked to render, newest last. */
  rendered: UiBlock[];
  /** Tool calls the view made back to this server. */
  appCalls: Array<{ tool: string; args: unknown }>;
}

/**
 * The HTML the host will load into a sandboxed iframe.
 *
 * Real MCP Apps content: it boots an `App` from the SDK, completes the
 * `ui/initialize` handshake, renders the block delivered by the
 * `ui/notifications/tool-result` notification, and calls `tools/call` back to
 * its own server when the user activates a control.
 */
export function viewHtml(agent: AgentId): string {
  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>${agent} view</title></head>
  <body>
    <div id="root" data-agent="${agent}" data-state="booting">booting…</div>
    <script type="module" src="./view-client.js"></script>
  </body>
</html>`;
}

export function createAgentServer(agent: AgentId): AgentServer {
  const server = new McpServer({ name: `agent-${agent}`, version: "0.1.0" });
  const rendered: UiBlock[] = [];
  const appCalls: Array<{ tool: string; args: unknown }> = [];

  registerAppResource(
    server,
    `${agent} view`,
    viewUri(agent),
    {
      description: `Surface drawn by agent ${agent}`,
      _meta: {
        ui: {
          // Declared up front so the host can audit and cache the template
          // before any tool runs — one of MCP Apps' real structural wins.
          csp: { connectDomains: [], resourceDomains: [] },
          prefersBorder: true,
        },
      },
    },
    async () => ({
      contents: [{ uri: viewUri(agent), mimeType: RESOURCE_MIME_TYPE, text: viewHtml(agent) }],
    }),
  );

  registerAppTool(
    server,
    RENDER_TOOL,
    {
      description: `Render a block on ${agent}'s surface`,
      inputSchema: z.object({ block: z.unknown() }),
      _meta: { ui: { resourceUri: viewUri(agent) } },
    },
    async ({ block }) => {
      rendered.push(block as UiBlock);
      return {
        content: [{ type: "text", text: `rendered ${(block as UiBlock).id}` }],
        structuredContent: { block },
      };
    },
  );

  registerAppTool(
    server,
    APP_TOOL,
    {
      description: "Revise a row from the view",
      inputSchema: z.object({ blockId: z.string(), rowId: z.string(), value: z.string() }),
      // Callable by the app, hidden from the model.
      _meta: { ui: { resourceUri: viewUri(agent), visibility: ["app"] } },
    },
    async (args) => {
      appCalls.push({ tool: APP_TOOL, args });
      return { content: [{ type: "text", text: `revised ${args.rowId}` }] };
    },
  );

  registerAppTool(
    server,
    PRIVILEGED_TOOL,
    {
      description: "Commit a booking and charge the customer",
      inputSchema: z.object({ ref: z.string(), amount: z.number() }),
      // Model-visible only. Per SEP-1865 a host MUST reject a tools/call for
      // this tool coming from the app.
      _meta: { ui: { resourceUri: viewUri(agent), visibility: ["model"] } },
    },
    async (args) => {
      appCalls.push({ tool: PRIVILEGED_TOOL, args });
      return { content: [{ type: "text", text: `committed ${args.ref}` }] };
    },
  );

  return { agent, server, rendered, appCalls };
}
