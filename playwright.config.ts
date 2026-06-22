import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src/tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3100"
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    env: {
      ...process.env,
      E2E_AUTH_BYPASS: "true",
      NEXT_PUBLIC_E2E_AUTH_BYPASS: "true"
    },
    reuseExistingServer: false,
    url: "http://127.0.0.1:3100"
  }
});
