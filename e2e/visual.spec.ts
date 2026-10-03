import { expect, test } from "@playwright/test";
import { login, roster, keepOldGlance } from "./login";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
});

test("login wall @visual", async ({ page }) => {
  await keepOldGlance(page);
  await page.goto("/login");
  await expect(page.getByTestId("login-form")).toBeVisible();
  await expect(page.getByTestId("login-form")).toHaveScreenshot("login-wall.png", { animations: "disabled" });
});

test("frozen map overview @visual", async ({ page }) => {
  await login(page);
  await page.evaluate(() => {
    window.__VILLAGE_TEST__?.setClock("2026-09-26T02:00:00.000Z");
    window.__VILLAGE_TEST__?.freezeAnimations(true);
  });
  const map = page.locator("[data-village-host='ready']");
  await expect(map).toBeVisible();
  await expect(map).toHaveScreenshot("map-overview.png", { animations: "disabled" });
});

test("busy map overview @visual", async ({ page }) => {
  await login(page);
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByRole("checkbox", { name: /安静村子/ }).uncheck();
  await page.evaluate(() => {
    window.__VILLAGE_TEST__?.setClock("2026-09-26T02:00:00.000Z");
    window.__VILLAGE_TEST__?.freezeAnimations(true);
  });
  const map = page.locator("[data-village-host='ready']");
  await expect(map).toHaveAttribute("data-quiet", "0");
  await expect(map).toHaveAttribute("data-particle-budget", /[1-9]/);
  await expect(map).toHaveScreenshot("map-overview-busy.png", { animations: "disabled" });
});

test("scored signal card @visual", async ({ page }) => {
  await login(page);
  await page.evaluate(() => {
    window.__VILLAGE_TEST__?.setClock("2026-09-26T02:00:00.000Z");
    window.__VILLAGE_TEST__?.freezeAnimations(true);
  });
  const body = await roster(page);
  const name = body.people.find((person) => person.scored)?.name;
  await page.evaluate((person) => window.__VILLAGE_TEST__?.selectVillager(person ?? null), name);
  const card = page.getByTestId("signal-card");
  await expect(card.getByTestId("history-window")).toContainText("30");
  await expect(card.locator("[data-history-present='1']").first()).toBeVisible();
  await expect(card).toHaveScreenshot("score-card-scored.png", { animations: "disabled" });
});

test("unscored signal card @visual", async ({ page }) => {
  await login(page);
  await page.evaluate(() => {
    window.__VILLAGE_TEST__?.setClock("2026-09-26T02:00:00.000Z");
    window.__VILLAGE_TEST__?.freezeAnimations(true);
  });
  const body = await roster(page);
  const name = body.people.find((person) => !person.scored)?.name;
  await page.evaluate((person) => window.__VILLAGE_TEST__?.selectVillager(person ?? null), name);
  const card = page.getByTestId("signal-card");
  await expect(card).toContainText("未评分");
  await expect(card.getByTestId("history-window")).toBeVisible();
  await expect(card.locator("[data-history-present='1']").first()).toBeVisible();
  await expect(card).toHaveScreenshot("score-card-unscored.png", { animations: "disabled" });
});

test("comfort settings @visual", async ({ page }) => {
  await login(page);
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await expect(page.getByTestId("self-picker")).toBeVisible();
  await expect(page.getByTestId("comfort-settings")).toHaveScreenshot("comfort-settings.png", {
    animations: "disabled",
  });
});

test("season banner @visual", async ({ page }) => {
  await login(page);
  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-02-04T02:00:00.000Z"));
  const banner = page.getByTestId("season-banner");
  await expect(banner).toContainText("立春");
  await expect(banner).toHaveScreenshot("season-banner.png", { animations: "disabled" });
});
