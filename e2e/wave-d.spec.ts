import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

test("visitor banner is visible before identity is chosen", async ({ page }) => {
  await login(page);
  await expect(page.getByTestId("visitor-banner")).toContainText("访客模式");
  await expect(page.getByTestId("weather-chip")).toBeVisible();
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator("summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  await expect(page.getByTestId("visitor-banner")).toHaveCount(0);
});

test("wave d actions stay local and canned", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator("summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  await page.getByTestId("wave-d-panel").locator("summary").click();
  await expect(page.getByTestId("week-board")).toContainText("不公示");
  await page.getByTestId("water-crop").click();
  await expect(page.getByTestId("wave-d-panel")).toContainText("浇");
  await page.getByTestId("go-home").click();
  await expect(page.locator("[data-village-host='ready']")).toBeVisible();
  const stored = await page.evaluate((name) => window.localStorage.getItem(`village:viewer:${name}:wave-d`), self);
  expect(stored ?? "").not.toMatch(/聊天|原文|transcript/);
  await page.getByTestId("save-postcard").click();
  await expect(page.getByTestId("postcard-note")).toContainText("不上传");
});

test("festival clocks keep the village mounted", async ({ page }) => {
  await login(page);
  for (const iso of ["2026-02-04T02:00:00.000Z", "2026-05-05T02:00:00.000Z", "2026-08-07T02:00:00.000Z", "2026-11-07T02:00:00.000Z"]) {
    await page.evaluate((value) => window.__VILLAGE_TEST__?.setClock(value), iso);
    await expect(page.getByTestId("village-header")).toBeVisible();
    await expect(page.getByTestId("season-banner")).toBeVisible();
  }
});
