import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import LoginPage from "@/app/(auth)/login/page";
import RegisterPage from "@/app/(auth)/register/page";
import { RegisterForm } from "@/components/auth/RegisterForm";

describe("auth page scaffolds", () => {
  it("renders login route fields and actions", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: /welcome back/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create account/i })).toHaveAttribute(
      "href",
      "/register"
    );
  });

  it("renders register route fields and actions", () => {
    render(<RegisterPage />);

    expect(
      screen.getByRole("heading", { name: /create your workspace/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Create a password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Repeat your password")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /sign in/i })
    ).toHaveAttribute("href", "/login");
  });

  it("blocks mismatched passwords before submit", async () => {
    const onSubmit = vi.fn();

    render(<RegisterForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "abid@example.com" }
    });
    fireEvent.change(screen.getByPlaceholderText("Create a password"), {
      target: { value: "secret123" }
    });
    fireEvent.change(screen.getByPlaceholderText("Repeat your password"), {
      target: { value: "different123" }
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Passwords must match")
    );

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
