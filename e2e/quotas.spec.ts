import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

test("kindness quota exhausts on the local identity", async ({ page }) => {
  await login(page);
  await expect(page.getByTestId("comfort-settings")).toHaveAttribute("data-quota-source", "local");
  const body = await roster(page);
  const self = body.people[0]?.name;
  const target = body.people.find((person) => person.scored && person.name !== self)?.name;
  expect(self && target).toBeTruthy();

  await page.getByTestId("comfort-settings").locator("summary").click();
  await page.getByTestId("self-picker").selectOption(self ?? "");
  await page.evaluate((name) => window.__VILLAGE_TEST__?.selectVillager(name ?? null), target);

  const days = ["2026-09-21T02:00:00.000Z", "2026-09-22T02:00:00.000Z", "2026-09-23T02:00:00.000Z"];
  const results: { ok: boolean; line: string }[] = [];
  for (const iso of days) {
    const result = await page.evaluate(
      async ({ name, iso }) => {
        window.__VILLAGE_TEST__?.setClock(iso);
        return (await window.__VILLAGE_TEST__?.playKindness(name, "seed")) ?? { ok: false, line: "" };
      },
      { name: target ?? "", iso },
    );
    results.push(result);
  }
  expect(results[0]?.ok).toBeTruthy();
  expect(results[1]?.ok).toBeTruthy();
  expect(results[2]?.ok).toBeFalsy();
  expect(results[2]?.line).toContain("这周两次关照都用过了");

  const card = page.getByTestId("signal-card");
  await expect(card).toContainText("这周两次关照都用过了");
  await expect(card.getByRole("button", { name: "今日互动" })).toBeDisabled();
});

test("wave is limited to once an hour", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name;
  const target = body.people.find((person) => person.name !== self)?.name;
  await page.getByTestId("comfort-settings").locator("summary").click();
  await page.getByTestId("self-picker").selectOption(self ?? "");
  await page.evaluate((name) => window.__VILLAGE_TEST__?.selectVillager(name ?? null), target);
  const card = page.getByTestId("signal-card");
  await card.getByRole("button", { name: "挥手" }).click();
  await expect(card).toContainText("这一小时已经挥过手了");
  await expect(card.getByRole("button", { name: "挥手" })).toBeDisabled();
});

test("comfort toggles reach the motion governor", async ({ page }) => {
  await login(page);
  await page.getByTestId("comfort-settings").locator("summary").click();
  await page.getByRole("checkbox", { name: /安静村子/ }).check();
  await page.getByRole("checkbox", { name: /先收起别人的分数/ }).check();
  await page.getByRole("checkbox", { name: /减少动作/ }).check();
  await expect(page.getByTestId("mute-stub")).toBeDisabled();
  await expect
    .poll(async () => page.evaluate(() => window.__VILLAGE_TEST__?.getState()?.comfort))
    .toMatchObject({ quiet: true, hideScores: true, reduceMotion: true });
});
