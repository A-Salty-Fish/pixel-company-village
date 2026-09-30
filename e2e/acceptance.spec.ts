import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

test("show-all nameplates flip a host flag", async ({ page }) => {
  await login(page);
  const host = page.locator("[data-village-host='ready']");
  await expect(host).toHaveAttribute("data-show-all", "0");
  await page.getByRole("button", { name: "全显" }).click();
  await expect(host).toHaveAttribute("data-show-all", "1");
});

test("quiet mode keeps the particle budget at zero", async ({ page }) => {
  await login(page);
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-particle-budget", "0");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-quiet", "1");
});

test("festival day after clears the banner", async ({ page }) => {
  await login(page);
  const dates = [
    ["2026-02-04T02:00:00.000Z", "2026-02-05T02:00:00.000Z", "立春"],
    ["2026-05-05T02:00:00.000Z", "2026-05-06T02:00:00.000Z", "立夏"],
    ["2026-08-07T02:00:00.000Z", "2026-08-08T02:00:00.000Z", "立秋"],
    ["2026-11-07T02:00:00.000Z", "2026-11-08T02:00:00.000Z", "立冬"],
  ] as const;
  for (const [on, off, label] of dates) {
    await page.evaluate((iso) => window.__VILLAGE_TEST__?.setClock(iso), on);
    await expect(page.getByTestId("season-banner")).toContainText(label);
    await page.evaluate((iso) => window.__VILLAGE_TEST__?.setClock(iso), off);
    await expect(page.getByTestId("season-banner")).not.toContainText(`今日${label}`);
  }
});

test("viewer switch keeps pins and kindness apart", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const [first, second, third, fourth] = body.people.map((person) => person.name);
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(first);
  await page.getByTestId("wave-d-panel").locator("summary").click();
  for (const name of [first, second, third]) {
    await page.locator(`[data-pin="${name}"]`).click();
  }
  await page.locator(`[data-pin="${fourth}"]`).click();
  await expect(page.getByTestId("pin-hint")).toContainText("最多钉三枚");
  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await page.getByTestId("wave-d-panel").locator("summary").click();
  await expect(page.locator(`[data-pin="${first}"]`)).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(second);
  await expect(page.locator(`[data-pin="${first}"]`)).toHaveAttribute("aria-pressed", "false");
  await page.getByTestId("self-picker").selectOption(first);
  await expect(page.locator(`[data-pin="${first}"]`)).toHaveAttribute("aria-pressed", "true");
});

test("kindness confirm debounces and does not credit another viewer", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const [self, other, nextViewer] = body.people.map((person) => person.name);
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  await page.evaluate((name) => window.__VILLAGE_TEST__?.selectVillager(name), other);
  await page.getByRole("button", { name: /今日互动|本地互动/ }).click();
  await page.getByRole("button", { name: "种子" }).click();
  await page.getByRole("button", { name: "确认关照" }).dblclick();
  await expect(page.locator("[data-kindness-quota]")).toContainText("今日 1/1");
  await page.getByTestId("self-picker").selectOption(nextViewer);
  await expect(page.getByTestId("kindness-undo")).toHaveCount(0);
  await page.getByTestId("self-picker").selectOption(self);
  await page.evaluate((name) => window.__VILLAGE_TEST__?.selectVillager(name), other);
  await expect(page.locator("[data-kindness-quota]")).toContainText("今日 1/1");
});

test("home camera moves when self is set", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0].name;
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  await page.getByTestId("wave-d-panel").locator("summary").click();
  await page.getByTestId("go-home").click();
  await expect(page.locator("[data-village-host]")).toHaveAttribute("data-camera-zoom", "2");
  await expect(page.getByTestId("season-banner")).toHaveAttribute("data-season-fade", "400");
});

test("visitor copy blocks home until a name is chosen", async ({ page }) => {
  await login(page);
  await expect(page.getByTestId("visitor-banner")).toBeVisible();
  await expect(page.getByTestId("thumb-home")).toBeDisabled();
  await page.getByTestId("wave-d-panel").locator("summary").click();
  await expect(page.getByTestId("go-home")).toBeDisabled();
});

test("crop water blocks a second pour the same day", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(body.people[0].name);
  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-09-30T02:00:00.000Z"));
  await page.getByTestId("wave-d-panel").locator("summary").click();
  await page.getByTestId("water-crop").click();
  await expect(page.getByTestId("wave-line")).toContainText("浇");
  await page.getByTestId("water-crop").click();
  await expect(page.getByTestId("wave-line")).toContainText("已经浇过");
  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-10-01T02:00:00.000Z"));
  await page.getByTestId("water-crop").click();
  await expect(page.getByTestId("wave-line")).toContainText("浇了一下水");
});

test("postcard export does not upload", async ({ page }) => {
  await login(page);
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  await page.getByTestId("wave-d-panel").locator("summary").click();
  await page.getByTestId("save-postcard").click();
  await expect(page.getByTestId("wave-line")).toContainText("已存");
  expect(posts.some((url) => /kindness|wave|ingest|blob|diary/i.test(url))).toBeFalsy();
});

test("atlas failure shows recovery instead of a blank page", async ({ page }) => {
  await page.route("**/village-atlas.json", (route) => route.abort());
  await page.route("**/village-atlas.png", (route) => route.abort());
  const password = process.env.SITE_PASSWORD ?? "";
  await page.goto("/login");
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("load-recovery")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("village-header")).toBeVisible();
});

test("a bad record stays isolated and an empty roster shows the yard", async ({ page }) => {
  await login(page);
  await page.evaluate(() => window.__VILLAGE_TEST__?.injectBadRecord());
  await expect(page.locator("[data-bad-isolated='1']")).toBeVisible();
  await expect(page.locator("[data-roster-item]").first()).toBeVisible();
  await page.evaluate(() => window.__VILLAGE_TEST__?.clearRoster());
  await expect(page.getByTestId("empty-yard")).toContainText("名册空着");
});

test("narrow split can open the map or the card", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  const refresh = await page.getByTestId("refresh-scores").boundingBox();
  expect(refresh && refresh.height >= 44 && refresh.width >= 44).toBeTruthy();
  await page.getByTestId("split-map").click();
  await expect(page.locator(".village-stage")).toHaveAttribute("style", /0\.78/);
  await page.getByTestId("split-card").click();
  await expect(page.locator(".village-stage")).toHaveAttribute("style", /0\.32/);
  await page.reload();
  await page.waitForSelector("[data-testid='split-bar']");
  await expect(page.locator(".village-stage")).toHaveAttribute("style", /0\.32/);
});

test("a cleared profile keeps quiet village checked", async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await login(page);
  await page.getByTestId("comfort-settings").locator("> summary").click();
  const quiet = page.getByTestId("quiet-toggle");
  await expect(quiet).toBeChecked();
  await expect(page.getByTestId("comfort-quiet")).toContainText("新来的人默认开着");
});

test("slow score load shows the boot shell without a retry button", async ({ page }) => {
  await login(page);
  await page.goto("/?delayScores=1", { waitUntil: "commit" });
  await expect(page.getByTestId("village-boot")).toBeVisible();
  await expect(page.getByTestId("village-boot")).toContainText("正在请名册");
  await expect(page.getByTestId("village-boot")).not.toContainText("再试一次");
  await expect(page.getByTestId("roster-list")).toBeVisible();
});

test("narrow sheet keeps the title, close, undo, and leave button usable", async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 800 });
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name;
  const target = body.people.find((person) => person.scored && person.name !== self)?.name;
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self ?? "");
  await page.evaluate((name) => window.__VILLAGE_TEST__?.selectVillager(name ?? null), target);
  const head = page.getByTestId("signal-sheet-head");
  const close = page.getByRole("button", { name: "关闭信号卡" });
  await expect(head).toBeVisible();
  await expect(close).toBeVisible();
  const leave = await page.getByRole("button", { name: "出村" }).boundingBox();
  expect(leave).toBeTruthy();
  const hit = await page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y);
    return Boolean(el?.closest("[data-testid='village-header']"));
  }, { x: (leave?.x ?? 0) + 8, y: (leave?.y ?? 0) + 8 });
  expect(hit).toBeTruthy();
  await page.getByRole("button", { name: /今日互动|本地互动/ }).click();
  await page.getByRole("button", { name: "种子" }).click();
  await page.getByRole("button", { name: "确认关照" }).click();
  const undo = page.getByTestId("kindness-undo");
  await expect(undo).toBeVisible();
  await expect(page.getByTestId("signal-actions")).toContainText("撤销");
  const headBox = await head.boundingBox();
  const undoBox = await undo.boundingBox();
  expect(headBox && undoBox && headBox.y < undoBox.y).toBeTruthy();
});

test("help drawer explains plates, quiet, and privacy", async ({ page }) => {
  await login(page);
  await page.getByTestId("village-help").locator("summary").click();
  await expect(page.getByTestId("village-help")).toContainText("琥珀名牌");
  await expect(page.getByTestId("village-help")).toContainText("安静村子");
  await expect(page.getByTestId("village-help")).toContainText("不收录说过的话");
});
