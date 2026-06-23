import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { McpToolsSettings } from "@/components/settings/McpToolsSettings";

describe("MCP tools settings", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("renders the empty state when no MCP servers are configured", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: []
        }),
        {
          status: 200
        }
      )
    );

    render(<McpToolsSettings />);

    await waitFor(() =>
      expect(screen.getByText("No MCP servers configured.")).toBeInTheDocument()
    );
    expect(
      screen.getByText(/add an http or stdio runtime mcp server/i)
    ).toBeInTheDocument();
  });

  it("lets the user switch transports and shows only the matching fields", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: []
        }),
        {
          status: 200
        }
      )
    );

    render(<McpToolsSettings />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /add mcp server/i })).toBeInTheDocument()
    );

    fireEvent.click(screen.getAllByRole("button", { name: /add mcp server/i })[0]);

    expect(screen.getByLabelText("HTTP URL")).toBeInTheDocument();
    expect(screen.queryByLabelText("stdio command")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Transport"), {
      target: { value: "stdio" }
    });

    expect(screen.getByLabelText(/stdio command/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/stdio args/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("HTTP URL")).not.toBeInTheDocument();
  });

  it("calls the save API with HTTP fields", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: []
          }),
          {
            status: 200
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              args: [],
              command: null,
              created_at: "2026-06-23T00:00:00.000Z",
              description: "Remote search",
              enabled: true,
              has_env_secrets: false,
              has_header_secrets: true,
              id: "config-1",
              is_default: false,
              name: "Search tools",
              timeout_ms: 30000,
              transport: "http",
              updated_at: "2026-06-23T00:00:00.000Z",
              url: "https://example.com/mcp",
              user_id: "user-123"
            }
          }),
          {
            status: 200
          }
        )
      );

    render(<McpToolsSettings />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /add mcp server/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getAllByRole("button", { name: /add mcp server/i })[0]);

    fireEvent.change(screen.getByLabelText("Server name"), {
      target: { value: "Search tools" }
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Remote search" }
    });
    fireEvent.change(screen.getByLabelText("HTTP URL"), {
      target: { value: "https://example.com/mcp" }
    });
    fireEvent.click(screen.getByRole("button", { name: /add header/i }));
    fireEvent.change(screen.getAllByLabelText("Key")[0], {
      target: { value: "Authorization" }
    });
    fireEvent.change(screen.getAllByLabelText("Value")[0], {
      target: { value: "Bearer secret-token" }
    });
    fireEvent.click(screen.getByLabelText("Enabled"));
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const lastCall = fetchMock.mock.calls.at(-1);

    expect(lastCall?.[0]).toBe("/api/mcp/servers");
    expect(lastCall?.[1]).toMatchObject({
      headers: {
        "content-type": "application/json"
      },
      method: "POST"
    });
    expect(JSON.parse(String(lastCall?.[1]?.body))).toEqual({
      description: "Remote search",
      enabled: true,
      headers: {
        Authorization: "Bearer secret-token"
      },
      isDefault: false,
      name: "Search tools",
      timeoutMs: 30000,
      transport: "http",
      url: "https://example.com/mcp"
    });
  });

  it("calls the test API and shows available tools", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                args: [],
                command: null,
                created_at: "2026-06-23T00:00:00.000Z",
                description: "Remote search",
                enabled: true,
                has_env_secrets: false,
                has_header_secrets: true,
                id: "config-1",
                is_default: false,
                name: "Search tools",
                timeout_ms: 30000,
                transport: "http",
                updated_at: "2026-06-23T00:00:00.000Z",
                url: "https://example.com/mcp",
                user_id: "user-123"
              }
            ]
          }),
          {
            status: 200
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              server: {
                id: "config-1"
              },
              tools: [
                {
                  description: "Search the web",
                  name: "remote_lookup"
                }
              ]
            }
          }),
          {
            status: 200
          }
        )
      );

    render(<McpToolsSettings />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /test connection/i })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /test connection/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith("/api/mcp/servers/config-1/test", {
        method: "POST"
      })
    );
    await waitFor(() =>
      expect(screen.getByText(/available tools for search tools/i)).toBeInTheDocument()
    );
    expect(screen.getByText("remote_lookup")).toBeInTheDocument();
    expect(screen.getByText("Search the web")).toBeInTheDocument();
  });
});
