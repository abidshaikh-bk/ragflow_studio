import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/documents/upload/route";

const getUserMock = vi.fn();
const uploadDocumentMock = vi.fn();
const supabaseMock = {
  auth: {
    getUser: getUserMock
  }
};

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: () => supabaseMock
}));

vi.mock("@/server/documents/upload", () => ({
  uploadDocument: (...args: unknown[]) => uploadDocumentMock(...args)
}));

describe("/api/documents/upload route", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    uploadDocumentMock.mockReset();
  });

  it("returns 401 when the upload request is unauthenticated", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: null
      }
    });

    const formData = new FormData();
    formData.append("file", new File(["hello"], "notes.txt", { type: "text/plain" }));

    const response = await POST(createMultipartRequest(formData));

    expect(response.status).toBe(401);
  });

  it("returns 400 when no file is provided", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
      }
    });

    const response = await POST(createMultipartRequest(new FormData()));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toMatch(/document file is required/i);
  });

  it("returns the created document id for a valid authenticated upload", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
      }
    });
    uploadDocumentMock.mockResolvedValue({
      documentId: "doc-456",
      s3Key: "user:user-123/documents/doc-456.md",
      status: "uploaded"
    });

    const formData = new FormData();
    const file = new File(["# handbook"], "handbook.md", { type: "text/markdown" });
    formData.append("file", file);

    const response = await POST(createMultipartRequest(formData));
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(uploadDocumentMock).toHaveBeenCalledWith({
      file,
      supabase: supabaseMock,
      userId: "user-123"
    });
    expect(payload).toEqual({
      data: {
        documentId: "doc-456",
        status: "uploaded"
      }
    });
  });
});

function createMultipartRequest(formData: FormData) {
  return {
    formData: async () => formData
  } as NextRequest;
}
