import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

test("a stale score day is not called today", async ({ page }) => {
  await login(page);
  await page.getByTestId("score-meta").locator("summary").click();
  const date = page.getByTestId("score-date");
  await expect(date).toHaveAttribute("data-honesty", "stale");
  await expect(date).toContainText("村里仍是此刻");
  await expect(date).not.toContainText("今日");
  await expect(page.getByTestId("score-date-detail")).toContainText("分数仍停在评分日");
  await expect(page.getByTestId("score-date-detail")).not.toContainText("今日");
  await expect(page.getByTestId("refresh-scores")).toHaveText("刷新评分日");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-quiet", "1");
});

test("a familiar neighbor gets a closer canned wave", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  const target = body.people.find((person) => person.name !== self)?.name ?? "";
  expect(self && target).toBeTruthy();
  await page.evaluate(({ viewer, name }) => {
    const days = ["2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04", "2026-08-05", "2026-08-06"];
    window.localStorage.setItem(
      `village:viewer:${viewer}:kindness`,
      JSON.stringify({ [name]: { days, weekCounts: {} } }),
    );
  }, { viewer: self, name: target });
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  await page.evaluate((name) => window.__VILLAGE_TEST__?.selectVillager(name ?? null), target);
  const card = page.getByTestId("signal-card");
  await card.getByRole("button", { name: "挥手" }).click();
  await expect(card).toContainText("挥得很熟");
  await expect(card.locator("[data-event-line]")).toHaveAttribute("data-social-reply", "wave");
  const stored = await page.evaluate(
    (viewer) => window.localStorage.getItem(`village:viewer:${viewer}:kindness`) ?? "",
    self,
  );
  expect(stored).not.toContain("挥得很熟");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-quiet", "1");
});
