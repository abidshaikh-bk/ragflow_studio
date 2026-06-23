import { expect, type Page } from "@playwright/test";

const E2E_STATE_COOKIE_NAME = "ragflow_e2e_state";
const E2E_BASE_URL = "http://127.0.0.1:3100";

export async function mockSettingsApi(page: Page) {
  await page.route("**/api/settings", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        data: {
          chatApiKeyMasked: null,
          chatModel: "gpt-4.1-mini",
          chatProvider: "openai",
          embeddingApiKeyMasked: null,
          embeddingDimensions: 1024,
          embeddingModel: "text-embedding-3-small",
          embeddingProvider: "openai"
        }
      }),
      contentType: "application/json",
      status: 200
    });
  });
}

export async function resetE2EState(page: Page) {
  const stateId = `state-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  await page.context().addCookies([
    {
      name: E2E_STATE_COOKIE_NAME,
      url: E2E_BASE_URL,
      value: stateId
    }
  ]);

  const response = await page.request.post(`/api/e2e/reset?stateId=${stateId}`);

  expect(response.ok()).toBe(true);
}

export async function loginThroughUi(page: Page) {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

  await page.getByLabel("Email").fill("playwright@ragflow.test");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL("/chat");
}
