import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

test("quiet nameplates and find-me are on the map", async ({ page }) => {
  await login(page);
  await expect(page.locator("[data-plate-lod='quiet']")).toBeVisible();
  await expect(page.getByTestId("name-legend")).toContainText("安静时远景收起名牌");
  const findMe = page.getByTestId("find-me");
  await expect(findMe).toBeVisible();
  await expect(findMe).toContainText("找我");
  const box = await findMe.boundingBox();
  expect(box && box.width >= 44 && box.height >= 44).toBeTruthy();
  await expect(findMe).toBeDisabled();
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  await expect(findMe).toBeEnabled();
  await findMe.click();
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-camera-zoom", "2");
  await page.getByTestId("quiet-toggle").uncheck();
  await expect(page.locator("[data-plate-lod='open']")).toBeVisible();
  await expect(page.getByTestId("name-legend")).toContainText("远景先收起名牌");
});
