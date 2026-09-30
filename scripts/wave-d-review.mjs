import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const password = process.env.SITE_PASSWORD ?? "";
if (!password) {
  const text = fs.readFileSync(".env.local", "utf8");
  const match = text.match(/^SITE_PASSWORD=(.*)$/m);
  if (match) process.env.SITE_PASSWORD = match[1].trim().replace(/^["']|["']$/g, "");
}
const sitePassword = process.env.SITE_PASSWORD;
if (!sitePassword) throw new Error("SITE_PASSWORD is missing");

const root = path.resolve("docs/images/wave-d");
for (const dir of ["round1", "round2"]) fs.mkdirSync(path.join(root, dir), { recursive: true });

const browser = await chromium.launch({
  executablePath: fs.existsSync("/usr/bin/google-chrome-stable") ? "/usr/bin/google-chrome-stable" : undefined,
  channel: fs.existsSync("/usr/bin/google-chrome-stable") ? undefined : "chrome",
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

async function login() {
  await page.goto("http://localhost:43123/login");
  await page.getByTestId("login-password").fill(sitePassword);
  await page.getByTestId("login-submit").click();
  await page.waitForSelector("canvas[data-village-ready='1']", { timeout: 20_000 });
}

async function freeze(iso) {
  await page.evaluate((value) => {
    window.__VILLAGE_TEST__?.setClock(value);
    window.__VILLAGE_TEST__?.freezeAnimations(true);
  }, iso);
}

async function setQuiet(on) {
  await page.getByTestId("comfort-settings").locator("summary").click();
  const box = page.getByRole("checkbox", { name: /安静村子/ });
  if (on) await box.check();
  else await box.uncheck();
  await page.getByTestId("comfort-settings").locator("summary").click();
}

await login();
await freeze("2026-09-26T02:00:00.000Z");
await page.screenshot({ path: path.join(root, "round1/quiet-map-overview.png") });
await page.locator("canvas").screenshot({ path: path.join(root, "round1/quiet-nameplate.png") });
const roster = await page.request.get("http://localhost:43123/api/scores");
const body = await roster.json();
const scored = body.people.find((person) => person.scored)?.name;
const quiet = body.people.find((person) => !person.scored)?.name;
await page.evaluate((name) => window.__VILLAGE_TEST__?.selectVillager(name), scored);
await page.getByTestId("signal-card").screenshot({ path: path.join(root, "round1/quiet-scored-card.png") });
await freeze("2026-02-04T02:00:00.000Z");
await page.getByTestId("season-banner").screenshot({ path: path.join(root, "round1/quiet-festival.png") });

await setQuiet(false);
await freeze("2026-09-26T02:00:00.000Z");
await page.screenshot({ path: path.join(root, "round1/busy-map-overview.png") });
await page.locator("canvas").screenshot({ path: path.join(root, "round1/busy-nameplate.png") });
await page.evaluate((name) => window.__VILLAGE_TEST__?.selectVillager(name), scored);
await page.getByTestId("signal-card").screenshot({ path: path.join(root, "round1/busy-scored-card.png") });
await page.evaluate((name) => window.__VILLAGE_TEST__?.selectVillager(name), quiet ?? scored);
await page.getByTestId("signal-card").screenshot({ path: path.join(root, "round1/busy-unscored.png") });

await page.evaluate((name) => window.__VILLAGE_TEST__?.selectVillager(name), null);
await freeze("2026-09-26T10:30:00.000Z");
await page.locator("[data-village-host]").screenshot({ path: path.join(root, "round2/dusk-map.png") });
await page.getByTestId("village-help").locator("summary").click();
await page.getByTestId("village-help").screenshot({ path: path.join(root, "round2/help-drawer.png") });
await page.evaluate(() => window.__VILLAGE_TEST__?.clearRoster());
await page.getByTestId("empty-yard").screenshot({ path: path.join(root, "round2/empty-yard.png") });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://localhost:43123/");
await page.waitForSelector("canvas[data-village-ready='1']");
await page.screenshot({ path: path.join(root, "round2/mobile-thumb.png") });
await page.locator("[data-roster-item]").first().click();
await page.screenshot({ path: path.join(root, "round2/split-bar.png") });
await freeze("2026-02-04T14:00:00.000Z");
await page.locator("[data-village-host]").screenshot({ path: path.join(root, "round2/night-festival.png") });
await page.getByTestId("signal-card").screenshot({ path: path.join(root, "round2/rings-card.png") });

await browser.close();
console.log("wrote", root);
