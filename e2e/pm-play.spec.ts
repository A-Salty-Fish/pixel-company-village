import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

const WORLD: Record<string, string> = {
  浇自己的田: "water",
  看一张信号卡: "card",
  在村口站一会儿: "gate",
  给门灯点一下: "porch",
  收一句罐头: "diary",
  沿着小路走三步: "steps",
  看季节色: "season",
  钉一枚名牌: "pin",
  把锄头放下: "rest",
};

test("first-run guide names 减动开关 and stays dismissed", async ({ page }) => {
  await login(page);
  const guide = page.getByTestId("first-run-guide");
  await expect(guide).toBeVisible();
  await expect(guide).toContainText("减动开关");
  await expect(guide).toContainText("村里新事");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-quiet", "1");
  await page.getByTestId("first-run-motion").click();
  await expect(page.getByTestId("wave-d-panel")).toHaveAttribute("open", "");
  await expect(page.getByTestId("wave-toggles").getByText("减动开关", { exact: true })).toBeVisible();
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-quiet", "1");
  await page.getByTestId("first-run-dismiss").click();
  await expect(guide).toHaveCount(0);
  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await expect(page.getByTestId("first-run-guide")).toHaveCount(0);
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-quiet", "1");
  const stored = await page.evaluate(() => window.localStorage.getItem("village:guide-seen-v1"));
  expect(stored).toBe("1");
});

test("finishing a weekly chore leaves a world mark", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  const row = page.getByTestId("today-chores").locator("[data-chore]").first();
  const label = (await row.getAttribute("data-chore")) ?? "";
  const key = WORLD[label];
  expect(key).toBeTruthy();
  const host = page.locator("[data-village-host='ready']");
  await expect(host).toHaveAttribute(`data-world-${key}`, "0");
  const button = row.getByRole("button");
  for (let i = 0; i < 3; i += 1) {
    if ((await row.getAttribute("data-done")) === "1") break;
    await button.click();
  }
  await expect(row).toHaveAttribute("data-done", "1");
  await expect(host).toHaveAttribute(`data-world-${key}`, "1");
  await expect(host).toHaveAttribute("data-quiet", "1");
});

test("a wave gets a canned reply from the other person", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name;
  const target = body.people.find((person) => person.name !== self)?.name;
  expect(self && target).toBeTruthy();
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self ?? "");
  await page.evaluate((name) => window.__VILLAGE_TEST__?.selectVillager(name ?? null), target);
  const card = page.getByTestId("signal-card");
  await card.getByRole("button", { name: "挥手" }).click();
  await expect(card).toContainText("对方也挥了回来。");
  await expect(card.locator("[data-event-line]")).toHaveAttribute("data-social-reply", "wave");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-quiet", "1");
});

test("closed yard panels show how many loops were touched", async ({ page }) => {
  await login(page);
  await expect(page.getByTestId("loop-summary-tally")).toHaveText("0/10");
  await expect(page.getByTestId("nook-summary-tally")).toHaveText("0/10");
  await expect(page.getByTestId("village-loops")).not.toHaveAttribute("open", "");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-quiet", "1");
});
