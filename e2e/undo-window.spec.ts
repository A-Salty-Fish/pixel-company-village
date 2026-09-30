import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

test("kindness undo stays clickable for at least 2.5s and the label matches", async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 800 });
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name;
  const target = body.people.find((person) => person.scored && person.name !== self)?.name;
  expect(self && target).toBeTruthy();
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self ?? "");
  await page.evaluate((name) => window.__VILLAGE_TEST__?.selectVillager(name ?? null), target);
  await page.getByRole("button", { name: /今日互动|本地互动/ }).click();
  await page.getByRole("button", { name: "种子" }).click();
  await page.getByRole("button", { name: "确认关照" }).click();

  const undo = page.getByTestId("kindness-undo");
  await expect(undo).toBeVisible();
  await expect(undo).toContainText("撤销（3秒）");
  const opened = await undo.evaluate((el) => {
    const until = Number(el.getAttribute("data-undo-until"));
    const at = Number(el.getAttribute("data-undo-at"));
    const seconds = Number(el.getAttribute("data-undo-seconds"));
    const budget = Number(el.getAttribute("data-undo-ms"));
    return {
      until,
      remaining: until - Date.now(),
      seconds,
      budget,
      text: el.textContent ?? "",
      mathMatches: seconds === Math.ceil((until - at) / 1000),
    };
  });
  expect(opened.budget).toBeGreaterThanOrEqual(3000);
  expect(opened.remaining).toBeGreaterThanOrEqual(2500);
  expect(opened.seconds).toBe(3);
  expect(opened.mathMatches).toBeTruthy();
  expect(opened.text).toContain("撤销（3秒）");

  await page.waitForFunction((deadline) => Date.now() >= deadline - 500, opened.until);
  await expect(undo).toBeVisible();
  const later = await undo.evaluate((el) => {
    const until = Number(el.getAttribute("data-undo-until"));
    const at = Number(el.getAttribute("data-undo-at"));
    const seconds = Number(el.getAttribute("data-undo-seconds"));
    const text = el.textContent ?? "";
    return {
      remaining: until - Date.now(),
      seconds,
      labelMatches: text.includes(`撤销（${seconds}秒）`),
      mathMatches: seconds === Math.ceil((until - at) / 1000),
    };
  });
  expect(later.remaining).toBeGreaterThan(0);
  expect(later.seconds).toBeGreaterThanOrEqual(1);
  expect(later.labelMatches).toBeTruthy();
  expect(later.mathMatches).toBeTruthy();
  await undo.getByRole("button", { name: /撤销/ }).click();
  await expect(page.locator("[data-kindness-quota]")).toContainText("今日 0/1");
  await expect(undo).toHaveCount(0);
});
