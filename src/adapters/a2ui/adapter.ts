/**
 * A2UI adapter.
 *
 * A2UI's model: the agent sends a stream of messages — `createSurface`,
 * `updateComponents`, `updateDataModel`, `deleteSurface` — and the client's
 * renderer maintains a `SurfaceModel` per surface, with a component tree and a
 * separate JSON-Pointer-addressed data model. User interactions come back as
 * `{ name, surfaceId, sourceComponentId, timestamp, context }`.
 *
 * The real `MessageProcessor` from `@a2ui/web_core` is driven here, so the
 * component tree, the data model and the action events in the traces are
 * A2UI's own, not a reimplementation.
 *
 * Structurally A2UI sits between the other two: it has a first-class surface
 * boundary (which json-render lacks) without giving each writer its own
 * sandbox (which MCP Apps imposes). That middle position is what makes it the
 * most workable of the three for an orchestrator — and also the one whose gaps
 * are easiest to miss.
 */

import {
  A2uiMessageSchema,
  MessageProcessor,
  type A2uiClientAction,
  type A2uiMessage,
} from "@a2ui/web_core/v0_9";
import { createHarnessCatalog } from "./catalog.ts";
import type { Catalog, ComponentApi, FunctionApi } from "@a2ui/web_core/v0_9";
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

const cardId = (blockId: string) => `card:${blockId}`;
const columnId = (blockId: string) => `col:${blockId}`;
const titleId = (blockId: string) => `title:${blockId}`;
const rowId = (blockId: string, id: string) => `row:${blockId}:${id}`;
const rowLabelId = (blockId: string, id: string) => `rowlabel:${blockId}:${id}`;
const rowValueId = (blockId: string, id: string) => `rowval:${blockId}:${id}`;
const buttonId = (blockId: string, id: string) => `btn:${blockId}:${id}`;
const buttonLabelId = (blockId: string, id: string) => `btnlabel:${blockId}:${id}`;

export class A2uiAdapter implements ProtocolAdapter {
  readonly id = "a2ui" as const;
  readonly sdk = "@a2ui/web_core (v0.9 schema)";

  private readonly processor: MessageProcessor<never>;
  private readonly actions: A2uiClientAction[] = [];

  /** Adapter-side record of who wrote what — A2UI messages carry no author. */
  private readonly lastWriter = new Map<string, AgentId>();
  private readonly blockTitles = new Map<string, string>();

  /** Every message sent to the renderer, for evidence in the report. */
  readonly messageLog: Array<{ agent: AgentId; message: A2uiMessage }> = [];

  /** Catalog id the agents address. Taken from the catalog actually in use. */
  readonly catalogId: string;

  /**
   * Children of each surface's `root` component.
   *
   * A2UI surfaces render from a component literally named `root`, so every
   * agent that adds a block has to append to a node it does not own. Worth
   * noticing: this is the shared-namespace problem in miniature — two agents
   * appending to that list are both rewriting the same component.
   */
  private readonly rootChildren = new Map<SurfaceId, string[]>();

  /**
   * @param catalog Defaults to the schema-only harness catalog, which runs under
   *   Node. The browser host passes `basicCatalog` from `@a2ui/lit` instead, so
   *   the very same adapter drives the real Lit renderer.
   */
  constructor(
    private readonly tracer: Tracer,
    catalog: Catalog<ComponentApi, FunctionApi> = createHarnessCatalog(),
  ) {
    this.catalogId = catalog.id;
    this.processor = new MessageProcessor(
      [catalog] as never[],
      (action) => {
        this.actions.push(action);
      },
    ) as MessageProcessor<never>;
  }

  /** The live surface models, so a renderer can bind to them directly. */
  get model() {
    return this.processor.model;
  }

  /** Send through A2UI's own schema before the renderer sees it. */
  private send(agent: AgentId, message: A2uiMessage): void {
    const parsed = A2uiMessageSchema.safeParse(message);
    if (!parsed.success) {
      throw new Error(`A2UI message rejected by A2uiMessageSchema: ${parsed.error.message}`);
    }
    this.messageLog.push({ agent, message });
    this.processor.processMessages([message]);
  }

  async createSurface(surfaceId: SurfaceId, agent: AgentId): Promise<void> {
    this.send(agent, {
      version: "v0.9",
      createSurface: { surfaceId, catalogId: this.catalogId, sendDataModel: true },
    });
    this.rootChildren.set(surfaceId, []);
    this.sendRoot(surfaceId, agent);
  }

  /** (Re)declare the surface's root Column with its current children. */
  private sendRoot(surfaceId: SurfaceId, agent: AgentId): void {
    this.send(agent, {
      version: "v0.9",
      updateComponents: {
        surfaceId,
        components: [
          { component: "Column", id: "root", children: this.rootChildren.get(surfaceId) ?? [] },
        ] as never,
      },
    });
  }

  async emit(surfaceId: SurfaceId, agent: AgentId, block: UiBlock): Promise<void> {
    const children: string[] = [titleId(block.id)];

    const components: Array<Record<string, unknown>> = [
      { component: "Text", id: titleId(block.id), text: block.title, variant: "h3" },
    ];

    for (const row of block.rows) {
      const rid = rowId(block.id, row.id);
      children.push(rid);
      components.push(
        {
          component: "Row",
          id: rid,
          children: [rowLabelId(block.id, row.id), rowValueId(block.id, row.id)],
        },
        { component: "Text", id: rowLabelId(block.id, row.id), text: row.label },
        // Values go through the data model rather than inline, which is how
        // A2UI is meant to be used: the component tree is the shape and the
        // data model is the content, so an agent can refresh a value without
        // resending the tree.
        {
          component: "Text",
          id: rowValueId(block.id, row.id),
          text: { path: `/${block.id}/${row.id}` },
        },
      );
    }

    for (const control of block.controls ?? []) {
      const bid = buttonId(block.id, control.id);
      children.push(bid);
      components.push(
        {
          component: "Button",
          id: bid,
          child: buttonLabelId(block.id, control.id),
          variant: "primary",
          action: {
            event: {
              name: control.action,
              // `context` is free-form, so an orchestrator *can* smuggle the
              // owning agent in here. Scenario 3 records what that costs.
              context: { controlId: control.id, ...(control.params ?? {}) },
            },
          },
        },
        { component: "Text", id: buttonLabelId(block.id, control.id), text: control.label },
      );
    }

    const existing = this.lastWriter.get(`${surfaceId}/${block.id}`);

    components.push(
      { component: "Column", id: columnId(block.id), children },
      { component: "Card", id: cardId(block.id), child: columnId(block.id) },
    );

    this.send(agent, {
      version: "v0.9",
      updateComponents: { surfaceId, components: components as never },
    });

    for (const row of block.rows) {
      this.send(agent, {
        version: "v0.9",
        updateDataModel: { surfaceId, path: `/${block.id}/${row.id}`, value: row.value },
      });
    }

    const rootKids = this.rootChildren.get(surfaceId) ?? [];
    if (!rootKids.includes(cardId(block.id))) {
      rootKids.push(cardId(block.id));
      this.rootChildren.set(surfaceId, rootKids);
      this.sendRoot(surfaceId, agent);
    }

    this.noteSharedSurface(surfaceId, agent);

    if (existing !== undefined && existing !== agent) {
      this.tracer.record(
        "compose.identifier-collision",
        "LOST",
        `Agent "${agent}" reused component ids from block "${block.id}", last written by "${existing}". ` +
          `updateComponents is keyed by component id within a surface, so re-sending an id replaces ` +
          `that node. The surface boundary stops agents on *different* surfaces from colliding, but ` +
          `inside one surface the id space is still shared and unowned.`,
        { surfaceId, blockId: block.id, previousWriter: existing, newWriter: agent },
      );
    }

    this.lastWriter.set(`${surfaceId}/${block.id}`, agent);
    this.blockTitles.set(`${surfaceId}/${block.id}`, block.title);
  }

  async handoff(surfaceId: SurfaceId, from: AgentId, to: AgentId): Promise<void> {
    const surface = this.processor.model.getSurface(surfaceId);

    this.tracer.record(
      "handoff.continue-surface",
      "SUPPORTED",
      `Agent "${to}" continues surface "${surfaceId}" by sending further updateComponents and ` +
        `updateDataModel messages against the same surfaceId. The surface is a first-class, ` +
        `addressable thing with its own component tree and data model, so a second agent can append ` +
        `to it, patch one value in it, or replace one node — without re-sending what "${from}" drew ` +
        `and without the user seeing a new panel appear.`,
      { surfaceId, exists: surface !== undefined, catalogId: this.catalogId },
    );

    this.tracer.record(
      "handoff.provenance",
      "NOT_EXPRESSIBLE",
      `The four v0.9 message types are createSurface, updateComponents, updateDataModel and ` +
        `deleteSurface. Each carries a surfaceId; none carries a sender. A renderer receiving a ` +
        `stream cannot tell that "${to}" wrote the later components and "${from}" wrote the earlier ` +
        `ones, so it cannot show attribution or refuse a write on the basis of who sent it.`,
      { messageTypes: ["createSurface", "updateComponents", "updateDataModel", "deleteSurface"] },
    );

    this.tracer.record(
      "handoff.isolation",
      "SUPPORTED_WITH_CAVEAT",
      `The surface is a real boundary in one direction: an agent addressing surface X cannot touch ` +
        `surface Y, because every message names its surfaceId and the renderer keeps a separate ` +
        `SurfaceModel, component map and data model per surface. That is more than json-render ` +
        `offers. But it is a routing boundary, not a security one — inside a surface every agent ` +
        `shares the component-id and pointer namespaces, and all surfaces render into the same ` +
        `document with the same catalog and the same privileges. It partitions cooperating agents; ` +
        `it does not contain a hostile one.`,
      { surfaceId, isolationUnit: "surfaceId", sharedWithinSurface: ["component ids", "data model pointers"] },
    );

    this.tracer.record(
      "handoff.data-model-isolation",
      "SUPPORTED_WITH_CAVEAT",
      `The data model is per-surface and addressed by JSON Pointer, so "${to}" can update ` +
        `/${"<block>"}/<row> without touching the component tree. Two agents writing different ` +
        `pointer subtrees genuinely do not collide — a real advantage over a single flat element map. ` +
        `The caveat is that the pointer space, like the id space, has no owner: nothing stops "${to}" ` +
        `from overwriting a pointer "${from}" is still using.`,
      { surfaceId },
    );
  }

  async dispatchUserAction(action: UserAction): Promise<ActionReceipt> {
    const surface = this.processor.model.getSurface(action.surfaceId);
    if (!surface) return { routedTo: null, routedBy: "none", raw: { missingSurface: action.surfaceId } };

    const before = this.actions.length;
    await surface.dispatchAction(
      { event: { name: action.name, context: { controlId: action.componentId, ...(action.params ?? {}) } } },
      buttonIdForComponent(action.componentId),
    );
    const emitted = this.actions[before];

    if (!emitted) return { routedTo: null, routedBy: "none" };

    this.tracer.record(
      "action.routing-identity",
      "REQUIRES_OUT_OF_BAND",
      `The client-to-server action is ${JSON.stringify(emitted)}. It is a genuinely useful envelope: ` +
        `surfaceId and sourceComponentId let an orchestrator narrow the event to one surface and one ` +
        `node, and timestamp lets it order events. What it does not carry is the agent. An ` +
        `orchestrator running several UI-capable agents on one surface still has to keep a ` +
        `component-id to agent table, or encode the agent into the free-form context and then trust ` +
        `whatever arrives there — which is a claim from the UI, not an authenticated identity.`,
      emitted,
    );

    this.tracer.record(
      "action.approval-gate",
      "NOT_EXPRESSIBLE",
      `A2UI v0.9 has no confirmation or consent primitive on an action. The Button's action is ` +
        `{ event: { name, context } }; there is no field a host could read to know this action needs ` +
        `the user's explicit approval, and no protocol step between the click and the emitted event. ` +
        `Gating a privileged action means the agent drawing a Modal and hoping — which is precisely ` +
        `the "trust the agent" posture the declarative format is supposed to avoid.`,
      { buttonActionShape: { event: { name: "string", context: "Record<string, any>" } } },
    );

    return { routedTo: null, routedBy: "none", raw: emitted };
  }

  async snapshot(): Promise<RenderedSnapshot> {
    const surfaces: RenderedSnapshot["surfaces"] = {};

    for (const [surfaceId, surface] of this.processor.model.surfacesMap) {
      const blocks: RenderedSnapshot["surfaces"][string]["blocks"] = {};
      const componentIds = [...surface.componentsModel.entries].map(([id]) => id);

      for (const id of componentIds) {
        if (!id.startsWith("card:")) continue;
        const blockId = id.slice("card:".length);
        const rows: Record<string, string> = {};

        for (const componentId of componentIds) {
          const prefix = `rowval:${blockId}:`;
          if (!componentId.startsWith(prefix)) continue;
          const rid = componentId.slice(prefix.length);
          const value = surface.dataModel.get(`/${blockId}/${rid}`);
          if (typeof value === "string") rows[rid] = value;
        }

        blocks[blockId] = {
          title: this.blockTitles.get(`${surfaceId}/${blockId}`) ?? blockId,
          rows,
          writtenBy: this.lastWriter.get(`${surfaceId}/${blockId}`) ?? "unknown",
        };
      }

      surfaces[surfaceId] = { owner: null, blocks };
    }

    return { surfaces };
  }

  /**
   * Record, once, what sharing a surface between agents actually buys.
   * A2UI's answer is the most nuanced of the three, because the component tree
   * and the data model have different collision properties.
   */
  private noteSharedSurface(surfaceId: SurfaceId, agent: AgentId): void {
    if (this.tracer.has("compose.shared-surface")) return;

    const others = [
      ...new Set(
        [...this.lastWriter.entries()]
          .filter(([key, writer]) => key.startsWith(`${surfaceId}/`) && writer !== agent)
          .map(([, writer]) => writer),
      ),
    ];

    if (others.length === 0) return;

    this.tracer.record(
      "compose.shared-surface",
      "SUPPORTED",
      `Agents ${JSON.stringify(others)} and "${agent}" compose into surface "${surfaceId}" by ` +
        `addressing it by id. In this adapter configuration, the surface is an explicit boundary and ` +
        `the data model is addressed by JSON Pointer, so the configured mappings keep agents on ` +
        `different surfaces and different subtrees separate. Component ids remain a shared, unowned ` +
        `namespace, which is where the collision in compose.identifier-collision comes from. This ` +
        `does not establish a protocol-level isolation or composition property.`,
      { surfaceId, writers: [...others, agent] },
    );
  }

  /** The exact message stream a browser renderer would replay. */
  get messages(): A2uiMessage[] {
    return this.messageLog.map((entry) => entry.message);
  }

  async dispose(): Promise<void> {
    this.processor.model.dispose();
  }
}

/**
 * The harness addresses controls by the logical control id; A2UI addresses them
 * by component id. The mapping is recoverable because the adapter minted both.
 */
function buttonIdForComponent(controlId: string): string {
  return controlId;
}
