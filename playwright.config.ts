import fs from "node:fs";
import { defineConfig, devices } from "@playwright/test";

if (!process.env.SITE_PASSWORD && fs.existsSync(".env.local")) {
  const text = fs.readFileSync(".env.local", "utf8");
  for (const line of text.split("\n")) {
    const match = line.match(/^SITE_PASSWORD=(.*)$/);
    if (match) process.env.SITE_PASSWORD = match[1].trim().replace(/^["']|["']$/g, "");
  }
}

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:43123",
    ...(fs.existsSync("/usr/bin/google-chrome-stable")
      ? { launchOptions: { executablePath: "/usr/bin/google-chrome-stable" } }
      : { channel: "chrome" as const }),
    trace: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:43123/login",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
