# Figure provenance

These original figures explain this repository's existing configuration and
assertions. They are not measurements, verdict scores, fresh browser screenshots,
or images copied from another paper. Editable sources are `topology.mmd` and
`s2.mmd`. PDF and SVG files and the intermediate DOT files are generated.

Figure 1 maps the json-render/A2UI shared-state runs and the MCP app-to-server
path. Evidence: `src/adapters/{json-render,a2ui,mcp-apps}/adapter.ts`,
`src/adapters/mcp-apps/host.ts`, `web/mcp-apps.ts`, and
`tests/protocol/mcp-apps-bridge.test.ts`. Its dashed arrow is the existing
permissive variant. The invisible Mermaid layout link is not a data path.
The drawing deliberately binds agent identity to the local server topology.

Figure 2 preserves the four awaited writes in
`src/scenarios/s2-fixed-order-collision.ts`, then illustrates retained summaries.
Its states are checked against `tests/protocol/scenarios.test.ts` and
`tests/browser/render.spec.ts`. A2UI's Node evidence is a writer map; the
executed DOM assertion establishes finance visible and risk absent, with no
exact node-count check. The retained [browser report](../evidence/browser-terminal-20260922T013449Z-zH4HTK/playwright-ipv4.json)
supports only pre-rename observations in the box and caption; new browser
execution is required to substantiate the renamed fixture. MCP browser fixtures omit the Node detail
blocks; a separate figure box identifies its two summary writes. This is not
full Node S2 validation or support across a common fixture. It is not a timing chart or a
scheduling experiment. The later finance write does not erase either separate
MCP instance. No new scenarios or adapter behavior were introduced.

Mermaid CLI 11.4.2 was tried locally but its Chromium process failed inside the
sandbox; the unchanged failure output is retained in
`../evidence/pdf-visuals/mermaid-attempt.txt`. No browser sandbox was disabled.
The successful local rendering path is:

```bash
node scripts/paper-figures.mjs
```

It converts an intentionally limited Mermaid `flowchart TB` subset to Graphviz
13.1.0 DOT, then renders PDF and SVG using the installed native `dot` executable.
Supported statements are quoted box/diamond labels, subgraphs, solid/dashed
arrows with optional labels, and invisible layout links. Unsupported statements,
unclosed groups, duplicate nodes and missing endpoints raise errors. Tests cover
these restrictions and source correspondence. This is not a claim that the
Mermaid CLI produced the retained figures or that the converter supports all
Mermaid syntax. `mermaid-config.json` records the CLI attempt's settings; the
fallback's grayscale styling is explicit in `scripts/paper-figures.mjs`.

Labels, shapes, and solid/dashed lines distinguish meaning without color. No
network access, JavaScript, Mermaid renderer or Graphviz is needed when compiling
the generated TeX: it includes only the preconverted PDF assets via `graphicx`.
