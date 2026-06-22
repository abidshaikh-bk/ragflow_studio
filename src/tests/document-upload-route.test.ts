import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/documents/upload/route";

const getUserMock = vi.fn();
const processUploadedDocumentMock = vi.fn();
const uploadDocumentMock = vi.fn();
const logInfoMock = vi.fn();
const logErrorMock = vi.fn();
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

vi.mock("@/server/documents/process", () => ({
  processUploadedDocument: (...args: unknown[]) => processUploadedDocumentMock(...args)
}));

vi.mock("@/server/logging/events", () => ({
  appEventLogger: {
    error: (...args: unknown[]) => logErrorMock(...args),
    info: (...args: unknown[]) => logInfoMock(...args)
  }
}));

describe("/api/documents/upload route", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    processUploadedDocumentMock.mockReset();
    uploadDocumentMock.mockReset();
    logInfoMock.mockReset();
    logErrorMock.mockReset();
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

  it("returns 400 when the uploaded file type is unsupported", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
      }
    });

    const formData = new FormData();
    formData.append("file", createFile("id,name", "contacts.csv", "text/csv"));

    const response = await POST(createMultipartRequest(formData));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toMatch(/unsupported file type/i);
    expect(uploadDocumentMock).not.toHaveBeenCalled();
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
    processUploadedDocumentMock.mockResolvedValue({
      namespace: "user:user-123",
      vectorCount: 1
    });

    const formData = new FormData();
    const file = createFile("# handbook", "handbook.md", "text/markdown");
    formData.append("file", file);

    const response = await POST(createMultipartRequest(formData));
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(uploadDocumentMock).toHaveBeenCalledWith({
      file,
      supabase: supabaseMock,
      userId: "user-123"
    });
    expect(processUploadedDocumentMock).toHaveBeenCalledWith({
      documentId: "doc-456",
      fileContents: Buffer.from("# handbook"),
      fileName: "handbook.md",
      fileType: "text/markdown",
      supabase: supabaseMock,
      userId: "user-123"
    });
    expect(payload).toEqual({
      data: {
        documentId: "doc-456",
        status: "uploaded"
      }
    });
    expect(logInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "documents.upload.started",
        metadata: expect.objectContaining({
          fileName: "handbook.md"
        }),
        userId: "user-123"
      })
    );
    expect(logInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: "doc-456",
        event: "documents.upload.completed",
        userId: "user-123"
      })
    );
  });

  it("logs a structured upload failure event", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
      }
    });
    uploadDocumentMock.mockRejectedValue(new Error("S3 unavailable."));

    const formData = new FormData();
    formData.append("file", createFile("# handbook", "handbook.md", "text/markdown"));

    const response = await POST(createMultipartRequest(formData));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      error: "S3 unavailable."
    });
    expect(logErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errorMessage: "S3 unavailable.",
        event: "documents.upload.failed",
        userId: "user-123"
      })
    );
  });
});

function createMultipartRequest(formData: FormData) {
  return {
    formData: async () => formData
  } as NextRequest;
}

function createFile(contents: string, name: string, type: string) {
  const file = new File([contents], name, { type });

  Object.defineProperty(file, "arrayBuffer", {
    value: async () => new TextEncoder().encode(contents).buffer
  });

  return file;
}
