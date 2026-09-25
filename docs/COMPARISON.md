<!--
  GENERATED FILE — do not edit by hand.
  Produced by `npm run report` from the traces the adapters record while the
  scenarios run against the real SDKs. `npm run report:check` fails if this
  file and the code disagree.
-->

# json-render vs A2UI vs MCP Apps, for multi-agent orchestration

Three scenarios, three tested SDK/adapter/host configurations, one orchestrator.
Every outcome below was recorded by an adapter driving the installed SDKs — not
by reading a specification and forming an opinion about it. Protocol effects
cannot be separated from adapter or topology here; a matched-topology comparison
has not been performed.

- **json-render** — `@json-render/core + @json-render/react`
- **A2UI** — `@a2ui/web_core (v0.9 schema)`
- **MCP Apps** — `@modelcontextprotocol/ext-apps (SEP-1865) + @modelcontextprotocol/server`

Screenshots throughout are captured by `npm run screenshots` from the same
pages the browser suite asserts against.

## The matrix

| Capability | json-render | A2UI | MCP Apps |
| --- | --- | --- | --- |
| **Continue another agent's surface**<br><sub>Can agent B keep drawing into the view agent A started?</sub> | 🟡 caveat | ✅ supported | ❌ not expressible |
| **Attribute a write to an agent**<br><sub>Can the host tell which agent produced a given piece of UI?</sub> | ❌ not expressible | ❌ not expressible | 🔒 enforced |
| **Isolate agents from each other**<br><sub>Can one agent read or overwrite another's rendered surface?</sub> | ❌ not expressible | 🟡 caveat | 🔒 enforced |
| **Compose into one view**<br><sub>Can several agents present as a single answer?</sub> | 🟡 caveat | ✅ supported | ❌ not expressible |
| **Retain both summaries after a fixed-order collision**<br><sub>What happens when two agents write the same id?</sub> | 🔴 write lost | 🔴 write lost | 🔒 enforced by conformant host |
| **Route an action to its agent**<br><sub>Does the event say which agent should handle it?</sub> | 🟠 out-of-band | 🟠 out-of-band | ✅ supported |
| **Gate a privileged action**<br><sub>Can anything below the agent withhold a dangerous action?</sub> | 🟡 caveat | ❌ not expressible | 🔒 enforced |

Outcome vocabulary records adapter classifications, not protocol rankings:
**✅ supported** observed in the tested adapter · **🟡 caveat** observed with a
limitation · **🟠 out-of-band** used harness/orchestrator bookkeeping ·
**❌ not expressible** was not represented by this tested mapping · **🔒 enforced**
was checked on the tested path · **🔒 enforced by conformant host** records
separate instances in the tested topology · **🔴 write lost** content was
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
one model-only call; SDK-default `oncalltool` forwards it. This measured
specification-versus-SDK gap is not a security guarantee.

**In the tested json-render mapping**, a flat shared element map permits the
observed overwrite. Its `confirm` block is adapter-observed metadata, not an
independently tested authorization control.

**Payload identity in these fixtures is limited.** The inspected json-render and
A2UI payload shapes lack an agent field; in this MCP Apps topology the host gets
identity from connection binding, not payload content. This does not rule out an
application envelope or other topology.

## A finding about MCP Apps worth stating separately

The inspected specification describes a host visibility requirement. Locally,
the installed SDK-default `AppBridge.connect()` handler forwards the call; the
tested host installs a separate handler that rejects one model-only call:

```js
this.oncalltool = async (params, extra) =>
  this._client.request({ method: "tools/call", params }, { signal: extra.mcpReq.signal });
```

The SDK exports `isToolVisibilityModelOnly` for host authors to apply. The
harness runs scenario 3 with `enforceVisibility: true` and `false`; the
model-only call is rejected in the installed-handler path and forwarded in the
SDK-default path. This is a measured specification-versus-SDK gap in this host,
not a claim that MCP Apps itself enforces or refuses calls.

## Two things only the browser run shows

The protocol suite cannot see either of these, and both cost real work in a
host.

**A sandboxed view cannot load its own code without CORS.** SEP-1865 requires
views to run in an iframe sandboxed without `allow-same-origin`, which gives the
document an opaque origin. Its module scripts are then fetched with
`Origin: null`, and any server that does not send
`Access-Control-Allow-Origin` blocks them — the view never boots. The harness's
dev server sets the header for exactly this reason. This is why the spec has
hosts serve app content from a dedicated origin via `_meta.ui.domain`, and why
its sandbox-proxy architecture delivers HTML inline through
`ui/notifications/sandbox-resource-ready` rather than by URL.

**The view needs a readiness signal the URL-loading path does not give it.**
`ui/initialize` is a request; if the view posts it before the host has attached
its message listener, it is lost and the App waits forever. The spec covers this
with `ui/notifications/sandbox-proxy-ready` in the sandbox-proxy flow, but a
host that loads a view by `src` has to build the equivalent itself — the
harness's host and view exchange a small ready/ack pair before `connect()`.
Neither json-render nor A2UI has an equivalent problem, because their renderers
are in the host's own document.

## Scenario detail

### Surface handoff mid-render

`s1-surface-handoff`

#### json-render

![json-render rendering s1-surface-handoff](screenshots/s1-json-render.png)

Rendered regions the user ends up with: **1** (`trip`)

**handoff.continue-surface** — 🟡 caveat

> Agent "booking" can continue the surface "planner" started by applying JSON Patch ops to the same flat element map — no re-render, no new surface, and the user sees one continuous view. The caveat is that this works because json-render grants every writer the whole keyspace: there is no per-element owner, so "continue" and "overwrite someone else's work" are the same operation, and the spec carries nothing a host could use to tell them apart.

**handoff.provenance** — ❌ not expressible

> The Spec type is { root, elements, state }; UIElement is { type, props, children, on, visible, repeat, watch }. None of them has a field for the agent that produced the element. The harness's "writtenBy" is an ordinary prop in its own catalog, which any agent can set to any value, so a host cannot use it to attribute or authorize a write.

**handoff.isolation** — ❌ not expressible

> There is no isolation boundary to speak of. One Spec renders into one React tree in one document, and any writer can patch any path — including /state, which every element's bindings read from. A misbehaving agent can rewrite another agent's rows, retarget its buttons' action bindings, or hide its elements with a visible condition, and the renderer will do it faithfully because a patch is a patch. That is fine when the orchestrator wrote all the agents; it is not a foundation for running agents you did not.

**compose.shared-surface** — 🟡 caveat

> Agents ["planner"] and "booking" write into one Spec and compose into a single rendered tree with no coordination step. For blocks with distinct keys this is the best experience of the three: one view, one layout pass, no seams. The caveat is that the keyspace is global and unowned, so composing and clobbering are the same operation and the protocol offers nothing to tell them apart.

#### A2UI

![A2UI rendering s1-surface-handoff](screenshots/s1-a2ui.png)

Rendered regions the user ends up with: **1** (`trip`)

**handoff.continue-surface** — ✅ supported

> Agent "booking" continues surface "trip" by sending further updateComponents and updateDataModel messages against the same surfaceId. The surface is a first-class, addressable thing with its own component tree and data model, so a second agent can append to it, patch one value in it, or replace one node — without re-sending what "planner" drew and without the user seeing a new panel appear.

**handoff.provenance** — ❌ not expressible

> The four v0.9 message types are createSurface, updateComponents, updateDataModel and deleteSurface. Each carries a surfaceId; none carries a sender. A renderer receiving a stream cannot tell that "booking" wrote the later components and "planner" wrote the earlier ones, so it cannot show attribution or refuse a write on the basis of who sent it.

**handoff.isolation** — 🟡 caveat

> The surface is a real boundary in one direction: an agent addressing surface X cannot touch surface Y, because every message names its surfaceId and the renderer keeps a separate SurfaceModel, component map and data model per surface. That is more than json-render offers. But it is a routing boundary, not a security one — inside a surface every agent shares the component-id and pointer namespaces, and all surfaces render into the same document with the same catalog and the same privileges. It partitions cooperating agents; it does not contain a hostile one.

**handoff.data-model-isolation** — 🟡 caveat

> The data model is per-surface and addressed by JSON Pointer, so "booking" can update /<block>/<row> without touching the component tree. Two agents writing different pointer subtrees genuinely do not collide — a real advantage over a single flat element map. The caveat is that the pointer space, like the id space, has no owner: nothing stops "booking" from overwriting a pointer "planner" is still using.

**compose.shared-surface** — ✅ supported

> Agents ["planner"] and "booking" compose into surface "trip" by addressing it by id. In this adapter configuration, the surface is an explicit boundary and the data model is addressed by JSON Pointer, so the configured mappings keep agents on different surfaces and different subtrees separate. Component ids remain a shared, unowned namespace, which is where the collision in compose.identifier-collision comes from. This does not establish a protocol-level isolation or composition property.

#### MCP Apps

![MCP Apps rendering s1-surface-handoff](screenshots/s1-mcp-apps.png)

Rendered regions the user ends up with: **2** (`trip::planner`, `trip::booking`)

**handoff.continue-surface** — ❌ not expressible

> There is no message in SEP-1865 that means "agent booking, continue the view agent planner is rendering" in the inspected mapping. A view is instantiated by a tools/call and bound to the server that declared the tool and its ui:// resource; booking lives behind a different server, so calling booking's render tool produces a second App instance with its own iframe, origin and bridge. The host can place the two boxes next to each other, but this tested topology does not continue the first instance. A matched-topology comparison would be required before treating that as a protocol-level result.

**handoff.provenance** — 🔒 enforced

> In this topology, attribution is not taken from an agent claim — it is a property of the connection. Each view is reachable only through the AppBridge the host created for one server, so the host knows a view is planner's without reading payload content. This is a tested connection-binding observation, not a protocol-wide claim.

**handoff.isolation** — 🔒 enforced

> The tested host creates separate sandboxed iframes with a host-constructed CSP. This is a configuration observation only: no adversarial, forged-identity, CSP, or cross-server test was run, so it is not a validated isolation defense.

**compose.shared-surface** — ❌ not expressible

> In this tested mapping, agents ["planner"] and "booking" do not compose into one surface. Each has its own App instance, its own sandboxed iframe and its own origin, so what the user gets is N stacked panels rather than one view. Laying them out — ordering, sizing, deciding which is primary, reconciling their headings — is entirely the host's problem in this topology, and the inspected mapping uses only ui/notifications/size-changed. For an orchestrator whose whole job is to present several agents' work as one answer, this is the sharpest edge in MCP Apps.

**compose.identifier-collision** — 🔒 enforced by conformant host

> In this tested one-server-per-agent adapter/topology configuration, component ids live inside separate app instances, so "booking" reusing block id "reservation" does not overwrite anything ["planner"] rendered. This is configuration-scoped instance separation, not protocol-level collision enforcement; a matched-topology comparison is required for that stronger claim.

### Fixed-order sequential identifier collision

`s2-fixed-order-collision`

#### json-render

![json-render rendering s2-fixed-order-collision](screenshots/s2-json-render.png)

Rendered regions the user ends up with: **1** (`briefing`)

**compose.shared-surface** — 🟡 caveat

> Agents ["risk"] and "finance" write into one Spec and compose into a single rendered tree with no coordination step. For blocks with distinct keys this is the best experience of the three: one view, one layout pass, no seams. The caveat is that the keyspace is global and unowned, so composing and clobbering are the same operation and the protocol offers nothing to tell them apart.

**compose.identifier-collision** — 🔴 write lost

> Agent "finance" replaced block "summary" previously written by "risk". json-render patches address a flat, shared element map: /elements/block:summary is a single slot with no owner, so the earlier agent's content is gone and neither agent is told.

#### A2UI

![A2UI rendering s2-fixed-order-collision](screenshots/s2-a2ui.png)

Rendered regions the user ends up with: **1** (`briefing`)

**compose.shared-surface** — ✅ supported

> Agents ["risk"] and "finance" compose into surface "briefing" by addressing it by id. In this adapter configuration, the surface is an explicit boundary and the data model is addressed by JSON Pointer, so the configured mappings keep agents on different surfaces and different subtrees separate. Component ids remain a shared, unowned namespace, which is where the collision in compose.identifier-collision comes from. This does not establish a protocol-level isolation or composition property.

**compose.identifier-collision** — 🔴 write lost

> Agent "finance" reused component ids from block "summary", last written by "risk". updateComponents is keyed by component id within a surface, so re-sending an id replaces that node. The surface boundary stops agents on *different* surfaces from colliding, but inside one surface the id space is still shared and unowned.

#### MCP Apps

![MCP Apps rendering s2-fixed-order-collision](screenshots/s2-mcp-apps.png)

Rendered regions the user ends up with: **2** (`briefing::risk`, `briefing::finance`)

**compose.shared-surface** — ❌ not expressible

> In this tested mapping, agents ["risk"] and "finance" do not compose into one surface. Each has its own App instance, its own sandboxed iframe and its own origin, so what the user gets is N stacked panels rather than one view. Laying them out — ordering, sizing, deciding which is primary, reconciling their headings — is entirely the host's problem in this topology, and the inspected mapping uses only ui/notifications/size-changed. For an orchestrator whose whole job is to present several agents' work as one answer, this is the sharpest edge in MCP Apps.

**compose.identifier-collision** — 🔒 enforced by conformant host

> In this tested one-server-per-agent adapter/topology configuration, component ids live inside separate app instances, so "finance" reusing block id "finance-detail" does not overwrite anything ["risk"] rendered. This is configuration-scoped instance separation, not protocol-level collision enforcement; a matched-topology comparison is required for that stronger claim.

### Action round-trip and approval gate

`s3-action-roundtrip`

#### json-render

![json-render rendering s3-action-roundtrip](screenshots/s3-json-render.png)

Rendered regions the user ends up with: **1** (`checkout`)

**compose.shared-surface** — 🟡 caveat

> Agents ["cart"] and "payments" write into one Spec and compose into a single rendered tree with no coordination step. For blocks with distinct keys this is the best experience of the three: one view, one layout pass, no seams. The caveat is that the keyspace is global and unowned, so composing and clobbering are the same operation and the protocol offers nothing to tell them apart.

**action.routing-identity** — 🟠 out-of-band

> The dispatched event is {"name":"editBasket","payload":{}} against local handler "dispatch". json-render actions resolve to a handler in the *client's* catalog, so the event names a function, not an addressee. With several UI-capable agents behind one orchestrator, the orchestrator must keep its own control-id to agent table and keep it in sync with every patch, including patches written by agents it did not schedule.

**action.approval-gate** — 🟡 caveat

> The privileged control carries a confirm block ({"title":"Confirm action","message":"Allow commitBooking?","variant":"danger"}) inside the action binding, and json-render's renderer honours it: it shows the dialog and withholds the dispatch until the user agrees. Of the three protocols this is the only declarative consent primitive. The caveat is decisive for multi-agent use, though — the confirm block is written by the agent that drew the button. An agent that simply omits it gets an ungated action, and nothing in the spec marks the action as one that needed a gate. It is a good default for agents you wrote; it is not a control over agents you did not.

#### A2UI

![A2UI rendering s3-action-roundtrip](screenshots/s3-a2ui.png)

Rendered regions the user ends up with: **1** (`checkout`)

**compose.shared-surface** — ✅ supported

> Agents ["cart"] and "payments" compose into surface "checkout" by addressing it by id. In this adapter configuration, the surface is an explicit boundary and the data model is addressed by JSON Pointer, so the configured mappings keep agents on different surfaces and different subtrees separate. Component ids remain a shared, unowned namespace, which is where the collision in compose.identifier-collision comes from. This does not establish a protocol-level isolation or composition property.

**action.routing-identity** — 🟠 out-of-band

> The client-to-server action is {"name":"editBasket","surfaceId":"checkout","sourceComponentId":"edit","timestamp":"<timestamp>","context":{"controlId":"edit"}}. It is a genuinely useful envelope: surfaceId and sourceComponentId let an orchestrator narrow the event to one surface and one node, and timestamp lets it order events. What it does not carry is the agent. An orchestrator running several UI-capable agents on one surface still has to keep a component-id to agent table, or encode the agent into the free-form context and then trust whatever arrives there — which is a claim from the UI, not an authenticated identity.

**action.approval-gate** — ❌ not expressible

> A2UI v0.9 has no confirmation or consent primitive on an action. The Button's action is { event: { name, context } }; there is no field a host could read to know this action needs the user's explicit approval, and no protocol step between the click and the emitted event. Gating a privileged action means the agent drawing a Modal and hoping — which is precisely the "trust the agent" posture the declarative format is supposed to avoid.

#### MCP Apps

![MCP Apps rendering s3-action-roundtrip](screenshots/s3-mcp-apps.png)

Rendered regions the user ends up with: **2** (`checkout::cart`, `checkout::payments`)

**compose.shared-surface** — ❌ not expressible

> In this tested mapping, agents ["cart"] and "payments" do not compose into one surface. Each has its own App instance, its own sandboxed iframe and its own origin, so what the user gets is N stacked panels rather than one view. Laying them out — ordering, sizing, deciding which is primary, reconciling their headings — is entirely the host's problem in this topology, and the inspected mapping uses only ui/notifications/size-changed. For an orchestrator whose whole job is to present several agents' work as one answer, this is the sharpest edge in MCP Apps.

**compose.identifier-collision** — 🔒 enforced by conformant host

> In this tested one-server-per-agent adapter/topology configuration, component ids live inside separate app instances, so "payments" reusing block id "pay" does not overwrite anything ["cart"] rendered. This is configuration-scoped instance separation, not protocol-level collision enforcement; a matched-topology comparison is required for that stronger claim.

**action.routing-identity** — ✅ supported

> The view's tools/call arrived over the AppBridge the host created for agent "cart"'s server. The orchestrator therefore knows the originating agent from the channel the message came in on, with no control-id table to maintain and nothing in the payload to trust. This is a tested connection-binding observation, not a protocol-wide attribution claim.

**action.approval-gate** — 🔒 enforced

> The installed host handler refused the view's tools/call for "commit_booking": Host refused tools/call from app: "commit_booking" is model-visible only. The tool's _meta.ui.visibility is ["model"]. This one rejection is measured handler behavior, not a security guarantee; SDK-default oncalltool forwards the corresponding call.
