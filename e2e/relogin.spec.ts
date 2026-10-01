import { expect, test } from "@playwright/test";
import { login } from "./login";

test("re-login restores header and roster without opening 村里的事", async ({ page }) => {
  const password = process.env.SITE_PASSWORD ?? "";
  await login(page);
  await expect(page.getByTestId("village-header")).toContainText("像素公司村");

  await page.getByTestId("exit-village").click();
  await expect(page.getByTestId("login-form")).toBeVisible();

  await page.getByTestId("login-password").fill(password);
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/", { timeout: 20_000 }),
    page.getByTestId("login-submit").click(),
  ]);

  const header = page.getByTestId("village-header");
  const roster = page.getByTestId("roster-list");
  await expect(header).toBeVisible();
  await expect(header).toContainText("像素公司村");
  await expect(page.getByTestId("village-glance")).toBeVisible();
  await expect(page.getByTestId("refresh-scores")).toBeVisible();
  await page.getByTestId("score-meta").locator("summary").click();
  await expect(header).toContainText("有分");
  await expect(page.getByTestId("toggle-plates")).toBeVisible();
  await expect(roster).toBeVisible();
  await expect(roster.locator("[data-roster-item]").first()).toBeVisible();
  await expect(page.getByTestId("play-shelf")).not.toHaveAttribute("open");
  await expect(page.getByTestId("season-banner")).toBeVisible();
});
