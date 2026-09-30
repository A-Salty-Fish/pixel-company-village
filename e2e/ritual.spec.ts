import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

test("first glance is the village, and a cleared store does not open a card", async ({ page }) => {
  await login(page);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await expect(page.getByTestId("signal-card")).toHaveCount(0);
  await expect(page.getByTestId("village-glance")).toBeVisible();
  await expect(page.getByTestId("village-glance")).not.toContainText("有分");
  await expect(page.getByTestId("ritual-guide")).toBeVisible();
  await expect(page.getByTestId("ritual-guide")).toHaveAttribute("data-ritual-step", "self");
  await expect(page.locator("[data-plate-cap]")).toHaveAttribute("data-plate-cap", "8");

  await page.getByTestId("wave-d-panel").locator("summary").click();
  await expect(page.getByTestId("reduce-motion-row")).toContainText("减动开关");
  await page.getByTestId("reduce-motion-toggle").check();
  await expect(page.locator(".farm-page")).toHaveAttribute("data-reduce-motion", "1");
  await page.getByTestId("reduce-motion-toggle").uncheck();
  await expect(page.locator(".farm-page")).toHaveAttribute("data-reduce-motion", "0");
});

test("a chore sparks the map and a wave gets a reply", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name;
  const other = body.people.find((person) => person.name !== self)?.name ?? self;
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self ?? "");
  await expect(page.getByTestId("ritual-guide")).toHaveAttribute("data-ritual-step", "yard");

  const chore = page.getByTestId("today-chores").locator("button").first();
  await chore.click();
  await expect(page.locator("[data-chore-juice]")).toHaveAttribute("data-chore-juice", "1");
  await expect(page.getByTestId("ritual-guide")).toHaveAttribute("data-ritual-step", "social");

  await page.locator(`[data-roster-name="${other}"]`).click();
  await page.getByTestId("signal-actions").getByRole("button", { name: "挥手" }).click();
  await expect(page.getByTestId("signal-card")).toContainText("对方也挥了挥手。");
  const honesty = await page.getByTestId("score-date").getAttribute("data-honesty");
  if (honesty === "stale") {
    await expect(page.getByTestId("signal-card")).toContainText("村里仍是此刻");
  }
  await expect(page.getByTestId("familiar-note")).toContainText("熟识 1/3");
  await expect(page.getByTestId("ritual-guide")).toHaveCount(0);
});

test("system reduced motion is already on", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  await expect(page.locator(".farm-page")).toHaveAttribute("data-reduce-motion", "1");
  await context.close();
});
