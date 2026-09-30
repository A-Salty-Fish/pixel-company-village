import { expect, test } from "@playwright/test";
import { login, openWeekBoard, roster } from "./login";

test("finished weekly chores stay with that viewer after a reload", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const [first, second] = body.people.map((person) => person.name);
  expect(first && second && first !== second).toBeTruthy();
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(first ?? "");
  await openWeekBoard(page);
  const strip = page.getByTestId("today-chores");
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
  await expect(strip).toHaveAttribute("data-week-kept", "3");
  await expect(strip).toContainText("只记到本周");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-week-ribbon", "1");

  await page.getByTestId("self-picker").selectOption(second ?? "");
  await expect(strip.getByTestId("week-tally")).toContainText("本周 0/3");
  await expect(strip.locator("[data-done='1']")).toHaveCount(0);
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-week-ribbon", "0");

  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await expect(page.getByTestId("today-chores").getByTestId("week-tally")).toContainText("本周 0/3");
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(first ?? "");
  await expect(page.getByTestId("today-chores")).toHaveAttribute("data-week-done", "1");
  await expect(page.getByTestId("today-chores")).toHaveAttribute("data-week-kept", "3");
  await expect(page.getByTestId("today-chores").locator("[data-done='1']")).toHaveCount(3);
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-week-ribbon", "1");
});
