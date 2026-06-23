import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as GET_SERVER, POST as POST_SERVERS } from "@/app/api/mcp/servers/route";
import {
  DELETE as DELETE_SERVER,
  GET as GET_SERVER_BY_ID,
  PATCH as PATCH_SERVER
} from "@/app/api/mcp/servers/[serverId]/route";
import { GET as GET_SERVER_TOOLS } from "@/app/api/mcp/servers/[serverId]/tools/route";
import { POST as TEST_SERVER } from "@/app/api/mcp/servers/[serverId]/test/route";

const getUserMock = vi.fn();
const createMcpServerConfigMock = vi.fn();
const deleteMcpServerConfigMock = vi.fn();
const getMcpServerConfigMock = vi.fn();
const listMcpServerConfigsMock = vi.fn();
const listMcpServerToolsMock = vi.fn();
const testMcpServerConfigMock = vi.fn();
const updateMcpServerConfigMock = vi.fn();

const supabaseMock = {
  auth: {
    getUser: getUserMock
  }
};

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: () => supabaseMock
}));

vi.mock("@/server/mcp/service", () => ({
  createMcpServerConfig: (...args: unknown[]) => createMcpServerConfigMock(...args),
  deleteMcpServerConfig: (...args: unknown[]) => deleteMcpServerConfigMock(...args),
  getMcpServerConfig: (...args: unknown[]) => getMcpServerConfigMock(...args),
  listMcpServerConfigs: (...args: unknown[]) => listMcpServerConfigsMock(...args),
  listMcpServerTools: (...args: unknown[]) => listMcpServerToolsMock(...args),
  testMcpServerConfig: (...args: unknown[]) => testMcpServerConfigMock(...args),
  updateMcpServerConfig: (...args: unknown[]) => updateMcpServerConfigMock(...args)
}));

describe("/api/mcp/servers routes", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    createMcpServerConfigMock.mockReset();
    deleteMcpServerConfigMock.mockReset();
    getMcpServerConfigMock.mockReset();
    listMcpServerConfigsMock.mockReset();
    listMcpServerToolsMock.mockReset();
    testMcpServerConfigMock.mockReset();
    updateMcpServerConfigMock.mockReset();
  });

  it("returns 401 for unauthenticated requests", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: null
      }
    });

    const response = await GET_SERVER();

    expect(response.status).toBe(401);
  });

  it("lets the authenticated user CRUD their own configs", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
      }
    });
    listMcpServerConfigsMock.mockResolvedValue([
      {
        id: "config-1",
        name: "Remote tools"
      }
    ]);
    createMcpServerConfigMock.mockResolvedValue({
      id: "config-1",
      name: "Remote tools"
    });
    getMcpServerConfigMock.mockResolvedValue({
      id: "config-1",
      name: "Remote tools"
    });
    updateMcpServerConfigMock.mockResolvedValue({
      id: "config-1",
      name: "Remote tools v2"
    });
    deleteMcpServerConfigMock.mockResolvedValue(true);

    const listResponse = await GET_SERVER();
    const createResponse = await POST_SERVERS(
      new NextRequest("http://localhost/api/mcp/servers", {
        body: JSON.stringify({
          args: [],
          enabled: true,
          headers: {
            Authorization: "Bearer raw-secret"
          },
          name: "Remote tools",
          timeoutMs: 30000,
          transport: "http",
          url: "https://example.com/mcp"
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      })
    );
    const getResponse = await GET_SERVER_BY_ID(new Request("http://localhost"), {
      params: Promise.resolve({
        serverId: "7d650faa-3727-4d5f-bf6f-55f4d8eff85d"
      })
    });
    const patchResponse = await PATCH_SERVER(
      new NextRequest("http://localhost/api/mcp/servers/id", {
        body: JSON.stringify({
          enabled: false,
          name: "Remote tools v2"
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "PATCH"
      }),
      {
        params: Promise.resolve({
          serverId: "7d650faa-3727-4d5f-bf6f-55f4d8eff85d"
        })
      }
    );
    const deleteResponse = await DELETE_SERVER(new Request("http://localhost"), {
      params: Promise.resolve({
        serverId: "7d650faa-3727-4d5f-bf6f-55f4d8eff85d"
      })
    });

    expect(listResponse.status).toBe(200);
    expect(createResponse.status).toBe(200);
    expect(getResponse.status).toBe(200);
    expect(patchResponse.status).toBe(200);
    expect(deleteResponse.status).toBe(200);
    expect(listMcpServerConfigsMock).toHaveBeenCalledWith(supabaseMock, "user-123");
    expect(createMcpServerConfigMock).toHaveBeenCalledWith(
      supabaseMock,
      "user-123",
      expect.objectContaining({
        name: "Remote tools",
        transport: "http"
      })
    );
    expect(getMcpServerConfigMock).toHaveBeenCalledWith(
      supabaseMock,
      "user-123",
      "7d650faa-3727-4d5f-bf6f-55f4d8eff85d"
    );
    expect(updateMcpServerConfigMock).toHaveBeenCalledWith(
      supabaseMock,
      "user-123",
      "7d650faa-3727-4d5f-bf6f-55f4d8eff85d",
      expect.objectContaining({
        enabled: false
      })
    );
    expect(deleteMcpServerConfigMock).toHaveBeenCalledWith(
      supabaseMock,
      "user-123",
      "7d650faa-3727-4d5f-bf6f-55f4d8eff85d"
    );
  });

  it("returns 404 when another user's config is requested", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
      }
    });
    getMcpServerConfigMock.mockResolvedValue(null);

    const response = await GET_SERVER_BY_ID(new Request("http://localhost"), {
      params: Promise.resolve({
        serverId: "7d650faa-3727-4d5f-bf6f-55f4d8eff85d"
      })
    });

    expect(response.status).toBe(404);
  });

  it("does not leak raw secrets from config test responses", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
      }
    });
    testMcpServerConfigMock.mockResolvedValue({
      server: {
        has_header_secrets: true,
        id: "config-1",
        name: "Remote tools"
      },
      tools: [
        {
          description: "Remote lookup",
          name: "remote_lookup"
        }
      ]
    });
    listMcpServerToolsMock.mockResolvedValue([
      {
        description: "Remote lookup",
        name: "remote_lookup"
      }
    ]);

    const testResponse = await TEST_SERVER(new Request("http://localhost"), {
      params: Promise.resolve({
        serverId: "7d650faa-3727-4d5f-bf6f-55f4d8eff85d"
      })
    });
    const toolsResponse = await GET_SERVER_TOOLS(new Request("http://localhost"), {
      params: Promise.resolve({
        serverId: "7d650faa-3727-4d5f-bf6f-55f4d8eff85d"
      })
    });
    const payload = await testResponse.json();

    expect(testResponse.status).toBe(200);
    expect(toolsResponse.status).toBe(200);
    expect(payload.data.server).not.toHaveProperty("headers_encrypted");
    expect(JSON.stringify(payload)).not.toContain("raw-secret");
  });
});
