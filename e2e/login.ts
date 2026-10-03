import type { Page } from "@playwright/test";

export async function login(page: Page, opts?: { glance?: "closed" }) {
  const password = process.env.SITE_PASSWORD;
  if (!password || password.length < 4) throw new Error("SITE_PASSWORD is missing");
  await page.addInitScript((closed: boolean) => {
    (window as Window & { __VILLAGE_GLANCE_MENU__?: "0" | "1" }).__VILLAGE_GLANCE_MENU__ = closed ? "0" : "1";
  }, opts?.glance === "closed");
  await page.goto("/login");
  await page.getByTestId("login-password").fill(password);
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/" || url.searchParams.has("error"), { timeout: 20_000 }),
    page.getByTestId("login-submit").click(),
  ]);
  if (new URL(page.url()).searchParams.get("error")) throw new Error("login_rejected");
  await page.waitForSelector("canvas[data-village-ready='1']");
  await page.waitForFunction(() => window.__VILLAGE_TEST__?.ready());
}

/** Secondary panels live inside 「村里」, which starts closed. */
export async function openVillageDrawer(page: Page) {
  const drawer = page.getByTestId("village-drawer");
  if ((await drawer.count()) === 0) return;
  if ((await drawer.getAttribute("open")) === null) {
    await drawer.locator(":scope > summary").click();
  }
}

export async function openWeekBoard(page: Page) {
  const badge = page.getByTestId("week-badge");
  if ((await badge.getAttribute("aria-expanded")) !== "true") await badge.click();
}

/** Folded roster keeps unscored names behind 「还有 N 人」. Expand when a test needs that row. */
export async function ensureRosterRow(page: Page, name: string) {
  const row = page.locator(`[data-roster-name="${name}"]`);
  if ((await row.count()) === 0) {
    const more = page.getByTestId("roster-more");
    if ((await more.count()) > 0) await more.click();
  }
  return page.locator(`[data-roster-name="${name}"]`);
}

export async function roster(page: Page) {
  const scores = await page.request.get("/api/scores");
  if (!scores.ok()) throw new Error("scores_unavailable");
  return (await scores.json()) as {
    date: string;
    people: { name: string; scored: boolean }[];
  };
}

/** Tests that log in by hand still open the old chrome. First glance stays closed unless this runs. */
export async function keepOldGlance(page: Page) {
  await page.addInitScript(() => {
    (window as Window & { __VILLAGE_GLANCE_MENU__?: "0" | "1" }).__VILLAGE_GLANCE_MENU__ = "1";
  });
}
