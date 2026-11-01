import { expect, test } from "@playwright/test";
import { login } from "./login";

type MagicState = { ready: boolean; spells: number; landmarks: number; weather: string[]; level: string };
declare global {
  interface Window {
    __VILLAGE_MAGIC__?: {
      cast(id: string, x: number, y: number): boolean;
      transition(id?: string): boolean;
      statusOn(id: string, index: number, seconds?: number): boolean;
      state(): MagicState;
      look(x: number, y: number, zoom: number): unknown;
    };
  }
}

test("magic town draws landmarks and plays spells, transitions and statuses without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await login(page);
  await page.waitForFunction(() => window.__VILLAGE_MAGIC__?.state().ready);
  await page.evaluate(() => window.__VILLAGE_MAGIC__?.look(608, 660, 3));
  await expect.poll(() => page.evaluate(() => window.__VILLAGE_MAGIC__?.state().landmarks ?? 0)).toBeGreaterThan(0);
  await page.evaluate(() => {
    const magic = window.__VILLAGE_MAGIC__;
    magic?.cast("ice/freeze", 608, 640);
    magic?.cast("pickups/xp-orb", 620, 650);
    magic?.statusOn("status/stunned", 0, 2);
    magic?.transition("transitions/star-iris");
  });
  await expect.poll(() => page.evaluate(() => window.__VILLAGE_MAGIC__?.state().spells ?? 0)).toBeGreaterThan(0);
  // everything winds down on its own
  await expect.poll(() => page.evaluate(() => window.__VILLAGE_MAGIC__?.state().spells ?? -1), { timeout: 15_000 }).toBe(0);
  expect(errors).toEqual([]);
});
