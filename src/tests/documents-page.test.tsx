import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DocumentsPage from "@/app/(app)/documents/page";

describe("documents page upload flow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it("advances a supported document through the mock progress stages", () => {
    render(<DocumentsPage />);

    fireEvent.change(screen.getByLabelText(/upload document/i), {
      target: {
        files: [new File(["# Handbook"], "employee-handbook.md", { type: "text/markdown" })]
      }
    });

    expect(screen.getByText(/selected document: employee-handbook.md/i)).toBeInTheDocument();
    expect(screen.getByText(/current stage/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^uploaded$/i, { selector: "p" }).length).toBeGreaterThan(0);

    act(() => {
      vi.advanceTimersByTime(700);
    });
    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(screen.getAllByText(/^chunking$/i, { selector: "p" }).length).toBeGreaterThan(0);

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

    expect(screen.getByRole("status", { name: /processing completed/i })).toBeInTheDocument();
    expect(screen.getAllByText(/24 chunks indexed/i).length).toBeGreaterThan(0);
  });

  it("renders a failed terminal state from the preview action", () => {
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
});
