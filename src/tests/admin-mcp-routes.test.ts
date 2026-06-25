import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as GET_SERVERS, POST as POST_SERVERS } from "@/app/api/admin/mcp-servers/route";
import {
  DELETE as DELETE_SERVER,
  GET as GET_SERVER_BY_ID,
  PATCH as PATCH_SERVER
} from "@/app/api/admin/mcp-servers/[serverId]/route";
import { GET as GET_SERVER_TOOLS } from "@/app/api/admin/mcp-servers/[serverId]/tools/route";
import { POST as TEST_SERVER } from "@/app/api/admin/mcp-servers/[serverId]/test/route";

const getUserMock = vi.fn();
const maybeSingleMock = vi.fn();
const createAdminSupabaseClientMock = vi.fn();
const createGlobalMcpServerConfigMock = vi.fn();
const deleteGlobalMcpServerConfigMock = vi.fn();
const getGlobalMcpServerConfigMock = vi.fn();
const listGlobalMcpServerConfigsMock = vi.fn();
const listGlobalMcpServerToolsMock = vi.fn();
const testGlobalMcpServerConfigMock = vi.fn();
const updateGlobalMcpServerConfigMock = vi.fn();

const authSupabaseMock = {
  auth: {
    getUser: getUserMock
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: maybeSingleMock
      }))
    }))
  }))
};

const adminSupabaseMock = {};

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: () => authSupabaseMock
}));

vi.mock("@/server/supabase/admin", () => ({
  createAdminSupabaseClient: () => createAdminSupabaseClientMock()
}));

vi.mock("@/server/mcp/service", () => ({
  createGlobalMcpServerConfig: (...args: unknown[]) => createGlobalMcpServerConfigMock(...args),
  deleteGlobalMcpServerConfig: (...args: unknown[]) => deleteGlobalMcpServerConfigMock(...args),
  getGlobalMcpServerConfig: (...args: unknown[]) => getGlobalMcpServerConfigMock(...args),
  listGlobalMcpServerConfigs: (...args: unknown[]) => listGlobalMcpServerConfigsMock(...args),
  listGlobalMcpServerTools: (...args: unknown[]) => listGlobalMcpServerToolsMock(...args),
  testGlobalMcpServerConfig: (...args: unknown[]) => testGlobalMcpServerConfigMock(...args),
  updateGlobalMcpServerConfig: (...args: unknown[]) => updateGlobalMcpServerConfigMock(...args)
}));

describe("/api/admin/mcp-servers routes", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    maybeSingleMock.mockReset();
    createAdminSupabaseClientMock.mockReset();
    createGlobalMcpServerConfigMock.mockReset();
    deleteGlobalMcpServerConfigMock.mockReset();
    getGlobalMcpServerConfigMock.mockReset();
    listGlobalMcpServerConfigsMock.mockReset();
    listGlobalMcpServerToolsMock.mockReset();
    testGlobalMcpServerConfigMock.mockReset();
    updateGlobalMcpServerConfigMock.mockReset();
    createAdminSupabaseClientMock.mockReturnValue(adminSupabaseMock);
  });

  it("returns 403 for authenticated non-admin users", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          app_metadata: {},
          id: "user-123",
          user_metadata: {}
        }
      }
    });
    maybeSingleMock.mockResolvedValue({
      data: {
        is_admin: false
      },
      error: null
    });

    const response = await GET_SERVERS();

    expect(response.status).toBe(403);
  });

  it("lets admins CRUD global MCP configs", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          app_metadata: {},
          id: "admin-123",
          user_metadata: {}
        }
      }
    });
    maybeSingleMock.mockResolvedValue({
      data: {
        is_admin: true
      },
      error: null
    });
    listGlobalMcpServerConfigsMock.mockResolvedValue([
      {
        id: "config-1",
        name: "Global tools",
        user_id: null
      }
    ]);
    createGlobalMcpServerConfigMock.mockResolvedValue({
      id: "config-1",
      name: "Global tools",
      user_id: null
    });
    getGlobalMcpServerConfigMock.mockResolvedValue({
      id: "config-1",
      name: "Global tools",
      user_id: null
    });
    updateGlobalMcpServerConfigMock.mockResolvedValue({
      id: "config-1",
      name: "Global tools v2",
      user_id: null
    });
    deleteGlobalMcpServerConfigMock.mockResolvedValue(true);

    const listResponse = await GET_SERVERS();
    const createResponse = await POST_SERVERS(
      new NextRequest("http://localhost/api/admin/mcp-servers", {
        body: JSON.stringify({
          args: [],
          enabled: true,
          headers: {
            Authorization: "Bearer raw-secret"
          },
          name: "Global tools",
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
      new NextRequest("http://localhost/api/admin/mcp-servers/id", {
        body: JSON.stringify({
          enabled: false,
          name: "Global tools v2"
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
    expect(listGlobalMcpServerConfigsMock).toHaveBeenCalledWith(adminSupabaseMock);
    expect(createGlobalMcpServerConfigMock).toHaveBeenCalledWith(
      adminSupabaseMock,
      expect.objectContaining({
        name: "Global tools",
        transport: "http"
      })
    );
    expect(getGlobalMcpServerConfigMock).toHaveBeenCalledWith(
      adminSupabaseMock,
      "7d650faa-3727-4d5f-bf6f-55f4d8eff85d"
    );
    expect(updateGlobalMcpServerConfigMock).toHaveBeenCalledWith(
      adminSupabaseMock,
      "7d650faa-3727-4d5f-bf6f-55f4d8eff85d",
      expect.objectContaining({
        enabled: false
      })
    );
    expect(deleteGlobalMcpServerConfigMock).toHaveBeenCalledWith(
      adminSupabaseMock,
      "7d650faa-3727-4d5f-bf6f-55f4d8eff85d"
    );
  });

  it("does not leak raw secrets from global config test responses", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          app_metadata: {},
          id: "admin-123",
          user_metadata: {}
        }
      }
    });
    maybeSingleMock.mockResolvedValue({
      data: {
        is_admin: true
      },
      error: null
    });
    testGlobalMcpServerConfigMock.mockResolvedValue({
      server: {
        has_header_secrets: true,
        id: "config-1",
        name: "Global tools",
        user_id: null
      },
      tools: [
        {
          description: "Remote lookup",
          name: "remote_lookup"
        }
      ]
    });
    listGlobalMcpServerToolsMock.mockResolvedValue([
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
