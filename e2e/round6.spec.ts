import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

test("finishing the three weekly chores hangs a ribbon that stays after the card closes", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name;
  expect(self).toBeTruthy();
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self ?? "");
  const strip = page.getByTestId("today-chores");
  await expect(strip).toHaveAttribute("data-week-done", "0");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-week-ribbon", "0");
  const rows = strip.locator("[data-chore]");
  await expect(rows).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    const row = rows.nth(index);
    const button = row.getByRole("button");
    for (let step = 0; step < 3; step += 1) {
      if ((await row.getAttribute("data-done")) === "1") break;
      await button.click();
    }
    const card = page.getByTestId("signal-card");
    if ((await card.count()) > 0) {
      await page.keyboard.press("Escape");
      await expect(card).toHaveCount(0);
    }
    await expect(row).toHaveAttribute("data-done", "1");
  }
  await expect(strip).toHaveAttribute("data-week-done", "1");
  await expect(page.getByTestId("week-done")).toContainText("三件都做完了");
  await expect(page.getByTestId("week-tally")).toContainText("本周 3/3");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-week-ribbon", "1");
  const other = body.people[1]?.name;
  expect(other && other !== self).toBeTruthy();
  await page.getByTestId("self-picker").selectOption(other ?? "");
  await expect(strip).toHaveAttribute("data-week-done", "0");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-week-ribbon", "0");
  await page.getByTestId("self-picker").selectOption(self ?? "");
  await expect(strip).toHaveAttribute("data-week-done", "1");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-week-ribbon", "1");
  await page.getByTestId("wave-d-panel").locator("summary").click();
  await page.locator("[data-wave-toggle='weekBoard']").uncheck();
  await expect(strip).toHaveCount(0);
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-week-ribbon", "0");
});
