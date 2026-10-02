import { expect, test, type Page } from "@playwright/test";
import { ensureRosterRow, login, roster } from "./login";

async function heroBox(page: Page) {
  return page.evaluate(() => {
    const parchment = document.querySelector("[data-testid='parchment-stack']")?.getBoundingClientRect();
    const map = document.querySelector("[data-testid='village-map-slot']")?.getBoundingClientRect();
    const refresh = document.querySelector("[data-testid='refresh-scores']")?.getBoundingClientRect();
    const leave = document.querySelector("[data-testid='exit-village']")?.getBoundingClientRect();
    return {
      scroll: window.scrollY,
      vh: window.innerHeight,
      parchment: parchment?.height ?? 0,
      mapTop: map?.top ?? -1,
      mapHeight: map?.height ?? 0,
      mapBottom: map?.bottom ?? 9999,
      refreshTop: refresh?.top ?? -1,
      refreshBottom: refresh?.bottom ?? 9999,
      leaveTop: leave?.top ?? -1,
      leaveBottom: leave?.bottom ?? 9999,
    };
  });
}

function expectHero(metrics: Awaited<ReturnType<typeof heroBox>>) {
  expect(metrics.scroll).toBe(0);
  expect(metrics.mapTop).toBeGreaterThanOrEqual(-1);
  expect(metrics.mapBottom).toBeLessThanOrEqual(metrics.vh + 1);
  expect(metrics.mapHeight).toBeGreaterThanOrEqual(metrics.vh * 0.6 - 1);
  expect(metrics.parchment).toBeLessThan(metrics.mapHeight);
  expect(metrics.refreshTop).toBeGreaterThanOrEqual(0);
  expect(metrics.refreshBottom).toBeLessThanOrEqual(metrics.vh);
  expect(metrics.leaveTop).toBeGreaterThanOrEqual(0);
  expect(metrics.leaveBottom).toBeLessThanOrEqual(metrics.vh);
}

test("fresh session keeps the whole map in the first viewport", async ({ page }) => {
  await login(page);
  expectHero(await heroBox(page));
  await expect(page.getByTestId("ritual-badge")).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByTestId("week-badge")).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByTestId("season-banner")).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByTestId("village-glance")).toBeVisible();
  await expect(page.getByTestId("score-meta")).toBeVisible();
});

test("a narrow fresh session still fits the map above the fold", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  expectHero(await heroBox(page));
  const host = page.locator("[data-village-host='ready']");
  await expect(host).toHaveAttribute("data-map-fill", "village");
  await expect(host).toHaveAttribute("data-camera-zoom", /2|3/);
  const camY = Number(await host.getAttribute("data-camera-y"));
  const zoom = Number(await host.getAttribute("data-camera-zoom"));
  const spanH = Math.floor(1120 / zoom);
  expect(camY + spanH).toBeLessThan(980);
  const today = page.getByTestId("today-entry");
  await expect(today).toBeVisible();
  await expect(today).toContainText("今日");
  const todayBox = await today.boundingBox();
  expect(todayBox && todayBox.height <= 48 && todayBox.height >= 44).toBeTruthy();
  await expect(page.getByTestId("ritual-badge")).toBeHidden();
  await expect(page.getByTestId("week-badge")).toBeHidden();
  await expect(page.getByTestId("season-banner")).toBeHidden();
  await page.getByTestId("header-fold").click();
  const refresh = await page.getByTestId("refresh-scores").boundingBox();
  expect(refresh && refresh.height >= 44 && refresh.width >= 44).toBeTruthy();
});

test("default panorama plates stay at eight until 全显名牌", async ({ page }) => {
  await login(page);
  const host = page.locator("[data-village-host='ready']");
  await expect(host).toHaveAttribute("data-camera-zoom", "1");
  await expect(host).toHaveAttribute("data-map-fill", "world");
  await expect(host).toHaveAttribute("data-quiet", "1");
  await expect(host).toHaveAttribute("data-plate-cap", "4");
  await expect.poll(async () => Number(await host.getAttribute("data-plate-count"))).toBeLessThanOrEqual(8);
  const body = await roster(page);
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(body.people[0]?.name ?? "");
  await expect.poll(async () => Number(await host.getAttribute("data-plate-count"))).toBeLessThanOrEqual(8);
  await page.getByTestId("quiet-toggle").uncheck();
  await expect(host).toHaveAttribute("data-plate-cap", "8");
  await expect.poll(async () => Number(await host.getAttribute("data-plate-count"))).toBeLessThanOrEqual(8);
  await page.getByTestId("toggle-plates").click();
  await expect(host).toHaveAttribute("data-show-all", "1");
  await expect(host).toHaveAttribute("data-plate-cap", "all");
  await expect.poll(async () => Number(await host.getAttribute("data-plate-count"))).toBeGreaterThanOrEqual(12);
});

test("a wave reply lands on the map and find-me holds", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  const other = body.people.find((person) => person.name !== self)?.name ?? "";
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  await (await ensureRosterRow(page, other)).click();
  await page.getByTestId("signal-actions").getByRole("button", { name: "挥手" }).click();
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-wave-reply", "1");
  await page.keyboard.press("Escape");
  await page.getByTestId("find-me").click();
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-self-highlight", "1");
});
