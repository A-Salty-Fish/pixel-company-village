import { expect, test } from "@playwright/test";
import { login } from "./login";

test("减动 sits under 村里新事 switches", async ({ page }) => {
  await login(page);
  await page.getByTestId("wave-d-panel").locator("summary").click();
  const toggle = page.getByTestId("reduce-motion-toggle");
  await expect(page.getByTestId("wave-toggles")).toContainText("开关");
  await expect(toggle).toBeVisible();
  await expect(toggle).toContainText("减动");
  await expect(toggle).toContainText("停住装饰晃动");
  const box = await toggle.boundingBox();
  expect(box && box.height >= 44).toBeTruthy();
  await expect(page.locator(".farm-page")).toHaveAttribute("data-reduce-motion", "0");
  await toggle.locator("input").check();
  await expect(page.locator(".farm-page")).toHaveAttribute("data-reduce-motion", "1");
  await toggle.locator("input").uncheck();
  await expect(page.locator(".farm-page")).toHaveAttribute("data-reduce-motion", "0");
});
