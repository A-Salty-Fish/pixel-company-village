import { expect, test } from "@playwright/test";

test("production read-only smoke @prod", async ({ page }) => {
  test.skip(!process.env.PLAYWRIGHT_PROD, "Set PLAYWRIGHT_PROD=1 and PLAYWRIGHT_BASE_URL to run the read-only production smoke.");
  const password = process.env.SITE_PASSWORD;
  if (!password) throw new Error("SITE_PASSWORD is missing");
  await page.goto("/login");
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await page.waitForSelector("canvas[data-village-ready='1']", { timeout: 20_000 });
  const scores = await page.request.get("/api/scores");
  expect(scores.ok()).toBeTruthy();
  const body = (await scores.json()) as { people: { name: string }[] };
  expect(body.people.length).toBeGreaterThan(0);
  await page.locator("[data-roster-item]").first().click();
  await expect(page.getByTestId("signal-card")).toBeVisible();
  await expect(page.getByRole("button", { name: "今日互动" })).toBeVisible();
});
