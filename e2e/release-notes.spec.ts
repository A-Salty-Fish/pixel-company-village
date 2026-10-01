import { expect, test } from "@playwright/test";
import { login } from "./login";

test("version chip opens the player changelog", async ({ page }) => {
  await login(page);
  const chip = page.getByTestId("village-version");
  await expect(chip).toBeVisible();
  await expect(chip).toHaveAttribute("data-version", "1.4.0");
  await expect(chip).toContainText("v1.4.0");
  const onMap = await chip.evaluate((el) => Boolean(el.closest("[data-village-host], canvas")));
  expect(onMap).toBe(false);
  await expect(page).toHaveTitle("像素公司村 · 手机也想多待");
  const header = page.getByTestId("village-header");
  await expect(header.getByTestId("village-brand")).toHaveText("像素公司村");
  await expect(header.getByTestId("ship-title")).toHaveText("手机也想多待");

  await chip.click();
  const notes = page.getByTestId("release-notes");
  await expect(notes).toHaveJSProperty("open", true);
  await expect(notes).toContainText("更新日志");
  await expect(notes).toContainText("v1.4.0 · 手机也想多待");
  await expect(notes).toContainText("还想回村");
  await expect(notes).toContainText("今日可做");
  await expect(notes).toContainText("再待一会儿");
  await expect(notes).toContainText("夜里还能认路");
  await expect(notes).toContainText("小路、水面");
  await expect(notes).toContainText("村里开张");
  await expect(notes).toContainText("分数环");
  await expect(notes).toContainText("不出现说过的话");
  await expect(notes).toContainText("玩乐雷达");
  await expect(notes).not.toContainText("原文");
  await expect(notes).not.toContainText("SITE_PASSWORD");
  await expect(notes).not.toContainText("INGEST_SECRET");
});
