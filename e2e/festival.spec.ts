import { expect, test } from "@playwright/test";
import { login } from "./login";

const FESTIVALS = [
  { iso: "2026-02-04T02:00:00.000Z", label: "立春", line: "春幡挂上了", season: "winter" },
  { iso: "2026-05-05T02:00:00.000Z", label: "立夏", line: "青苗节", season: "spring" },
  { iso: "2026-08-07T02:00:00.000Z", label: "立秋", line: "收成灯亮了", season: "summer" },
  { iso: "2026-11-07T02:00:00.000Z", label: "立冬", line: "围炉日", season: "autumn" },
] as const;

test("each fixed festival shows a canned line and team totals", async ({ page }) => {
  await login(page);
  await page.evaluate(() => window.__VILLAGE_TEST__?.freezeAnimations(true));
  for (const festival of FESTIVALS) {
    await page.evaluate((iso) => window.__VILLAGE_TEST__?.setClock(iso), festival.iso);
    const banner = page.getByTestId("season-banner");
    await expect(banner).toHaveAttribute("data-festival", festival.label);
    await expect(banner).toContainText(festival.line);
    await expect(banner).toContainText("全村合计，不排名");
    await expect(banner).not.toContainText("垫底");
    const state = await page.evaluate(() => window.__VILLAGE_TEST__?.getState());
    expect(state?.festival).toBe(festival.label);
    expect(state?.season).toBe(festival.season);
  }
});

test("an ordinary day is not a festival", async ({ page }) => {
  await login(page);
  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-09-26T02:00:00.000Z"));
  const banner = page.getByTestId("season-banner");
  await expect(banner).toHaveAttribute("data-festival", "");
  await expect(banner).toContainText("秋日田色");
  await expect(banner).toContainText("一年四节");
  await expect(banner).not.toContainText("今日立春");
  await expect(banner).not.toContainText("今日立夏");
  await expect(banner).not.toContainText("今日立秋");
  await expect(banner).not.toContainText("今日立冬");
  const state = await page.evaluate(() => window.__VILLAGE_TEST__?.getState());
  expect(state?.festival).toBeNull();
  expect(state?.season).toBe("autumn");
});
