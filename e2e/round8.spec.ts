import { expect, test } from "@playwright/test";
import { login, roster, openVillageDrawer } from "./login";

test("yard errands stay on the viewer who did them", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const [first, second] = body.people.map((person) => person.name);
  expect(first && second && first !== second).toBeTruthy();
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(first ?? "");
  await openVillageDrawer(page);
  await page.getByTestId("wave-d-panel").locator("> summary").click();

  const host = page.locator("[data-village-host='ready']");
  await expect(host).toHaveAttribute("data-path-wear", "1");
  await page.getByTestId("yard-hen").click();
  await expect(page.getByTestId("wave-line")).toHaveText("给鸡撒了一把谷。");
  await expect(host).toHaveAttribute("data-yard-hen", "1");
  await page.getByTestId("yard-hen").click();
  await expect(page.getByTestId("wave-line")).toHaveText("今天已经喂过鸡。");
  await expect(host).toHaveAttribute("data-yard-hen", "1");

  await page.getByTestId("yard-laundry").click();
  await page.getByTestId("yard-stove").click();
  await page.getByTestId("yard-shutters").click();
  await page.getByTestId("yard-bowl").click();
  await page.getByTestId("yard-pepper").click();
  await page.getByTestId("yard-bell").click();
  await page.getByTestId("yard-grain").click();
  await page.getByTestId("yard-sweep").click();
  await expect(page.getByTestId("wave-line")).toHaveText("门前扫过了。");
  await expect(host).toHaveAttribute("data-yard-laundry", "1");
  await expect(host).toHaveAttribute("data-yard-stove", "1");
  await expect(host).toHaveAttribute("data-yard-bell", "1");
  await expect(host).toHaveAttribute("data-yard-grain", "1");
  await expect(host).toHaveAttribute("data-path-wear", "0");
  await expect(page.getByTestId("yard-bell")).toContainText("1/3");

  for (let n = 0; n < 2; n += 1) await page.getByTestId("yard-bell").click();
  await expect(host).toHaveAttribute("data-yard-bell", "3");
  await page.getByTestId("yard-bell").click();
  await expect(page.getByTestId("wave-line")).toHaveText("铃只记三次，没有声音。");
  await expect(host).toHaveAttribute("data-yard-bell", "3");

  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-yard-hen", "1");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-path-wear", "0");

  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(second ?? "");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-yard-hen", "0");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-yard-laundry", "0");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-path-wear", "1");

  await page.getByTestId("self-picker").selectOption(first ?? "");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-yard-hen", "1");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-yard-bell", "3");
  await expect(page.locator("body")).not.toContainText("聊天原文");
  await expect(page.locator("body")).not.toContainText("消息内容");
});

test("night wash and critters follow the clock without extra noise", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const first = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(first);
  await page.getByTestId("quiet-toggle").uncheck();
  const host = page.locator("[data-village-host='ready']");

  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-09-30T04:00:00.000Z"));
  await expect(host).toHaveAttribute("data-critters", "butterfly");
  await expect(host).toHaveAttribute("data-night", "0");

  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-09-29T23:00:00.000Z"));
  await expect(host).toHaveAttribute("data-critters", "sparrow");

  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-09-30T13:00:00.000Z"));
  await expect(host).toHaveAttribute("data-critters", "firefly");
  await expect(host).toHaveAttribute("data-night", "1");
  await expect(host).toHaveAttribute("data-dusk", "0");

  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-09-30T15:00:00.000Z"));
  await expect(host).toHaveAttribute("data-critters", "moth");
  await expect(host).toHaveAttribute("data-night", "1");

  await page.getByTestId("quiet-toggle").check();
  await expect(host).toHaveAttribute("data-critters", "none");
  await expect(host).toHaveAttribute("data-night", "0");
});
