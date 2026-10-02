import { expect, test, type Page } from "@playwright/test";
import { login, roster } from "./login";

const LOUD = ["今日还空着", "去看村口", "门灯还亮着", "分享村子"] as const;

async function coldStart(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.evaluate(() => {
    window.localStorage.removeItem("village-self-v1");
    window.sessionStorage.removeItem("village-self-session");
    window.localStorage.removeItem("village:visit-v1");
    window.localStorage.removeItem("village:guide-seen-v1");
    window.localStorage.removeItem("village:first-visit-step-v1");
    window.localStorage.removeItem("village:settings-discover-v1");
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith("village:today-touch-v1:")) window.localStorage.removeItem(key);
    }
  });
  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await expect(page.locator(".farm-page")).toHaveAttribute("data-has-self", "0");
}

async function chooseSelf(page: Page) {
  const body = await roster(page);
  const name = body.people[0]?.name ?? "";
  expect(name.length).toBeGreaterThan(0);
  await page.getByTestId("thumb-who").click();
  await page.getByTestId("who-sheet").getByTestId("self-picker").selectOption(name);
  await expect(page.locator(".farm-page")).toHaveAttribute("data-has-self", "1");
  await expect(page.getByTestId("thumb-home")).toBeVisible();
  return name;
}

async function loudVisible(page: Page) {
  return page.evaluate((phrases) => {
    const hits: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const text = node.textContent ?? "";
      const el = node.parentElement;
      node = walker.nextNode();
      if (!el || !text.trim()) continue;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) continue;
      const box = el.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) continue;
      if (box.bottom <= 0 || box.top >= window.innerHeight || box.right <= 0 || box.left >= window.innerWidth) continue;
      for (const phrase of phrases) {
        if (text.includes(phrase)) hits.push(phrase);
      }
    }
    return hits;
  }, [...LOUD]);
}

test("PV-PM-116 one next sentence after a name is chosen", async ({ page }) => {
  await coldStart(page);
  await expect(page.getByTestId("first-run-guide")).toBeVisible();
  await expect(page.getByTestId("next-beat-first")).toBeHidden();
  await expect(page.getByTestId("share-village")).toBeHidden();
  await expect(page.getByTestId("dawn-porch")).toBeHidden();
  await expect(page.getByTestId("today-entry")).not.toContainText("今日还空着");
  await expect(page.getByTestId("today-touch")).toBeHidden();

  await chooseSelf(page);
  await expect(page.getByTestId("first-run-dismiss")).toBeVisible();
  await expect.poll(async () => (await loudVisible(page)).length).toBeLessThanOrEqual(1);
  const headerInvite = await page.evaluate(() => {
    const header = document.querySelector("[data-testid='village-header']")?.textContent ?? "";
    const today = document.querySelector("[data-testid='today-entry']")?.textContent ?? "";
    return `${header}\n${today}`;
  });
  expect(headerInvite).not.toContain("今日还空着");
  expect(headerInvite).not.toContain("今日摸一下村里");
  expect(headerInvite).not.toContain("去看村口");
  expect(headerInvite).not.toContain("门灯还亮着");
  expect(headerInvite).not.toContain("分享村子");

  await page.getByTestId("map-home").click();
  const home = page.getByTestId("home-village-line");
  await expect(home).toBeVisible();
  await expect(home).toContainText("灶还温着。");
  const strips = await page.evaluate(() => {
    return [...document.querySelectorAll("[data-sentence-strip='1']")].filter((el) => {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      const box = el.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < window.innerHeight;
    }).length;
  });
  expect(strips).toBeLessThanOrEqual(1);
  expect((await loudVisible(page)).length).toBeLessThanOrEqual(1);
});

test("PV-PM-117 the tip travels with the page and stops teaching 先选定", async ({ page }) => {
  await coldStart(page);
  const guide = page.getByTestId("first-run-guide");
  await expect(guide).toBeVisible();
  await expect(guide).toContainText("先选定");
  const gap = await page.evaluate(() => {
    const tip = document.querySelector("[data-testid='first-run-guide']")?.getBoundingClientRect();
    const bar = document.querySelector("[data-testid='thumb-bar']")?.getBoundingClientRect();
    return {
      tipTop: tip?.top ?? -1,
      tipBottom: tip?.bottom ?? 9999,
      barTop: bar?.top ?? 0,
      height: window.innerHeight,
    };
  });
  expect(gap.tipTop).toBeGreaterThanOrEqual(0);
  expect(gap.tipBottom).toBeLessThanOrEqual(gap.height);
  expect(gap.barTop - gap.tipBottom).toBeGreaterThanOrEqual(8);

  const hitsSplit = await page.evaluate(() => {
    return ["split-map", "split-card"].map((id) => {
      const el = document.querySelector(`[data-testid='${id}']`);
      if (!el) return false;
      const box = el.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return Boolean(hit && (hit === el || el.contains(hit)));
    });
  });
  expect(hitsSplit).toEqual([true, true]);

  const body = await roster(page);
  const scored = body.people.find((person) => person.scored)?.name ?? body.people[0]?.name ?? "";
  await page.evaluate((person) => window.__VILLAGE_TEST__?.selectVillager(person), scored);
  const wave = page.getByTestId("signal-actions").getByRole("button", { name: "挥手" });
  await expect(wave).toBeVisible();
  const waveHits = await wave.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return Boolean(hit && (hit === el || el.contains(hit)));
  });
  expect(waveHits).toBe(true);
  await page.evaluate(() => window.__VILLAGE_TEST__?.selectVillager(null));

  await page.getByTestId("village-drawer").scrollIntoViewIfNeeded();
  const overlap = await page.evaluate(() => {
    const tip = document.querySelector("[data-testid='first-run-guide']")?.getBoundingClientRect();
    const drawer = document.querySelector("[data-testid='village-drawer']")?.getBoundingClientRect();
    if (!tip || !drawer) return true;
    return tip.left < drawer.right && tip.right > drawer.left && tip.top < drawer.bottom && tip.bottom > drawer.top;
  });
  expect(overlap).toBe(false);

  await page.evaluate(() => window.scrollTo(0, 0));
  await chooseSelf(page);
  const tips = page.locator("[data-testid='first-run-guide'], [data-testid='settings-discover']");
  const tipCount = await tips.count();
  for (let i = 0; i < tipCount; i += 1) {
    const tip = tips.nth(i);
    if (await tip.isVisible()) await expect(tip).not.toContainText("先选定");
  }
  await expect(guide).not.toContainText("先选定");

  await page.getByTestId("first-run-dismiss").click();
  await expect(guide).toHaveCount(0);
  await expect(page.getByTestId("thumb-bar")).toBeVisible();
  await expect(page.getByTestId("thumb-home")).toBeVisible();
  const discover = page.getByTestId("settings-discover");
  await expect(discover).toBeVisible();
  await expect(discover).toContainText("减少动作和安静村子在这里。");
  const placed = await page.evaluate(() => {
    const tip = document.querySelector("[data-testid='settings-discover']")?.getBoundingClientRect();
    const summary = document.querySelector("[data-testid='comfort-settings'] > summary")?.getBoundingClientRect();
    const drawer = document.querySelector("[data-testid='village-drawer']")?.getBoundingClientRect();
    if (!tip || !summary || !drawer) return { onSummary: false, coversDrawer: true };
    const hit = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    return { onSummary: hit(tip, summary), coversDrawer: hit(tip, drawer) };
  });
  expect(placed.onSummary).toBe(true);
  expect(placed.coversDrawer).toBe(false);
});
