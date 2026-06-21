import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { uploadDocument } from "@/server/documents/upload";

const sendMock = vi.fn();
const singleMock = vi.fn();
const selectMock = vi.fn(() => ({
  single: singleMock
}));
const insertMock = vi.fn(() => ({
  select: selectMock
}));
const fromMock = vi.fn(() => ({
  insert: insertMock
}));

const supabaseMock = {
  from: fromMock
};

describe("uploadDocument", () => {
  beforeEach(() => {
    sendMock.mockReset();
    singleMock.mockReset();
    selectMock.mockClear();
    insertMock.mockClear();
    fromMock.mockClear();
    process.env.AWS_REGION = "us-east-1";
    process.env.AWS_ACCESS_KEY_ID = "test-access-key";
    process.env.AWS_SECRET_ACCESS_KEY = "test-secret-key";
    process.env.S3_BUCKET_NAME = "ragflow-documents";
  });

  it("rejects unsupported file types", async () => {
    const file = createFile("id,name", "contacts.csv", "text/csv");

    await expect(
      uploadDocument(
        {
          file,
          supabase: supabaseMock as never,
          userId: "user-123"
        },
        {
          bucketName: "ragflow-documents",
          s3Client: {
            send: sendMock
          } as never
        }
      )
    ).rejects.toThrow(/unsupported file type/i);
  });

  it("uploads the file privately and inserts the Supabase document row", async () => {
    sendMock.mockResolvedValue({});
    singleMock.mockResolvedValue({
      data: {
        id: "doc-123",
        status: "uploaded"
      },
      error: null
    });

    const file = createFile("hello world", "notes.txt", "text/plain");
    const result = await uploadDocument(
      {
        file,
        supabase: supabaseMock as never,
        userId: "user-123"
      },
      {
        bucketName: "ragflow-documents",
        s3Client: {
          send: sendMock
        } as never
      }
    );

    expect(sendMock).toHaveBeenCalledTimes(1);
    const command = sendMock.mock.calls[0][0] as PutObjectCommand;
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input.Bucket).toBe("ragflow-documents");
    expect(command.input.ContentType).toBe("text/plain");
    expect(command.input.Key).toContain("user:user-123/documents/");
    expect(fromMock).toHaveBeenCalledWith("documents");
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        file_name: "notes.txt",
        file_size: 11,
        file_type: "text/plain",
        pinecone_namespace: "user:user-123",
        status: "uploaded",
        user_id: "user-123"
      })
    );
    expect(result).toEqual({
      documentId: "doc-123",
      s3Key: expect.stringContaining("user:user-123/documents/"),
      status: "uploaded"
    });
  });

  it("removes the S3 object if the Supabase insert fails", async () => {
    sendMock.mockResolvedValue({});
    singleMock.mockResolvedValue({
      data: null,
      error: {
        message: "insert failed"
      }
    });

    const file = createFile("hello world", "notes.txt", "text/plain");

    await expect(
      uploadDocument(
        {
          file,
          supabase: supabaseMock as never,
          userId: "user-123"
        },
        {
          bucketName: "ragflow-documents",
          s3Client: {
            send: sendMock
          } as never
        }
      )
    ).rejects.toThrow(/unable to create the uploaded document record/i);

    const deleteCommand = sendMock.mock.calls[1][0] as DeleteObjectCommand;
    expect(deleteCommand).toBeInstanceOf(DeleteObjectCommand);
    expect(deleteCommand.input.Bucket).toBe("ragflow-documents");
  });
});

function createFile(contents: string, name: string, type: string) {
  const file = new File([contents], name, { type });

  Object.defineProperty(file, "arrayBuffer", {
    value: async () => new TextEncoder().encode(contents).buffer
  });

  return file;
}
