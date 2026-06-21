import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DocumentsPage from "@/app/(app)/documents/page";

describe("documents page upload flow", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          data: {
            documentId: "doc-123",
            status: "uploaded"
          }
        }),
        ok: true
      })
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows an error for unsupported files", () => {
    render(<DocumentsPage />);

    fireEvent.change(screen.getByLabelText(/upload document/i), {
      target: {
        files: [new File(["name,price"], "pricing.csv", { type: "text/csv" })]
      }
    });

    expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
  });

  it("uploads through the API before advancing through the mock progress stages", async () => {
    render(<DocumentsPage />);

    fireEvent.change(screen.getByLabelText(/upload document/i), {
      target: {
        files: [new File(["# Handbook"], "employee-handbook.md", { type: "text/markdown" })]
      }
    });

    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/documents/upload",
        expect.objectContaining({
          method: "POST"
        })
      )
    );
    expect(await screen.findByText(/selected document: employee-handbook.md/i)).toBeInTheDocument();
    expect(screen.getByText(/current stage/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^uploaded$/i, { selector: "p" }).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/reached private s3 storage\. continuing through the mock parsing pipeline/i)
    ).toBeInTheDocument();

    await waitFor(
      () =>
        expect(screen.getByRole("status", { name: /processing completed/i })).toBeInTheDocument(),
      { timeout: 6000 }
    );
    expect(screen.getAllByText(/24 chunks indexed/i).length).toBeGreaterThan(0);
  }, 10000);

  it("renders a failed terminal state from the preview action", () => {
    vi.useFakeTimers();
    render(<DocumentsPage />);

    fireEvent.click(screen.getByRole("button", { name: /preview failed state/i }));
    act(() => {
      vi.advanceTimersByTime(700);
    });
    act(() => {
      vi.advanceTimersByTime(700);
    });
    act(() => {
      vi.advanceTimersByTime(700);
    });
    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(screen.getByRole("status", { name: /processing failed/i })).toBeInTheDocument();
    expect(screen.getAllByText(/embedding provider timed out while generating vectors/i).length)
      .toBeGreaterThan(0);
  });

  it("shows an upload error when the API rejects the file", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          error: "Unauthorized"
        }),
        ok: false
      })
    );

    render(<DocumentsPage />);

    fireEvent.change(screen.getByLabelText(/upload document/i), {
      target: {
        files: [new File(["# Handbook"], "employee-handbook.md", { type: "text/markdown" })]
      }
    });

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Unauthorized")
    );
  });
});
