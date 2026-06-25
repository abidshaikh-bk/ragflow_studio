import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HistoryPageClient } from "@/components/history/HistoryPageClient";

describe("history page", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders an empty state when the user has no saved history", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({
        data: []
      }),
      ok: true
    } as Response);

    render(<HistoryPageClient />);

    expect(await screen.findByRole("heading", { name: /no run history yet/i })).toBeInTheDocument();
  });

  it("renders a load error when the history request fails", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({
        error: "Unauthorized"
      }),
      ok: false
    } as Response);

    render(<HistoryPageClient />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/unable to load history/i);
  });

  it("renders populated history, filters it, and shows runtime MCP activity", async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      if (input === "/api/history") {
        return {
          json: async () => ({
            data: [
              {
                assistantReply: "Refunds require manager approval.",
                hasRuntimeMcpActivity: true,
                sessionId: "session-1",
                status: "completed",
                title: "Policy Q&A",
                toolActivityCount: 2,
                toolNames: ["pinecone.query", "weather_lookup"],
                trace: {
                  deepLink: null,
                  runId: "trace-123",
                  source: "assistant_message"
                },
                updatedAt: "2026-06-25T07:00:00.000Z",
                userPrompt: "What does the refund policy say?"
              },
              {
                assistantReply: null,
                hasRuntimeMcpActivity: false,
                sessionId: "session-2",
                status: "in_progress",
                title: "Draft run",
                toolActivityCount: 0,
                toolNames: [],
                trace: null,
                updatedAt: "2026-06-24T07:00:00.000Z",
                userPrompt: "Still running?"
              }
            ]
          }),
          ok: true
        } as Response;
      }

      if (input === "/api/history/session-1") {
        return {
          json: async () => ({
            data: {
              assistantReply: "Refunds require manager approval.",
              hasRuntimeMcpActivity: true,
              messages: [
                {
                  content: "What does the refund policy say?",
                  createdAt: "2026-06-25T06:59:00.000Z",
                  id: "message-1",
                  langsmithRunId: null,
                  role: "user"
                },
                {
                  content: "Refunds require manager approval.",
                  createdAt: "2026-06-25T07:00:00.000Z",
                  id: "message-2",
                  langsmithRunId: "trace-123",
                  metadata: {
                    sources: ["employee-handbook.md chunk 4"]
                  },
                  role: "assistant"
                }
              ],
              sessionId: "session-1",
              status: "completed",
              title: "Policy Q&A",
              toolActivity: [
                {
                  createdAt: "2026-06-25T06:59:30.000Z",
                  id: "tool-1",
                  langsmithRunId: null,
                  latencyMs: 180,
                  source: "built_in",
                  status: "success",
                  summary: "Returned 3 items.",
                  toolName: "pinecone.query"
                },
                {
                  createdAt: "2026-06-25T06:59:40.000Z",
                  id: "tool-2",
                  langsmithRunId: "trace-456",
                  latencyMs: 220,
                  source: "runtime_mcp",
                  status: "success",
                  summary: "Sunny and 29C.",
                  toolName: "weather_lookup"
                }
              ],
              toolActivityCount: 2,
              toolNames: ["pinecone.query", "weather_lookup"],
              trace: {
                deepLink: null,
                runId: "trace-123",
                source: "assistant_message"
              },
              updatedAt: "2026-06-25T07:00:00.000Z",
              userPrompt: "What does the refund policy say?"
            }
          }),
          ok: true
        } as Response;
      }

      if (input === "/api/history/session-2") {
        return {
          json: async () => ({
            data: {
              assistantReply: null,
              hasRuntimeMcpActivity: false,
              messages: [],
              sessionId: "session-2",
              status: "in_progress",
              title: "Draft run",
              toolActivity: [],
              toolActivityCount: 0,
              toolNames: [],
              trace: null,
              updatedAt: "2026-06-24T07:00:00.000Z",
              userPrompt: "Still running?"
            }
          }),
          ok: true
        } as Response;
      }

      throw new Error(`Unexpected fetch: ${String(input)}`);
    });

    render(<HistoryPageClient />);

    expect(await screen.findByText(/session: policy q&a/i)).toBeInTheDocument();
    expect(await screen.findByText(/runtime mcp used/i)).toBeInTheDocument();
    expect(screen.getAllByText(/weather_lookup/i)).toHaveLength(2);
    expect(screen.getAllByText(/trace-123/i)).toHaveLength(2);

    fireEvent.change(screen.getByLabelText(/tool source/i), {
      target: { value: "built_in" }
    });

    await waitFor(() =>
      expect(screen.queryByText(/session: policy q&a/i)).not.toBeInTheDocument()
    );

    fireEvent.change(screen.getByLabelText(/tool source/i), {
      target: { value: "runtime_mcp" }
    });

    expect(await screen.findByText(/session: policy q&a/i)).toBeInTheDocument();
  });

  it("renders detail errors when a selected session fails to load", async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      if (input === "/api/history") {
        return {
          json: async () => ({
            data: [
              {
                assistantReply: "Answer",
                hasRuntimeMcpActivity: false,
                sessionId: "session-1",
                status: "completed",
                title: "Session one",
                toolActivityCount: 0,
                toolNames: [],
                trace: null,
                updatedAt: "2026-06-25T07:00:00.000Z",
                userPrompt: "Prompt"
              }
            ]
          }),
          ok: true
        } as Response;
      }

      return {
        json: async () => ({
          error: "History session not found."
        }),
        ok: false
      } as Response;
    });

    render(<HistoryPageClient />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /unable to load session detail/i
    );
  });
});
