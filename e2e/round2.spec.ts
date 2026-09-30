import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

test("quiet off shows butterflies by day, dusk and fireflies later, and the bench toggles", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("quiet-toggle").uncheck();
  await page.getByTestId("self-picker").selectOption(body.people[0].name);
  const host = page.locator("[data-village-host='ready']");
  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-09-30T04:00:00.000Z"));
  await expect(host).toHaveAttribute("data-critters", "butterfly");
  await expect(host).toHaveAttribute("data-dusk", "0");
  await expect(host).toHaveAttribute("data-season", "autumn");
  await page.evaluate(() => window.__VILLAGE_TEST__?.setClock("2026-09-30T11:00:00.000Z"));
  await expect(host).toHaveAttribute("data-dusk", "1");
  await expect(host).toHaveAttribute("data-critters", "firefly");
  await page.getByTestId("wave-d-panel").locator("summary").click();
  await page.getByTestId("sit-bench").click();
  await expect(host).toHaveAttribute("data-sitting", "1");
  await expect(page.getByTestId("sit-bench")).toHaveText("起身");
  await page.getByTestId("sit-bench").click();
  await expect(host).toHaveAttribute("data-sitting", "0");
});
