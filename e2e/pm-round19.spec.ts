import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

test("a 768px first screen is the map without the ritual row", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await login(page);

  const metrics = await page.evaluate(() => {
    const map = document.querySelector("[data-testid='village-map-slot']")?.getBoundingClientRect();
    const badges = [...document.querySelectorAll("[data-testid='ritual-badge'], [data-testid='week-badge'], [data-testid='season-banner']")];
    const visibleBadges = badges.filter((node) => {
      const box = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden" && box.height > 0 && box.width > 0;
    });
    return {
      vh: window.innerHeight,
      mapHeight: map?.height ?? 0,
      visibleBadges: visibleBadges.length,
    };
  });
  expect(metrics.mapHeight).toBeGreaterThanOrEqual(metrics.vh * 0.5);
  expect(metrics.visibleBadges).toBe(0);
  await expect(page.getByTestId("today-entry")).toBeVisible();
  await expect(page.getByTestId("map-more")).toBeVisible();
  await expect(page.getByTestId("ritual-badge")).toBeHidden();
});

test("更多 shows one cue, then stays quiet after it is opened", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.addInitScript(() => {
    window.localStorage.removeItem("village:more-discover-v1");
  });
  await login(page);
  const cue = page.getByTestId("more-discover");
  const more = page.getByTestId("map-more");
  await expect(cue).toBeVisible();
  await expect(cue).toHaveAttribute("data-more-cue", "pulse");
  // PV-D-012: an 8px corner dot was visible to Playwright and invisible to people.
  const metrics = await more.evaluate((btn) => {
    const mark = btn.querySelector("[data-testid='more-discover']");
    const markBox = mark?.getBoundingClientRect();
    const btnBox = btn.getBoundingClientRect();
    const bg = getComputedStyle(btn).backgroundColor;
    const [red, green, blue] = bg.match(/\d+/g)?.map(Number) ?? [0, 0, 0];
    return {
      cueW: markBox?.width ?? 0,
      cueH: markBox?.height ?? 0,
      btnW: btnBox.width,
      btnH: btnBox.height,
      blue,
      red,
      green,
      anim: getComputedStyle(btn).animationName,
    };
  });
  expect(metrics.cueW).toBeGreaterThanOrEqual(metrics.btnW * 0.7);
  expect(metrics.cueH).toBeGreaterThanOrEqual(metrics.btnH * 0.7);
  expect(metrics.red).toBeGreaterThan(220);
  expect(metrics.blue).toBeLessThan(150);
  expect(metrics.anim).toContain("more-cue-btn");
  await more.click();
  await expect(page.getByTestId("name-legend")).toBeVisible();
  await expect(page.getByTestId("co-presence-toggle")).toBeVisible();
  await expect(cue).toBeHidden();

  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await expect(page.getByTestId("more-discover")).toHaveCount(0);
});

test("减少动作 keeps a still dot on 更多", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.addInitScript(() => {
    window.localStorage.removeItem("village:more-discover-v1");
  });
  await login(page);
  const cue = page.getByTestId("more-discover");
  await expect(cue).toBeVisible();
  await expect(cue).toHaveAttribute("data-more-cue", "dot");
  const metrics = await page.getByTestId("map-more").evaluate((btn) => {
    const mark = btn.querySelector("[data-testid='more-discover']");
    const box = mark?.getBoundingClientRect();
    const bg = getComputedStyle(btn).backgroundColor;
    const blue = Number(bg.match(/\d+/g)?.[2] ?? 0);
    return {
      w: box?.width ?? 0,
      h: box?.height ?? 0,
      blue,
      anim: getComputedStyle(btn).animationName,
      cueAnim: mark ? getComputedStyle(mark).animationName : "",
    };
  });
  expect(metrics.w).toBeLessThanOrEqual(16);
  expect(metrics.h).toBeLessThanOrEqual(16);
  expect(metrics.w).toBeGreaterThanOrEqual(8);
  expect(metrics.anim).toBe("none");
  expect(metrics.cueAnim).toBe("none");
  expect(metrics.blue).toBeGreaterThan(180);
});

test("choosing a name focuses self and shows 回家", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  await page.getByTestId("thumb-who").click();
  await page.getByTestId("self-picker").selectOption(self);
  await expect(page.getByTestId("thumb-home")).toBeVisible();
  await expect(page.locator(".farm-page")).toHaveAttribute("data-identity-land", "1");
  await expect(page.locator("[data-village-host]")).toHaveAttribute("data-self-highlight", "1", { timeout: 1000 });
});
