# json-render-vs-a2ui-vs-mcpapps

![TypeScript](https://img.shields.io/badge/typescript-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/node-%3E%3D22-5FA04E?logo=node.js&logoColor=white)
![Vitest](https://img.shields.io/badge/vitest-6E9F18?logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/playwright-2EAD33?logo=playwright&logoColor=white)
![OpenSpec](https://img.shields.io/badge/OpenSpec-enforced-blueviolet)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.22896882.svg)](https://doi.org/10.5281/zenodo.22896882)

Cite: v0.2.0 evidence [10.5281/zenodo.22965404](https://doi.org/10.5281/zenodo.22965404); all versions [10.5281/zenodo.22896881](https://doi.org/10.5281/zenodo.22896881).

> Three real UI-testing scenarios comparing json-render, A2UI and MCP Apps for
> multi-agent orchestration.

---

## What this is

When an orchestrator owns several agents and tools that each want to draw UI,
which agent-UI protocol can actually express what it needs — and which one
silently loses information?

This repository answers that with a runnable harness rather than an opinion.
One protocol-agnostic orchestrator drives three scenarios against three
protocols, using each protocol's **real published SDK**:

| Protocol | SDK driven | What it is |
| --- | --- | --- |
| json-render | `@json-render/core`, `@json-render/react` | Vercel Labs' JSON→UI renderer; a flat element map patched with RFC 6902 |
| A2UI | `@a2ui/web_core`, `@a2ui/lit` | Google's agent-to-UI protocol; surfaces, component trees and a JSON-Pointer data model |
| MCP Apps | `@modelcontextprotocol/ext-apps`, `@modelcontextprotocol/server` | SEP-1865, Final 2026-01-26; `ui://` HTML resources in sandboxed iframes over JSON-RPC |

No protocol's message types, renderer or transport is stubbed. Anything a
protocol cannot express is **recorded as an outcome rather than worked around**
— the gaps are the deliverable.

**→ [docs/COMPARISON.md](docs/COMPARISON.md) is the result.** It is generated
from the traces the adapters record while the scenarios run, and a test fails if
it drifts from the code.

**Research manuscript:** [English paper by Eduardo Arana (Arananet)](paper/manuscript.md),
[illustrated PDF](paper/manuscript.pdf), [generated LaTeX](paper/manuscript.tex),
[figure sources and provenance](paper/figures/README.md), [reproduction guide](paper/REPRODUCTION.md),
and [local execution evidence](paper/EXECUTION.md). Frozen Markdown versions,
[preregistration records](prereg/README.md), [audit status](FINAL-AUDIT.md), and
[novelty bounds](NOVELTY.md) are versioned research records. Human review is pending.
The paper bounds the historical labels below: S2 uses sequential fixed-order
writes, and differences concern SDK/adapter/host configurations, not isolated
protocol causality. Generated comparison documentation is retained unchanged.

This repository is licensed under [Apache-2.0](LICENSE). A prior Zenodo deposit
has [DOI 10.5281/zenodo.22896882](https://doi.org/10.5281/zenodo.22896882), but
it predates the regenerated current-source evidence; archive the final record
only after this evidence chain is reviewed.

## The headline

| Capability | json-render | A2UI | MCP Apps |
| --- | --- | --- | --- |
| Continue another agent's surface | 🟡 caveat | ✅ | ❌ |
| Attribute a write to an agent | ❌ | ❌ | 🔒 |
| Isolate agents from each other | ❌ | 🟡 caveat | 🔒 |
| Compose into one view | 🟡 caveat | ✅ | ❌ |
| Retain both summaries after a fixed-order collision | 🔴 lost | 🔴 lost | 🔒 |
| Route an action to its agent | 🟠 out-of-band | 🟠 out-of-band | ✅ |
| Gate a privileged action | 🟡 caveat | ❌ | 🔒 |

The split is one design choice, not seven. json-render and A2UI treat UI as
shared mutable state any agent can address; MCP Apps treats it as per-agent
isolated instances no other agent can reach. Composition and enforcement sit on
opposite ends of that axis, and **no protocol here gives you both**.

Two findings worth pulling out:

- **None of the three carries agent identity in the payload.** MCP Apps gets
  attribution only as a side effect of binding views to connections — which is
  also precisely what stops it composing.
- **MCP Apps' central security rule is delegated to the host, and the reference
  bridge does not implement it.** SEP-1865 says a host MUST reject a
  `tools/call` from an app for a non-app-visible tool. `AppBridge.connect()`
  installs an `oncalltool` that forwards everything to the MCP client with no
  visibility check. A host that never overrides it type-checks cleanly and ships
  the guarantee switched off. The harness runs scenario 3 both ways and the
  privileged call succeeds in one of them.

## What each protocol actually renders

Captured by `npm run screenshots` from the same pages the browser suite asserts
against — same scenarios, same clicks, real renderers. Nothing below is a
mock-up.

### S1 · Surface handoff

A planner agent draws an itinerary; the orchestrator hands the surface to a
booking agent mid-render.

| json-render | A2UI | MCP Apps |
| --- | --- | --- |
| [![json-render, surface handoff](docs/screenshots/s1-json-render.png)](docs/screenshots/s1-json-render.png) | [![A2UI, surface handoff](docs/screenshots/s1-a2ui.png)](docs/screenshots/s1-a2ui.png) | [![MCP Apps, surface handoff](docs/screenshots/s1-mcp-apps.png)](docs/screenshots/s1-mcp-apps.png) |
| Both agents' blocks land in **one React tree**. The successor patched the same element map. | Both agents land in **one `<a2ui-surface>`**, addressed by `surfaceId`. | **Two sandboxed iframes**, each bound to its own server. The handoff became a second panel. |

### S2 · Fixed-order identifier collision

Two agents write sequentially: risk detail, finance detail, risk summary, then finance summary. Both use the identifier `summary`; only this order is tested.

These observations cannot generalize to alternative write orders, scheduling or concurrency.
The retained screenshots predate the behavior-preserving S2 rename. A separate
post-rename browser run records current-source and build hashes; it does not
turn this fixed-order probe into a concurrency evaluation.

| json-render | A2UI | MCP Apps |
| --- | --- | --- |
| [![json-render, fixed-order identifier collision](docs/screenshots/s2-json-render.png)](docs/screenshots/s2-json-render.png) | [![A2UI, fixed-order identifier collision](docs/screenshots/s2-a2ui.png)](docs/screenshots/s2-a2ui.png) | [![MCP Apps, fixed-order identifier collision](docs/screenshots/s2-mcp-apps.png)](docs/screenshots/s2-mcp-apps.png) |
| One `Summary`, written by `finance`. **`risk`'s headline is gone** and nobody was told. | Same loss — the surface is scoped, the component-id namespace is not. | **Both survive**, in separate origins. Nothing was lost; nothing composed either. |

### S3 · Action round-trip

The user clicks a control drawn by one agent, then a privileged "Pay now" drawn
by another.

| json-render | A2UI | MCP Apps |
| --- | --- | --- |
| [![json-render, action round-trip](docs/screenshots/s3-json-render.png)](docs/screenshots/s3-json-render.png) | [![A2UI, action round-trip](docs/screenshots/s3-a2ui.png)](docs/screenshots/s3-a2ui.png) | [![MCP Apps, action round-trip](docs/screenshots/s3-mcp-apps.png)](docs/screenshots/s3-mcp-apps.png) |
| The event names a **catalog handler**, not an addressee. | The envelope carries `surfaceId`, `sourceComponentId` and `timestamp` — **and no agent**. | The host **refuses** `commit_booking`: its visibility is `["model"]`, so a view may not call it however the agent drew the button. |

That last cell is the one to look at twice. Green is `revise_row`, declared
app-visible, allowed through. Red is the host rejecting a call the agent was
perfectly willing to make — the only enforcement in the comparison that does not
depend on the agent cooperating.

## The scenarios

| Scenario | What happens | What it measures |
| --- | --- | --- |
| `s1-surface-handoff` | A planner agent starts an itinerary; the orchestrator hands the surface to a booking agent mid-render | Can B continue A's view, and can anyone tell who wrote what? |
| `s2-fixed-order-collision` | Risk then finance write the same `summary` identifier in a fixed order | Does a write get silently dropped? |
| `s3-action-roundtrip` | A user clicks a control drawn by one agent, then a privileged "Pay now" drawn by another | Does the event say who to wake, and can anything withhold a dangerous action? |

Each runs through the same orchestrator and scenario script, but the SDK,
adapter, namespace/topology, renderer, and host vary by configuration. A
difference is therefore an observation about the tested configuration, not an
isolated protocol effect.

## Quick start

```bash
npm install

npm test           # protocol suite (vitest, no browser, no network)
npm run test:browser   # browser suite (builds the host pages, runs Playwright)
npm run report         # regenerate docs/COMPARISON.md from the traces
npm run screenshots    # recapture docs/screenshots/ from the live pages
npm run dev            # open the three host pages and poke at them
```

`npm run dev` serves:

- `/json-render.html?scenario=s1-surface-handoff` — a real React tree
- `/a2ui.html?scenario=s1-surface-handoff` — a real `<a2ui-surface>` Lit renderer
- `/mcp-apps.html?scenario=s1-surface-handoff` — real sandboxed iframes over the
  real `postMessage` JSON-RPC bridge

Swap `scenario=` for `s2-fixed-order-collision` or `s3-action-roundtrip`.

## How it is put together

```text
src/
  orchestrator/     protocol-agnostic types, the orchestrator, the tracer
  adapters/
    json-render/    catalog + adapter over @json-render/core
    a2ui/           catalog + adapter over @a2ui/web_core's MessageProcessor
    mcp-apps/       one McpServer per agent, AppBridge host, App view
  scenarios/        the three scripts, written against the port only
  report/           trace → docs/COMPARISON.md
web/                one host page per protocol, plus the MCP App view
tests/
  protocol/         vitest — the matrix, asserted cell by cell
  browser/          playwright — what the user actually sees
```

The orchestrator talks to adapters through a five-method port
(`createSurface` / `emit` / `handoff` / `dispatchUserAction` / `snapshot`),
which is what keeps the comparison fair. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Caveats

- The orchestrator and its agents are **deterministic scripts, not models**.
  The subject is protocol expressiveness; an LLM would only add variance.
- MCP Apps' server leg uses an in-memory transport standing in for stdio/HTTP.
  The **view** leg in the browser is a genuine sandboxed iframe over
  `postMessage` — that is the leg the comparison depends on.
- A2UI is exercised at its message layer (v0.9). A2A and AG-UI transports are
  out of scope; they do not change any outcome in the matrix.
- Versions move. The report records the SDK versions it ran against, and
  `npm test` fails if behaviour changes — that is the intended way to notice.

## Contributing

This project uses **OpenSpec** — every feature or bugfix starts with a spec file
under `.openspec/specs/`. See [`docs/OPENSPEC.md`](docs/OPENSPEC.md) for the
workflow and [`CONTRIBUTING.md`](CONTRIBUTING.md) for the checklist.

```bash
bash scripts/openspec check
bash scripts/openspec verify <slug>
```

## Documentation

| Topic | Where |
| --- | --- |
| **The comparison result** | [`docs/COMPARISON.md`](docs/COMPARISON.md) |
| How the harness works | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Spec-driven workflow | [`docs/OPENSPEC.md`](docs/OPENSPEC.md) |
| Small-project adoption | [`docs/ADOPTION.md`](docs/ADOPTION.md) |
| Branch protection setup | [`docs/BRANCH_PROTECTION.md`](docs/BRANCH_PROTECTION.md) |
| Security policy | [`SECURITY.md`](SECURITY.md) |
| Release history | [`CHANGELOG.md`](CHANGELOG.md) |

## License

[Apache-2.0](LICENSE)

## Developer

Eduardo Arana

## Support this with a ko-fi

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/H2H51MPWG)
