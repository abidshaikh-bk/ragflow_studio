import { expect, test } from "@playwright/test";

test("login redirects to chat and unlocks protected settings", async ({ page }) => {
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

  await page.goto("/settings");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

  await page.getByLabel("Email").fill("playwright@ragflow.test");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL("/chat");
  await expect(page.getByText("Agentic RAG workspace")).toBeVisible();

  await page.goto("/settings");

  await expect(page).toHaveURL("/settings");
  await expect(page.getByText("Model configuration status")).toBeVisible();
});
