/**
 * MCP Apps at the protocol level, below the scenario layer.
 *
 * Two things are worth pinning independently of the comparison: that the
 * harness really completes SEP-1865's `ui/initialize` handshake (otherwise the
 * scenario results would be measuring a stub), and that the visibility
 * enforcement finding is about the shipped SDK rather than about this repo's
 * host.
 */

import { afterEach, describe, expect, it } from "vitest";
import { closeHostedApp, hostApp, type HostedApp } from "../../src/adapters/mcp-apps/host.ts";
import {
  APP_TOOL,
  PRIVILEGED_TOOL,
  RENDER_TOOL,
  createAgentServer,
  viewUri,
} from "../../src/adapters/mcp-apps/agent-server.ts";
import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";

const open: HostedApp[] = [];

async function open_(agent: string, enforceVisibility: boolean): Promise<HostedApp> {
  const server = createAgentServer(agent);
  const hosted = await hostApp(agent, server.server, viewUri(agent), { enforceVisibility });
  open.push(hosted);
  return hosted;
}

afterEach(async () => {
  while (open.length) await closeHostedApp(open.pop()!);
});

describe("ui/initialize handshake", () => {
  it("negotiates host info and context with the view", async () => {
    const hosted = await open_("planner", true);

    // Proof the App completed the handshake rather than being driven directly.
    expect(hosted.app.getHostVersion()).toEqual({ name: "harness-host", version: "0.1.0" });
    expect(hosted.app.getHostContext()).toMatchObject({ theme: "light", displayMode: "inline" });
    expect(hosted.bridge.getAppVersion()).toEqual({ name: "planner-view", version: "0.1.0" });
  });

  it("declares the UI resource with the MCP Apps MIME type and a ui:// URI", async () => {
    const hosted = await open_("planner", true);
    const { resources } = await hosted.client.listResources();

    const view = resources.find((r) => r.uri === "ui://planner/view.html");
    expect(view).toBeDefined();
    expect(view!.mimeType).toBe(RESOURCE_MIME_TYPE);
    expect(view!.uri.startsWith("ui://")).toBe(true);
  });

  it("carries tool-to-UI binding and visibility in _meta.ui", async () => {
    const hosted = await open_("planner", true);
    const { tools } = await hosted.client.listTools();

    const render = tools.find((t) => t.name === RENDER_TOOL)!;
    expect(render._meta).toMatchObject({ ui: { resourceUri: "ui://planner/view.html" } });

    const privileged = tools.find((t) => t.name === PRIVILEGED_TOOL)!;
    expect(privileged._meta).toMatchObject({ ui: { visibility: ["model"] } });
  });
});

describe("tool visibility enforcement", () => {
  it("an app-visible tool is callable from the view", async () => {
    const hosted = await open_("planner", true);

    const result = await hosted.app.callServerTool({
      name: APP_TOOL,
      arguments: { blockId: "itinerary", rowId: "depart", value: "10:15" },
    });

    expect(result.content).toEqual([{ type: "text", text: "revised depart" }]);
    expect(hosted.refusals).toHaveLength(0);
  });

  it("an enforcing host refuses a model-only tool called from the view", async () => {
    const hosted = await open_("planner", true);

    await expect(
      hosted.app.callServerTool({ name: PRIVILEGED_TOOL, arguments: { ref: "r1", amount: 499 } }),
    ).rejects.toThrow(/model-visible only/);

    expect(hosted.refusals).toEqual([
      { tool: PRIVILEGED_TOOL, reason: 'tool visibility is ["model"]; apps may not call it' },
    ]);
  });

  it("AppBridge's default oncalltool forwards the model-only call to the server", async () => {
    // Not a defect this repo introduced: AppBridge.connect() installs
    //   this.oncalltool = async (params, extra) =>
    //     this._client.request({ method: "tools/call", params }, ...)
    // with no visibility check, and the SDK exports isToolVisibilityModelOnly
    // for hosts to apply themselves. A host that never overrides oncalltool
    // type-checks cleanly and violates the spec's MUST at runtime.
    const hosted = await open_("planner", false);

    const result = await hosted.app.callServerTool({
      name: PRIVILEGED_TOOL,
      arguments: { ref: "r1", amount: 499 },
    });

    expect(result.content).toEqual([{ type: "text", text: "committed r1" }]);
    expect(hosted.refusals).toHaveLength(0);
  });
});
