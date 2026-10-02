import { expect, test } from "@playwright/test";
import { login, openWeekBoard, roster, openVillageDrawer } from "./login";

const WORLD: Record<string, string> = {
  浇自己的田: "water",
  看一张信号卡: "card",
  在村口站一会儿: "gate",
  给门灯点一下: "porch",
  收一句罐头: "diary",
  沿着小路走三步: "steps",
  看季节色: "season",
  钉一枚名牌: "pin",
  把锄头放下: "rest",
};

test("390 first visit keeps the tip above the bar and the name picker on this screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.evaluate(() => {
    window.localStorage.removeItem("village-self-v1");
    window.sessionStorage.removeItem("village-self-session");
    window.localStorage.removeItem("village:visit-v1");
    window.localStorage.removeItem("village:guide-seen-v1");
    window.localStorage.removeItem("village:first-visit-step-v1");
  });
  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  const guide = page.getByTestId("first-run-guide");
  await expect(guide).toBeVisible();
  await expect(guide).toHaveAttribute("data-blocks-map", "0");
  await expect(guide).toContainText("先选定「我是谁」。先在地图上找我，或去看村口。");
  await expect(guide).not.toContainText("减动");
  const gap = await page.evaluate(() => {
    const tip = document.querySelector("[data-testid='first-run-guide']")?.getBoundingClientRect();
    const thumb = document.querySelector("[data-testid='thumb-who']")?.getBoundingClientRect();
    return {
      tipTop: tip?.top ?? 0,
      tipBottom: tip?.bottom ?? 0,
      thumbTop: thumb?.top ?? 0,
      height: window.innerHeight,
    };
  });
  expect(gap.tipTop).toBeGreaterThanOrEqual(0);
  expect(gap.tipBottom).toBeLessThanOrEqual(gap.height);
  expect(gap.thumbTop - gap.tipBottom).toBeGreaterThanOrEqual(8);

  const before = await page.evaluate(() => window.scrollY);
  await page.getByTestId("thumb-who").click();
  const picker = page.getByTestId("who-sheet").getByTestId("self-picker");
  await expect(picker).toBeVisible();
  const after = await page.evaluate(() => ({ y: window.scrollY, height: window.innerHeight }));
  expect(Math.abs(after.y - before)).toBeLessThan(after.height);
  await expect(page.getByTestId("comfort-settings")).not.toHaveAttribute("open", "");
  const quietInView = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll("span, p"));
    return nodes.some((el) => {
      if (!el.textContent?.includes("安静村子")) return false;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      const box = el.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < window.innerHeight;
    });
  });
  expect(quietInView).toBe(false);
  await page.getByTestId("who-sheet").getByRole("button", { name: "收起" }).click();
  await page.getByTestId("first-run-dismiss").click();
  await expect(guide).toHaveCount(0);
  await expect(page.getByTestId("thumb-who")).toBeVisible();
  await expect(page.getByTestId("thumb-bar")).toBeVisible();
});

test("cleared visit and guide keys show the first tip again at 390", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.evaluate(() => {
    window.localStorage.setItem("village:first-visit-step-v1", "5");
    window.localStorage.setItem(
      "village:visit-v1",
      JSON.stringify({ self: true, yard: true, social: true }),
    );
    window.localStorage.setItem("village:guide-seen-v1", "1");
    window.localStorage.removeItem("village-self-v1");
    window.sessionStorage.removeItem("village-self-session");
    window.localStorage.removeItem("village:visit-v1");
    window.localStorage.removeItem("village:guide-seen-v1");
  });
  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  const guide = page.getByTestId("first-run-guide");
  await expect(guide).toBeVisible();
  await expect(guide).toHaveAttribute("data-blocks-map", "0");
  await expect(guide).toContainText("先选定「我是谁」。");
  await expect(guide.getByRole("button", { name: "知道了" })).toHaveCount(1);
  await page.getByTestId("first-run-dismiss").click();
  await expect(guide).toHaveCount(0);
  const visit = await page.evaluate(() => window.localStorage.getItem("village:visit-v1"));
  expect(visit).toContain("self");
  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await expect(page.getByTestId("first-run-guide")).toHaveCount(0);
});

test("resetting 我是谁 brings the first tip back", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  await page.evaluate(() => {
    window.localStorage.setItem("village:guide-seen-v1", "1");
    window.localStorage.setItem("village:first-visit-step-v1", "5");
    window.localStorage.setItem(
      "village:visit-v1",
      JSON.stringify({ self: true, yard: true, social: true }),
    );
  });
  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await expect(page.getByTestId("first-run-guide")).toHaveCount(0);
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption("");
  const guide = page.getByTestId("first-run-guide");
  await expect(guide).toBeVisible();
  await expect(guide).toContainText("先选定「我是谁」。");
  await expect(guide).toHaveAttribute("data-blocks-map", "0");
  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await expect(page.getByTestId("first-run-guide")).toBeVisible();
  await expect(page.getByTestId("first-run-guide")).toContainText("先选定「我是谁」。");
});

test("first-run guide names 减动开关 and stays dismissed", async ({ page }) => {
  await login(page);
  await page.evaluate(() => {
    localStorage.removeItem("village:visit-v1");
    localStorage.removeItem("village:guide-seen-v1");
    localStorage.removeItem("village:first-visit-step-v1");
  });
  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  const guide = page.getByTestId("first-run-guide");
  await expect(guide).toBeVisible();
  await expect(guide).toHaveAttribute("data-blocks-map", "0");
  await expect(guide).toContainText("先选定「我是谁」。");
  await expect(guide).toContainText("先在地图上找我，或去看村口。");
  await expect(guide).not.toContainText("减动");
  await expect(guide).not.toContainText("安静");
  await expect(guide).not.toContainText("减少动作");
  await expect(guide.getByRole("button", { name: "知道了" })).toHaveCount(1);
  await page.getByTestId("first-run-dismiss").click();
  const visit = await page.evaluate(() => window.localStorage.getItem("village:visit-v1"));
  expect(visit).toContain("self");
  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await expect(page.getByTestId("first-run-guide")).toHaveCount(0);
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-quiet", "1");
  const stored = await page.evaluate(() => window.localStorage.getItem("village:guide-seen-v1"));
  expect(stored).toBe("1");
});

test("finishing a weekly chore leaves a world mark", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  await openWeekBoard(page);
  const row = page.getByTestId("today-chores").locator("[data-chore]").first();
  const label = (await row.getAttribute("data-chore")) ?? "";
  const key = WORLD[label];
  expect(key).toBeTruthy();
  const host = page.locator("[data-village-host='ready']");
  await expect(host).toHaveAttribute(`data-world-${key}`, "0");
  const button = row.getByRole("button");
  for (let i = 0; i < 3; i += 1) {
    if ((await row.getAttribute("data-done")) === "1") break;
    await button.click();
  }
  await expect(row).toHaveAttribute("data-done", "1");
  await expect(host).toHaveAttribute(`data-world-${key}`, "1");
  await expect(host).toHaveAttribute("data-quiet", "1");
});

test("a wave gets a canned reply from the other person", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name;
  const target = body.people.find((person) => person.name !== self)?.name;
  expect(self && target).toBeTruthy();
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self ?? "");
  await page.evaluate((name) => window.__VILLAGE_TEST__?.selectVillager(name ?? null), target);
  const card = page.getByTestId("signal-card");
  await card.getByRole("button", { name: "挥手" }).click();
  await expect(card).toContainText("对方也挥了回来。");
  await expect(card.locator("[data-event-line]")).toHaveAttribute("data-social-reply", "wave");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-quiet", "1");
});

test("closed yard panels show how many loops were touched", async ({ page }) => {
  await login(page);
  await openVillageDrawer(page);
  await expect(page.getByTestId("village-drawer")).toHaveAttribute("open", "");
  await expect(page.getByTestId("loop-summary-tally")).toHaveText("0/10");
  await expect(page.getByTestId("nook-summary-tally")).toHaveText("0/10");
  await expect(page.getByTestId("village-loops")).not.toHaveAttribute("open", "");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-quiet", "1");
});
