import { expect, test, type Page } from "@playwright/test";
import { login, openWeekBoard, roster } from "./login";

const GROUND: Record<string, string> = {
  spring: "petal",
  summer: "grass",
  autumn: "leaf",
  winter: "tuft",
};

test("体贴设置 shows a one-time tip for 减少动作 and 安静村子", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await login(page);
  const tip = page.getByTestId("settings-discover");
  await expect(tip).toBeVisible();
  await expect(tip).toContainText("减少动作和安静村子在这里。");
  await page.getByTestId("settings-discover-dismiss").click();
  await expect(tip).toHaveCount(0);
  const stored = await page.evaluate(() => window.localStorage.getItem("village:settings-discover-v1"));
  expect(stored).toBe("1");
  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await expect(page.getByTestId("settings-discover")).toHaveCount(0);
});

test("ambient life and seasonal clutter follow quiet and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await login(page);
  const host = page.locator("[data-village-host='ready']");
  await expect(host).toHaveAttribute("data-quiet", "1");
  await expect(host).toHaveAttribute("data-ambient-life", "off");
  await expect(host).toHaveAttribute("data-ground-props", "off");
  await expect(host).toHaveAttribute("data-self-yard", "off");

  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("quiet-toggle").uncheck();
  await expect(host).toHaveAttribute("data-ambient-life", "on");
  await expect(host).toHaveAttribute("data-ambient-count", "5");
  const season = (await host.getAttribute("data-season")) ?? "";
  await expect(host).toHaveAttribute("data-ground-props", GROUND[season] ?? "grass");
  const clusters = Number((await host.getAttribute("data-ground-prop-count")) ?? "0");
  expect(clusters).toBeGreaterThan(4);

  await page.getByTestId("comfort-decor").locator("> summary").click();
  await page.getByTestId("reduce-motion").check();
  await expect(host).toHaveAttribute("data-ambient-life", "off");
  await expect(host).toHaveAttribute("data-ambient-count", "0");
  await expect(host).toHaveAttribute("data-ground-props", GROUND[season] ?? "grass");
});

test("the yard pin stays on the self roof, and a bond stake glows", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  const target = body.people.find((person) => person.name !== self)?.name ?? "";
  expect(self && target).toBeTruthy();

  const host = page.locator("[data-village-host='ready']");
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  await expect(host).toHaveAttribute("data-self-yard", "pin");
  await expect(host).toHaveAttribute("data-kindness-glow", "off");

  await page.evaluate((name) => window.__VILLAGE_TEST__?.selectVillager(name ?? null), target);
  const card = page.getByTestId("signal-card");
  await card.getByRole("button", { name: "挥手" }).click();
  await expect(host).toHaveAttribute("data-bond-posts", "1");
  await expect(host).toHaveAttribute("data-kindness-glow", "soft");
});

async function mapAverage(page: Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas[data-testid='village-map']") as HTMLCanvasElement | null;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return { r: 0, g: 0, b: 0 };
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    const stepX = Math.max(1, Math.floor(canvas.width / 8));
    const stepY = Math.max(1, Math.floor(canvas.height / 8));
    for (let y = stepY; y < canvas.height; y += stepY) {
      for (let x = stepX; x < canvas.width; x += stepX) {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        r += pixel[0];
        g += pixel[1];
        b += pixel[2];
        n += 1;
      }
    }
    return { r: r / n, g: g / n, b: b / n };
  });
}

test("PV-PM-016 quiet night still washes the map when the glance says 夜里", async ({ page }) => {
  await login(page);
  const host = page.locator("[data-village-host='ready']");
  const canvas = page.locator("canvas[data-testid='village-map']");
  const glance = page.getByTestId("village-glance");
  await expect(host).toHaveAttribute("data-quiet", "1");

  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-09-30T04:00:00.000Z"));
  await expect(glance).toContainText("白天");
  await expect(host).toHaveAttribute("data-session-night", "0");
  await expect(host).toHaveAttribute("data-night-wash", "off");
  await expect(host).not.toHaveClass(/night-wash-active/);
  await expect(canvas).toHaveAttribute("data-night-paint", "off");
  await expect(canvas).toHaveAttribute("data-night-wash", "off");
  const day = await mapAverage(page);

  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-09-30T13:00:00.000Z"));
  await expect(glance).toContainText("夜里");
  await expect(host).toHaveAttribute("data-session-night", "1");
  await expect(host).toHaveAttribute("data-quiet", "1");
  await expect(host).toHaveAttribute("data-night-wash", "active");
  await expect(host).toHaveClass(/night-wash-active/);
  await expect(canvas).toHaveAttribute("data-night-paint", "active");
  await expect(canvas).toHaveAttribute("data-night-wash", "active");
  const night = await mapAverage(page);
  expect(night.b).toBeGreaterThan(night.g);
  expect(night.g).toBeLessThan(day.g - 20);
  expect(night.r).toBeLessThan(day.r - 20);
  expect(day.g - day.b).toBeGreaterThan(night.g - night.b + 24);

  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("comfort-decor").locator("> summary").click();
  await page.getByRole("checkbox", { name: /减少动作/ }).check();
  await expect(host).toHaveAttribute("data-night-wash", "active");
  await expect(host).toHaveAttribute("data-night-static", "1");
  await expect(canvas).toHaveAttribute("data-night-paint", "active");
  const still = await mapAverage(page);
  expect(Math.abs(still.g - night.g)).toBeLessThan(12);
  expect(Math.abs(still.b - night.b)).toBeLessThan(12);

  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-09-30T04:00:00.000Z"));
  await expect(glance).toContainText("白天");
  await expect(host).toHaveAttribute("data-night-wash", "off");
  await expect(host).not.toHaveClass(/night-wash-active/);
  await expect(canvas).toHaveAttribute("data-night-paint", "off");
  const restored = await mapAverage(page);
  expect(restored.g).toBeGreaterThan(night.g + 20);
  expect(restored.g - restored.b).toBeGreaterThan(night.g - night.b + 24);
});

test("PV-PM-017 a finished week can leave a glance that is not a wave", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name;
  expect(self).toBeTruthy();
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self ?? "");
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
  const host = page.locator("[data-village-host='ready']");
  await expect(host).toHaveAttribute("data-map-feedback", "none");
  await expect(host).toHaveAttribute("data-wave-reply", "0");
  const glance = page.getByTestId("post-week-glance");
  await expect(glance).toBeVisible();
  await expect(glance).toHaveText("路过看一眼");
  await glance.click();
  await expect(page.getByTestId("post-week-presence")).toHaveAttribute("data-post-week", "done");
  await expect(page.getByTestId("post-week-presence")).toContainText("邻里应了一眼");
  await expect(page.getByTestId("post-week-presence")).not.toContainText("挥手");
  await expect(host).toHaveAttribute("data-yard-resonance", "1");
  await expect(host).toHaveAttribute("data-passing-glance", "1");
  await expect(host).toHaveAttribute("data-map-feedback", "glance");
  await expect(host).toHaveAttribute("data-wave-reply", "0");
  await expect(page.locator("body")).not.toContainText("聊天原文");
});

test("PV-PM-018 mid zoom shows short glyphs and 全显 stays explicit", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  await page.getByTestId("comfort-settings").locator("> summary").click();
  const host = page.locator("[data-village-host='ready']");
  await expect(host).toHaveAttribute("data-plate-mid", "0");
  await expect(host).toHaveAttribute("data-quiet", "1");
  await page.getByTestId("find-me").click();
  await expect(host).toHaveAttribute("data-plate-mid", "1");
  await expect(host).toHaveAttribute("data-plate-short-cap", "4");
  await expect.poll(async () => Number(await host.getAttribute("data-plate-count"))).toBeLessThanOrEqual(8);
  await expect.poll(async () => Number(await host.getAttribute("data-plate-short"))).toBeGreaterThan(0);
  await expect.poll(async () => Number(await host.getAttribute("data-plate-short"))).toBeLessThanOrEqual(4);
  await page.getByTestId("toggle-plates").click();
  await expect(host).toHaveAttribute("data-show-all", "1");
  await expect(host).toHaveAttribute("data-plate-mid", "0");
  await expect(host).toHaveAttribute("data-plate-cap", "all");
  await expect.poll(async () => Number(await host.getAttribute("data-plate-short"))).toBe(0);
});
