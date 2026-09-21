/**
 * The MCP App itself — the thing that runs inside the sandboxed iframe.
 *
 * This is a real MCP App: it boots `App` from `@modelcontextprotocol/ext-apps`,
 * completes the `ui/initialize` handshake with the host over
 * `PostMessageTransport`, waits for `ui/notifications/tool-result`, renders what
 * it was given, and issues `tools/call` back through the host when the user
 * activates a control.
 *
 * Nothing here can see the host page's DOM or any other agent's view: the
 * iframe is sandboxed without `allow-same-origin`, so this document runs in an
 * opaque origin and `postMessage` is the only channel it has.
 */

import { App, PostMessageTransport } from "@modelcontextprotocol/ext-apps";
import type { UiBlock } from "../src/orchestrator/types.ts";

const agent = new URLSearchParams(location.search).get("agent") ?? "unknown";
const root = document.getElementById("root")!;

const app = new App(
  { name: `${agent}-view`, version: "0.1.0" },
  { availableDisplayModes: ["inline"] },
  // The SDK watches the document with a ResizeObserver and emits
  // ui/notifications/size-changed. The host has no other way to size this
  // frame — it cannot read a cross-origin document — so this notification is
  // the only channel through which an MCP App's height is knowable.
  { autoResize: true },
);

const blocks: UiBlock[] = [];

/**
 * Show what the host did with the view's tool call.
 *
 * The visibility decision is the most important thing this page can show a
 * reader, and a data attribute is invisible in a screenshot.
 */
function showOutcome(section: HTMLElement, allowed: boolean, text: string): void {
  section.querySelector(".outcome")?.remove();
  const line = document.createElement("p");
  line.className = `outcome ${allowed ? "ok" : "refused"}`;
  line.dataset["outcome"] = allowed ? "allowed" : "refused";
  line.textContent = text;
  section.appendChild(line);
}

function render(): void {
  root.textContent = "";

  for (const block of blocks) {
    const section = document.createElement("section");
    section.className = "block";
    section.dataset["block"] = block.id;
    section.dataset["writtenBy"] = agent;

    const heading = document.createElement("h2");
    heading.textContent = block.title;
    const tag = document.createElement("span");
    tag.className = "agent-tag";
    tag.dataset["agent"] = agent;
    tag.textContent = agent;
    heading.appendChild(tag);
    section.appendChild(heading);

    for (const row of block.rows) {
      const line = document.createElement("div");
      line.className = "row";
      line.dataset["row"] = row.id;

      const label = document.createElement("span");
      label.className = "label";
      label.textContent = row.label;

      const value = document.createElement("span");
      value.className = "value";
      value.dataset["value"] = row.id;
      value.textContent = row.value;

      line.append(label, value);
      section.appendChild(line);
    }

    for (const control of block.controls ?? []) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset["control"] = control.id;
      button.textContent = control.label;

      button.addEventListener("click", async () => {
        // A privileged control asks for the model-only tool on purpose. The
        // host is supposed to refuse it; the view has no way to force it
        // through, which is the whole point of the visibility boundary.
        const privileged = control.privileged === true;
        const name = privileged ? "commit_booking" : "revise_row";
        const args = privileged
          ? { ref: control.id, amount: 499 }
          : { blockId: block.id, rowId: block.rows[0]?.id ?? "row", value: "revised" };

        try {
          const result = await app.callServerTool({ name, arguments: args });
          root.dataset["lastCall"] = JSON.stringify({ name, ok: true, result: result.content });
          showOutcome(section, true, `tools/call ${name} → allowed`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          root.dataset["lastCall"] = JSON.stringify({ name, ok: false, error: message });
          showOutcome(section, false, `tools/call ${name} → refused by host`);
        }
        root.dataset["callState"] = "settled";
      });

      section.appendChild(button);
    }

    root.appendChild(section);
  }
}

app.addEventListener("toolresult", (params) => {
  const structured = params.structuredContent as { block?: UiBlock } | undefined;
  if (structured?.block) {
    blocks.push(structured.block);
    render();
  }
  root.dataset["blocks"] = String(blocks.length);
});

/**
 * Wait for the host to have its bridge attached before starting the handshake.
 *
 * `ui/initialize` is a request, and a request posted before the host has added
 * its message listener is simply lost — the App would then wait forever. The
 * spec solves the same problem on the host side with
 * `ui/notifications/sandbox-proxy-ready`; this is the minimal equivalent for a
 * host that loads the view by URL.
 */
await new Promise<void>((resolve) => {
  const onMessage = (event: MessageEvent) => {
    if ((event.data as { harness?: string } | null)?.harness === "host-ready") {
      window.removeEventListener("message", onMessage);
      clearInterval(announce);
      resolve();
    }
  };
  window.addEventListener("message", onMessage);
  // Announce repeatedly in case the host attached before this frame ran.
  const announce = setInterval(() => window.parent.postMessage({ harness: "view-ready" }, "*"), 25);
  window.parent.postMessage({ harness: "view-ready" }, "*");
});

await app.connect(new PostMessageTransport(window.parent, window.parent));

root.dataset["state"] = "ready";
root.dataset["host"] = app.getHostVersion()?.name ?? "";
root.dataset["theme"] = app.getHostContext()?.theme ?? "";
root.textContent = "waiting for tool result…";
