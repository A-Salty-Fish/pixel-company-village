import { expect, test } from "@playwright/test";
import { login, roster, keepOldGlance } from "./login";

test("escape closes the signal card and returns to that roster row", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const name = body.people.find((person) => person.scored)?.name;
  expect(name).toBeTruthy();
  await page.evaluate((person) => window.__VILLAGE_TEST__?.selectVillager(person ?? null), name);
  const card = page.getByTestId("signal-card");
  await expect(card).toHaveAttribute("role", "dialog");
  await expect(card).toHaveAttribute("aria-labelledby", "signal-sheet-title");
  const close = page.getByRole("button", { name: "关闭信号卡" });
  await expect(close).toBeFocused();
  const row = page.locator(`[data-roster-name="${name}"]`);
  await expect(row).toHaveAttribute("aria-current", "true");
  await expect(row).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(card).toHaveCount(0);
  await expect(row).toBeFocused();
  await expect(row).toHaveAttribute("aria-expanded", "false");
});

test("the password field is at least 44px tall", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await keepOldGlance(page);
  await page.goto("/login");
  const field = page.getByTestId("login-password");
  await expect(field).toBeVisible();
  const box = await field.boundingBox();
  expect(box && box.height >= 44).toBeTruthy();
});

test("narrow split handle is a 44px control and arrow keys move it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  const body = await roster(page);
  const bar = page.getByTestId("split-bar");
  const box = await bar.boundingBox();
  expect(box && box.height >= 44).toBeTruthy();
  await expect(bar).toHaveAttribute("aria-valuemin", "28");
  await expect(bar).toHaveAttribute("aria-valuemax", "78");
  await bar.focus();
  const before = Number(await page.locator(".village-stage").getAttribute("data-split"));
  await page.keyboard.press("ArrowDown");
  const after = Number(await page.locator(".village-stage").getAttribute("data-split"));
  expect(after).toBeGreaterThan(before);
  await page.keyboard.press("Home");
  await expect(page.locator(".village-stage")).toHaveAttribute("data-split", "0.32");
  await page.keyboard.press("End");
  await expect(page.locator(".village-stage")).toHaveAttribute("data-split", "0.78");
  await page.getByTestId("comfort-settings").locator("> summary").click();
  const picker = await page.getByTestId("self-picker").boundingBox();
  expect(picker && picker.height >= 44).toBeTruthy();
  const name = body.people.find((person) => person.scored)?.name;
  await page.evaluate((person) => window.__VILLAGE_TEST__?.selectVillager(person ?? null), name);
  const close = await page.getByRole("button", { name: "关闭信号卡" }).boundingBox();
  expect(close && close.width >= 44 && close.height >= 44).toBeTruthy();
});

test("reduced motion removes the season fade", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  const duration = await page.getByTestId("season-banner").evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(duration.split(",").every((part) => part.trim() === "0s")).toBeTruthy();
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("comfort-decor").locator("> summary").click();
  await page.getByRole("checkbox", { name: /减少动作/ }).check();
  await expect(page.locator(".farm-page")).toHaveAttribute("data-reduce-motion", "1");
});

test("history grid stays visual once a card is open", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const name = body.people[0]?.name;
  await page.evaluate((person) => window.__VILLAGE_TEST__?.selectVillager(person ?? null), name);
  const grid = page.locator(".history-grid");
  await expect(grid).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByTestId("history-window")).toContainText("近 30 日数值");
  await expect(page.getByTestId("history-window")).toContainText("没有录入");
});
