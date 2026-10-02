import { expect, test, type Locator, type Page } from "@playwright/test";
import { login, roster } from "./login";

/** Folded map controls sit under the zoom row at 390. Fire the control itself. */
async function fireClick(locator: Locator) {
  await locator.evaluate((node) => {
    (node as HTMLElement).click();
  });
}

async function ensureCompanion(page: Page, on: boolean) {
  const chip = page.getByTestId("social-float-chip");
  if ((await chip.count()) > 0 && (await chip.getAttribute("aria-expanded")) !== "true") {
    await chip.click();
  }
  const more = page.getByTestId("map-more");
  if ((await more.getAttribute("aria-expanded")) !== "true") await more.click();
  const toggle = page.getByTestId("co-presence-toggle");
  await expect(toggle).toBeVisible();
  const mark = on ? "on" : "off";
  if ((await toggle.getAttribute("data-companion")) !== mark) await fireClick(toggle);
  await expect(toggle).toHaveAttribute("data-companion", mark);
  await expect(toggle).toContainText(on ? "相伴 · 开着" : "相伴");
  if ((await more.getAttribute("aria-expanded")) === "true") await more.click();
}

test("PV-D-018 panel wave shows the companion cue and foot ring at 390", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name;
  const target = body.people.find((person) => person.name !== self)?.name;
  expect(self && target).toBeTruthy();

  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self ?? "");
  await page.getByTestId("comfort-decor").locator("summary").click();
  await page.getByTestId("reduce-motion").check();
  await expect(page.locator(".farm-page")).toHaveAttribute("data-reduce-motion", "1");

  await ensureCompanion(page, true);
  const host = page.locator("[data-village-host='ready']");

  await page.evaluate((name) => window.__VILLAGE_TEST__?.selectVillager(name ?? null), target);
  const card = page.getByTestId("signal-card");
  const cue = page.getByTestId("companion-cue");
  await expect(card.locator("[data-wave]")).toBeEnabled();
  const seen = Date.now();
  await card.locator("[data-wave]").click();
  await expect(cue).toBeVisible();
  await expect(cue).toContainText("邻里应了一下。");
  await expect(cue).toHaveAttribute("data-motion", "still");
  await expect(page.locator(".farm-page")).toHaveAttribute("data-companion-cue", "1");
  await expect(host).toHaveAttribute("data-companion-ring", target ?? "");
  await page.waitForTimeout(1_600);
  await expect(cue).toBeVisible();
  await expect(cue).toBeHidden({ timeout: 2_500 });
  const held = Date.now() - seen;
  expect(held).toBeGreaterThan(2_200);
  expect(held).toBeLessThan(5_000);

  await card.getByRole("button", { name: "关闭信号卡" }).click();
  await fireClick(page.getByTestId("header-wave"));
  await expect(cue).toBeVisible();
  await expect(host).not.toHaveAttribute("data-companion-ring", "");
  await expect(page.locator(".farm-page")).toHaveAttribute("data-header-wave", "receipt");
  await expect(page.getByTestId("header-wave-receipt")).toHaveText(/邻里应了一下|朝田边挥了一下/);
});

test("PV-D-018 companion off keeps the wave and skips the cue", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name;
  const target = body.people.find((person) => person.name !== self)?.name;
  expect(self && target).toBeTruthy();

  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self ?? "");
  await ensureCompanion(page, false);

  await page.evaluate((name) => window.__VILLAGE_TEST__?.selectVillager(name ?? null), target);
  const card = page.getByTestId("signal-card");
  await card.locator("[data-wave]").click();
  await expect(card).toContainText("挥了挥手");
  await expect(page.getByTestId("companion-cue")).toHaveCount(0);
  await expect(page.locator(".farm-page")).toHaveAttribute("data-companion-cue", "0");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-companion-ring", "");

  await card.getByRole("button", { name: "关闭信号卡" }).click();
  await fireClick(page.getByTestId("header-wave"));
  await expect(page.locator(".farm-page")).toHaveAttribute("data-header-wave", "receipt");
  await expect(page.getByTestId("header-wave-receipt")).toHaveText(/邻里应了一下|朝田边挥了一下/);
  await expect(page.getByTestId("companion-cue")).toHaveCount(0);
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-companion-ring", "");
});
