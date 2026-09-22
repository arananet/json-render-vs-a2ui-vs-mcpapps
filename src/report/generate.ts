/**
 * Generates docs/COMPARISON.md from recorded traces.
 *
 * Run with `--check` to fail when the committed document no longer matches what
 * the code produces. That check runs in the test suite, so the matrix cannot
 * drift away from the adapters that justify it.
 */

import { writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PROTOCOLS, SCENARIOS, runAll, type ScenarioRun } from "../scenarios/run.ts";
import type { Outcome, ProtocolId, TraceEntry } from "../orchestrator/types.ts";

const OUTPUT = resolve(import.meta.dirname, "../../docs/COMPARISON.md");

const PROTOCOL_LABELS: Record<ProtocolId, string> = {
  "json-render": "json-render",
  a2ui: "A2UI",
  "mcp-apps": "MCP Apps",
};

const OUTCOME_LABELS: Record<Outcome, string> = {
  SUPPORTED: "✅ supported",
  SUPPORTED_WITH_CAVEAT: "🟡 caveat",
  REQUIRES_OUT_OF_BAND: "🟠 out-of-band",
  NOT_EXPRESSIBLE: "❌ not expressible",
  ENFORCED: "🔒 enforced",
  ENFORCED_BY_CONFORMANT_HOST: "🔒 enforced by conformant host",
  LOST: "🔴 write lost",
};

/** Capabilities in the order the report presents them. */
const CAPABILITIES: Array<{ id: string; label: string; question: string }> = [
  {
    id: "handoff.continue-surface",
    label: "Continue another agent's surface",
    question: "Can agent B keep drawing into the view agent A started?",
  },
  {
    id: "handoff.provenance",
    label: "Attribute a write to an agent",
    question: "Can the host tell which agent produced a given piece of UI?",
  },
  {
    id: "handoff.isolation",
    label: "Isolate agents from each other",
    question: "Can one agent read or overwrite another's rendered surface?",
  },
  {
    id: "compose.shared-surface",
    label: "Compose into one view",
    question: "Can several agents present as a single answer?",
  },
  {
    id: "compose.identifier-collision",
    label: "Retain both summaries after a fixed-order collision",
    question: "What happens when two agents write the same id?",
  },
  {
    id: "action.routing-identity",
    label: "Route an action to its agent",
    question: "Does the event say which agent should handle it?",
  },
  {
    id: "action.approval-gate",
    label: "Gate a privileged action",
    question: "Can anything below the agent withhold a dangerous action?",
  },
];

interface Cell {
  outcome: Outcome;
  detail: string;
}

function collect(runs: ScenarioRun[]): Map<string, Map<ProtocolId, Cell>> {
  const grid = new Map<string, Map<ProtocolId, Cell>>();

  for (const capability of CAPABILITIES) {
    grid.set(capability.id, new Map());
  }

  for (const run of runs) {
    for (const trace of run.traces) {
      const row = grid.get(trace.capability);
      if (!row) continue;
      // First recording wins; scenarios probing the same capability agree, and
      // a disagreement should surface as a test failure rather than be hidden
      // by whichever scenario ran last.
      if (!row.has(trace.protocol)) {
        row.set(trace.protocol, { outcome: trace.outcome, detail: trace.detail });
      }
    }
  }

  return grid;
}

/**
 * Replace run-varying values so the generated document is byte-stable.
 *
 * Only A2UI's action timestamp varies today. It is real protocol data and the
 * trace keeps the true value; the document shows a placeholder so
 * `report:check` measures drift in *findings* rather than in clocks.
 */
function stabilise(detail: string): string {
  return detail.replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/g, "<timestamp>");
}

/** Screenshot captured for a (scenario, protocol) pair by `npm run screenshots`. */
function screenshotFor(scenario: string, protocol: ProtocolId): string {
  const stem = scenario.split("-")[0];
  return `screenshots/${stem}-${protocol}.png`;
}

function perScenario(runs: ScenarioRun[]): string {
  const sections: string[] = [];

  for (const scenario of SCENARIOS) {
    const scenarioRuns = runs.filter((r) => r.scenario === scenario.id);
    sections.push(`${sections.length ? "\n" : ""}### ${scenario.title}\n\n`);
    sections.push(`\`${scenario.id}\`\n`);

    for (const protocol of PROTOCOLS) {
      const run = scenarioRuns.find((r) => r.protocol === protocol);
      if (!run) continue;

      sections.push(`\n#### ${PROTOCOL_LABELS[protocol]}\n\n`);
      sections.push(
        `![${PROTOCOL_LABELS[protocol]} rendering ${scenario.id}]` +
          `(${screenshotFor(scenario.id, protocol)})\n\n`,
      );
      sections.push(
        `Rendered regions the user ends up with: **${Object.keys(run.snapshot.surfaces).length}**` +
          ` (\`${Object.keys(run.snapshot.surfaces).join("`, `")}\`)\n`,
      );

      const seen = new Set<string>();
      for (const trace of run.traces) {
        if (seen.has(trace.capability)) continue;
        seen.add(trace.capability);
        sections.push(
          `\n**${trace.capability}** — ${OUTCOME_LABELS[trace.outcome]}\n\n> ${stabilise(trace.detail)}\n`,
        );
      }
    }
  }

  return sections.join("").trimEnd() + "\n";
}

function matrix(grid: Map<string, Map<ProtocolId, Cell>>): string {
  const header = `| Capability | ${PROTOCOLS.map((p) => PROTOCOL_LABELS[p]).join(" | ")} |`;
  const divider = `| --- | ${PROTOCOLS.map(() => "---").join(" | ")} |`;
  const rows: string[] = [];

  for (const capability of CAPABILITIES) {
    const row = grid.get(capability.id)!;
    const cells = PROTOCOLS.map((p) => {
      const cell = row.get(p);
      return cell ? OUTCOME_LABELS[cell.outcome] : "—";
    });
    rows.push(`| **${capability.label}**<br><sub>${capability.question}</sub> | ${cells.join(" | ")} |`);
  }

  return [header, divider, ...rows].join("\n");
}

export async function buildReport(): Promise<string> {
  const runs = await runAll();
  const grid = collect(runs);

  const sdkLines = PROTOCOLS.map((p) => {
    const run = runs.find((r) => r.protocol === p)!;
    return `- **${PROTOCOL_LABELS[p]}** — \`${run.adapter.sdk}\``;
  }).join("\n");

  return `<!--
  GENERATED FILE — do not edit by hand.
  Produced by \`npm run report\` from the traces the adapters record while the
  scenarios run against the real SDKs. \`npm run report:check\` fails if this
  file and the code disagree.
-->

# json-render vs A2UI vs MCP Apps, for multi-agent orchestration

Three scenarios, three protocols, one orchestrator. Every outcome below was
recorded by an adapter driving the protocol's published SDK — not by reading a
specification and forming an opinion about it.

${sdkLines}

Screenshots throughout are captured by \`npm run screenshots\` from the same
pages the browser suite asserts against.

## The matrix

${matrix(grid)}

Outcome vocabulary: **✅ supported** the protocol expresses it directly ·
**🟡 caveat** expressed, but something the orchestrator needs was weakened ·
**🟠 out-of-band** only works because the orchestrator keeps state the protocol
does not carry · **❌ not expressible** no way to say it · **🔒 enforced** the
protocol actively prevents the failure · **🔒 enforced by conformant host** a
conformant host structurally prevents the failure · **🔴 write lost** content
was silently dropped.

## What the matrix means if you are building an orchestrator

**There is no protocol here that does all three jobs.** The capabilities split
cleanly along one axis: json-render and A2UI treat UI as *shared mutable state*
that any agent can address, and MCP Apps treats it as *per-agent isolated
instances* that no other agent can reach. Everything else follows.

**If your agents are yours, and the job is to present them as one answer**,
A2UI is the closest fit. The surface is an explicit boundary, a second agent can
continue a first agent's view without the user seeing a seam, and the
JSON-Pointer data model means agents touching different subtrees genuinely do
not interfere. You will still build a control-id-to-agent routing table, and you
will still have no approval gate.

**If your agents are third-party, or any of them can move money**, MCP Apps is
the only one of the three that gives you enforcement rather than convention. A
view is bound to one server, so a click is attributable by construction, and
tool visibility is a real authorization boundary. The price is steep and
structural: agents cannot share a surface at all, so composing several agents'
output into one coherent answer becomes your layout problem, not the protocol's.

**json-render is the strongest single-agent streaming format of the three** and
the weakest multi-agent one, for the same reason: the flat element map makes
every patch cheap and every element reachable by every writer. Its \`confirm\`
block is the only declarative consent primitive in the comparison — but the
agent drawing the button decides whether to include it, which makes it a good
default rather than a control.

**The gap none of the three closes: agent identity in the payload.** Neither
json-render's \`Spec\`/\`UIElement\` nor A2UI's four message types has a field
for the agent that produced a piece of UI. MCP Apps gets identity only as a side
effect of binding views to connections, which is also what stops it composing.
An orchestrator that wants both composition and attribution has to invent an
envelope today.

## A finding about MCP Apps worth stating separately

SEP-1865 says a host MUST reject a \`tools/call\` from an app for a tool that is
not app-visible. That rule is delegated to the host, and the reference
\`AppBridge\` does not implement it. \`AppBridge.connect()\` installs:

\`\`\`js
this.oncalltool = async (params, extra) =>
  this._client.request({ method: "tools/call", params }, { signal: extra.mcpReq.signal });
\`\`\`

No visibility check. The SDK exports \`isToolVisibilityModelOnly\` for host
authors to apply themselves, so a host that never overrides \`oncalltool\`
type-checks cleanly and ships the spec's central security guarantee switched
off. The harness runs scenario 3 both ways — \`enforceVisibility: true\` and
\`false\` — and the privileged tool call succeeds in the second, which is why the
same protocol appears as **🔒 enforced** and **🟠 out-of-band** depending on one
line in the host.

## Two things only the browser run shows

The protocol suite cannot see either of these, and both cost real work in a
host.

**A sandboxed view cannot load its own code without CORS.** SEP-1865 requires
views to run in an iframe sandboxed without \`allow-same-origin\`, which gives the
document an opaque origin. Its module scripts are then fetched with
\`Origin: null\`, and any server that does not send
\`Access-Control-Allow-Origin\` blocks them — the view never boots. The harness's
dev server sets the header for exactly this reason. This is why the spec has
hosts serve app content from a dedicated origin via \`_meta.ui.domain\`, and why
its sandbox-proxy architecture delivers HTML inline through
\`ui/notifications/sandbox-resource-ready\` rather than by URL.

**The view needs a readiness signal the URL-loading path does not give it.**
\`ui/initialize\` is a request; if the view posts it before the host has attached
its message listener, it is lost and the App waits forever. The spec covers this
with \`ui/notifications/sandbox-proxy-ready\` in the sandbox-proxy flow, but a
host that loads a view by \`src\` has to build the equivalent itself — the
harness's host and view exchange a small ready/ack pair before \`connect()\`.
Neither json-render nor A2UI has an equivalent problem, because their renderers
are in the host's own document.

## Scenario detail

${perScenario(runs)}`;
}

async function main(): Promise<void> {
  const report = await buildReport();
  const check = process.argv.includes("--check");

  if (check) {
    const existing = await readFile(OUTPUT, "utf-8").catch(() => null);
    if (existing !== report) {
      console.error(
        `docs/COMPARISON.md is out of date with the recorded traces. Run \`npm run report\`.`,
      );
      process.exit(1);
    }
    console.log("docs/COMPARISON.md is up to date.");
    return;
  }

  await writeFile(OUTPUT, report, "utf-8");
  console.log(`Wrote ${OUTPUT}`);
}

// Only run when invoked directly, so tests can import buildReport.
if (process.argv[1] && import.meta.filename === resolve(process.argv[1])) {
  await main();
}
