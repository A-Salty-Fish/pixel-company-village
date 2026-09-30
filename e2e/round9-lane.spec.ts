import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

test("lane errands stay with the viewer who walked them", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const [first, second] = body.people.map((person) => person.name);
  expect(first && second && first !== second).toBeTruthy();
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(first ?? "");
  await page.getByTestId("wave-d-panel").locator("> summary").click();

  const host = page.locator("[data-village-host='ready']");
  await page.getByTestId("lane-well").click();
  await expect(page.getByTestId("wave-line")).toHaveText("井水打上来了。");
  await expect(host).toHaveAttribute("data-lane-well", "1");
  await page.getByTestId("lane-well").click();
  await expect(page.getByTestId("wave-line")).toHaveText("今天已经打过井水。");

  await page.getByTestId("lane-fence").click();
  await page.getByTestId("lane-lantern").click();
  await page.getByTestId("lane-hat").click();
  await page.getByTestId("lane-gate").click();
  await page.getByTestId("lane-bridge").click();
  await page.getByTestId("lane-stone").click();
  await page.getByTestId("lane-wind").click();
  await expect(page.getByTestId("wave-line")).toContainText("今天的风朝");
  await page.getByTestId("lane-ducks").click();
  await expect(page.getByTestId("wave-line")).toHaveText("数到一只鸭。已数 1/3。");
  await expect(host).toHaveAttribute("data-lane-lantern", "1");
  await expect(host).toHaveAttribute("data-lane-gate", "1");
  await expect(host).toHaveAttribute("data-lane-stone", "1");
  await expect(host).toHaveAttribute("data-lane-ducks", "1");

  for (let n = 0; n < 2; n += 1) await page.getByTestId("lane-ducks").click();
  await expect(host).toHaveAttribute("data-lane-ducks", "3");
  await page.getByTestId("lane-ducks").click();
  await expect(page.getByTestId("wave-line")).toHaveText("鸭子已经数到三只。");

  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-lane-well", "1");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-lane-ducks", "3");

  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(second ?? "");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-lane-well", "0");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-lane-lantern", "0");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-lane-ducks", "0");

  await page.getByTestId("self-picker").selectOption(first ?? "");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-lane-well", "1");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-lane-gate", "1");
  await expect(page.locator("body")).not.toContainText("聊天原文");
  await expect(page.locator("body")).not.toContainText("消息内容");
});

test("reduced motion keeps the lane ducks still", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const first = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(first);
  await page.getByTestId("comfort-decor").locator("> summary").click();
  const host = page.locator("[data-village-host='ready']");
  await expect(host).toHaveAttribute("data-lane-bob", "1");
  await page.getByTestId("reduce-motion").check();
  await expect(host).toHaveAttribute("data-lane-bob", "0");
  await expect(page.locator(".farm-page")).toHaveAttribute("data-reduce-motion", "1");
});
