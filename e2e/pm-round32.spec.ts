import { expect, test, type Page } from "@playwright/test";
import { login, roster } from "./login";

const GATE = { x: 88, y: 128 };

async function coldStart(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.evaluate(() => {
    window.localStorage.removeItem("village-self-v1");
    window.sessionStorage.removeItem("village-self-session");
    window.localStorage.removeItem("village:visit-v1");
    window.localStorage.removeItem("village:guide-seen-v1");
    window.localStorage.removeItem("village:first-visit-step-v1");
    window.localStorage.removeItem("village:settings-discover-v1");
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith("village:today-touch-v1:")) window.localStorage.removeItem(key);
      if (key.startsWith("village:return-warm-v1:")) window.localStorage.removeItem(key);
    }
  });
  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await expect(page.locator(".farm-page")).toHaveAttribute("data-has-self", "0");
  await page.evaluate((clock) => window.__VILLAGE_TEST__?.setClock(clock), "2026-10-04T04:00:00.000Z");
}

async function chooseSelf(page: Page) {
  const body = await roster(page);
  const name = body.people[0]?.name ?? "";
  expect(name.length).toBeGreaterThan(1);
  await page.getByTestId("thumb-who").click();
  await page.getByTestId("who-sheet").getByTestId("self-picker").selectOption(name);
  await expect(page.locator(".farm-page")).toHaveAttribute("data-has-self", "1");
  await expect(page.getByTestId("first-run-guide")).toBeVisible();
  return name;
}

type Spot = { name: string; x: number; y: number };
type Read = { name: string; text: string; x: number; y: number; w: number; h: number };

async function frameRead(page: Page) {
  return page.evaluate(() => {
    const host = document.querySelector("[data-village-host='ready']");
    if (!host) return null;
    const people = JSON.parse(host.getAttribute("data-people-xy") || "[]") as Spot[];
    const plates = JSON.parse(host.getAttribute("data-plate-read") || "[]") as Read[];
    return {
      people,
      plates,
      camX: Number(host.getAttribute("data-camera-x")),
      camY: Number(host.getAttribute("data-camera-y")),
      spanW: Number(host.getAttribute("data-view-span-w")),
      spanH: Number(host.getAttribute("data-view-span-h")),
      showAll: host.getAttribute("data-show-all"),
      zoom: host.getAttribute("data-camera-zoom"),
    };
  });
}

test("PV-PM-124 去看村口 leaves the home field and the viewer's nameplate", async ({ page }) => {
  await coldStart(page);
  const self = await chooseSelf(page);
  const pageRoot = page.locator(".farm-page");
  const host = page.locator("[data-village-host='ready']");
  await expect(pageRoot).toHaveAttribute("data-gate-arrive", "1");
  await expect(host).toHaveAttribute("data-show-all", "0");
  await expect(page.getByTestId("first-run-dismiss")).toBeVisible();

  const before = await frameRead(page);
  expect(before).not.toBeNull();

  const gateZoom = (await pageRoot.getAttribute("data-gate-zoom")) ?? "";
  expect(gateZoom).not.toBe("");
  const gate = page.locator("[data-testid='village-map-slot']").getByRole("button", { name: "去看村口" });
  if (!(await gate.isVisible())) {
    await page.locator("[data-sentence-strip='1']").getByRole("button").first().click();
  }
  await expect(gate).toBeVisible();
  await gate.click();
  await expect(page.getByTestId("village-feedback")).toHaveText("镜头到了。");

  await expect.poll(async () => {
    const frame = await frameRead(page);
    if (!frame || frame.showAll !== "0" || frame.zoom !== gateZoom) return false;
    const gateIn =
      frame.camX <= GATE.x &&
      GATE.x < frame.camX + frame.spanW &&
      frame.camY <= GATE.y &&
      GATE.y < frame.camY + frame.spanH;
    const selfSpot = frame.people.find((person) => person.name === self);
    if (!selfSpot) return false;
    const selfOut = selfSpot.y >= frame.camY + frame.spanH;
    const plateOut = !frame.plates.some((plate) => plate.name === self);
    const moved = Math.hypot(frame.camX - (before?.camX ?? 0), frame.camY - (before?.camY ?? 0));
    return gateIn && selfOut && plateOut && moved > 24;
  }).toBe(true);

  await expect(page.getByTestId("first-run-dismiss")).toBeVisible();
  await expect(host).toHaveAttribute("data-show-all", "0");
  await expect(page.locator("body")).not.toContainText("聊天原文");
});
