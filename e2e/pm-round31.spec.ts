import { expect, test, type Page } from "@playwright/test";
import { login, roster } from "./login";

const LANTERN = { x: 852, y: 336 };

async function coldStart(page: Page, iso: string) {
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
  await page.evaluate((clock) => window.__VILLAGE_TEST__?.setClock(clock), iso);
}

async function chooseSelf(page: Page) {
  const body = await roster(page);
  const name = body.people[0]?.name ?? "";
  expect(name.length).toBeGreaterThan(1);
  await page.getByTestId("thumb-who").click();
  await page.getByTestId("who-sheet").getByTestId("self-picker").selectOption(name);
  await expect(page.locator(".farm-page")).toHaveAttribute("data-has-self", "1");
  await expect(page.getByTestId("first-run-guide")).toBeVisible();
  await expect(page.getByTestId("first-run-guide")).toContainText("先在地图上找我");
  return name;
}

type Spot = { name: string; x: number; y: number };
type Read = { name: string; text: string; kind: string; x: number; y: number; w: number; h: number };

function overlapArea(
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number },
) {
  const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  if (width <= 0 || height <= 0) return 0;
  return width * height;
}

async function frameRead(page: Page) {
  return page.evaluate(() => {
    const host = document.querySelector("[data-village-host='ready']");
    const canvas = document.querySelector("canvas");
    if (!host || !canvas) return null;
    const people = JSON.parse(host.getAttribute("data-people-xy") || "[]") as Spot[];
    const reads = JSON.parse(host.getAttribute("data-plate-read") || "[]") as Read[];
    const rect = canvas.getBoundingClientRect();
    const plates = reads.map((item) => ({
      name: item.name,
      text: item.text,
      left: rect.left + (item.x / canvas.width) * rect.width,
      top: rect.top + (item.y / canvas.height) * rect.height,
      right: rect.left + ((item.x + item.w) / canvas.width) * rect.width,
      bottom: rect.top + ((item.y + item.h) / canvas.height) * rect.height,
    }));
    return {
      people,
      plates,
      camX: Number(host.getAttribute("data-camera-x")),
      camY: Number(host.getAttribute("data-camera-y")),
      spanW: Number(host.getAttribute("data-view-span-w")),
      spanH: Number(host.getAttribute("data-view-span-h")),
      showAll: host.getAttribute("data-show-all"),
      zoom: host.getAttribute("data-camera-zoom"),
    };
  });
}

async function dockReport(page: Page) {
  const frame = await frameRead(page);
  return page.evaluate((plates) => {
    const visible = (el: Element | null) => {
      if (!el) return false;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
      const box = el.getBoundingClientRect();
      return box.width > 0 && box.height > 0;
    };
    const area = (a: DOMRect, b: { left: number; top: number; right: number; bottom: number }) => {
      const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (width <= 0 || height <= 0) return 0;
      return width * height;
    };
    const dock = document.querySelector("[data-testid='toy-dock']");
    const guide = document.querySelector("[data-testid='first-run-guide']");
    if (!visible(dock)) return { absent: true, onlyLantern: false, hit: 0, cards: [] as string[] };
    const cards = [...(dock?.querySelectorAll("[data-toy-id]") ?? [])].filter(visible);
    const ids = cards.map((el) => el.getAttribute("data-toy-id") ?? "");
    let hit = 0;
    const guideBox = guide && visible(guide) ? guide.getBoundingClientRect() : null;
    for (const card of cards) {
      const box = card.getBoundingClientRect();
      if (guideBox) hit += area(box, guideBox);
      for (const plate of plates) hit += area(box, plate);
    }
    return {
      absent: false,
      onlyLantern: ids.length === 1 && ids[0] === "lantern" && hit === 0,
      hit,
      cards: ids,
    };
  }, frame?.plates ?? []);
}

test("PV-PM-121 the evening invite frames the lantern without the yard counts", async ({ page }) => {
  await coldStart(page, "2026-10-03T10:00:00.000Z");
  await chooseSelf(page);
  const host = page.locator("[data-village-host='ready']");
  await expect(host).toHaveAttribute("data-show-all", "0");
  await expect(page.locator(".farm-page")).toHaveAttribute("data-lantern-frame", "1");
  const dusk = page.getByTestId("dusk-lantern");
  await expect(dusk).toBeVisible();
  await dusk.getByRole("button", { name: "灯笼该亮了" }).click();

  let framed = false;
  await expect.poll(async () => {
    const frame = await frameRead(page);
    if (
      frame &&
      frame.camX <= LANTERN.x &&
      LANTERN.x <= frame.camX + frame.spanW &&
      frame.camY <= LANTERN.y &&
      LANTERN.y <= frame.camY + frame.spanH
    ) {
      framed = true;
    }
    const dock = await dockReport(page);
    const clear = dock.absent || dock.onlyLantern;
    return framed && clear;
  }).toBe(true);

  const dock = await dockReport(page);
  expect(dock.absent || dock.onlyLantern).toBe(true);
  if (!dock.absent) expect(dock.hit).toBe(0);

  await page.locator("[data-testid='village-map-slot']").getByRole("button", { name: "去看村口" }).click();
  await page.getByTestId("map-home").click();
  await expect(page.getByTestId("map-home")).toHaveText("屋");
  await expect.poll(async () => (await dockReport(page)).absent).toBe(true);
});

test("PV-PM-122 one zoom keeps two nameplates above the first-run strip", async ({ page }) => {
  await coldStart(page, "2026-10-03T01:00:00.000Z");
  const self = await chooseSelf(page);
  const host = page.locator("[data-village-host='ready']");
  await expect(host).toHaveAttribute("data-show-all", "0");
  await expect(page.locator(".farm-page")).toHaveAttribute("data-zoom-plate-lift", "1");
  await expect(page.getByTestId("first-run-dismiss")).toBeVisible();
  const before = Number((await host.getAttribute("data-camera-zoom")) ?? "1");
  await page.getByRole("button", { name: "拉近" }).click();
  await expect(host).toHaveAttribute("data-camera-zoom", String(Math.min(3, before + 1)));

  await expect.poll(async () => {
    const frame = await frameRead(page);
    const guide = await page.getByTestId("first-run-guide").boundingBox();
    if (!frame || frame.showAll !== "0" || !guide) return false;
    const selfSpot = frame.people.find((person) => person.name === self);
    if (!selfSpot) return false;
    const byName = new Map<string, (typeof frame.plates)[number]>();
    for (const plate of frame.plates) {
      if ([...plate.text].length < 2 || !plate.name.startsWith(plate.text)) continue;
      const prev = byName.get(plate.name);
      if (!prev || [...plate.text].length > [...prev.text].length) byName.set(plate.name, plate);
    }
    const ranked = [...byName.values()]
      .map((plate) => {
        const person = frame.people.find((item) => item.name === plate.name);
        const dist = person ? (person.x - selfSpot.x) ** 2 + (person.y - selfSpot.y) ** 2 : Number.POSITIVE_INFINITY;
        return { plate, dist };
      })
      .sort((a, b) => a.dist - b.dist || a.plate.name.localeCompare(b.plate.name, "zh"));
    const nearest = ranked.slice(0, 2);
    if (nearest.length < 2) return false;
    const guideBox = { left: guide.x, top: guide.y, right: guide.x + guide.width, bottom: guide.y + guide.height };
    return nearest.every((item) => overlapArea(item.plate, guideBox) === 0);
  }).toBe(true);
});

test("PV-PM-123 the map sheet does not cut the first-run sentence", async ({ page }) => {
  await coldStart(page, "2026-10-03T01:00:00.000Z");
  await chooseSelf(page);
  await expect(page.locator(".farm-page")).toHaveAttribute("data-sheet-yield", "1");
  await expect(page.getByTestId("first-run-dismiss")).toBeVisible();
  await page.getByTestId("map-more").click();
  const sheet = page.getByTestId("map-more-sheet");
  const guide = page.getByTestId("first-run-guide");
  await expect(sheet).toBeVisible();
  await expect(guide).toBeVisible();
  await expect(guide).toContainText("先在地图上找我");

  const placed = await page.evaluate(() => {
    const boxOf = (el: Element | null) => {
      if (!el) return null;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return null;
      const box = el.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) return null;
      return { left: box.left, top: box.top, right: box.right, bottom: box.bottom };
    };
    const area = (
      a: { left: number; top: number; right: number; bottom: number },
      b: { left: number; top: number; right: number; bottom: number },
    ) => {
      const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (width <= 0 || height <= 0) return 0;
      return width * height;
    };
    const sheetBox = boxOf(document.querySelector("[data-testid='map-more-sheet']"));
    const guideBox = boxOf(document.querySelector("[data-testid='first-run-guide']"));
    const buttons = [
      boxOf(document.querySelector("[data-testid='name-legend'] summary")),
      boxOf(document.querySelector("[data-testid='yard-entry']")),
      boxOf(document.querySelector("[data-testid='toggle-plates']")),
    ];
    let buttonHit = 0;
    for (let i = 0; i < buttons.length; i += 1) {
      for (let j = i + 1; j < buttons.length; j += 1) {
        const left = buttons[i];
        const right = buttons[j];
        if (left && right) buttonHit += area(left, right);
      }
    }
    return {
      sheet: Boolean(sheetBox),
      guide: Boolean(guideBox),
      hit: sheetBox && guideBox ? area(sheetBox, guideBox) : -1,
      buttons: buttons.filter(Boolean).length,
      buttonHit,
    };
  });
  expect(placed.sheet).toBe(true);
  expect(placed.guide).toBe(true);
  expect(placed.hit).toBe(0);
  expect(placed.buttons).toBe(3);
  expect(placed.buttonHit).toBe(0);
});
