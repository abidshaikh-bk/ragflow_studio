import { expect, test } from "@playwright/test";

test("landing page shows marketing sections, snapshot imagery, and auth links", async ({
  page
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Find the answer in your documents before the meeting starts."
    })
  ).toBeVisible();
  await expect(
    page.getByAltText(
      "RAGFlow Studio chat workspace showing a grounded answer with cited document sources"
    )
  ).toBeVisible();
  await expect(
    page.getByAltText(
      "RAGFlow Studio documents workspace showing upload progress and indexed document history"
    )
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Start free workspace" })).toHaveAttribute(
    "href",
    "/register"
  );
  await expect(page.getByRole("navigation", { name: "Footer" })).toContainText(
    "Create account"
  );
});

test("landing page keeps primary actions visible on a mobile viewport", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Login" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Create account" }).first()).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Document intelligence that does not ask you to trade away control."
    })
  ).toBeVisible();
});
