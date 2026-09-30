import { expect, test, type Page } from "@playwright/test";
import { login, openWeekBoard, roster } from "./login";

async function waitFrames(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}

async function mapAverage(page: Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas[data-testid='village-map']") as HTMLCanvasElement | null;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return { r: 0, g: 0, b: 0 };
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    const stepX = Math.max(1, Math.floor(canvas.width / 8));
    const stepY = Math.max(1, Math.floor(canvas.height / 8));
    for (let y = stepY; y < canvas.height; y += stepY) {
      for (let x = stepX; x < canvas.width; x += stepX) {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        r += pixel[0];
        g += pixel[1];
        b += pixel[2];
        n += 1;
      }
    }
    return { r: r / n, g: g / n, b: b / n };
  });
}

test("PV-PM-012 opens on relation status and keeps wave one tap away", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const name = body.people.find((person) => person.scored)?.name;
  expect(name).toBeTruthy();
  await page.evaluate((person) => window.__VILLAGE_TEST__?.selectVillager(person ?? null), name);
  const card = page.getByTestId("signal-card");
  await expect(card).toHaveAttribute("data-relation-first", "1");
  const relation = card.getByTestId("relation-status");
  const score = card.getByTestId("score-disclosure");
  await expect(relation).toBeVisible();
  await expect(relation).toContainText("先看这位同事");
  await expect(score).toBeVisible();
  const relationBox = await relation.boundingBox();
  const scoreBox = await score.boundingBox();
  expect(relationBox && scoreBox && relationBox.y < scoreBox.y).toBeTruthy();
  await expect(card.locator("[data-activity-rings]")).toBeHidden();
  await expect(card.locator("[data-wave]")).toBeVisible();
  await expect(card.locator("[data-play-interaction]")).toBeVisible();
  await score.locator("summary").click();
  await expect(card.locator("[data-activity-rings]")).toBeVisible();
  await expect(card.getByTestId("history-window")).toBeVisible();
});

test("PV-PM-014 night wash stays readable when motion is reduced", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  await page.getByTestId("quiet-toggle").uncheck();
  const host = page.locator("[data-village-host='ready']");

  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-09-30T04:00:00.000Z"));
  await expect(host).toHaveAttribute("data-night", "0");
  await expect(host).toHaveAttribute("data-night-wash", "off");
  await waitFrames(page);
  const day = await mapAverage(page);

  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-09-30T13:00:00.000Z"));
  await expect(host).toHaveAttribute("data-night", "1");
  await expect(host).toHaveAttribute("data-night-wash", "cool");
  await expect(host).toHaveAttribute("data-night-static", "0");
  await waitFrames(page);
  const night = await mapAverage(page);
  expect(night.b).toBeGreaterThan(day.b + 4);
  expect(night.g).toBeLessThan(day.g - 4);

  await page.getByTestId("comfort-decor").locator("> summary").click();
  await page.getByRole("checkbox", { name: /减少动作/ }).check();
  await expect(host).toHaveAttribute("data-night-wash", "cool");
  await expect(host).toHaveAttribute("data-night-static", "1");
  await waitFrames(page);
  const still = await mapAverage(page);
  expect(still.b).toBeGreaterThan(day.b + 4);
  expect(Math.abs(still.b - night.b)).toBeLessThan(18);
});

test("PV-PM-015 replaces finished chores with a world summary", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name;
  expect(self).toBeTruthy();
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self ?? "");
  await openWeekBoard(page);
  const strip = page.getByTestId("today-chores");
  const rows = strip.locator("[data-chore]");
  await expect(rows).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    const row = rows.nth(index);
    const button = row.getByRole("button");
    for (let step = 0; step < 3; step += 1) {
      if ((await row.getAttribute("data-done")) === "1") break;
      if ((await button.count()) === 0) break;
      await button.click();
    }
    const card = page.getByTestId("signal-card");
    if ((await card.count()) > 0) {
      await page.keyboard.press("Escape");
      await expect(card).toHaveCount(0);
    }
  }
  await expect(strip).toHaveAttribute("data-week-done", "1");
  await expect(page.getByTestId("week-settled")).toContainText("本周已安顿");
  await expect(page.getByTestId("week-settled")).toContainText("脚印");
  await expect(page.getByTestId("week-settled")).toContainText("水壶");
  await expect(page.getByTestId("week-settled")).toContainText("布条");
  await expect(page.getByTestId("week-settled")).toContainText("不跟别人比");
  await expect(strip.getByRole("button", { name: /去做/ })).toHaveCount(0);
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-week-ribbon", "1");
  await expect(page.getByTestId("week-settled")).not.toContainText("排名");
});
