import { expect, test } from "@playwright/test";
import { loginThroughUi, mockSettingsApi } from "./helpers";

test("login redirects to chat and unlocks protected settings", async ({ page }) => {
  await mockSettingsApi(page);

  await page.goto("/settings");

  await expect(page).toHaveURL(/\/login$/);
  await loginThroughUi(page);
  await expect(page.getByText("Agentic RAG workspace")).toBeVisible();

  await page.goto("/settings");

  await expect(page).toHaveURL("/settings");
  await expect(page.getByText("Model configuration status")).toBeVisible();
});
