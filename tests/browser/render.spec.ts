/**
 * The same three scenarios, asserted against real rendered DOM.
 *
 * The protocol suite can show that a message was accepted or an event was
 * emitted. It cannot show what the user ends up looking at, and for this
 * comparison that is half the answer: "agent B continued agent A's surface" and
 * "agent B opened a second panel underneath" are the same protocol success and
 * completely different products.
 */

import { expect, test, type Page } from "@playwright/test";

const ready = async (page: Page) => {
  await expect(page.locator("#root")).toHaveAttribute("data-state", "ready");
};

test.describe("S1 — surface handoff", () => {
  test("json-render: both agents' blocks land in one React tree", async ({ page }) => {
    await page.goto("/json-render.html?scenario=s1-surface-handoff");
    await ready(page);

    // The surface's own root Block, plus one Block per agent, all in one tree.
    await expect(page.locator("[data-block]")).toHaveCount(3);

    const surface = page.locator('[data-block="trip"]');
    await expect(surface.locator('[data-block="itinerary"][data-written-by="planner"]')).toBeVisible();
    await expect(surface.locator('[data-block="reservation"][data-written-by="booking"]')).toBeVisible();

    // Real prop resolution through json-render, not a string we injected.
    await expect(page.locator('[data-block="itinerary"] [data-value="depart"]')).toHaveText("Thu 09:40");
    await expect(page.locator('[data-block="reservation"] [data-value="flight"]')).toHaveText("TP1234");

    // One document, no iframes.
    await expect(page.locator("iframe")).toHaveCount(0);
  });

  test("A2UI: the Lit renderer paints both agents into one surface element", async ({ page }) => {
    await page.goto("/a2ui.html?scenario=s1-surface-handoff");
    await ready(page);

    const surface = page.locator("a2ui-surface");
    await expect(surface).toHaveCount(1);

    // Piercing the shadow DOM: this is the A2UI basic catalog's own output.
    await expect(surface.getByText("Lisbon, 3 nights")).toBeVisible();
    await expect(surface.getByText("Held for 20 minutes")).toBeVisible();

    // Values arrived through the data model, not inline in the component tree.
    await expect(surface.getByText("Thu 09:40")).toBeVisible();
    await expect(surface.getByText("TP1234")).toBeVisible();

    await expect(page.locator("iframe")).toHaveCount(0);
  });

  test("MCP Apps: the handoff becomes two sandboxed iframes", async ({ page }) => {
    await page.goto("/mcp-apps.html?scenario=s1-surface-handoff");
    await ready(page);

    const frames = page.locator("iframe[data-agent-frame]");
    await expect(frames).toHaveCount(2);

    // The isolation is real, not cosmetic: no allow-same-origin.
    await expect(frames.first()).toHaveAttribute("sandbox", "allow-scripts");

    const planner = page.frameLocator('[data-agent-frame="planner"]');
    const booking = page.frameLocator('[data-agent-frame="booking"]');

    await expect(planner.locator('[data-block="itinerary"]')).toBeVisible();
    await expect(booking.locator('[data-block="reservation"]')).toBeVisible();

    // Neither view contains the other's work — the seam a user would see.
    await expect(planner.locator('[data-block="reservation"]')).toHaveCount(0);
    await expect(booking.locator('[data-block="itinerary"]')).toHaveCount(0);
  });
});

test.describe("S2 — fixed-order identifier collision", () => {
  test("json-render: the second agent's summary replaces the first in the DOM", async ({ page }) => {
    await page.goto("/json-render.html?scenario=s2-fixed-order-collision");
    await ready(page);

    const summary = page.locator('[data-block="summary"]');
    await expect(summary).toHaveCount(1);
    await expect(summary).toHaveAttribute("data-written-by", "finance");
    await expect(summary.locator('[data-value="headline"]')).toHaveText("Spend is within budget");

    // risk's headline is nowhere on the page.
    await expect(page.getByText("Exposure exceeds appetite")).toHaveCount(0);
  });

  test("A2UI: finance's headline visible, risk's headline absent", async ({ page }) => {
    await page.goto("/a2ui.html?scenario=s2-fixed-order-collision");
    await ready(page);

    const surface = page.locator("a2ui-surface");
    await expect(surface.getByText("Spend is within budget")).toBeVisible();
    await expect(surface.getByText("Exposure exceeds appetite")).toHaveCount(0);
  });

  test("MCP Apps: both summaries survive, in separate origins", async ({ page }) => {
    await page.goto("/mcp-apps.html?scenario=s2-fixed-order-collision");
    await ready(page);

    const risk = page.frameLocator('[data-agent-frame="risk"]');
    const finance = page.frameLocator('[data-agent-frame="finance"]');

    await expect(risk.locator('[data-value="headline"]')).toHaveText("Exposure exceeds appetite");
    await expect(finance.locator('[data-value="headline"]')).toHaveText("Spend is within budget");
  });
});

test.describe("S3 — action round-trip", () => {
  test("json-render: the click delivers an action name with no agent in it", async ({ page }) => {
    await page.goto("/json-render.html?scenario=s3-action-roundtrip");
    await ready(page);

    await page.locator('[data-control="edit"]').click();

    const log = page.locator("#log");
    await expect(log).toHaveAttribute("data-last-action", /editBasket/);

    const payload = JSON.parse((await log.getAttribute("data-last-action"))!);
    expect(payload.name).toBe("dispatch");
    expect(payload.params.name).toBe("editBasket");
    // Nothing identifies the agent that drew the button.
    expect(JSON.stringify(payload)).not.toContain("cart");
  });

  test("A2UI: the click delivers surfaceId and sourceComponentId, but no agent", async ({ page }) => {
    await page.goto("/a2ui.html?scenario=s3-action-roundtrip");
    await ready(page);

    await page.locator("a2ui-surface").getByText("Edit quantities").click();

    const log = page.locator("#log");
    await expect(log).toHaveAttribute("data-last-action", /editBasket/);

    const action = JSON.parse((await log.getAttribute("data-last-action"))!);
    expect(action.surfaceId).toBe("checkout");
    expect(action.name).toBe("editBasket");
    expect(typeof action.sourceComponentId).toBe("string");
    expect(action).not.toHaveProperty("agent");
  });

  test("MCP Apps: the host refuses the view's privileged tool call", async ({ page }) => {
    await page.goto("/mcp-apps.html?scenario=s3-action-roundtrip");
    await ready(page);

    const cart = page.frameLocator('[data-agent-frame="cart"]');
    const payments = page.frameLocator('[data-agent-frame="payments"]');

    // Ordinary, app-visible tool: allowed.
    await cart.locator('[data-control="edit"]').click();
    await expect(cart.locator("#root")).toHaveAttribute("data-call-state", "settled");
    const ok = JSON.parse((await cart.locator("#root").getAttribute("data-last-call"))!);
    expect(ok).toMatchObject({ name: "revise_row", ok: true });

    // Privileged, model-only tool: refused by the host, over the real bridge.
    await payments.locator('[data-control="commit"]').click();
    await expect(payments.locator("#root")).toHaveAttribute("data-call-state", "settled");
    const refused = JSON.parse((await payments.locator("#root").getAttribute("data-last-call"))!);
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/model-visible only/);
  });
});
