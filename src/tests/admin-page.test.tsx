import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminPageClient } from "@/components/admin/AdminPageClient";

describe("AdminPageClient", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (input, init) => {
        if (input === "/api/admin/assistant" && (!init || init.method === undefined)) {
          return {
            json: async () => ({
              data: {
                systemPrompt: "Keep answers grounded in retrieved evidence.",
                toolPolicy: {
                  enableDateTime: true,
                  enableVectorSearch: true,
                  enableWebSearch: false
                },
                updatedAt: "2026-06-25T10:00:00.000Z"
              }
            }),
            ok: true
          };
        }

        if (input === "/api/admin/mcp-servers" && (!init || init.method === undefined)) {
          return {
            json: async () => ({
              data: []
            }),
            ok: true
          };
        }

        return {
          json: async () => ({
            data: {
              systemPrompt: "Prefer numbered next steps.",
              toolPolicy: {
                enableDateTime: true,
                enableVectorSearch: false,
                enableWebSearch: false
              },
              updatedAt: "2026-06-25T10:30:00.000Z"
            }
          }),
          ok: true
        };
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the shared assistant settings and saves edits", async () => {
    render(<AdminPageClient />);

    expect(await screen.findByRole("textbox", { name: /system prompt/i })).toHaveValue(
      "Keep answers grounded in retrieved evidence."
    );
    expect(screen.getByLabelText("Web search")).not.toBeChecked();

    fireEvent.change(screen.getByRole("textbox", { name: /system prompt/i }), {
      target: {
        value: "Prefer numbered next steps."
      }
    });
    fireEvent.click(screen.getByLabelText("Vector search"));
    fireEvent.click(screen.getByRole("button", { name: /save shared assistant/i }));

    await waitFor(() =>
      expect(screen.getByText(/shared assistant settings saved/i)).toBeInTheDocument()
    );
    expect(screen.getByLabelText("Vector search")).not.toBeChecked();
    expect(screen.getByText(/custom prompt active/i)).toBeInTheDocument();
  });

  it("shows a load error when the admin API request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (input) => {
        if (input === "/api/admin/mcp-servers") {
          return {
            json: async () => ({
              data: []
            }),
            ok: true
          };
        }

        return {
          json: async () => ({
            error: "Forbidden"
          }),
          ok: false
        };
      })
    );

    render(<AdminPageClient />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(
      await screen.findByText(/unable to load the shared assistant settings|forbidden/i)
    ).toBeInTheDocument();
  });
});
