import { expect, type Page, test } from "@playwright/test";
import { login, roster } from "./login";

async function openCard(page: Page) {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  const target = body.people.find((person) => person.scored && person.name !== self)?.name ?? "";
  expect(self && target).toBeTruthy();
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  await page.evaluate((name) => window.__VILLAGE_TEST__?.selectVillager(name), target);
  return target;
}

async function expectEscCloses(page: Page, name: string) {
  const card = page.getByTestId("signal-card");
  const row = page.locator(`[data-roster-name="${name}"]`);
  await page.keyboard.press("Escape");
  await expect(card).toHaveCount(0);
  await expect(page.getByTestId("kindness-undo")).toHaveCount(0);
  await expect(row).toBeFocused();
  await expect(row).toHaveAttribute("aria-expanded", "false");
}

test("escape before kindness confirm closes the card and restores the roster row", async ({ page }) => {
  const name = await openCard(page);
  await page.getByRole("button", { name: /今日互动|本地互动/ }).click();
  await page.getByRole("button", { name: "种子" }).click();
  await expect(page.getByTestId("kindness-confirm")).toBeVisible();
  await expectEscCloses(page, name);
  await expect(page.locator("[data-kindness-quota]")).toHaveCount(0);
});

test("escape after kindness confirm closes the card, drops undo, and restores the roster row", async ({ page }) => {
  const name = await openCard(page);
  await page.getByRole("button", { name: /今日互动|本地互动/ }).click();
  await page.getByRole("button", { name: "种子" }).click();
  await page.getByRole("button", { name: "确认关照" }).click();
  await expect(page.getByTestId("kindness-undo")).toBeVisible();
  await expectEscCloses(page, name);
  await page.evaluate((person) => window.__VILLAGE_TEST__?.selectVillager(person), name);
  await expect(page.locator("[data-kindness-quota]")).toContainText("今日 1/1");
});

test("escape before secret feed confirm closes the card and restores the roster row", async ({ page }) => {
  const name = await openCard(page);
  await page.getByRole("button", { name: "匿名投喂" }).click();
  await expect(page.getByTestId("secret-confirm")).toBeVisible();
  await expectEscCloses(page, name);
});

test("escape after secret feed confirm closes the card, drops undo, and restores the roster row", async ({ page }) => {
  const name = await openCard(page);
  await page.getByRole("button", { name: "匿名投喂" }).click();
  await page.getByRole("button", { name: "确认投喂" }).click();
  await expect(page.getByTestId("kindness-undo")).toBeVisible();
  await expectEscCloses(page, name);
  await page.evaluate((person) => window.__VILLAGE_TEST__?.selectVillager(person), name);
  await expect(page.locator("[data-kindness-quota]")).toContainText("今日 1/1");
});
