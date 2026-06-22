import { expect, test } from "@playwright/test";
import { loginThroughUi } from "./helpers";

test("markdown upload reaches completed and appears in the document list", async ({
  page
}) => {
  const documents: Array<{
    documentId: string;
    fileName: string;
    processedChunks: number;
    status: string;
    totalChunks: number;
    updatedAt: string;
  }> = [];
  const statusSnapshots = [
    {
      documentId: "doc-e2e-029",
      fileName: "team-facts.md",
      processedChunks: 0,
      status: "parsing",
      totalChunks: 12
    },
    {
      documentId: "doc-e2e-029",
      fileName: "team-facts.md",
      processedChunks: 12,
      status: "completed",
      totalChunks: 12
    }
  ];

  await page.route("**/api/documents", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        data: documents
      }),
      contentType: "application/json",
      status: 200
    });
  });

  await page.route("**/api/documents/upload", async (route) => {
    documents.splice(0, documents.length, {
      documentId: "doc-e2e-029",
      fileName: "team-facts.md",
      processedChunks: 0,
      status: "uploaded",
      totalChunks: 0,
      updatedAt: new Date().toISOString()
    });

    await route.fulfill({
      body: JSON.stringify({
        data: {
          documentId: "doc-e2e-029",
          status: "uploaded"
        }
      }),
      contentType: "application/json",
      status: 200
    });
  });

  await page.route("**/api/documents/doc-e2e-029/status", async (route) => {
    const nextSnapshot = statusSnapshots.shift() ?? statusSnapshots.at(-1);

    if (nextSnapshot) {
      documents.splice(0, documents.length, {
        documentId: nextSnapshot.documentId,
        fileName: nextSnapshot.fileName,
        processedChunks: nextSnapshot.processedChunks,
        status: nextSnapshot.status,
        totalChunks: nextSnapshot.totalChunks,
        updatedAt: new Date().toISOString()
      });
    }

    await route.fulfill({
      body: JSON.stringify({
        data: nextSnapshot
      }),
      contentType: "application/json",
      status: 200
    });
  });

  await loginThroughUi(page);
  await page.goto("/documents");

  await page.getByLabel("Upload document").setInputFiles({
    buffer: Buffer.from("# Team Facts\n\nThe launch city is Pune.\n"),
    mimeType: "text/markdown",
    name: "team-facts.md"
  });

  await expect(page.getByText("Selected document: team-facts.md")).toBeVisible();
  await expect(
    page.getByText("Polling live processing status for team-facts.md.")
  ).toBeVisible();
  await expect(page.getByRole("table").getByText("team-facts.md")).toBeVisible();
  await expect(page.getByText("12 chunks indexed")).toBeVisible();
  await expect(page.getByRole("status", { name: /processing completed/i })).toBeVisible();
});
