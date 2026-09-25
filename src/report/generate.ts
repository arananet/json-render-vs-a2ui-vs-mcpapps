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

function outcomeLabel(capability: string, protocol: ProtocolId, outcome: Outcome): string {
  if (capability === "compose.identifier-collision" && protocol === "mcp-apps") {
    return "🧩 separate instances in tested topology";
  }

  return OUTCOME_LABELS[outcome];
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
      const recorded = row.get(trace.protocol);
      if (!recorded) {
        row.set(trace.protocol, { outcome: trace.outcome, detail: trace.detail });
      } else if (recorded.outcome !== trace.outcome) {
        throw new Error(
          `Conflicting trace classifications for ${trace.capability}/${trace.protocol}; ` +
            `report generation cannot select one by scenario order.`,
        );
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
          `\n**${trace.capability}** — ${outcomeLabel(trace.capability, protocol, trace.outcome)}\n\n> ${stabilise(trace.detail)}\n`,
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
      return cell ? outcomeLabel(capability.id, p, cell.outcome) : "—";
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

Three scenarios, three tested SDK/adapter/host configurations, one orchestrator.
Every outcome below was recorded by an adapter driving the installed SDKs — not
by reading a specification and forming an opinion about it. Protocol effects
cannot be separated from adapter or topology here; a matched-topology comparison
has not been performed.

${sdkLines}

Screenshots throughout are captured by \`npm run screenshots\` from the same
pages the browser suite asserts against.

## The matrix

${matrix(grid)}

Outcome vocabulary records adapter classifications, not protocol rankings:
**✅ supported** observed in the tested adapter · **🟡 caveat** observed with a
limitation · **🟠 out-of-band** used harness/orchestrator bookkeeping ·
**❌ not expressible** was not represented by this tested mapping · **🔒 enforced**
was checked on the tested path · **🧩 separate instances in tested topology**
records per-instance separation in this adapter/topology · **🔴 write lost** content was
overwritten in the tested shared mapping.

## What the matrix means if you are building an orchestrator

**These configurations divide responsibilities differently.** In the tested
shared mappings, json-render and A2UI retain shared mutable state; in the tested
one-server-per-agent MCP Apps topology, separate app instances retain values.
These are configuration observations, not protocol-wide properties.

**In the tested A2UI adapter**, surface IDs and JSON-Pointer mappings support the
observed shared-surface fixture, while action routing uses a control-id-to-agent
table. This fixture does not test an approval gate or hostile writers.

**In the tested MCP Apps adapter/topology**, connection binding supplies the
originating-agent identity rather than the payload, and separate instances leave
multi-agent layout to the host. The installed host visibility handler rejects
one model-only call; SDK-default \`oncalltool\` forwards it. This measured
specification-versus-SDK gap is not a security guarantee.

**In the tested json-render mapping**, a flat shared element map permits the
observed overwrite. Its \`confirm\` block is adapter-observed metadata, not an
independently tested authorization control.

**Payload identity in these fixtures is limited.** The inspected json-render and
A2UI payload shapes lack an agent field; in this MCP Apps topology the host gets
identity from connection binding, not payload content. This does not rule out an
application envelope or other topology.

## A finding about MCP Apps worth stating separately

The inspected specification describes a host visibility requirement. Locally,
the installed SDK-default \`AppBridge.connect()\` handler forwards the call; the
tested host installs a separate handler that rejects one model-only call:

\`\`\`js
this.oncalltool = async (params, extra) =>
  this._client.request({ method: "tools/call", params }, { signal: extra.mcpReq.signal });
\`\`\`

The SDK exports \`isToolVisibilityModelOnly\` for host authors to apply. The
harness runs scenario 3 with \`enforceVisibility: true\` and \`false\`; the
model-only call is rejected in the installed-handler path and forwarded in the
SDK-default path. This is a measured specification-versus-SDK gap in this host,
not a claim that MCP Apps itself enforces or refuses calls.

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
