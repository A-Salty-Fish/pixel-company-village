import { expect, test } from "@playwright/test";
import { login } from "./login";

test("first glance is the field, a name, and one glowing place", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, { glance: "closed" });
  const pageRoot = page.locator(".farm-page");
  await expect(pageRoot).toHaveAttribute("data-first-glance", "1");
  await expect(pageRoot).toHaveAttribute("data-glance-menu", "0");

  await expect(page.getByTestId("village-header")).toBeHidden();
  await expect(page.getByTestId("today-entry")).toBeHidden();
  await expect(page.getByTestId("narrow-today")).toBeHidden();
  await expect(page.getByRole("button", { name: "拉近" })).toBeHidden();
  await expect(page.getByRole("button", { name: "去看村口" })).toBeHidden();
  await expect(page.getByRole("button", { name: "知道了" })).toBeHidden();
  await expect(page.getByTestId("social-float-chip")).toBeHidden();
  await expect(page.getByTestId("thumb-who")).toBeHidden();
  await expect(page.getByTestId("split-map")).toBeHidden();

  await expect(page.getByTestId("glance-find")).toHaveText("先在地图上找我");
  const place = page.getByTestId("glance-place");
  await expect(place).toBeVisible();
  const label = (await place.innerText()).trim();
  expect(label.startsWith("去看")).toBe(false);
  expect(["村口", "湖边", "长椅", "灯笼"]).toContain(label);

  await place.click();
  await expect
    .poll(async () => page.locator("[data-village-host='ready']").getAttribute("data-next-id"))
    .toMatch(/^(gate|pond|bench|lantern|lantern-frame)$/);

  const name = await page.evaluate(() => window.__VILLAGE_TEST__?.getState().rosterNames[0] ?? null);
  expect(name).toBeTruthy();
  await page.evaluate((picked) => window.__VILLAGE_TEST__?.selectVillager(picked), name);
  await expect(page.getByTestId("glance-find")).toHaveCount(0);
  await expect(page.getByTestId("glance-greet")).toBeVisible();
  await expect(page.getByRole("button", { name: "知道了" })).toBeHidden();

  await page.getByTestId("today-mark").click();
  await expect(page.getByTestId("today-entry")).toBeVisible();
  await expect(page.getByTestId("village-header")).toBeHidden();

  await page.getByTestId("glance-menu").click();
  await expect(pageRoot).toHaveAttribute("data-glance-menu", "1");
  await expect(page.getByTestId("village-header")).toBeVisible();
  await expect(page.getByRole("button", { name: "拉近" })).toBeVisible();
});
