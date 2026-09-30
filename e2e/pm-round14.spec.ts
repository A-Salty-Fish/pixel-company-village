import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

test("PV-PM-020 autumn bands sit with night wash and fallen leaves", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await login(page);
  const host = page.locator("[data-village-host='ready']");
  const canvas = page.locator("canvas[data-testid='village-map']");

  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-01-15T04:00:00.000Z"));
  await expect(host).toHaveAttribute("data-season", "winter");
  await expect(host).toHaveAttribute("data-autumn-palette", "off");
  await expect(canvas).toHaveAttribute("data-autumn-palette", "off");

  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-09-24T13:00:00.000Z"));
  await expect(host).toHaveAttribute("data-season", "autumn");
  await expect(host).toHaveAttribute("data-autumn-palette", "warm");
  await expect(canvas).toHaveAttribute("data-autumn-palette", "warm");
  await expect(host).toHaveAttribute("data-night-wash", "active");
  await expect(canvas).toHaveAttribute("data-night-wash", "active");
  await expect(host).toHaveAttribute("data-quiet", "1");
  await expect(host).toHaveAttribute("data-ground-props", "off");
  await expect(page.getByTestId("season-banner")).toHaveAttribute("data-autumn-palette", "warm");

  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("quiet-toggle").uncheck();
  await expect(host).toHaveAttribute("data-ground-props", "leaf");
  await expect(host).toHaveAttribute("data-autumn-palette", "warm");
  await expect(host).toHaveAttribute("data-night-wash", "active");
});

test("PV-PM-021 a fresh score day is a quiet line, and a stale day is unmarked", async ({ page }) => {
  await login(page);
  const host = page.locator("[data-village-host='ready']");
  const dateText = (await page.getByTestId("score-date").textContent()) ?? "";
  const dataDate = dateText.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
  expect(dataDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

  await page.evaluate((ymd) => window.__VILLAGE_TEST__?.setClock(`${ymd}T02:00:00.000Z`), dataDate);
  await expect(page.getByTestId("score-date")).toHaveAttribute("data-honesty", "fresh");
  await expect(host).toHaveAttribute("data-quiet", "1");
  await expect(host).toHaveAttribute("data-score-day", "quiet");
  await expect(page.locator("canvas[data-testid='village-map']")).toHaveAttribute("data-score-day", "quiet");
  const cue = page.getByTestId("score-day-cue");
  await expect(cue).toBeVisible();
  await expect(cue).toHaveText("今日分数在田里。");
  await expect(cue).toHaveAttribute("data-score-day", "quiet");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("聊天原文");

  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("quiet-toggle").uncheck();
  await expect(host).toHaveAttribute("data-score-day", "soft");
  await expect(cue).toHaveCSS("color", "rgb(74, 58, 40)");

  await page.evaluate((ymd) => {
    const [year, month, day] = ymd.split("-").map(Number);
    const next = new Date(Date.UTC(year, month - 1, day + 6, 2, 0, 0));
    window.__VILLAGE_TEST__?.setClock(`${next.toISOString().slice(0, 10)}T02:00:00.000Z`);
  }, dataDate);
  await expect(page.getByTestId("score-date")).toHaveAttribute("data-honesty", "stale");
  await expect(host).toHaveAttribute("data-score-day", "off");
  await expect(cue).toHaveCount(0);
});

test("PV-PM-019 ritual afterglow fades, and reduced motion holds then clears", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  await page.getByTestId("ritual-badge").click();
  await page.getByTestId("header-ritual-act").click();

  const host = page.locator("[data-village-host='ready']");
  const line = page.getByTestId("ritual-afterglow");
  await expect(host).toHaveAttribute("data-ritual-done", "1");
  await expect(host).toHaveAttribute("data-ritual-afterglow", "fade");
  await expect(page.locator("canvas[data-testid='village-map']")).toHaveAttribute("data-ritual-afterglow", "fade");
  await expect(line).toBeVisible();
  await expect(line).toHaveText("余晖还留了一会儿。");
  await expect(host).toHaveAttribute("data-ritual-afterglow", "off", { timeout: 6000 });
  await expect(line).toHaveCount(0);

  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-ritual-done", "1");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-ritual-afterglow", "off");
  await expect(page.getByTestId("ritual-afterglow")).toHaveCount(0);
});

test("PV-PM-019 reduced motion keeps a still afterglow, then clears", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  await page.getByTestId("comfort-decor").locator("> summary").click();
  await page.getByTestId("reduce-motion").check();
  await page.getByTestId("ritual-badge").click();
  await page.getByTestId("header-ritual-act").click();

  const host = page.locator("[data-village-host='ready']");
  await expect(host).toHaveAttribute("data-ritual-afterglow", "still");
  await expect(page.getByTestId("ritual-afterglow")).toHaveAttribute("data-ritual-afterglow", "still");
  await expect(host).toHaveAttribute("data-ritual-afterglow", "off", { timeout: 5000 });
  await expect(page.getByTestId("ritual-afterglow")).toHaveCount(0);
});

test("PV-PM-022 a button click is silent until unmute, and reduced motion stays silent", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await login(page);
  const pageRoot = page.locator(".farm-page");
  const status = page.getByTestId("sfx-status");
  await expect(pageRoot).toHaveAttribute("data-sfx", "muted");
  await page.getByTestId("ritual-badge").click();
  await expect(status).toHaveAttribute("data-sfx-last", "silent");
  await expect(status).toHaveAttribute("data-sfx-count", "0");

  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("comfort-decor").locator("> summary").click();
  await expect(page.getByTestId("mute-stub")).toBeDisabled();
  await expect(page.getByTestId("sfx-mute")).toBeChecked();
  await page.getByTestId("sfx-mute").uncheck();
  await expect(pageRoot).toHaveAttribute("data-sfx", "live");
  await page.getByTestId("season-banner").click();
  await expect(status).toHaveAttribute("data-sfx-last", "click");
  const played = Number((await status.getAttribute("data-sfx-count")) ?? "0");
  expect(played).toBeGreaterThan(0);

  await page.getByTestId("reduce-motion").check();
  await expect(pageRoot).toHaveAttribute("data-sfx", "still");
  await page.getByTestId("ritual-badge").click();
  await expect(status).toHaveAttribute("data-sfx-last", "silent");
  await expect(status).toHaveAttribute("data-sfx-count", String(played));
  await expect(page.locator("body")).not.toContainText("聊天原文");
});
