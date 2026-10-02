import { expect, test } from "@playwright/test";
import { ensureRosterRow, login, roster } from "./login";

test("a wave leaves a bond post for this viewer only", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const self = body.people[0]?.name ?? "";
  const other = body.people.find((person) => person.name !== self)?.name ?? "";
  const next = body.people.find((person) => person.name !== self && person.name !== other)?.name ?? "";
  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(self);
  await (await ensureRosterRow(page, other)).click();
  await page.getByTestId("signal-actions").getByRole("button", { name: "挥手" }).click();
  await expect(page.getByTestId("signal-card")).toContainText("对方也挥了回来");
  await expect(page.getByTestId("bond-note")).toContainText("点过一次头");
  await expect(await ensureRosterRow(page, other)).toHaveAttribute("data-bond", "1");
  await expect(page.locator("[data-bond-posts]")).toHaveAttribute("data-bond-posts", "1");

  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await expect(await ensureRosterRow(page, other)).toHaveAttribute("data-bond", "1");

  await page.getByTestId("comfort-settings").locator("> summary").click();
  await page.getByTestId("self-picker").selectOption(next);
  await expect(await ensureRosterRow(page, other)).toHaveAttribute("data-bond", "0");
  await expect(page.locator("[data-bond-posts]")).toHaveAttribute("data-bond-posts", "0");
});
