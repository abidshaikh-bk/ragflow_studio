import { expect, test } from "@playwright/test";
import { loginThroughUi, resetE2EState } from "./helpers";

test("document-grounded chat answers with the known fact and persists after refresh", async ({
  page
}) => {
  await resetE2EState(page);
  await loginThroughUi(page);

  await page.getByLabel("Ask your documents").fill("What is the launch city?");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(
    page.getByLabel("Private knowledge chat center panel").getByText("The launch city is Pune.")
  ).toBeVisible();
  await expect(page.getByText("team-facts.md · chunk 1").first()).toBeVisible();
  await expect(
    page.getByText("pinecone.query -> returned 1 document chunk")
  ).toBeVisible();

  await page.reload();

  await expect(
    page.getByLabel("Private knowledge chat center panel").getByText("The launch city is Pune.")
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /What is the launch city\?.*Live/i })
  ).toBeVisible();
});
