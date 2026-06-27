import React from "react";
import { render, screen } from "@testing-library/react";
import HomePage from "../app/page";

describe("HomePage", () => {
  it("renders the marketing sections, snapshots, and auth entry points", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /find the answer in your documents before the meeting starts/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /see where answers, uploads, and trust signals come together/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /document intelligence that does not ask you to trade away control/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /start free workspace/i })
    ).toHaveAttribute("href", "/register");
    expect(screen.getAllByRole("link", { name: /login/i })[0]).toHaveAttribute(
      "href",
      "/login"
    );
    expect(screen.getAllByAltText(/ragflow studio logo/i)).toHaveLength(2);
    expect(
      screen.getByAltText(
        /chat workspace showing a grounded answer with cited document sources/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByAltText(
        /documents workspace showing upload progress and indexed document history/i
      )
    ).toBeInTheDocument();
  });
});
