import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

test("隔天回来有一句，当天再进就没有", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const name = body.people[0]?.name;
  expect(name).toBeTruthy();
  await page.evaluate((person) => {
    const record = JSON.stringify({ name: person, preset: null });
    window.localStorage.setItem("village-self-v1", record);
    window.sessionStorage.setItem("village-self-session", record);
    window.localStorage.setItem(`village:return-warm-v1:${person}`, "2020-01-01");
  }, name);
  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  const welcome = page.getByTestId("return-warm");
  await expect(welcome).toBeVisible();
  await expect(welcome).toContainText(/又回来了。|村里还在。|屋檐还认你。/);
  await welcome.getByRole("button", { name: "收起" }).click();
  await expect(welcome).toBeHidden();

  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await expect(page.getByTestId("return-warm")).toHaveCount(0);
});

test("清晨有一句门廊，点一下就收起", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const name = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator(":scope > summary").click();
  await page.getByTestId("self-picker").selectOption(name);
  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-10-01T01:30:00.000Z"));
  const dawn = page.getByTestId("dawn-porch");
  await expect(dawn).toBeVisible();
  await expect(dawn).toContainText(/门灯还亮着|露水还在田边/);
  await dawn.getByRole("button", { name: /门灯还亮着|露水还在田边/ }).click();
  await expect(dawn).toBeHidden();
  await expect(page.locator("[data-camera-zoom]")).toHaveAttribute("data-camera-zoom", /.+/);
});

test("出村时有一句送别，随后离开", async ({ page }) => {
  await login(page);
  await page.getByTestId("exit-village").click();
  await expect(page.getByTestId("exit-soft-bye")).toHaveText("慢慢走。村口还在。");
  await page.waitForURL("**/login", { timeout: 8_000 });
});

test("回家落到屋檐，并留下一句回执", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  const body = await roster(page);
  const name = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator(":scope > summary").click();
  await page.getByTestId("self-picker").selectOption(name);
  const tools = page.getByTestId("map-tools");
  await expect(tools.getByTestId("find-me")).toBeVisible();
  await expect(tools.getByTestId("map-home")).toBeVisible();
  await expect(tools.getByTestId("map-home")).toHaveText("屋");
  await expect(page.getByTestId("thumb-home")).toBeVisible();
  await expect(page.getByTestId("thumb-home")).toHaveText("回家");
  await expect(page.getByText("回家", { exact: true })).toHaveCount(1);
  const settle = page.waitForFunction(
    () => document.querySelector(".farm-page")?.getAttribute("data-home-settle") === "1",
  );
  await tools.getByTestId("map-home").click();
  await settle;
  const line = page.getByTestId("home-village-line");
  await expect(line).toBeVisible();
  await expect(line).toContainText("灶还温着。");
  await expect(page.locator(".village-map-slot")).toHaveAttribute("data-home-warm", "0");
  await expect(page.locator(".farm-page")).not.toHaveAttribute("data-feedback-state", "home");
});

test("宽屏选定身份后，底栏同时有找我和回家", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await login(page);
  const tools = page.getByTestId("map-tools");
  await expect(tools.getByTestId("find-me")).toBeVisible();
  await expect(tools.getByTestId("map-home")).toHaveCount(0);

  const body = await roster(page);
  const name = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator(":scope > summary").click();
  await page.getByTestId("self-picker").selectOption(name);

  const home = tools.getByTestId("map-home");
  await expect(tools.getByTestId("find-me")).toBeVisible();
  await expect(home).toBeVisible();
  await expect(home).toHaveText("屋");
  await expect(home).not.toHaveText("回家");
  await home.click();
  const line = page.getByTestId("home-village-line");
  await expect(line).toBeVisible();
  await expect(line).toContainText("灶还温着。");
  await expect(page.locator(".village-map-slot")).toHaveAttribute("data-home-warm", "0");
  await expect(page.locator(".farm-page")).not.toHaveAttribute("data-feedback-state", "home");
});

test("减少动作时回家只移动镜头", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await login(page);
  const body = await roster(page);
  const name = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator(":scope > summary").click();
  await page.getByTestId("self-picker").selectOption(name);
  await expect(page.locator(".farm-page")).toHaveAttribute("data-reduce-motion", "1");
  const settle = page.waitForFunction(
    () => document.querySelector(".farm-page")?.getAttribute("data-home-settle") === "1",
  );
  await page.getByTestId("map-tools").getByTestId("map-home").click();
  await settle;
  await expect(page.locator(".village-map-slot")).toHaveAttribute("data-home-warm", "0");
  const line = page.getByTestId("home-village-line");
  await expect(line).toBeVisible();
  await expect(line).toContainText("灶还温着。");
});
