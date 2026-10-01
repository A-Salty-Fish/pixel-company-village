import { expect, test, type Page } from "@playwright/test";
import { login, roster, openVillageDrawer } from "./login";

const PLANTED = "PRIVACY_PROBE_CHAT_ALPHA";

async function pickSelf(page: Page, name: string) {
  const settings = page.getByTestId("comfort-settings");
  if ((await settings.getAttribute("open")) === null) {
    await settings.locator("> summary").click();
  }
  await page.getByTestId("self-picker").selectOption(name);
}

test("ten yard-edge loops stay with that viewer", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  await login(page);
  const body = await roster(page);
  const [first, second] = body.people.map((person) => person.name);
  expect(first && second && first !== second).toBeTruthy();
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-quiet", "1");
  await expect(page.getByTestId("quiet-toggle")).toBeChecked();

  await pickSelf(page, first ?? "");
  const panel = page.getByTestId("yard-nook");
  await openVillageDrawer(page);
  await panel.locator("> summary").click();
  await expect(panel).toHaveAttribute("data-nook-count", "10");
  await expect(panel).toHaveAttribute("data-viewer", first ?? "");

  await page.getByTestId("nook-kettle").click();
  await expect(page.getByTestId("nook-kettle")).toHaveAttribute("data-pressed", "1");
  const kettleLine = await page.getByTestId("nook-line").innerText();
  await page.getByTestId("nook-kettle").click();
  await expect(page.getByTestId("nook-line")).toContainText("今天看过了");
  await expect(page.getByTestId("nook-line")).toContainText(kettleLine);

  await page.getByTestId("nook-pond").click();
  await page.getByTestId("nook-pond").click();
  await expect(page.getByTestId("nook-pond")).toHaveAttribute("data-count", "2");
  await expect(page.getByTestId("nook-pond")).toHaveAttribute("data-scope", "session");

  await page.getByTestId("nook-wood").click();
  await expect(page.getByTestId("nook-wood")).toHaveAttribute("data-count", "1");

  await page.getByTestId("nook-laundry").click();
  await expect(page.getByTestId("nook-laundry")).toHaveAttribute("data-sway", "sway");

  await page.getByTestId("nook-bridge").click();
  await expect(page.getByTestId("nook-bridge")).toHaveAttribute("data-pressed", "1");
  await expect(page.getByTestId("nook-bridge")).toHaveAttribute("data-count", "1");

  await page.getByTestId("nook-cat").click();
  await expect(page.getByTestId("nook-cat")).toHaveAttribute("data-pressed", "1");

  await page.getByTestId("nook-barrel").click();
  await expect(page.getByTestId("nook-barrel")).toHaveAttribute("data-pressed", "1");

  await page.getByTestId("nook-sign").click();
  await expect(page.getByTestId("nook-sign")).toHaveAttribute("data-count", "1");

  await page.getByTestId("nook-pot").click();
  await expect(page.getByTestId("nook-pot")).toHaveAttribute("data-count", "1");
  await expect(page.getByTestId("nook-pot")).toHaveAttribute("data-scope", "session");

  await page.getByTestId("nook-shutter").click();
  await expect(page.getByTestId("nook-shutter")).toHaveAttribute("data-swing", "swing");
  await expect(page.getByTestId("nook-shutter")).toHaveAttribute("data-count", "1");
  await expect(page.getByTestId("nook-tally")).toContainText("10/10");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-quiet", "1");

  const saved = await page.evaluate((name) => {
    return {
      local: window.localStorage.getItem(`village:viewer:${name}:nook-r9`),
      session: window.sessionStorage.getItem(`village:viewer:${name}:nook-session-r9`),
    };
  }, first ?? "");
  const stored = JSON.parse(saved.local ?? "{}") as Record<string, unknown>;
  expect(stored.kettleDay).toBeTruthy();
  expect(stored.skips).toBeUndefined();
  expect(stored.pots).toBeUndefined();
  expect(JSON.stringify(stored)).not.toContain(PLANTED);
  const session = JSON.parse(saved.session ?? "{}") as { skips: number; pots: number };
  expect(session.skips).toBe(2);
  expect(session.pots).toBe(1);

  await pickSelf(page, second ?? "");
  await expect(panel).toHaveAttribute("data-viewer", second ?? "");
  await expect(page.getByTestId("nook-kettle")).toHaveAttribute("data-pressed", "0");
  await expect(page.getByTestId("nook-pond")).toHaveAttribute("data-count", "0");
  await expect(page.getByTestId("nook-wood")).toHaveAttribute("data-count", "0");
  await expect(page.getByTestId("nook-laundry")).toHaveAttribute("data-sway", "off");
  await expect(page.getByTestId("nook-shutter")).toHaveAttribute("data-swing", "off");
  await expect(page.getByTestId("nook-tally")).toContainText("0/10");

  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await pickSelf(page, first ?? "");
  await openVillageDrawer(page);
  await page.getByTestId("yard-nook").locator("> summary").click();
  await expect(page.getByTestId("nook-kettle")).toHaveAttribute("data-pressed", "1");
  await expect(page.getByTestId("nook-pond")).toHaveAttribute("data-count", "2");
  await expect(page.getByTestId("nook-wood")).toHaveAttribute("data-count", "1");
  await expect(page.getByTestId("nook-laundry")).toHaveAttribute("data-sway", "sway");
  await expect(page.getByTestId("nook-bridge")).toHaveAttribute("data-count", "1");
  await expect(page.getByTestId("nook-pot")).toHaveAttribute("data-count", "1");
  await expect(page.getByTestId("nook-shutter")).toHaveAttribute("data-count", "1");
  expect(posts.filter((url) => !url.includes("/api/login"))).toEqual([]);
});

test("laundry and shutters hold still when motion is reduced", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const name = body.people[0]?.name ?? "";
  await pickSelf(page, name);
  await openVillageDrawer(page);
  await page.getByTestId("yard-nook").locator("> summary").click();
  await page.getByTestId("nook-laundry").click();
  await page.getByTestId("nook-shutter").click();
  await expect(page.getByTestId("nook-laundry")).toHaveAttribute("data-sway", "sway");
  await expect(page.getByTestId("nook-shutter")).toHaveAttribute("data-swing", "swing");
  await page.getByTestId("comfort-decor").locator("summary").click();
  await page.getByRole("checkbox", { name: /减少动作/ }).check();
  await expect(page.getByTestId("nook-yard")).toHaveAttribute("data-motion", "reduced");
  await expect(page.getByTestId("nook-laundry")).toHaveAttribute("data-sway", "still");
  await expect(page.getByTestId("nook-laundry")).toContainText("别住");
  await expect(page.getByTestId("nook-shutter")).toHaveAttribute("data-swing", "still");
  await expect(page.getByTestId("nook-shutter")).toContainText("开着");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-quiet", "1");
});

test("planted chat text is dropped from yard-edge storage", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const name = body.people[0]?.name ?? "";
  await page.evaluate(
    ({ viewer, planted }) => {
      window.localStorage.setItem(
        `village:viewer:${viewer}:nook-r9`,
        JSON.stringify({ kettleDay: "2026-09-30", kettleIndex: 0, chat: planted, letter: planted }),
      );
      window.sessionStorage.setItem(`village:viewer:${viewer}:nook-session-r9`, planted);
    },
    { viewer: name, planted: PLANTED },
  );
  await pickSelf(page, name);
  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await pickSelf(page, name);
  await openVillageDrawer(page);
  await page.getByTestId("yard-nook").locator("> summary").click();
  await expect(page.locator("body")).not.toContainText(PLANTED);
  const dump = await page.evaluate((viewer) => {
    return {
      local: window.localStorage.getItem(`village:viewer:${viewer}:nook-r9`),
      session: window.sessionStorage.getItem(`village:viewer:${viewer}:nook-session-r9`),
    };
  }, name);
  expect(dump.local ?? "").not.toContain(PLANTED);
  expect(dump.local ?? "").not.toMatch(/chat|letter/);
  expect(dump.session ?? "").not.toContain(PLANTED);
  const session = JSON.parse(dump.session ?? "{}") as { skips: number; pots: number };
  expect(session.skips).toBe(0);
  expect(session.pots).toBe(0);
});
