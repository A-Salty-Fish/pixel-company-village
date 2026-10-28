import { expect, test, type Page } from "@playwright/test";
import { login, roster } from "./login";

async function freshGuest(page: Page) {
  await page.evaluate(() => {
    window.localStorage.removeItem("village-self-v1");
    window.sessionStorage.removeItem("village-self-session");
    window.localStorage.removeItem("village:visit-v1");
    window.localStorage.removeItem("village:guide-seen-v1");
    window.localStorage.removeItem("village:first-visit-step-v1");
  });
  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
}

test("390 guest sees a dark labeled 我是谁 entry, even after hints are dismissed", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await freshGuest(page);
  const who = page.getByTestId("thumb-who");
  await expect(who).toHaveText("我是谁？点这里选名字");
  await expect(who).toHaveAttribute("data-who-entry", "1");
  const look = await who.evaluate((el) => {
    const box = el.getBoundingClientRect();
    return { h: box.height, w: box.width, bottom: box.bottom, vh: window.innerHeight, bg: getComputedStyle(el).backgroundColor };
  });
  expect(look.h).toBeGreaterThanOrEqual(48);
  expect(look.w).toBeGreaterThan(300);
  expect(look.bottom).toBeLessThanOrEqual(look.vh);
  expect(look.bg).toBe("rgb(106, 61, 24)");

  for (let i = 0; i < 8; i += 1) {
    const dismiss = page.getByTestId("first-run-dismiss");
    if ((await dismiss.count()) === 0 || !(await dismiss.isVisible())) break;
    await dismiss.click();
  }
  await expect(who).toBeVisible();
  await expect(who).toHaveText("我是谁？点这里选名字");
});

test("390 name picker filters, picks on tap, and confirms 已选定", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await freshGuest(page);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  expect(self.length).toBeGreaterThan(0);

  await page.getByTestId("thumb-who").click();
  const sheet = page.getByTestId("who-sheet");
  await expect(sheet).toBeVisible();
  await expect(sheet.getByTestId("who-name-option")).toHaveCount(new Set(body.people.map((p) => p.name)).size);
  await sheet.getByTestId("who-search").fill(self);
  const option = sheet.locator(`[data-who-name="${self}"]`);
  await expect(option).toBeVisible();
  await sheet.getByTestId("who-search").fill("不会有这个名字");
  await expect(sheet.getByTestId("who-name-option")).toHaveCount(0);
  await expect(sheet).toContainText("没找到这个名字");
  await sheet.getByTestId("who-search").fill(self);
  await option.click();

  await expect(sheet).toHaveCount(0);
  await expect(page.getByTestId("who-picked")).toHaveText(`已选定：${self}`);
  await expect(page.getByTestId("thumb-home")).toBeVisible();
  await expect(page.getByTestId("thumb-who")).toHaveText("我是谁");
  await expect(page.getByTestId("who-picked")).toHaveCount(0, { timeout: 6000 });
});

test("1280 guest gets a visible 我是谁 button near the top", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await login(page);
  await freshGuest(page);
  const entry = page.getByTestId("who-entry");
  await expect(entry).toBeVisible();
  await expect(entry).toHaveText("我是谁？点这里选名字");
  const box = await entry.boundingBox();
  expect(box?.y ?? 9999).toBeLessThan(300);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  await entry.click();
  await page.getByTestId("who-sheet").locator(`[data-who-name="${self}"]`).click();
  await expect(page.getByTestId("who-picked")).toHaveText(`已选定：${self}`);
  await expect(entry).toHaveCount(0);
});
