import React from "react";
import { render, screen } from "@testing-library/react";
import HomePage from "../app/page";

describe("HomePage", () => {
  it("renders the landing content and auth entry points", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /build an authenticated document intelligence workspace/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /create your workspace/i })
    ).toHaveAttribute("href", "/register");
    expect(screen.getAllByAltText(/ragflow studio logo/i)).toHaveLength(1);
  });
});
