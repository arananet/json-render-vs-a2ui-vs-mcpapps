/**
 * The json-render catalog.
 *
 * Built with the real `schema` exported by `@json-render/react`, so the specs
 * the agents emit are validated by json-render's own Zod machinery rather than
 * by anything the harness invented.
 *
 * The component set is deliberately the neutral `UiBlock` shape from
 * `src/orchestrator/types.ts`: a titled block, labelled rows, and buttons. The
 * same three primitives exist in the A2UI basic catalog and are trivial to
 * write in MCP Apps HTML, so no protocol is flattered by the choice.
 */

import { schema } from "@json-render/react";
import { z } from "zod";

export const catalog = schema.createCatalog({
  components: {
    Block: {
      props: z.object({
        blockId: z.string(),
        title: z.string(),
        /**
         * Which agent last wrote this block.
         *
         * Worth being precise about what this is: json-render has no notion of
         * authorship, so this is an ordinary prop the harness adds by
         * convention. A host cannot rely on it — any agent can set it to any
         * value. Scenario 1 records exactly that.
         */
        writtenBy: z.string(),
      }),
      slots: ["default"],
      description: "A titled block of rows, drawn by one agent.",
      example: { blockId: "itinerary", title: "Itinerary", writtenBy: "planner" },
    },
    Row: {
      props: z.object({
        rowId: z.string(),
        label: z.string(),
        value: z.string(),
      }),
      slots: [],
      description: "A labelled value inside a block.",
      example: { rowId: "dep", label: "Departure", value: "09:40" },
    },
    Button: {
      props: z.object({
        controlId: z.string(),
        label: z.string(),
      }),
      slots: [],
      description: "A control the user can activate.",
      example: { controlId: "confirm", label: "Confirm" },
    },
  },
  actions: {
    /**
     * A single generic action.
     *
     * This is the honest modelling of json-render's action layer: an action is
     * a *name in the client's catalog* plus params. There is no addressee
     * field, so the name is all the routing information the event carries.
     */
    dispatch: {
      params: z.object({
        /** Action name the emitting agent chose. */
        name: z.string(),
        /** Arbitrary payload. */
        payload: z.record(z.string(), z.unknown()).optional(),
      }),
      description: "Dispatch a named action back to the application.",
    },
  },
});

export type BlockCatalog = typeof catalog;
