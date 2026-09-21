/**
 * MCP Apps host page.
 *
 * This is the page that makes the structural claim visible. It runs the same
 * scenarios as the other two hosts, but because a view is bound to a tool call
 * on one server, the host has to create a *separate sandboxed iframe per agent*
 * and lay them out itself. What the user sees is stacked panels, and the seam
 * between them is a protocol property, not a styling choice.
 *
 * Every leg is real: `McpServer` behind an in-memory transport (standing in for
 * stdio/HTTP), `AppBridge` on the host side, and `PostMessageTransport` to an
 * iframe sandboxed without `allow-same-origin`, so the view genuinely runs in an
 * opaque origin.
 */

import { PostMessageTransport } from "@modelcontextprotocol/ext-apps";
import { connectAgentClient, createBridge } from "../src/adapters/mcp-apps/host.ts";
import {
  RENDER_TOOL,
  createAgentServer,
  viewUri,
} from "../src/adapters/mcp-apps/agent-server.ts";
import type { UiBlock } from "../src/orchestrator/types.ts";
import { markReady, scenarioFromUrl } from "./scenario.ts";

/** The blocks each scenario asks each agent to draw, in order. */
const SCRIPTS: Record<string, Array<{ agent: string; block: UiBlock }>> = {
  "s1-surface-handoff": [
    {
      agent: "planner",
      block: {
        id: "itinerary",
        title: "Lisbon, 3 nights",
        rows: [
          { id: "depart", label: "Depart", value: "Thu 09:40" },
          { id: "return", label: "Return", value: "Sun 18:15" },
        ],
      },
    },
    {
      agent: "booking",
      block: {
        id: "reservation",
        title: "Held for 20 minutes",
        rows: [
          { id: "flight", label: "Flight", value: "TP1234" },
          { id: "hotel", label: "Hotel", value: "Baixa House" },
        ],
        controls: [
          { id: "confirm", label: "Confirm booking", action: "confirmBooking", owner: "booking" },
        ],
      },
    },
  ],
  "s2-concurrent-composition": [
    {
      agent: "risk",
      block: {
        id: "summary",
        title: "Summary",
        rows: [{ id: "headline", label: "Headline", value: "Exposure exceeds appetite" }],
      },
    },
    {
      agent: "finance",
      block: {
        id: "summary",
        title: "Summary",
        rows: [{ id: "headline", label: "Headline", value: "Spend is within budget" }],
      },
    },
  ],
  "s3-action-roundtrip": [
    {
      agent: "cart",
      block: {
        id: "basket",
        title: "Your basket",
        rows: [{ id: "total", label: "Total", value: "£499.00" }],
        controls: [{ id: "edit", label: "Edit quantities", action: "editBasket", owner: "cart" }],
      },
    },
    {
      agent: "payments",
      block: {
        id: "pay",
        title: "Payment",
        rows: [{ id: "card", label: "Card", value: "•••• 4242" }],
        controls: [
          {
            id: "commit",
            label: "Pay now",
            action: "commitBooking",
            owner: "payments",
            privileged: true,
          },
        ],
      },
    },
  ],
};

const scenario = scenarioFromUrl();
const script = SCRIPTS[scenario]!;
const root = document.getElementById("root")!;
const logEl = document.getElementById("log")!;
logEl.dataset["logLabel"] = "tool calls the host made to each agent's server";
const log: string[] = [];

/** Stand up one agent: server, client, bridge, sandboxed iframe. */
async function mountAgent(agent: string): Promise<{
  send: (block: UiBlock) => Promise<void>;
  refusals: Array<{ tool: string; reason: string }>;
}> {
  const agentServer = createAgentServer(agent);
  const client = await connectAgentClient(agentServer.server);
  const { bridge, refusals, enforce } = createBridge(client, { enforceVisibility: true });

  const pane = document.createElement("div");
  pane.className = "pane";
  pane.dataset["agent"] = agent;

  const heading = document.createElement("h3");
  heading.textContent = `${viewUri(agent)} — sandboxed iframe, opaque origin`;
  pane.appendChild(heading);

  const iframe = document.createElement("iframe");
  iframe.dataset["agentFrame"] = agent;
  iframe.height = "120";
  // No allow-same-origin: the view cannot reach this document, the other
  // agents' views, or anything but its own bridge.
  iframe.setAttribute("sandbox", "allow-scripts");
  iframe.src = `./mcp-view.html?agent=${encodeURIComponent(agent)}`;
  pane.appendChild(iframe);
  root.appendChild(pane);

  await new Promise<void>((resolve) => iframe.addEventListener("load", () => resolve()));

  const view = iframe.contentWindow!;

  // Size the frame from the view's own notifications. Worth noticing how much
  // machinery this takes compared with the other two protocols, where the
  // renderer is in the host's document and simply lays out.
  bridge.addEventListener("sizechange", ({ height }) => {
    if (typeof height === "number" && height > 0) {
      iframe.style.height = `${Math.ceil(height)}px`;
    }
  });

  await bridge.connect(new PostMessageTransport(view, view));
  enforce();

  // Tell the view the bridge is listening, and keep answering its
  // announcements until it acknowledges by completing ui/initialize.
  await new Promise<void>((resolve) => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== view) return;
      if ((event.data as { harness?: string } | null)?.harness === "view-ready") {
        view.postMessage({ harness: "host-ready" }, "*");
      }
    };
    window.addEventListener("message", onMessage);
    view.postMessage({ harness: "host-ready" }, "*");

    const started = () => {
      if (bridge.getAppVersion()) {
        window.removeEventListener("message", onMessage);
        resolve();
        return;
      }
      requestAnimationFrame(started);
    };
    started();
  });

  return {
    refusals,
    send: async (block) => {
      await bridge.sendToolInput({ arguments: { block } });
      const result = await client.callTool({ name: RENDER_TOOL, arguments: { block } });
      await bridge.sendToolResult({
        content: result.content,
        structuredContent: result.structuredContent as Record<string, unknown>,
      });
      log.push(`tools/call ${RENDER_TOOL} → ${agent} · ${block.id}`);
      logEl.textContent = log.join("\n");
    },
  };
}

const mounted = new Map<string, Awaited<ReturnType<typeof mountAgent>>>();

for (const step of script) {
  let agent = mounted.get(step.agent);
  if (!agent) {
    agent = await mountAgent(step.agent);
    mounted.set(step.agent, agent);
  }
  await agent.send(step.block);
}

// The host cannot wait on the views' DOM: sandboxed frames are cross-origin,
// which is exactly the isolation under test. It waits a frame and the
// Playwright spec asserts inside each frame instead.
await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

markReady(root, { scenario, surfaces: mounted.size, frames: mounted.size });
