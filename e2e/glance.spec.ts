import { expect, test } from "@playwright/test";
import { ensureRosterRow, login, openWeekBoard, roster } from "./login";

test("a cleared store opens the visit, not a signal card", async ({ page }) => {
  await login(page);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await expect(page.getByTestId("signal-card")).toHaveCount(0);
  const glance = page.getByTestId("village-glance");
  await expect(glance).toBeVisible();
  await expect(glance).not.toContainText("有分");
  await expect(page.getByTestId("first-run-guide")).toHaveAttribute("data-visit-step", "self");
  await page.getByTestId("score-meta").locator("summary").click();
  const score = page.getByTestId("score-date");
  await expect(score).toContainText("有分");
  const honesty = await score.getAttribute("data-honesty");
  if (honesty === "stale") {
    await expect(score).toContainText("村里仍是此刻");
    await expect(page.getByTestId("score-date-detail")).toContainText("分数仍停在评分日");
    await expect(page.getByTestId("refresh-scores")).toHaveText("刷新评分日");
  }
});

test("three local steps finish the visit and still open a card", async ({ page }) => {
  await login(page);
  await page.evaluate(() => localStorage.removeItem("village:guide-seen-v1"));
  await page.evaluate(() => localStorage.removeItem("village:visit-v1"));
  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  const other = body.people.find((person) => person.name !== self)?.name ?? self;
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  await expect(page.getByTestId("first-run-guide")).toHaveAttribute("data-visit-step", "yard");
  await openWeekBoard(page);
  await page.getByTestId("today-chores").locator("button").first().click();
  await expect(page.getByTestId("first-run-guide")).toHaveAttribute("data-visit-step", "social");
  await (await ensureRosterRow(page, other)).click();
  await page.getByTestId("signal-actions").getByRole("button", { name: "挥手" }).click();
  await expect(page.getByTestId("signal-card")).toContainText("对方也挥了回来");
  await expect(page.getByTestId("history-window")).toBeVisible();
  await expect(page.getByTestId("first-run-guide")).toHaveCount(0);
});
