import type { Page } from "@playwright/test";

export async function login(page: Page) {
  const password = process.env.SITE_PASSWORD;
  if (!password || password.length < 4) throw new Error("SITE_PASSWORD is missing");
  await page.goto("/login");
  await page.getByTestId("login-password").fill(password);
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/" || url.searchParams.has("error"), { timeout: 20_000 }),
    page.getByTestId("login-submit").click(),
  ]);
  if (new URL(page.url()).searchParams.get("error")) throw new Error("login_rejected");
  await page.waitForSelector("canvas[data-village-ready='1']");
  await page.waitForFunction(() => window.__VILLAGE_TEST__?.ready());
}

export async function roster(page: Page) {
  const scores = await page.request.get("/api/scores");
  if (!scores.ok()) throw new Error("scores_unavailable");
  return (await scores.json()) as {
    date: string;
    people: { name: string; scored: boolean }[];
  };
}
