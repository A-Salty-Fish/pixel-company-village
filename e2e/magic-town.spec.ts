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
      screen(x: number, y: number): { x: number; y: number } | null;
      play(): { badges: string[]; progress: { counts: Record<string, number> } } | null;
      chorus(a: number, b: number): boolean;
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

async function tapWorld(page: import("@playwright/test").Page, x: number, y: number) {
  const at = await page.evaluate(([x, y]) => window.__VILLAGE_MAGIC__?.screen(x, y), [x, y] as const);
  if (!at) throw new Error("no canvas");
  await page.mouse.click(at.x, at.y);
}

test("wizard play: fountain wishes, the portal trip, a charged spell and the chorus all answer real taps", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await login(page);
  await page.waitForFunction(() => window.__VILLAGE_MAGIC__?.state().ready);
  const toast = page.getByTestId("magic-toast");
  await page.evaluate(() => window.__VILLAGE_MAGIC__?.look(300, 210, 2));
  for (let i = 0; i < 3; i += 1) {
    await tapWorld(page, 300, 196);
    await page.waitForTimeout(350);
  }
  await expect(toast).toHaveAttribute("data-shown", "1");
  await expect.poll(() => page.evaluate(() => window.__VILLAGE_MAGIC__?.play()?.badges ?? [])).toContain("wish-3");

  // the gate portal flies the camera to the warp pad and back
  await page.evaluate(() => window.__VILLAGE_MAGIC__?.look(66, 200, 2));
  await page.waitForTimeout(300);
  await tapWorld(page, 66, 196);
  await expect.poll(async () => {
    const pad = await page.evaluate(() => window.__VILLAGE_MAGIC__?.screen(34, 656));
    const box = await page.locator("canvas[data-village-ready='1']").boundingBox();
    return Boolean(pad && box && pad.y > box.y && pad.y < box.y + box.height);
  }).toBe(true);
  await page.waitForTimeout(500);
  await tapWorld(page, 34, 656);
  await expect.poll(() => page.evaluate(() => window.__VILLAGE_MAGIC__?.play()?.badges ?? [])).toContain("portal-trip");

  // a long press charges, dragging draws the staff trail, release casts the big one
  await page.waitForTimeout(800);
  await page.evaluate(() => window.__VILLAGE_MAGIC__?.look(470, 500, 2));
  await page.waitForTimeout(300);
  const at = await page.evaluate(() => window.__VILLAGE_MAGIC__?.screen(470, 500));
  await page.mouse.move(at!.x, at!.y);
  await page.mouse.down();
  await page.waitForTimeout(1000);
  for (let i = 0; i <= 16; i += 1) await page.mouse.move(at!.x + i * 12, at!.y + Math.sin(i / 3) * 20);
  await expect.poll(() => page.evaluate(() => (window.__VILLAGE_MAGIC__?.state() as unknown as { play?: { charging: boolean } }).play?.charging)).toBe(true);
  await page.waitForTimeout(250);
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.__VILLAGE_MAGIC__?.play()?.badges ?? [])).toContain("first-ultimate");
  expect(await page.evaluate(() => window.__VILLAGE_MAGIC__?.play()?.progress.counts.trail ?? 0)).toBe(1);

  expect(await page.evaluate(() => window.__VILLAGE_MAGIC__?.chorus(0, 1))).toBe(true);
  await expect(toast).toContainText(/合唱|小成就/);
  // only counts and badge ids are kept on the device
  const stored = await page.evaluate(() => `${localStorage.getItem("village-magic-play-v1")}${localStorage.getItem("village-magic-badges-v1")}`);
  expect(stored).toMatch(/portal-trip/);
  expect(stored).not.toMatch(/name|text|message/i);

  await page.getByTestId("comfort-settings").locator("> summary").click();
  await expect(page.getByTestId("magic-quest")).toContainText("今日魔法任务");
  await expect(page.getByTestId("magic-howto")).toContainText("长按");
  expect(errors).toEqual([]);
});

test("reduced motion keeps wizard play still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  await page.waitForFunction(() => window.__VILLAGE_TEST__?.ready?.());
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__VILLAGE_MAGIC__?.look(300, 210, 2));
  for (let i = 0; i < 3; i += 1) await tapWorld(page, 300, 196).catch(() => undefined);
  expect(await page.evaluate(() => window.__VILLAGE_MAGIC__?.play() ?? null)).toBeNull();
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await expect(page.getByTestId("magic-howto")).toContainText("减少动作");
});
