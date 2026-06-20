import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Spinner } from "@/components/ui/Spinner";
import { TopNav } from "@/components/app-shell/TopNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/documents"
}));

describe("TopNav", () => {
  it("renders the expected navigation links and highlights the active route", () => {
    render(<TopNav />);

    expect(screen.getByRole("link", { name: "Chat" })).toHaveAttribute(
      "href",
      "/chat"
    );
    expect(screen.getByRole("link", { name: "Documents" })).toHaveAttribute(
      "href",
      "/documents"
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings"
    );
    expect(screen.getByRole("link", { name: "Documents" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(
      screen.getByRole("button", { name: /logout/i })
    ).toBeInTheDocument();
  });
});

describe("Shared feedback components", () => {
  it("renders a loading spinner with accessible status text", () => {
    render(<Spinner label="Loading page" />);

    expect(screen.getByRole("status", { name: /loading page/i })).toBeInTheDocument();
  });

  it("renders an error alert with the provided message", () => {
    render(<ErrorAlert message="Unable to load documents." title="Load error" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Load error");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to load documents."
    );
  });
});
