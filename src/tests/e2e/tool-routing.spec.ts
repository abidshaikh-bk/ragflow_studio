import { expect, test } from "@playwright/test";
import { loginThroughUi, resetE2EState } from "./helpers";

test("chat routes date, document, and web questions to the expected tools", async ({
  page
}) => {
  await resetE2EState(page);
  await loginThroughUi(page);

  await page.getByLabel("Ask your documents").fill("What date is it today?");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page.getByText("June 23, 2026")).toBeVisible();
  await expect(page.getByText("date.now -> resolved UTC time context")).toBeVisible();

  await page.getByRole("button", { name: "New chat" }).click();
  await page.getByLabel("Ask your documents").fill("What is the launch city?");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page.getByText("The launch city is Pune.")).toBeVisible();
  await expect(
    page.getByText("pinecone.query -> returned 1 document chunk")
  ).toBeVisible();

  await page.getByRole("button", { name: "New chat" }).click();
  await page
    .getByLabel("Ask your documents")
    .fill("What is the latest AI news on the web?");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(
    page.getByText("retrieval systems remain a major focus")
  ).toBeVisible();
  await expect(page.getByText("tavily.search -> returned 1 web result")).toBeVisible();
});
