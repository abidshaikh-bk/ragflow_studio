import { beforeEach, describe, expect, it, vi } from "vitest";
import { extractDocumentText, parseDocument } from "@/server/documents/parser";

const eqUserMock = vi.fn();
const eqIdMock = vi.fn(() => ({
  eq: eqUserMock
}));
const updateMock = vi.fn(() => ({
  eq: eqIdMock
}));
const fromMock = vi.fn(() => ({
  update: updateMock
}));

const supabaseMock = {
  from: fromMock
};

describe("document parser", () => {
  beforeEach(() => {
    eqUserMock.mockReset();
    eqIdMock.mockClear();
    updateMock.mockClear();
    fromMock.mockClear();
  });

  it("extracts plain text from TXT files", () => {
    const text = extractDocumentText({
      fileContents: Buffer.from("Hello from text"),
      fileName: "notes.txt",
      fileType: "text/plain"
    });

    expect(text).toBe("Hello from text");
  });

  it("extracts plain text from Markdown files", () => {
    const text = extractDocumentText({
      fileContents: "# Heading\n\nParagraph",
      fileName: "guide.md",
      fileType: "text/markdown"
    });

    expect(text).toContain("# Heading");
    expect(text).toContain("Paragraph");
  });

  it("fails gracefully for empty documents", async () => {
    eqUserMock
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });

    await expect(
      parseDocument({
        documentId: "doc-123",
        fileContents: "   ",
        fileName: "empty.txt",
        fileType: "text/plain",
        supabase: supabaseMock as never,
        userId: "user-123"
      })
    ).rejects.toThrow(/must contain readable text/i);

    expect(updateMock).toHaveBeenNthCalledWith(1, {
      error_message: null,
      status: "parsing"
    });
    expect(updateMock).toHaveBeenNthCalledWith(2, {
      error_message: "Uploaded documents must contain readable text.",
      status: "failed"
    });
  });

  it("marks the document as failed when parsing an unsupported file", async () => {
    eqUserMock
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });

    await expect(
      parseDocument({
        documentId: "doc-456",
        fileContents: "name,price",
        fileName: "pricing.csv",
        fileType: "text/csv",
        supabase: supabaseMock as never,
        userId: "user-123"
      })
    ).rejects.toThrow(/unsupported document type/i);

    expect(updateMock).toHaveBeenNthCalledWith(2, {
      error_message: "Unsupported document type for parser MVP. Use TXT or Markdown.",
      status: "failed"
    });
  });
});
