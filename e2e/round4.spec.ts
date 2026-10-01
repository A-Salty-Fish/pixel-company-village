import { expect, test } from "@playwright/test";
import { login, roster, openVillageDrawer } from "./login";

test("weekly chores check off from a local action and diary shows the canned line", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name;
  expect(self).toBeTruthy();
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self ?? "");
  const chores = page.getByTestId("today-chores");
  await expect(chores.locator("[data-chore]")).toHaveCount(3);
  await expect(chores).toContainText("不公示");
  await openVillageDrawer(page);
  await page.getByTestId("wave-d-panel").locator("summary").click();
  await expect(page.getByTestId("diary-0")).toContainText("今天先看自己的那一块田");

  const labels = await chores.locator("[data-chore]").evaluateAll((els) => els.map((el) => el.getAttribute("data-chore")));
  if (labels.includes("浇自己的田")) {
    await page.getByTestId("water-crop").click();
    await expect(chores.locator("[data-chore='浇自己的田']")).toHaveAttribute("data-done", "1");
  } else if (labels.includes("收一句罐头")) {
    await page.getByTestId("diary-0").click();
    await expect(chores.locator("[data-chore='收一句罐头']")).toHaveAttribute("data-done", "1");
  } else if (labels.includes("看一张信号卡")) {
    const name = body.people.find((person) => person.scored)?.name;
    await page.evaluate((person) => window.__VILLAGE_TEST__?.selectVillager(person ?? null), name);
    await expect(chores.locator("[data-chore='看一张信号卡']")).toHaveAttribute("data-done", "1");
  } else if (labels.includes("给门灯点一下")) {
    await page.getByRole("button", { name: "点门灯" }).click();
    await expect(chores.locator("[data-chore='给门灯点一下']")).toHaveAttribute("data-done", "1");
  } else if (labels.includes("钉一枚名牌")) {
    await page.locator("[data-pin]").first().click();
    await expect(chores.locator("[data-chore='钉一枚名牌']")).toHaveAttribute("data-done", "1");
  } else if (labels.includes("把锄头放下")) {
    await page.getByTestId("sit-bench").click();
    await expect(chores.locator("[data-chore='把锄头放下']")).toHaveAttribute("data-done", "1");
  } else if (labels.includes("看季节色")) {
    await page.getByTestId("season-banner").click();
    await expect(chores.locator("[data-chore='看季节色']")).toHaveAttribute("data-done", "1");
  } else if (labels.includes("在村口站一会儿")) {
    await page.getByTestId("go-home").click();
    await expect(chores.locator("[data-chore='在村口站一会儿']")).toHaveAttribute("data-done", "1");
  } else {
    throw new Error(`no playable chore in ${labels.join(",")}`);
  }
  await expect(page.getByTestId("week-chores").locator("[data-done='1']")).toHaveCount(1);
  await page.locator("[data-wave-toggle='weekBoard']").uncheck();
  await expect(chores).toHaveCount(0);
});
