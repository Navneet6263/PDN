import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: process.env.E2E_URL || "http://localhost:3000",
    channel: "chrome",
    trace: "retain-on-failure",
  },
});
