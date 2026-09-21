/**
 * Captures the README's screenshots from the same pages the assertions run
 * against.
 *
 * These are tagged `@screenshot` and excluded from `npm run test:browser`, so
 * the normal suite stays fast and does not write into the repo. `npm run
 * screenshots` runs only these.
 *
 * Each capture drives the scenario exactly as `render.spec.ts` does — including
 * the clicks in S3 — so the images show real rendered output rather than a
 * mock-up of it. Where a screenshot would otherwise be ambiguous the test also
 * asserts, so a capture cannot silently record a broken page.
 */

import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const OUT = resolve(import.meta.dirname, "../../docs/screenshots");

/** One width for every image, so the README's comparison table lines up. */
const VIEWPORT = { width: 560, height: 900 };

test.use({ viewport: VIEWPORT, deviceScaleFactor: 2 });

test.beforeAll(async () => {
  await mkdir(OUT, { recursive: true });
});

/**
 * Pin the light theme and disable animation.
 *
 * The pages honour `prefers-color-scheme`, which would make captures depend on
 * the machine that took them.
 */
async function stabilise(page: Page): Promise<void> {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.addStyleTag({ content: `*, *::before, *::after { transition: none !important; animation: none !important; }` });
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
}

async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.locator("#root")).toHaveAttribute("data-state", "ready");
  await stabilise(page);
}

/**
 * Capture `main`, which is the content without the browser chrome or margins.
 *
 * MCP Apps frames are sized from `ui/notifications/size-changed`, which arrives
 * asynchronously after the view's content changes, so wait for every frame's
 * height to stop moving before shooting.
 */
async function capture(page: Page, name: string): Promise<void> {
  await page.waitForFunction(
    () => {
      const frames = [...document.querySelectorAll<HTMLIFrameElement>("iframe[data-agent-frame]")];
      if (frames.length === 0) return true;
      const heights = frames.map((f) => f.getBoundingClientRect().height).join(",");
      const settled = (window as unknown as { __h?: string }).__h === heights;
      (window as unknown as { __h?: string }).__h = heights;
      return settled;
    },
    undefined,
    { polling: 120 },
  );
  await page.locator("main").screenshot({ path: resolve(OUT, `${name}.png`) });
}

test.describe("@screenshot S1 — surface handoff", () => {
  test("json-render", async ({ page }) => {
    await open(page, "/json-render.html?scenario=s1-surface-handoff");
    await expect(page.locator('[data-block="reservation"]')).toBeVisible();
    await capture(page, "s1-json-render");
  });

  test("a2ui", async ({ page }) => {
    await open(page, "/a2ui.html?scenario=s1-surface-handoff");
    await expect(page.locator("a2ui-surface").getByText("Held for 20 minutes")).toBeVisible();
    await capture(page, "s1-a2ui");
  });

  test("mcp-apps", async ({ page }) => {
    await open(page, "/mcp-apps.html?scenario=s1-surface-handoff");
    await expect(
      page.frameLocator('[data-agent-frame="booking"]').locator('[data-block="reservation"]'),
    ).toBeVisible();
    await capture(page, "s1-mcp-apps");
  });
});

test.describe("@screenshot S2 — concurrent composition", () => {
  test("json-render", async ({ page }) => {
    await open(page, "/json-render.html?scenario=s2-concurrent-composition");
    // The image is only meaningful if the collision really happened.
    await expect(page.locator('[data-block="summary"]')).toHaveCount(1);
    await capture(page, "s2-json-render");
  });

  test("a2ui", async ({ page }) => {
    await open(page, "/a2ui.html?scenario=s2-concurrent-composition");
    await expect(page.locator("a2ui-surface").getByText("Spend is within budget")).toBeVisible();
    await capture(page, "s2-a2ui");
  });

  test("mcp-apps", async ({ page }) => {
    await open(page, "/mcp-apps.html?scenario=s2-concurrent-composition");
    await expect(
      page.frameLocator('[data-agent-frame="risk"]').locator('[data-value="headline"]'),
    ).toHaveText("Exposure exceeds appetite");
    await capture(page, "s2-mcp-apps");
  });
});

test.describe("@screenshot S3 — action round-trip", () => {
  test("json-render", async ({ page }) => {
    await open(page, "/json-render.html?scenario=s3-action-roundtrip");
    await page.locator('[data-control="edit"]').click();
    await expect(page.locator("#log")).toHaveAttribute("data-last-action", /editBasket/);
    await capture(page, "s3-json-render");
  });

  test("a2ui", async ({ page }) => {
    await open(page, "/a2ui.html?scenario=s3-action-roundtrip");
    await page.locator("a2ui-surface").getByText("Edit quantities").click();
    await expect(page.locator("#log")).toHaveAttribute("data-last-action", /editBasket/);
    await capture(page, "s3-a2ui");
  });

  test("mcp-apps", async ({ page }) => {
    await open(page, "/mcp-apps.html?scenario=s3-action-roundtrip");

    const cart = page.frameLocator('[data-agent-frame="cart"]');
    const payments = page.frameLocator('[data-agent-frame="payments"]');

    await cart.locator('[data-control="edit"]').click();
    await expect(cart.locator('[data-outcome="allowed"]')).toBeVisible();

    await payments.locator('[data-control="commit"]').click();
    await expect(payments.locator('[data-outcome="refused"]')).toBeVisible();

    await capture(page, "s3-mcp-apps");
  });
});
