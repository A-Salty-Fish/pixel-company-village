import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

async function pickSelf(page: import("@playwright/test").Page) {
  const body = await roster(page);
  const name = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator(":scope > summary").click();
  await page.getByTestId("self-picker").selectOption(name);
  return name;
}

test("同一天再进，页头有一句又见面了", async ({ page }) => {
  await login(page);
  await expect(page.getByTestId("again-today")).toHaveCount(0);
  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  const chip = page.getByTestId("again-today");
  await expect(chip).toBeVisible();
  await expect(chip).toHaveText("又见面了");
  await expect(chip).toBeHidden({ timeout: 4_000 });
  const stored = await page.evaluate(() => window.localStorage.getItem("village:again-today-v1"));
  expect(stored).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test("选定自己后有今日小目标，找我打勾就收起", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await login(page);
  await expect(page.getByTestId("today-touch")).toHaveCount(0);
  await pickSelf(page);
  const strip = page.getByTestId("today-touch");
  await expect(strip).toBeVisible();
  await expect(strip).toHaveText("今日摸一下村里");
  await page.getByTestId("find-me").click();
  await expect(strip).toHaveAttribute("data-state", "done");
  await expect(strip).toContainText("✓");
  await expect(strip).toBeHidden({ timeout: 4_000 });
  await expect(page.getByTestId("village-map")).toHaveAttribute("data-find-prints", "show");
  await expect(page.getByTestId("village-map")).toHaveAttribute("data-find-print-count", "4");
});

test("减少动作时找我只留一枚脚印", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await login(page);
  await pickSelf(page);
  await page.getByTestId("find-me").click();
  await expect(page.getByTestId("village-map")).toHaveAttribute("data-find-prints", "show");
  await expect(page.getByTestId("village-map")).toHaveAttribute("data-find-print-count", "1");
});

test("今日仪式也能收起小目标", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await login(page);
  await pickSelf(page);
  await page.getByTestId("ritual-badge").click();
  await page.getByTestId("header-ritual-act").click();
  await expect(page.getByTestId("today-touch")).toHaveAttribute("data-state", "done");
  await expect(page.getByTestId("today-touch")).toBeHidden({ timeout: 4_000 });
});

test("回家时屋檐亮一下", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await login(page);
  await expect(page.locator("[data-village-host]")).toHaveAttribute("data-home-breath", "off");
  await pickSelf(page);
  await expect(page.locator("[data-village-host]")).toHaveAttribute("data-home-breath", "glow");
  const flash = page.waitForFunction(
    () => document.querySelector("[data-village-host]")?.getAttribute("data-home-breath") === "flash",
  );
  await page.getByTestId("map-tools").getByTestId("map-home").click();
  await flash;
});

test("夜里第一次出村会挽留，再待就不会马上走", async ({ page }) => {
  await login(page);
  await page.evaluate(() => {
    window.localStorage.removeItem("village:night-hold-v1");
    window.__VILLAGE_TEST__?.setClock("2026-10-01T14:30:00.000Z");
  });
  await expect(page.getByTestId("village-glance")).toContainText("夜里");
  await page.getByTestId("exit-village").click();
  const hold = page.getByTestId("night-hold");
  await expect(hold).toBeVisible();
  await expect(hold).toContainText("路上慢点");
  await page.getByTestId("night-hold-stay").click();
  await expect(hold).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
  await page.getByTestId("exit-village").click();
  await expect(page.getByTestId("night-hold")).toHaveCount(0);
  await expect(page.getByTestId("exit-soft-bye")).toHaveText("慢慢走。村口还在。");
  await page.waitForURL("**/login", { timeout: 8_000 });
});

test("秋意开关能关掉轻叶子，广场标记在地图上", async ({ page }) => {
  await login(page);
  await expect(page.getByTestId("village-map")).toHaveAttribute("data-plaza-sit", /off|still|sit/);
  const host = page.locator("[data-village-host]");
  const before = await host.getAttribute("data-october-wisp");
  expect(before === "drift" || before === "still" || before === "off").toBe(true);
  await page.getByTestId("comfort-settings").locator(":scope > summary").click();
  await page.locator("[data-testid='comfort-decor'] > summary").click();
  await page.getByTestId("october-wisp-toggle").click();
  if (before === "off") {
    await expect(host).toHaveAttribute("data-october-wisp", /drift|still/);
  } else {
    await expect(host).toHaveAttribute("data-october-wisp", "off");
  }
});
