/**
 * json-render adapter.
 *
 * json-render's model: an agent produces a `Spec` — a flat map of elements
 * keyed by string — and the client renders it against a catalog it controls.
 * Updates are RFC 6902 JSON Patch operations applied to that same flat map,
 * which is what `applySpecPatch` from `@json-render/core` does here.
 *
 * The flat keyspace is the whole story for multi-agent work. It is excellent
 * for a single agent streaming a document, because any later patch can reach
 * any earlier element. It is exactly that reach which becomes the problem once
 * two agents share a surface: there is no addressing boundary between them.
 */

import { applySpecPatch, type Spec, type UIElement } from "@json-render/core";
import { catalog } from "./catalog.ts";
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

/** Element key for a block. Shared keyspace — collisions here are the point. */
const blockKey = (blockId: string) => `block:${blockId}`;
const rowKey = (blockId: string, rowId: string) => `row:${blockId}:${rowId}`;
const controlKey = (blockId: string, controlId: string) => `ctl:${blockId}:${controlId}`;

export class JsonRenderAdapter implements ProtocolAdapter {
  readonly id = "json-render" as const;
  readonly sdk = "@json-render/core + @json-render/react";

  /** One spec per surface — the natural mapping, since a Renderer takes one spec. */
  private readonly specs = new Map<SurfaceId, Spec>();

  /**
   * Adapter-side bookkeeping of who last wrote each block.
   *
   * This is not protocol data. json-render patches carry no author, so the
   * harness has to keep this itself in order to *detect* a lost write. That it
   * is needed at all is the finding.
   */
  private readonly lastWriter = new Map<string, AgentId>();

  /** Every patch applied, for evidence in the report. */
  readonly patchLog: Array<{ surfaceId: SurfaceId; agent: AgentId; patch: unknown }> = [];

  constructor(private readonly tracer: Tracer) {}

  async createSurface(surfaceId: SurfaceId, agent: AgentId): Promise<void> {
    const rootKey = `surface:${surfaceId}`;
    const spec: Spec = {
      root: rootKey,
      elements: {
        [rootKey]: {
          type: "Block",
          props: { blockId: surfaceId, title: surfaceId, writtenBy: agent },
          children: [],
        } satisfies UIElement,
      },
      state: {},
    };
    this.specs.set(surfaceId, spec);
    this.lastWriter.set(`${surfaceId}/${rootKey}`, agent);
  }

  async emit(surfaceId: SurfaceId, agent: AgentId, block: UiBlock): Promise<void> {
    const spec = this.mustGet(surfaceId);
    const bKey = blockKey(block.id);
    const childKeys: string[] = [];

    const apply = (patch: { op: "add" | "replace"; path: string; value: unknown }) => {
      applySpecPatch(spec, patch);
      this.patchLog.push({ surfaceId, agent, patch });
    };

    for (const row of block.rows) {
      const key = rowKey(block.id, row.id);
      childKeys.push(key);
      apply({
        op: "add",
        path: `/elements/${escapeKey(key)}`,
        value: {
          type: "Row",
          props: { rowId: row.id, label: row.label, value: row.value },
          children: [],
        } satisfies UIElement,
      });
    }

    for (const control of block.controls ?? []) {
      const key = controlKey(block.id, control.id);
      childKeys.push(key);
      apply({
        op: "add",
        path: `/elements/${escapeKey(key)}`,
        value: {
          type: "Button",
          props: { controlId: control.id, label: control.label },
          children: [],
          on: {
            press: {
              action: "dispatch",
              params: { name: control.action, payload: control.params ?? {} },
              // json-render's one genuine governance primitive: the confirmation
              // gate travels *inside* the declarative binding, so a host renders
              // it without the agent having to be trusted to ask.
              ...(control.privileged
                ? {
                    confirm: {
                      title: "Confirm action",
                      message: `Allow ${control.action}?`,
                      variant: "danger" as const,
                    },
                  }
                : {}),
            },
          },
        } satisfies UIElement,
      });
    }

    // Replacing the whole block element is the ordinary way an agent redraws a
    // region. Nothing stops a different agent doing exactly this to a block it
    // never created, which is what scenario 2 exploits.
    const existed = spec.elements[bKey] !== undefined;
    apply({
      op: existed ? "replace" : "add",
      path: `/elements/${escapeKey(bKey)}`,
      value: {
        type: "Block",
        props: { blockId: block.id, title: block.title, writtenBy: agent },
        children: childKeys,
      } satisfies UIElement,
    });

    this.noteSharedSurface(surfaceId, agent);

    if (existed) {
      const previous = this.lastWriter.get(`${surfaceId}/${bKey}`);
      if (previous !== undefined && previous !== agent) {
        this.tracer.record(
          "compose.concurrent-write",
          "LOST",
          `Agent "${agent}" replaced block "${block.id}" previously written by "${previous}". ` +
            `json-render patches address a flat, shared element map: /elements/${bKey} is a single ` +
            `slot with no owner, so the earlier agent's content is gone and neither agent is told.`,
          { path: `/elements/${bKey}`, previousWriter: previous, newWriter: agent },
        );
      }
    }

    const root = spec.elements[spec.root];
    if (root && !root.children?.includes(bKey)) {
      root.children = [...(root.children ?? []), bKey];
    }
    this.lastWriter.set(`${surfaceId}/${bKey}`, agent);

    const validation = catalog.validate(spec);
    if (!validation.success) {
      throw new Error(`emitted spec failed catalog validation: ${validation.error?.message}`);
    }
  }

  async handoff(surfaceId: SurfaceId, from: AgentId, to: AgentId): Promise<void> {
    const spec = this.mustGet(surfaceId);

    // The mechanical answer is "yes, trivially": agent B patches agent A's spec
    // with no ceremony at all, because a patch is just a path into the map.
    this.tracer.record(
      "handoff.continue-surface",
      "SUPPORTED_WITH_CAVEAT",
      `Agent "${to}" can continue the surface "${from}" started by applying JSON Patch ops to the ` +
        `same flat element map — no re-render, no new surface, and the user sees one continuous view. ` +
        `The caveat is that this works because json-render grants every writer the whole keyspace: ` +
        `there is no per-element owner, so "continue" and "overwrite someone else's work" are the ` +
        `same operation, and the spec carries nothing a host could use to tell them apart.`,
      { rootKey: spec.root, elementKeys: Object.keys(spec.elements) },
    );

    this.tracer.record(
      "handoff.provenance",
      "NOT_EXPRESSIBLE",
      `The Spec type is { root, elements, state }; UIElement is { type, props, children, on, visible, ` +
        `repeat, watch }. None of them has a field for the agent that produced the element. The ` +
        `harness's "writtenBy" is an ordinary prop in its own catalog, which any agent can set to any ` +
        `value, so a host cannot use it to attribute or authorize a write.`,
      { uiElementFields: ["type", "props", "children", "slots", "visible", "on", "repeat", "watch"] },
    );

    this.tracer.record(
      "handoff.isolation",
      "NOT_EXPRESSIBLE",
      `There is no isolation boundary to speak of. One Spec renders into one React tree in one ` +
        `document, and any writer can patch any path — including /state, which every element's ` +
        `bindings read from. A misbehaving agent can rewrite another agent's rows, retarget its ` +
        `buttons' action bindings, or hide its elements with a visible condition, and the renderer ` +
        `will do it faithfully because a patch is a patch. That is fine when the orchestrator wrote ` +
        `all the agents; it is not a foundation for running agents you did not.`,
      { sharedKeyspace: ["/elements/*", "/state/*", "/root"] },
    );
  }

  async dispatchUserAction(action: UserAction): Promise<ActionReceipt> {
    const spec = this.mustGet(action.surfaceId);
    const key = controlKey(findBlockForControl(spec, action.componentId) ?? "", action.componentId);
    const element = spec.elements[key];

    if (!element) {
      return { routedTo: null, routedBy: "none", raw: { missingElement: key } };
    }

    const binding = element.on?.["press"];
    const resolved = Array.isArray(binding) ? binding[0] : binding;

    // This is the entire event as json-render models it: an action name from
    // the client's own catalog, plus params. The client invokes its local
    // handler; nothing is serialised back to any agent by the protocol itself.
    const event = {
      action: resolved?.action,
      params: resolved?.params,
      confirm: resolved?.confirm,
    };

    this.tracer.record(
      "action.routing-identity",
      "REQUIRES_OUT_OF_BAND",
      `The dispatched event is ${JSON.stringify(event.params)} against local handler ` +
        `"${event.action}". json-render actions resolve to a handler in the *client's* catalog, so ` +
        `the event names a function, not an addressee. With several UI-capable agents behind one ` +
        `orchestrator, the orchestrator must keep its own control-id to agent table and keep it in ` +
        `sync with every patch, including patches written by agents it did not schedule.`,
      event,
    );

    if (resolved?.confirm) {
      this.tracer.record(
        "action.approval-gate",
        "SUPPORTED_WITH_CAVEAT",
        `The privileged control carries a confirm block (${JSON.stringify(resolved.confirm)}) inside ` +
          `the action binding, and json-render's renderer honours it: it shows the dialog and ` +
          `withholds the dispatch until the user agrees. Of the three protocols this is the only ` +
          `declarative consent primitive. The caveat is decisive for multi-agent use, though — the ` +
          `confirm block is written by the agent that drew the button. An agent that simply omits it ` +
          `gets an ungated action, and nothing in the spec marks the action as one that needed a ` +
          `gate. It is a good default for agents you wrote; it is not a control over agents you did ` +
          `not.`,
        resolved.confirm,
      );
    }

    return { routedTo: null, routedBy: "none", raw: event };
  }

  async snapshot(): Promise<RenderedSnapshot> {
    const surfaces: RenderedSnapshot["surfaces"] = {};

    for (const [surfaceId, spec] of this.specs) {
      const blocks: RenderedSnapshot["surfaces"][string]["blocks"] = {};

      for (const [key, element] of Object.entries(spec.elements)) {
        if (element.type !== "Block" || key === spec.root) continue;
        const props = element.props as { blockId: string; title: string; writtenBy: string };
        const rows: Record<string, string> = {};

        for (const childKey of element.children ?? []) {
          const child = spec.elements[childKey];
          if (child?.type !== "Row") continue;
          const rowProps = child.props as { rowId: string; value: string };
          rows[rowProps.rowId] = rowProps.value;
        }

        blocks[props.blockId] = { title: props.title, rows, writtenBy: props.writtenBy };
      }

      surfaces[surfaceId] = { owner: null, blocks };
    }

    return { surfaces };
  }

  /** The spec as the renderer would receive it. Used by the browser host. */
  specFor(surfaceId: SurfaceId): Spec {
    return this.mustGet(surfaceId);
  }

  /**
   * Record, once, what it means for two agents to be writing the same spec.
   * Kept separate from the collision trace: composition can succeed and still
   * be unpoliced, and the report needs both facts.
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
      "SUPPORTED_WITH_CAVEAT",
      `Agents ${JSON.stringify(others)} and "${agent}" write into one Spec and compose into a single ` +
        `rendered tree with no coordination step. For blocks with distinct keys this is the best ` +
        `experience of the three: one view, one layout pass, no seams. The caveat is that the ` +
        `keyspace is global and unowned, so composing and clobbering are the same operation and the ` +
        `protocol offers nothing to tell them apart.`,
      { surfaceId, writers: [...others, agent] },
    );
  }

  private mustGet(surfaceId: SurfaceId): Spec {
    const spec = this.specs.get(surfaceId);
    if (!spec) throw new Error(`unknown surface: ${surfaceId}`);
    return spec;
  }
}

/** JSON Pointer escaping (RFC 6901): "~" then "/". */
function escapeKey(key: string): string {
  return key.replace(/~/g, "~0").replace(/\//g, "~1");
}

function findBlockForControl(spec: Spec, controlId: string): string | null {
  for (const [key, element] of Object.entries(spec.elements)) {
    if (element.type !== "Button") continue;
    if ((element.props as { controlId?: string }).controlId === controlId) {
      // key is "ctl:<blockId>:<controlId>"
      return key.slice("ctl:".length, key.length - controlId.length - 1);
    }
  }
  return null;
}
