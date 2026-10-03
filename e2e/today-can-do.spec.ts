import { expect, test } from "@playwright/test";
import { login, roster, keepOldGlance } from "./login";

test("today hint sits on the map corner with the three lines, then leaves after a person", async ({ page }) => {
  await keepOldGlance(page);
  await page.goto("/login");
  await page.evaluate(() => {
    window.sessionStorage.setItem("village:today-hint-start-v1", "1");
    window.sessionStorage.setItem("village:today-hint-dismiss-v1", "1");
  });
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);

  const hint = page.getByTestId("today-can-do");
  await expect(hint).toBeVisible();
  await expect(hint).toHaveAttribute("data-today-hint", /show|fade/);
  await expect(hint).toContainText("今日可做");
  await expect(hint).toContainText("点一盏门灯");
  await expect(hint).toContainText("做一件本周小事");
  await expect(hint).toContainText("找一个人");
  await expect(hint).not.toHaveAttribute("role", "dialog");

  const place = await hint.evaluate((el) => {
    const slot = el.closest("[data-testid='village-map-slot']");
    if (!slot) return null;
    const hintBox = el.getBoundingClientRect();
    const slotBox = slot.getBoundingClientRect();
    const style = getComputedStyle(el);
    return {
      inSlot: true,
      nearTop: hintBox.top - slotBox.top < slotBox.height * 0.45,
      onRight: slotBox.right - hintBox.right < slotBox.width * 0.35,
      z: Number.parseInt(style.zIndex, 10),
      clipped: hintBox.height < 8 || hintBox.width < 8,
    };
  });
  expect(place?.inSlot).toBe(true);
  expect(place?.nearTop).toBe(true);
  expect(place?.onRight).toBe(true);
  expect(place?.clipped).toBe(false);
  expect(place?.z ?? 0).toBeGreaterThanOrEqual(16);

  await page.locator("[data-roster-item]").first().click();
  await expect(hint).toHaveCount(0);
  await expect(page.locator("[data-today-hint]").first()).toHaveAttribute("data-today-hint", "off");
});
