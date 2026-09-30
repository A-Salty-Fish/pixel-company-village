import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

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
