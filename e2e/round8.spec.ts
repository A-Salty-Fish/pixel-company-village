import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

const PLANTED = "PRIVACY_PROBE_CHAT_ALPHA";

async function pickSelf(page: import("@playwright/test").Page, name: string) {
  const settings = page.getByTestId("comfort-settings");
  if ((await settings.getAttribute("open")) === null) {
    await settings.locator("> summary").click();
  }
  await page.getByTestId("self-picker").selectOption(name);
}

test("ten yard loops stay with that viewer and keep quiet village on", async ({ page }) => {
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
  const panel = page.getByTestId("village-loops");
  await panel.locator("> summary").click();
  await expect(panel).toHaveAttribute("data-loop-count", "10");
  await expect(panel).toHaveAttribute("data-viewer", first ?? "");

  await page.getByTestId("loop-mailbox").click();
  await expect(page.getByTestId("loop-mailbox")).toHaveAttribute("data-pressed", "1");
  await expect(page.getByTestId("loop-mailbox")).toHaveAttribute("data-scope", "viewer");
  const mailLine = await page.getByTestId("loop-line").innerText();
  await page.getByTestId("loop-mailbox").click();
  await expect(page.getByTestId("loop-line")).toContainText("今天看过了");
  await expect(page.getByTestId("loop-line")).toContainText(mailLine);

  await page.getByTestId("loop-scarecrow").click();
  await expect(page.getByTestId("loop-scarecrow")).toHaveAttribute("data-count", "1");
  await expect(page.getByTestId("loop-scarecrow")).toHaveAttribute("data-lean", "left");

  await page.getByTestId("loop-well").click();
  await expect(page.getByTestId("loop-well")).toHaveAttribute("data-pressed", "1");

  await page.getByTestId("loop-crop").click();
  await expect(page.getByTestId("loop-crop")).toHaveAttribute("data-pressed", "1");

  await page.getByTestId("loop-pebble").click();
  await page.getByTestId("loop-pebble").click();
  await expect(page.getByTestId("loop-pebble")).toHaveAttribute("data-count", "2");
  await expect(page.getByTestId("loop-pebble")).toHaveAttribute("data-scope", "session");

  await page.getByTestId("loop-lantern").click();
  await expect(page.getByTestId("loop-lantern")).toHaveAttribute("data-glow", "pulse");

  await page.getByTestId("loop-notice").click();
  await expect(page.getByTestId("loop-notice")).toHaveAttribute("data-count", "1");

  await page.getByTestId("loop-coop").click();
  await expect(page.getByTestId("loop-coop")).toHaveAttribute("data-pressed", "1");

  await page.getByTestId("loop-gate").click();
  await expect(page.getByTestId("loop-gate")).toHaveAttribute("data-open", "1");
  await expect(page.getByTestId("loop-gate")).toHaveAttribute("data-count", "1");

  await page.getByTestId("loop-picnic").click();
  await expect(page.getByTestId("loop-picnic")).toHaveAttribute("data-pressed", "1");
  await expect(page.getByTestId("loop-picnic")).toHaveAttribute("data-count", "1");
  await expect(page.getByTestId("loop-tally")).toContainText("10/10");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-quiet", "1");

  const saved = await page.evaluate((name) => {
    const localKey = `village:viewer:${name}:loops-r8`;
    const sessionKey = `village:viewer:${name}:pebbles-r8`;
    return {
      local: window.localStorage.getItem(localKey),
      session: window.sessionStorage.getItem(sessionKey),
    };
  }, first ?? "");
  expect(saved.session).toBe("2");
  const stored = JSON.parse(saved.local ?? "{}") as Record<string, unknown>;
  expect(stored.mailDay).toBeTruthy();
  expect(stored.pebble).toBeUndefined();
  expect(stored.pebbles).toBeUndefined();
  expect(JSON.stringify(stored)).not.toContain(PLANTED);

  await pickSelf(page, second ?? "");
  await expect(panel).toHaveAttribute("data-viewer", second ?? "");
  await expect(page.getByTestId("loop-mailbox")).toHaveAttribute("data-pressed", "0");
  await expect(page.getByTestId("loop-scarecrow")).toHaveAttribute("data-count", "0");
  await expect(page.getByTestId("loop-pebble")).toHaveAttribute("data-count", "0");
  await expect(page.getByTestId("loop-lantern")).toHaveAttribute("data-glow", "off");
  await expect(page.getByTestId("loop-gate")).toHaveAttribute("data-open", "0");
  await expect(page.getByTestId("loop-picnic")).toHaveAttribute("data-pressed", "0");
  await expect(page.getByTestId("loop-tally")).toContainText("0/10");

  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await pickSelf(page, first ?? "");
  await page.getByTestId("village-loops").locator("> summary").click();
  await expect(page.getByTestId("loop-mailbox")).toHaveAttribute("data-pressed", "1");
  await expect(page.getByTestId("loop-scarecrow")).toHaveAttribute("data-count", "1");
  await expect(page.getByTestId("loop-pebble")).toHaveAttribute("data-count", "2");
  await expect(page.getByTestId("loop-lantern")).toHaveAttribute("data-glow", "pulse");
  await expect(page.getByTestId("loop-gate")).toHaveAttribute("data-count", "1");
  await expect(page.getByTestId("loop-picnic")).toHaveAttribute("data-count", "1");
  expect(posts.filter((url) => !url.includes("/api/login"))).toEqual([]);
});

test("lantern dusk glow stays still when motion is reduced", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const name = body.people[0]?.name ?? "";
  await pickSelf(page, name);
  await page.getByTestId("village-loops").locator("> summary").click();
  await page.getByTestId("loop-lantern").click();
  await expect(page.getByTestId("loop-lantern")).toHaveAttribute("data-glow", "pulse");
  await page.getByTestId("comfort-decor").locator("summary").click();
  await page.getByRole("checkbox", { name: /减少动作/ }).check();
  await expect(page.getByTestId("loop-yard")).toHaveAttribute("data-motion", "reduced");
  await expect(page.getByTestId("loop-lantern")).toHaveAttribute("data-glow", "still");
  await expect(page.getByTestId("loop-lantern")).toContainText("静光");
  await expect(page.locator("[data-village-host='ready']")).toHaveAttribute("data-quiet", "1");
});

test("planted chat text is dropped from yard loop storage", async ({ page }) => {
  await login(page);
  const body = await roster(page);
  const name = body.people[0]?.name ?? "";
  await page.evaluate(
    ({ viewer, planted }) => {
      window.localStorage.setItem(
        `village:viewer:${viewer}:loops-r8`,
        JSON.stringify({ mailDay: "2026-09-30", mailIndex: 0, chat: planted, letter: planted }),
      );
      window.sessionStorage.setItem(`village:viewer:${viewer}:pebbles-r8`, planted);
    },
    { viewer: name, planted: PLANTED },
  );
  await pickSelf(page, name);
  await page.reload();
  await page.waitForSelector("canvas[data-village-ready='1']");
  await pickSelf(page, name);
  await page.getByTestId("village-loops").locator("> summary").click();
  await expect(page.locator("body")).not.toContainText(PLANTED);
  const dump = await page.evaluate((viewer) => {
    return {
      local: window.localStorage.getItem(`village:viewer:${viewer}:loops-r8`),
      session: window.sessionStorage.getItem(`village:viewer:${viewer}:pebbles-r8`),
    };
  }, name);
  expect(dump.local ?? "").not.toContain(PLANTED);
  expect(dump.session).toBe("0");
  expect(dump.local ?? "").not.toMatch(/chat|letter/);
});
