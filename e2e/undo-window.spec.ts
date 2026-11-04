import { expect, type Page, test } from "@playwright/test";
import { login, roster } from "./login";

async function armCard(page: Page) {
  await page.setViewportSize({ width: 420, height: 800 });
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name;
  const target = body.people.find((person) => person.scored && person.name !== self)?.name;
  expect(self && target).toBeTruthy();
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self ?? "");
  await page.evaluate((name) => window.__VILLAGE_TEST__?.selectVillager(name ?? null), target);
}

async function expectUndoLasts(page: Page) {
  const undo = page.getByTestId("kindness-undo");
  await expect(undo).toBeVisible();
  await expect(undo).toContainText("撤销（3秒）");
  const snap = await undo.evaluate((el) => {
    const until = Number(el.getAttribute("data-undo-until"));
    const at = Number(el.getAttribute("data-undo-at"));
    return {
      span: until - at,
      remaining: until - Date.now(),
      at,
      seconds: Number(el.getAttribute("data-undo-seconds")),
      text: el.textContent ?? "",
    };
  });
  expect(snap.span).toBe(3000);
  expect(snap.seconds).toBe(3);
  expect(snap.text).toContain("撤销（3秒）");
  // Stamp is when the bar paints. A throttled confirm can spend part of the 3s
  // before Playwright reads it. At least 1.5s must remain, and the button
  // must still be there at 2.5s after that stamp — not 2.5s after this read,
  // which can already be late enough to walk past the deadline.
  expect(snap.remaining).toBeGreaterThan(1500);
  const waitMs = snap.at + 2500 - Date.now();
  expect(waitMs).toBeGreaterThan(800);
  await page.waitForTimeout(waitMs);
  await expect(undo).toBeVisible();
  expect(Date.now() - snap.at).toBeGreaterThanOrEqual(2500);
  const later = await undo.evaluate((el) => Number(el.getAttribute("data-undo-until")) - Date.now());
  expect(later).toBeGreaterThan(0);
  await undo.getByRole("button", { name: /撤销/ }).click();
  await expect(page.locator("[data-kindness-quota]")).toContainText("今日 0/1");
  await expect(undo).toHaveCount(0);
}

test("kindness undo shows 3 seconds and stays clickable past 2.5s", async ({ page }) => {
  await armCard(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
  await page.getByRole("button", { name: /今日互动|本地互动/ }).click();
  await page.getByRole("button", { name: "种子" }).click();
  await page.getByRole("button", { name: "确认关照" }).click();
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await expectUndoLasts(page);
});

test("secret feed undo uses the same 3 second window", async ({ page }) => {
  await armCard(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
  await page.getByRole("button", { name: "匿名投喂" }).click();
  await page.getByRole("button", { name: "确认投喂" }).click();
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await expectUndoLasts(page);
});
