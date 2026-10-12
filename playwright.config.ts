import { defineConfig, devices } from "@playwright/test";

/**
 * Browser checks run against an already running production instance, normally
 * the local container started by `scripts/e2e.sh`. Point E2E_BASE_URL at
 * another instance to test it instead.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // One retry on CI surfaces flaky tests in the report without failing the run.
  retries: process.env.CI ? 1 : 0,
  globalTimeout: process.env.CI ? 10 * 60_000 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
