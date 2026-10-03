import { expect, test } from "@playwright/test";
import { login } from "./login";

const LANDMARKS: Record<string, { x: number; y: number }> = {
  gate: { x: 88, y: 120 },
  pond: { x: 128, y: 80 },
  bench: { x: 640, y: 420 },
  lantern: { x: 852, y: 336 },
};

test("first glance is the field, a name, and one glowing place", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, { glance: "closed" });
  const pageRoot = page.locator(".farm-page");
  await expect(pageRoot).toHaveAttribute("data-first-glance", "1");
  await expect(pageRoot).toHaveAttribute("data-glance-menu", "0");

  await expect(page.getByTestId("village-header")).toBeHidden();
  await expect(page.getByTestId("today-entry")).toBeHidden();
  await expect(page.getByTestId("narrow-today")).toBeHidden();
  await expect(page.getByRole("button", { name: "拉近" })).toBeHidden();
  await expect(page.getByRole("button", { name: "去看村口" })).toBeHidden();
  await expect(page.getByRole("button", { name: "知道了" })).toBeHidden();
  await expect(page.getByTestId("social-float-chip")).toBeHidden();
  await expect(page.getByTestId("thumb-who")).toBeHidden();
  await expect(page.getByTestId("split-map")).toBeHidden();

  await expect(page.getByTestId("glance-find")).toHaveText("先在地图上找我");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-map-fill", "village");

  const place = page.getByTestId("glance-place");
  const read = await page.evaluate(() => {
    const host = document.querySelector("[data-village-host='ready']");
    const canvas = document.querySelector("canvas[data-testid='village-map']");
    const node = document.querySelector("[data-testid='glance-place']");
    if (!host || !canvas || !(node instanceof HTMLElement)) return null;
    const zoom = Number(host.getAttribute("data-camera-zoom"));
    const camX = Number(host.getAttribute("data-camera-x"));
    const camY = Number(host.getAttribute("data-camera-y"));
    const spanW = Math.max(1, Math.floor(1216 / zoom));
    const spanH = Math.max(1, Math.floor(1120 / zoom));
    const id = node.getAttribute("data-place-id") ?? "";
    const box = node.getBoundingClientRect();
    const frame = canvas.getBoundingClientRect();
    return {
      id,
      hidden: node.hidden,
      camX,
      camY,
      spanW,
      spanH,
      text: (node.textContent ?? "").trim(),
      // Bottom center is the landmark after translate(-50%, -100%).
      markX: box.left + box.width / 2,
      markY: box.bottom,
      frameLeft: frame.left,
      frameTop: frame.top,
      frameW: frame.width,
      frameH: frame.height,
    };
  });
  expect(read).toBeTruthy();
  const spot = LANDMARKS[read?.id ?? ""];
  expect(spot).toBeTruthy();
  const inFrame =
    spot.x >= (read?.camX ?? 0) &&
    spot.y >= (read?.camY ?? 0) &&
    spot.x <= (read?.camX ?? 0) + (read?.spanW ?? 0) &&
    spot.y <= (read?.camY ?? 0) + (read?.spanH ?? 0);

  if (!inFrame) {
    await expect(place).toBeHidden();
    await expect(page.getByRole("button", { name: "村口" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "灯笼" })).toHaveCount(0);
  } else {
    await expect(place).toBeVisible();
    expect(read?.text.startsWith("去看")).toBe(false);
    const projectedX = (read?.frameLeft ?? 0) + ((spot.x - (read?.camX ?? 0)) / (read?.spanW ?? 1)) * (read?.frameW ?? 1);
    const projectedY = (read?.frameTop ?? 0) + ((spot.y - (read?.camY ?? 0)) / (read?.spanH ?? 1)) * (read?.frameH ?? 1);
    expect(Math.hypot((read?.markX ?? 0) - projectedX, (read?.markY ?? 0) - projectedY)).toBeLessThan(28);
    await place.click();
    await expect
      .poll(async () => page.locator("[data-village-host='ready']").getAttribute("data-next-id"))
      .toMatch(/^(gate|pond|bench|lantern|lantern-frame)$/);
  }

  const name = await page.evaluate(() => window.__VILLAGE_TEST__?.getState().rosterNames[0] ?? null);
  expect(name).toBeTruthy();
  await page.evaluate((picked) => window.__VILLAGE_TEST__?.selectVillager(picked), name);
  await expect(page.getByTestId("glance-find")).toHaveCount(0);
  await expect(page.getByTestId("glance-greet")).toBeVisible();
  await expect(page.getByRole("button", { name: "知道了" })).toBeHidden();

  await page.getByTestId("today-mark").click();
  await expect(page.getByTestId("today-entry")).toBeVisible();
  await expect(page.getByTestId("village-header")).toBeHidden();

  await page.getByTestId("glance-menu").click();
  await expect(pageRoot).toHaveAttribute("data-glance-menu", "1");
  await expect(page.getByTestId("village-header")).toBeVisible();
  await expect(page.getByRole("button", { name: "拉近" })).toBeVisible();
});
