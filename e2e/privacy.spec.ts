import { expect, test } from "@playwright/test";
import { login, roster } from "./login";

const ALLOWED_KEYS = new Set([
  "date",
  "disclaimer",
  "people",
  "name",
  "scored",
  "msgs",
  "work",
  "fish",
  "on_task",
  "tags",
  "plot",
  "ok",
  "error",
  "store",
]);

function assertAllowlist(value: unknown, path = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertAllowlist(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    expect(ALLOWED_KEYS.has(key), `${path}.${key}`).toBeTruthy();
    expect(key.toLowerCase()).not.toMatch(/chat|message|transcript|snippet|body|content/);
    if (typeof child === "string" && child.length > 80 && key !== "disclaimer") {
      throw new Error(`long_text:${path}.${key}`);
    }
    assertAllowlist(child, `${path}.${key}`);
  }
}

test("score payloads stay on the numeric allowlist", async ({ page }) => {
  const urls: string[] = [];
  page.on("request", (request) => urls.push(request.url()));
  await login(page);
  const body = await roster(page);
  assertAllowlist(body);
  expect(body.people.length).toBeGreaterThanOrEqual(12);
  expect(urls.some((url) => url.includes("/api/kindness") || url.includes("/api/wave") || url.includes("/api/history"))).toBeFalsy();
  await expect(page.locator("[data-village-host='ready']")).not.toHaveAttribute("data-history-matrix", /.+/);
});

test("removed quota routes do not echo chat text", async ({ page }) => {
  await login(page);
  const planted = "PRIVACY_PROBE_CHAT_ALPHA";
  const kindness = await page.request.post("/api/kindness", {
    data: { viewer: "林小满", target: "林小满", action: "seed", chat: planted, text: planted, body: planted, message: planted },
  });
  expect(kindness.status()).toBe(404);
  expect(await kindness.text()).not.toContain(planted);
  expect(await kindness.text()).not.toContain("should-not-echo-chat");
  const wave = await page.request.post("/api/wave", {
    data: { viewer: "林小满", target: "林小满", text: planted },
  });
  expect(wave.status()).toBe(404);
  expect(await wave.text()).not.toContain(planted);
  const diary = await page.request.post("/api/diary", { data: { text: planted } });
  expect(diary.status()).toBe(404);
  expect(await diary.text()).not.toContain(planted);
});

test("storage and test state never hold chat text", async ({ page }) => {
  await login(page);
  const planted = "PRIVACY_PROBE_CHAT_ALPHA";
  await page.getByTestId("comfort-settings").locator("summary").click();
  const body = await roster(page);
  await page.getByTestId("self-picker").selectOption(body.people[0].name);
  await page.getByTestId("wave-d-panel").locator("summary").click();
  await page.getByTestId("diary-2").click();
  await page.getByTestId("village-help").locator("summary").click();
  const dump = await page.evaluate(() => {
    const bags = [window.localStorage, window.sessionStorage].map((store) => {
      const out: Record<string, string> = {};
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i);
        if (key) out[key] = store.getItem(key) ?? "";
      }
      return out;
    });
    return { bags, state: window.__VILLAGE_TEST__?.getState() ?? null, html: document.body.innerText };
  });
  const packed = JSON.stringify(dump);
  expect(packed).not.toContain(planted);
  expect(packed).not.toMatch(/聊天原文|消息内容|AI 总结/);
  const forbidden = /chat|transcript|snippet|slack|raw_message|message_text|messagetext|messages|body|content|prompt|completion|llm|summary|ai_summary|comment/i;
  for (const bag of dump.bags) {
    for (const key of Object.keys(bag)) expect(key).not.toMatch(forbidden);
  }
  expect(JSON.stringify(dump.state)).not.toMatch(forbidden);
});
