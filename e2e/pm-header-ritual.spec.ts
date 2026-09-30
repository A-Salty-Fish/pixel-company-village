import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

test("header ritual is once a day and names nearby people", async ({ page }) => {
  await login(page);
  await page.getByTestId("ritual-badge").click();
  const ritual = page.getByTestId("header-ritual");
  await expect(ritual).toBeVisible();
  await expect(ritual).toContainText("先选定「我是谁」，再做今日仪式。");
  const act = page.getByTestId("header-ritual-act");
  await expect(act).toContainText("做今日仪式");
  await expect(act).toBeDisabled();
  const box = await act.boundingBox();
  expect(box && box.width >= 44 && box.height >= 44).toBeTruthy();
  await expect(page.getByTestId("ritual-near")).toContainText("身边");
  await expect(ritual).toHaveAttribute("data-ritual-motion", "still");

  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  await expect(act).toBeEnabled();
  await act.click();
  await expect(ritual).toHaveAttribute("data-ritual-done", "1");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-ritual-done", "1");
  await expect(act).toBeDisabled();
  await expect(act).toContainText("今日仪式已做");

  await page.reload();
  await expect(page.getByTestId("header-ritual")).toHaveAttribute("data-ritual-done", "1");
  await expect(page.getByTestId("header-ritual-act")).toBeDisabled();
});
