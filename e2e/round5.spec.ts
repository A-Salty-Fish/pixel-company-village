import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

test("a weekly chore can be finished from the board and then stays done", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name;
  expect(self).toBeTruthy();
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self ?? "");
  const row = page.getByTestId("today-chores").locator("[data-chore]").first();
  const button = row.getByRole("button");
  await expect(button).toBeEnabled();
  for (let i = 0; i < 3; i += 1) {
    if ((await row.getAttribute("data-done")) === "1") break;
    await button.click();
  }
  await expect(row).toHaveAttribute("data-done", "1");
  await expect(button).toBeDisabled();
  await expect(page.getByTestId("today-chores")).toContainText("不公示");
  await expect(page.getByTestId("today-chores")).toContainText("可在村里新事里关掉");
});
