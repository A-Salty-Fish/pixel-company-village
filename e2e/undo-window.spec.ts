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
      seconds: Number(el.getAttribute("data-undo-seconds")),
      text: el.textContent ?? "",
    };
  });
  expect(snap.span).toBe(3000);
  expect(snap.seconds).toBe(3);
  expect(snap.text).toContain("撤销（3秒）");
  expect(snap.remaining).toBeGreaterThan(2000);
  const seen = Date.now();
  await page.waitForTimeout(2500);
  await expect(undo).toBeVisible();
  expect(Date.now() - seen).toBeGreaterThanOrEqual(2500);
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
