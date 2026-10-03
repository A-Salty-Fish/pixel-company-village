import { keepOldGlance } from "./login";
import { expect, test } from "@playwright/test";

test("production read-only smoke @prod", async ({ page }) => {
  test.skip(!process.env.PLAYWRIGHT_PROD, "Set PLAYWRIGHT_PROD=1 and PLAYWRIGHT_BASE_URL to run the read-only production smoke.");
  const password = process.env.SITE_PASSWORD;
  if (!password) throw new Error("SITE_PASSWORD is missing");
  const writes: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") writes.push(request.url());
  });
  await keepOldGlance(page);
  await page.goto("/login");
  await page.screenshot({ path: "tmp/prod-smoke/01-gate.png", fullPage: true });
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await page.waitForSelector("canvas[data-village-ready='1']", { timeout: 20_000 });
  await page.screenshot({ path: "tmp/prod-smoke/02-map-ready.png", fullPage: true });
  const scores = await page.request.get("/api/scores");
  expect(scores.ok()).toBeTruthy();
  const body = (await scores.json()) as { people: { name: string; scored: boolean }[]; date?: string };
  expect(body.people.length).toBeGreaterThan(0);
  await page.screenshot({ path: "tmp/prod-smoke/03-roster.png", fullPage: true });
  const scored = body.people.find((person) => person.scored);
  const quiet = body.people.find((person) => !person.scored);
  if (scored) await page.locator("[data-roster-item]").filter({ hasText: scored.name }).first().click();
  else await page.locator("[data-roster-item]").first().click();
  await expect(page.getByTestId("signal-card")).toBeVisible();
  await page.screenshot({ path: "tmp/prod-smoke/04-scored-card.png", fullPage: true });
  if (quiet) {
    const more = page.getByTestId("roster-more");
    if ((await page.locator(`[data-roster-name="${quiet.name}"]`).count()) === 0 && (await more.count()) > 0) {
      await more.click();
    }
    await page.locator("[data-roster-item]").filter({ hasText: quiet.name }).first().click();
    await expect(page.getByTestId("signal-card")).toContainText("未评分");
  }
  await page.screenshot({ path: "tmp/prod-smoke/05-unscored-or-empty.png", fullPage: true });
  await page.getByTestId("exit-village").click();
  await expect(page.getByTestId("login-form")).toBeVisible();
  await page.screenshot({ path: "tmp/prod-smoke/06-left-village.png", fullPage: true });
  expect(writes.filter((url) => /\/api\/(kindness|wave|ingest|feed)/.test(url))).toEqual([]);
});
