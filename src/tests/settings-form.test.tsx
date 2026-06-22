import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { SettingsForm } from "@/components/settings/SettingsForm";

describe("settings form", () => {
  it("renders all provider, model, and secret fields", () => {
    render(
      <SettingsForm
        initialMaskedSecrets={{
          chatApiKey: "********1234",
          embeddingApiKey: "********5678"
        }}
      />
    );

    expect(screen.getByLabelText("Chat provider")).toBeInTheDocument();
    expect(screen.getByLabelText("Chat model")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter a new chat provider key")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Embedding provider")).toBeInTheDocument();
    expect(
      screen.getByRole("spinbutton", { name: /embedding dimensions/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Embedding model")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter a new embedding provider key")
    ).toBeInTheDocument();
    expect(screen.getByText(/stored value on file: \*{8}1234/i)).toBeInTheDocument();
    expect(screen.getByText(/stored value on file: \*{8}5678/i)).toBeInTheDocument();
  });

  it("disables the save button while submitting", async () => {
    let resolveSubmit: (() => void) | undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        })
    );

    render(<SettingsForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    const button = screen.getByRole("button", { name: /save changes/i });

    await waitFor(() => expect(button).toBeDisabled());

    resolveSubmit?.();

    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it("prevents saving when provider or model values are empty", async () => {
    const onSubmit = vi.fn();

    render(
      <SettingsForm
        initialValues={{
          chatModel: "",
          chatProvider: "",
          embeddingDimensions: 0,
          embeddingModel: "",
          embeddingProvider: ""
        }}
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Fix the highlighted settings before saving."
      )
    );

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Select a chat provider.")).toBeInTheDocument();
    expect(screen.getByText("Enter a chat model.")).toBeInTheDocument();
    expect(screen.getByText("Select an embedding provider.")).toBeInTheDocument();
    expect(screen.getByText("Enter an embedding dimension.")).toBeInTheDocument();
    expect(screen.getByText("Enter an embedding model.")).toBeInTheDocument();
  });

  it("clears raw secrets and keeps them masked after save", async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      chatApiKeyMasked: "********1234",
      embeddingApiKeyMasked: "********5678",
      message: "Settings saved."
    });

    render(<SettingsForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByPlaceholderText("Enter a new chat provider key"), {
      target: { value: "chat-secret-key" }
    });
    fireEvent.change(
      screen.getByPlaceholderText("Enter a new embedding provider key"),
      {
      target: { value: "embedding-secret-key" }
      }
    );
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Settings saved.")
    );

    expect(
      screen.getByPlaceholderText("Enter a new chat provider key")
    ).toHaveValue("");
    expect(
      screen.getByPlaceholderText("Enter a new embedding provider key")
    ).toHaveValue("");
    expect(screen.queryByDisplayValue("chat-secret-key")).not.toBeInTheDocument();
    expect(
      screen.queryByDisplayValue("embedding-secret-key")
    ).not.toBeInTheDocument();
    expect(screen.getByText(/stored value on file: \*{8}1234/i)).toBeInTheDocument();
    expect(screen.getByText(/stored value on file: \*{8}5678/i)).toBeInTheDocument();
  });
});
