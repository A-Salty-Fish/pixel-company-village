import { expect, test } from "@playwright/test";
import { login, openWeekBoard, roster, openVillageDrawer } from "./login";

test("PV-PM-023 night keeps path-scale structure and autumn dots while the wash stays on", async ({ page }) => {
  await login(page);
  const host = page.locator("[data-village-host='ready']");
  const canvas = page.locator("canvas[data-testid='village-map']");
  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-09-30T04:00:00.000Z"));
  await expect(host).toHaveAttribute("data-night-wash", "off");
  await expect(host).toHaveAttribute("data-night-read", "off");
  await expect(host).toHaveAttribute("data-night-autumn", "0");

  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-09-30T13:00:00.000Z"));
  await expect(page.getByTestId("village-glance")).toContainText("夜里");
  await expect(host).toHaveAttribute("data-season", "autumn");
  await expect(host).toHaveAttribute("data-night-wash", "active");
  await expect(host).toHaveAttribute("data-night-read", "lift");
  await expect(canvas).toHaveAttribute("data-night-read", "lift");
  await expect(host).toHaveAttribute("data-night-autumn", "1");
  await expect(page.locator("body")).not.toContainText("聊天原文");
});

test("PV-PM-024 a finished week offers one map beat without the accordion", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  await openWeekBoard(page);
  const strip = page.getByTestId("today-chores");
  const rows = strip.locator("[data-chore]");
  await expect(rows).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    const row = rows.nth(index);
    const button = row.getByRole("button");
    for (let step = 0; step < 3; step += 1) {
      if ((await row.getAttribute("data-done")) === "1") break;
      if ((await button.count()) === 0) break;
      await button.click();
    }
    const card = page.getByTestId("signal-card");
    if ((await card.count()) > 0) {
      await page.keyboard.press("Escape");
      await expect(card).toHaveCount(0);
    }
  }
  await expect(strip).toHaveAttribute("data-week-done", "1");
  const beat = page.getByTestId("next-beat");
  await expect(beat).toBeVisible();
  const beatId = await beat.getAttribute("data-next-id");
  expect(beatId === "gate" || beatId === "pond" || beatId === "bench").toBeTruthy();
  await page.getByTestId("week-badge").click();
  await expect(strip).toBeHidden();
  await expect(beat).toBeVisible();
  const host = page.locator("[data-village-host='ready']");
  await beat.click();
  await expect(host).toHaveAttribute("data-next-beat", "aimed");
  await expect(host).toHaveAttribute("data-next-id", beatId ?? "");
  const gateZoom = (await page.locator(".farm-page").getAttribute("data-gate-zoom")) ?? "3";
  await expect(host).toHaveAttribute("data-camera-zoom", beatId === "gate" ? gateZoom : "3");
  await expect(page.locator("body")).not.toContainText("聊天原文");
});

test("PV-PM-027 lantern, scarecrow, and path stone land on the map", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  await openVillageDrawer(page);
  await page.getByTestId("village-loops").locator("> summary").click();
  const host = page.locator("[data-village-host='ready']");

  await page.getByTestId("loop-lantern").click();
  await expect(page.getByTestId("loop-lantern")).toHaveAttribute("data-pressed", "1");
  await expect(host).toHaveAttribute("data-toy-lantern", "1");
  await expect(host).toHaveAttribute("data-toy-pulse", "lantern");
  await expect(host).toHaveAttribute("data-camera-zoom", "3");

  await page.getByTestId("loop-scarecrow").click();
  await expect(page.getByTestId("loop-scarecrow")).toHaveAttribute("data-pressed", "1");
  await expect.poll(async () => Number(await host.getAttribute("data-toy-scare"))).toBeGreaterThan(0);
  await expect(host).toHaveAttribute("data-toy-pulse", "scarecrow");

  await page.getByTestId("loop-pebble").click();
  await expect(page.getByTestId("loop-pebble")).toHaveAttribute("data-count", "1");
  await expect(host).toHaveAttribute("data-toy-pebbles", "1");
  await expect(host).toHaveAttribute("data-toy-pulse", "pebble");
  await expect(page.locator("body")).not.toContainText("聊天原文");
});

test("PV-PM-025 mute stays default and lamp, wave, and find-me can sound", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  const pageRoot = page.locator(".farm-page");
  const mute = page.getByTestId("gesture-mute");
  const ambient = page.getByTestId("gesture-ambient");
  await expect(mute).toHaveAttribute("aria-pressed", "true");
  await expect(ambient).toHaveAttribute("aria-pressed", "false");
  await expect(pageRoot).toHaveAttribute("data-sfx", "muted");
  await expect(pageRoot).toHaveAttribute("data-gesture-bed", "off");

  await page.getByTestId("find-me").click();
  await expect(pageRoot).toHaveAttribute("data-gesture", "find");
  await expect(pageRoot).toHaveAttribute("data-gesture-audio", "silent");

  await mute.click();
  await expect(pageRoot).toHaveAttribute("data-sfx", "live");
  await page.getByTestId("find-me").click();
  await expect(pageRoot).toHaveAttribute("data-gesture", "find");
  await expect(pageRoot).toHaveAttribute("data-gesture-audio", "played");

  await page.getByTestId("header-wave").click();
  await expect(pageRoot).toHaveAttribute("data-gesture", "wave");
  await expect(pageRoot).toHaveAttribute("data-gesture-audio", "played");

  await openVillageDrawer(page);
  await page.getByTestId("wave-d-panel").locator("> summary").click();
  await page.getByRole("button", { name: "点门灯" }).click();
  await expect(pageRoot).toHaveAttribute("data-gesture", "lamp");
  await expect(pageRoot).toHaveAttribute("data-gesture-audio", "played");

  await ambient.click();
  await expect(pageRoot).toHaveAttribute("data-gesture-bed", "live");
  await mute.click();
  await expect(pageRoot).toHaveAttribute("data-sfx", "muted");
  await expect(pageRoot).toHaveAttribute("data-gesture-bed", "off");
  await page.getByTestId("find-me").click();
  await expect(pageRoot).toHaveAttribute("data-gesture-audio", "silent");
});

test("PV-PM-026 all-names fade at the far zoom and quiet returns when toggled off", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(body.people[0]?.name ?? "");
  const host = page.locator("[data-village-host='ready']");
  await expect(host).toHaveAttribute("data-camera-zoom", "1");
  await expect(host).toHaveAttribute("data-plate-viewport", "off");
  await expect(host).toHaveAttribute("data-quiet", "1");
  await page.getByTestId("toggle-plates").click();
  await expect(host).toHaveAttribute("data-show-all", "1");
  await expect(host).toHaveAttribute("data-plate-viewport", "fade");
  await expect.poll(async () => Number(await host.getAttribute("data-plate-count"))).toBeGreaterThanOrEqual(12);
  await page.getByRole("button", { name: "拉近" }).click();
  await page.getByRole("button", { name: "拉近" }).click();
  await expect(host).toHaveAttribute("data-camera-zoom", "3");
  await expect(host).toHaveAttribute("data-plate-viewport", "near");
  await page.getByTestId("toggle-plates").click();
  await expect(host).toHaveAttribute("data-show-all", "0");
  await expect(host).toHaveAttribute("data-plate-viewport", "off");
  await expect(host).toHaveAttribute("data-plate-cap", "4");
});

test("PV-PM-028 a quiet header wave leaves a receipt within 3 seconds", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  const host = page.locator("[data-village-host='ready']");
  const pageRoot = page.locator(".farm-page");
  await expect(host).toHaveAttribute("data-quiet", "1");
  await page.getByTestId("header-wave").click();
  const receipt = page.getByTestId("header-wave-receipt");
  await expect(receipt).toBeVisible();
  await expect(receipt).toHaveText("邻里应了一下。");
  await expect(pageRoot).toHaveAttribute("data-header-wave", "receipt");
  await expect(host).toHaveAttribute("data-wave-reply", "1");
  await expect(page.locator("body")).not.toContainText("聊天原文");
  await expect(page.locator("body")).not.toContainText("他说");
});
