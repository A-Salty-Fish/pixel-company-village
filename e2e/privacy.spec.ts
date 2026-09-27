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
  const planted = "should-not-echo-chat";
  const kindness = await page.request.post("/api/kindness", {
    data: { viewer: "林小满", target: "林小满", action: "seed", chat: planted },
  });
  expect(kindness.status()).toBe(404);
  expect(await kindness.text()).not.toContain(planted);
  const wave = await page.request.post("/api/wave", {
    data: { viewer: "林小满", target: "林小满", text: planted },
  });
  expect(wave.status()).toBe(404);
  expect(await wave.text()).not.toContain(planted);
});
