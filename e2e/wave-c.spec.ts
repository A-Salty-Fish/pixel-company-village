import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

test("password wall rejects a wrong password and accepts Enter", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("login-password").fill("not-the-site-password");
  await page.getByTestId("login-submit").click();
  await expect(page).toHaveURL(/error=password/);
  await expect(page.getByRole("alert")).toContainText("密码不对");

  const password = process.env.SITE_PASSWORD ?? "";
  await page.getByTestId("login-password").fill(password);
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/", { timeout: 20_000 }),
    page.getByTestId("login-password").press("Enter"),
  ]);
  await page.waitForSelector("canvas[data-village-ready='1']");
});

test("hard reload shows a load stage and can recover", async ({ page }) => {
  await login(page);
  await page.reload();
  await expect(page.locator("[data-village-host]")).toHaveAttribute("data-load-stage", /terrain|roster|villagers|ready|timeout/);
  await expect(page.locator("[data-load-stage='ready']")).toBeVisible();
  await page.evaluate(() => window.__VILLAGE_TEST__?.forceLoadTimeout());
  await expect(page.getByTestId("load-recovery")).toBeVisible();
  await expect(page.getByRole("button", { name: "再试一次" })).toBeVisible();
  await expect(page.getByTestId("refresh-scores")).toBeVisible();
  await page.getByRole("button", { name: "再试一次" }).click();
  await expect(page.locator("[data-load-stage='ready']")).toBeVisible();
});

test("kindness opens a menu and can be undone", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name;
  const target = body.people.find((person) => person.scored && person.name !== self)?.name;
  expect(self && target).toBeTruthy();
  await page.getByTestId("comfort-settings").locator("summary").click();
  await page.getByTestId("self-picker").selectOption(self ?? "");
  await page.evaluate((name) => window.__VILLAGE_TEST__?.selectVillager(name ?? null), target);
  const card = page.getByTestId("signal-card");
  await card.getByRole("button", { name: "今日互动" }).click();
  await expect(page.getByTestId("kindness-menu")).toBeVisible();
  await page.getByRole("button", { name: "先不用" }).click();
  await expect(card).toContainText("今日 0/1");
  await card.getByRole("button", { name: "今日互动" }).click();
  await page.getByRole("button", { name: "种子" }).click();
  await page.getByRole("button", { name: "确认关照" }).click();
  await expect(page.getByTestId("kindness-undo")).toBeVisible();
  await page.getByRole("button", { name: /撤销/ }).click();
  await expect(card).toContainText("今日 0/1");
});

test("wave copy asks for identity and then counts the hour", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const target = body.people[0]?.name;
  await page.evaluate((name) => window.__VILLAGE_TEST__?.selectVillager(name ?? null), target);
  await expect(page.getByTestId("signal-card")).toContainText("我是谁");
  const self = body.people[1]?.name;
  await page.getByTestId("comfort-settings").locator("summary").click();
  await page.getByTestId("self-picker").selectOption(self ?? "");
  await expect(page.getByTestId("signal-card")).toContainText("还可挥 1 次");
});

test("logout returns to the password wall", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "出村" }).click();
  await expect(page.getByTestId("login-form")).toBeVisible();
  await page.goto("/");
  await expect(page.getByTestId("login-form")).toBeVisible();
});

test("festival field is visual and has no ranking", async ({ page }) => {
  await login(page);
  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-02-04T02:00:00.000Z"));
  await page.getByTestId("play-shelf").locator("summary").click();
  const field = page.getByTestId("festival-field");
  await expect(field).toContainText("没有名次");
  await expect(field).not.toContainText("垫底");
  await expect(field).not.toContainText("第一名");
  await expect(page.locator("[data-festival-skin='立春']")).toBeVisible();
});

test("mobile keeps the signal actions on screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  const body = await roster(page);
  const name = body.people.find((person) => person.scored)?.name;
  await page.evaluate((person) => window.__VILLAGE_TEST__?.selectVillager(person ?? null), name);
  await expect(page.getByTestId("split-bar")).toBeVisible();
  const actions = page.getByTestId("signal-actions");
  await expect(actions.getByRole("button", { name: "今日互动" })).toBeVisible();
  const box = await actions.boundingBox();
  expect(box).toBeTruthy();
  expect((box?.y ?? 9999) + (box?.height ?? 0)).toBeLessThanOrEqual(844);
});

test("score JSON stays free of chat keys", async ({ page }) => {
  await login(page);
  const response = await page.request.get("/api/scores");
  const text = await response.text();
  const forbidden = ["chat", "transcript", "snippet", "screenshot", "group_name", "message_text"];
  for (const key of forbidden) {
    expect(text.toLowerCase()).not.toContain(`"${key}"`);
  }
  const body = JSON.parse(text) as { people: Record<string, unknown>[] };
  for (const person of body.people) {
    expect(Object.keys(person).some((key) => /chat|content|body|text|transcript/i.test(key))).toBeFalsy();
  }
});

test("quiet village is the default for a new viewer", async ({ page }) => {
  await login(page);
  await expect
    .poll(async () => page.evaluate(() => window.__VILLAGE_TEST__?.getState()?.comfort.quiet))
    .toBe(true);
  await expect(page.getByTestId("name-legend")).toContainText("琥珀");
  await expect(page.getByTestId("toggle-plates")).toBeVisible();
});
