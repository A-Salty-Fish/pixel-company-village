import { keepOldGlance } from "./login";
import { expect, test } from "@playwright/test";
import { isSolarPlaceholder } from "./solar-banlist";

test("login, roster, and one scored card", async ({ page }) => {
  const password = process.env.SITE_PASSWORD;
  if (!password || password.length < 4) throw new Error("SITE_PASSWORD is missing");

  await keepOldGlance(page);
  await page.goto("/login");
  await page.getByTestId("login-password").fill(password);
  await expect(page.getByTestId("login-password")).toHaveValue(password);
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/" || url.searchParams.has("error"), { timeout: 20_000 }),
    page.getByTestId("login-submit").click(),
  ]);
  if (new URL(page.url()).searchParams.get("error")) {
    throw new Error("login_rejected");
  }
  await page.waitForSelector("canvas[data-village-ready='1']");
  await expect(page.getByTestId("comfort-settings")).toBeVisible();

  const scores = await page.request.get("/api/scores");
  expect(scores.ok()).toBeTruthy();
  const body = (await scores.json()) as {
    date: string;
    people: { name: string; scored: boolean }[];
  };
  expect(body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(body.people.length).toBeGreaterThanOrEqual(12);
  const solar = body.people.map((person) => person.name).filter(isSolarPlaceholder);
  expect(solar).toEqual([]);
  expect(body.people.some((person) => person.scored)).toBeTruthy();
  expect(body.people.some((person) => !person.scored)).toBeTruthy();

  await page.waitForFunction(() => window.__VILLAGE_TEST__?.ready());
  const state = await page.evaluate(() => window.__VILLAGE_TEST__?.getState());
  expect(state?.rosterNames.length).toBeGreaterThanOrEqual(12);
  expect(state?.rosterNames.some((name) => isSolarPlaceholder(name))).toBeFalsy();
  expect(state?.season).toBeTruthy();

  const scoredName = body.people.find((person) => person.scored)?.name;
  expect(scoredName).toBeTruthy();
  await page.evaluate((name) => window.__VILLAGE_TEST__?.selectVillager(name ?? null), scoredName);
  const card = page.getByTestId("signal-card");
  await expect(card).toBeVisible();
  await expect(card).toContainText(scoredName ?? "");
  await expect(card).toContainText("信号卡");
  await expect(card.getByTestId("data-date")).toBeVisible();
  await expect(card.getByText("今日暂无评分")).toHaveCount(0);
  const history = card.getByTestId("history-window");
  await expect(history).toContainText("30");
  await expect(history).toContainText("不铺到全村地图");
  await expect(history.locator("[data-history-present='1']").first()).toBeVisible();
});
