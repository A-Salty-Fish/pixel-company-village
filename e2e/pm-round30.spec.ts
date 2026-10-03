import { expect, test, type Page } from "@playwright/test";
import { login, roster } from "./login";

const LOUD = ["今日还空着", "去看村口", "门灯还亮着", "分享村子", "今日摸一下村里"] as const;

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
      if (key.startsWith("village:return-warm-v1:")) window.localStorage.removeItem(key);
    }
  });
  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await expect(page.locator(".farm-page")).toHaveAttribute("data-has-self", "0");
  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-10-03T01:00:00.000Z"));
}

async function chooseSelf(page: Page) {
  const body = await roster(page);
  const name = body.people[0]?.name ?? "";
  expect(name.length).toBeGreaterThan(1);
  await page.getByTestId("thumb-who").click();
  await page.getByTestId("who-sheet").getByTestId("self-picker").selectOption(name);
  await expect(page.locator(".farm-page")).toHaveAttribute("data-has-self", "1");
  await expect(page.getByTestId("thumb-home")).toBeVisible();
  return name;
}

type Spot = { name: string; x: number; y: number };
type Read = { name: string; text: string; kind: string };

function nearestInFrame(people: Spot[], selfName: string, camX: number, camY: number, spanW: number, spanH: number) {
  const self = people.find((person) => person.name === selfName);
  if (!self) return [];
  return people
    .filter(
      (person) =>
        person.name !== selfName &&
        person.x >= camX &&
        person.y >= camY &&
        person.x <= camX + spanW &&
        person.y <= camY + spanH,
    )
    .sort((a, b) => {
      const da = (a.x - self.x) ** 2 + (a.y - self.y) ** 2;
      const db = (b.x - self.x) ** 2 + (b.y - self.y) ** 2;
      return da - db || a.name.localeCompare(b.name, "zh");
    })
    .slice(0, 2);
}

async function frameRead(page: Page) {
  return page.evaluate(() => {
    const host = document.querySelector("[data-village-host='ready']");
    if (!host) return null;
    const people = JSON.parse(host.getAttribute("data-people-xy") || "[]") as Spot[];
    const reads = JSON.parse(host.getAttribute("data-plate-read") || "[]") as Read[];
    return {
      people,
      reads,
      camX: Number(host.getAttribute("data-camera-x")),
      camY: Number(host.getAttribute("data-camera-y")),
      spanW: Number(host.getAttribute("data-view-span-w")),
      spanH: Number(host.getAttribute("data-view-span-h")),
      showAll: host.getAttribute("data-show-all"),
      zoom: host.getAttribute("data-camera-zoom"),
    };
  });
}

function textReads(name: string, text: string) {
  const need = Math.min(2, [...name].length);
  return [...text].length >= need && name.startsWith(text);
}

test("PV-PM-118 nearest field names stay readable without 全显名牌", async ({ page }) => {
  await coldStart(page);
  const self = await chooseSelf(page);
  const host = page.locator("[data-village-host='ready']");
  await expect(host).toHaveAttribute("data-show-all", "0");
  await expect(page.locator(".farm-page")).toHaveAttribute("data-field-near", "1");

  await expect.poll(async () => {
    const frame = await frameRead(page);
    if (!frame || frame.showAll !== "0") return false;
    const selfPlate = frame.reads.find((item) => item.name === self);
    if (!selfPlate || !textReads(self, selfPlate.text) || [...selfPlate.text].length < 2) return false;
    const near = nearestInFrame(frame.people, self, frame.camX, frame.camY, frame.spanW, frame.spanH);
    if (near.length < 2) return false;
    return near.every((person) => frame.reads.some((item) => item.name === person.name && textReads(person.name, item.text)));
  }).toBe(true);

  const dawn = page.getByTestId("dawn-porch");
  await expect(dawn).toBeVisible();
  await expect(dawn).toContainText("门灯还亮着");
  await dawn.getByRole("button", { name: "门灯还亮着" }).click();
  await expect(host).toHaveAttribute("data-camera-zoom", "3");
  await expect(host).toHaveAttribute("data-show-all", "0");

  await expect.poll(async () => {
    const frame = await frameRead(page);
    if (!frame || frame.zoom !== "3" || frame.showAll !== "0") return false;
    const selfPlate = frame.reads.find((item) => item.name === self && textReads(self, item.text));
    const near = nearestInFrame(frame.people, self, frame.camX, frame.camY, frame.spanW, frame.spanH);
    const named = near.filter((person) => frame.reads.some((item) => item.name === person.name && textReads(person.name, item.text)));
    return Boolean(selfPlate) || named.length >= 2;
  }).toBe(true);

  const beforeZoom = await frameRead(page);
  expect(beforeZoom).toBeTruthy();
  const held = nearestInFrame(
    beforeZoom!.people,
    self,
    beforeZoom!.camX,
    beforeZoom!.camY,
    beforeZoom!.spanW,
    beforeZoom!.spanH,
  )
    .filter((person) => beforeZoom!.reads.some((item) => item.name === person.name && textReads(person.name, item.text)))
    .slice(0, 2);
  const selfHeld = beforeZoom!.reads.some((item) => item.name === self && textReads(self, item.text));
  expect(selfHeld || held.length >= 2).toBe(true);

  await page.getByRole("button", { name: "拉近" }).click();
  await expect.poll(async () => {
    const frame = await frameRead(page);
    if (!frame || frame.showAll !== "0") return false;
    const namesStay = held.every((person) =>
      frame.reads.some((item) => item.name === person.name && textReads(person.name, item.text)),
    );
    const selfStays = frame.reads.some((item) => item.name === self && textReads(self, item.text));
    if (held.length >= 2) return namesStay;
    return selfStays && namesStay;
  }).toBe(true);
});

async function visibleStrips(page: Page) {
  return page.evaluate(() => {
    const nodes = new Set<Element>([
      ...document.querySelectorAll("[data-sentence-strip='1']"),
      ...document.querySelectorAll("[data-testid='find-me-receipt']"),
    ]);
    let count = 0;
    for (const el of nodes) {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) continue;
      const box = el.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) continue;
      if (box.bottom <= 0 || box.top >= window.innerHeight || box.right <= 0 || box.left >= window.innerWidth) continue;
      count += 1;
    }
    return count;
  });
}

test("PV-PM-119 找我 does not add a second sentence", async ({ page }) => {
  await coldStart(page);
  await chooseSelf(page);
  const dawn = page.getByTestId("dawn-porch");
  await expect(dawn).toBeVisible();
  await expect(dawn).toContainText("门灯还亮着");
  await expect(page.getByTestId("first-run-dismiss")).toBeVisible();
  await page.getByTestId("find-me").click();
  await expect(page.getByTestId("find-me-receipt")).toHaveCount(0);
  await expect.poll(async () => visibleStrips(page)).toBeLessThanOrEqual(1);
  const header = await page.getByTestId("village-header").innerText();
  for (const phrase of LOUD) expect(header).not.toContain(phrase);
  expect(header).not.toContain("人在这儿");
});

test("PV-PM-120 the motion line leaves 体贴设置 readable", async ({ page }) => {
  await coldStart(page);
  await chooseSelf(page);
  await page.getByTestId("first-run-dismiss").click();
  const discover = page.getByTestId("settings-discover");
  await expect(discover).toBeVisible();
  await expect(discover).toContainText("减少动作和安静村子在这里。");
  await page.getByTestId("comfort-settings").scrollIntoViewIfNeeded();
  const placed = await page.evaluate(() => {
    const text = document.querySelector("[data-testid='comfort-title-text']")?.getBoundingClientRect();
    const tip = document.querySelector("[data-testid='settings-discover']")?.getBoundingClientRect();
    const summary = document.querySelector("[data-testid='comfort-settings'] > summary")?.getBoundingClientRect();
    const drawer = document.querySelector("[data-testid='village-drawer']")?.getBoundingClientRect();
    if (!text || !tip || !summary || !drawer) return null;
    const overlap = (a: DOMRect, b: DOMRect) => {
      const top = Math.max(a.top, b.top);
      const bottom = Math.min(a.bottom, b.bottom);
      const left = Math.max(a.left, b.left);
      const right = Math.min(a.right, b.right);
      if (right <= left || bottom <= top) return 0;
      return bottom - top;
    };
    const hit = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    return {
      title: text.height,
      overlap: overlap(text, tip),
      onSummary: hit(tip, summary),
      coversDrawer: hit(tip, drawer),
      chars: (document.querySelector("[data-testid='comfort-title-text']")?.textContent ?? "").replace(/\s/g, ""),
    };
  });
  expect(placed).toBeTruthy();
  expect(placed!.chars).toBe("体贴设置");
  expect(placed!.overlap).toBe(0);
  expect(placed!.onSummary).toBe(true);
  expect(placed!.coversDrawer).toBe(false);
});
