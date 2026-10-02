import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

test("narrow first screen folds the ritual trio and the map hud", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);

  const metrics = await page.evaluate(() => {
    const map = document.querySelector("[data-testid='village-map-slot']")?.getBoundingClientRect();
    const today = document.querySelector("[data-testid='today-entry']")?.getBoundingClientRect();
    return {
      vh: window.innerHeight,
      mapHeight: map?.height ?? 0,
      todayHeight: today?.height ?? 0,
    };
  });
  expect(metrics.mapHeight).toBeGreaterThanOrEqual(metrics.vh * 0.55);
  expect(metrics.todayHeight).toBeGreaterThan(0);
  expect(metrics.todayHeight).toBeLessThanOrEqual(48);

  await expect(page.getByTestId("today-entry")).toBeVisible();
  await expect(page.getByTestId("ritual-badge")).toBeHidden();
  await expect(page.getByTestId("week-badge")).toBeHidden();
  await expect(page.getByTestId("season-banner")).toBeHidden();
  await expect(page.getByTestId("name-legend")).toBeHidden();
  await expect(page.getByTestId("today-can-do")).toBeHidden();
  await expect(page.getByTestId("toggle-plates")).toBeHidden();
  await expect(page.getByTestId("gesture-ambient")).toBeHidden();
  await expect(page.getByTestId("co-presence-toggle")).toBeVisible();
  await expect(page.getByTestId("first-wave")).toBeVisible();
  await expect(page.getByTestId("first-wave")).toHaveText("挥手");
  await expect(page.locator("[data-village-host]")).toHaveAttribute("data-teach", "pinch");
  await expect(page.locator("canvas")).toHaveAttribute("aria-label", /双指捏合/);
  await expect(page.locator("canvas")).not.toHaveAttribute("aria-label", /滚轮/);
  await expect(page.getByTestId("toy-dock")).toBeHidden();
  await expect(page.getByTestId("thumb-home")).toBeHidden();
  await expect(page.getByTestId("thumb-who")).toBeVisible();
  await expect(page.getByRole("button", { name: "拉远" })).toBeVisible();
  await expect(page.getByRole("button", { name: "全景" })).toBeVisible();
  await expect(page.getByRole("button", { name: "拉近" })).toBeVisible();
  await expect(page.getByTestId("gesture-mute")).toBeVisible();
  await expect(page.getByTestId("find-me")).toBeVisible();

  await page.getByTestId("map-more").click();
  await expect(page.getByTestId("name-legend")).toBeVisible();
  await expect(page.getByTestId("co-presence-toggle")).toBeVisible();
  await expect(page.getByTestId("today-entry")).toBeVisible();

  await page.getByTestId("today-entry").click();
  await expect(page.getByTestId("ritual-badge")).toBeVisible();
  await expect(page.getByTestId("week-badge")).toBeVisible();
  await expect(page.getByTestId("season-banner")).toBeVisible();
});

test("a 375px map does not stack the extra actions down the left", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  await expect(page.getByTestId("emote-bar")).toBeHidden();
  await expect(page.getByTestId("toggle-plates")).toBeHidden();
  await expect(page.getByTestId("name-legend")).toBeHidden();
  await expect(page.getByTestId("social-float-chip")).toBeVisible();
  await expect(page.getByTestId("first-wave")).toBeHidden();
  await expect(page.getByTestId("co-presence-toggle")).toBeHidden();
  await page.getByTestId("social-float-chip").click();
  await expect(page.getByTestId("co-presence-toggle")).toBeVisible();
  await expect(page.getByTestId("first-wave")).toBeVisible();
  await expect(page.getByTestId("first-wave")).toHaveText("挥手");
  await expect(page.locator("[data-village-host]")).toHaveAttribute("data-teach", "pinch");
  await expect(page.getByTestId("thumb-home")).toBeVisible();
  const tools = await page.getByTestId("map-tools").boundingBox();
  expect(tools && tools.height <= 56).toBeTruthy();
});

test("desktop still shows the ritual trio and the map legend", async ({ page }) => {
  await login(page);
  await expect(page.getByTestId("today-entry")).toBeHidden();
  await expect(page.getByTestId("ritual-badge")).toBeVisible();
  await expect(page.getByTestId("week-badge")).toBeVisible();
  await expect(page.getByTestId("season-banner")).toBeVisible();
  await expect(page.getByTestId("name-legend")).toBeVisible();
  await expect(page.getByTestId("header-fold")).toBeHidden();
  await expect(page.getByTestId("map-more")).toBeHidden();
  await expect(page.getByTestId("refresh-scores")).toBeVisible();
  await expect(page.getByTestId("exit-village")).toBeVisible();
  await expect(page.locator("[data-village-host]")).toHaveAttribute("data-teach", "wheel");
  await expect(page.getByTestId("first-wave")).toBeHidden();
});
