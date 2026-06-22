import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAppEventLogger } from "@/server/logging/events";

describe("appEventLogger", () => {
  const infoSink = vi.fn();
  const errorSink = vi.fn();

  beforeEach(() => {
    infoSink.mockReset();
    errorSink.mockReset();
  });

  it("emits structured JSON info events", () => {
    const logger = createAppEventLogger({
      errorSink,
      infoSink
    });

    logger.info({
      documentId: "doc-123",
      event: "documents.upload.completed",
      metadata: {
        fileSize: 128
      },
      userId: "user-123"
    });

    const payload = JSON.parse(infoSink.mock.calls[0][0]);

    expect(payload).toMatchObject({
      documentId: "doc-123",
      event: "documents.upload.completed",
      level: "info",
      metadata: {
        fileSize: 128
      },
      userId: "user-123"
    });
    expect(payload.timestamp).toMatch(/T/);
  });

  it("emits structured JSON error events with sanitized errors", () => {
    const logger = createAppEventLogger({
      errorSink,
      infoSink
    });

    logger.error({
      errorMessage: "Pinecone unavailable.",
      event: "documents.processing.failed",
      metadata: {
        fileName: "policy.md"
      },
      userId: "user-123"
    });

    const payload = JSON.parse(errorSink.mock.calls[0][0]);

    expect(payload).toMatchObject({
      error: {
        message: "Pinecone unavailable."
      },
      event: "documents.processing.failed",
      level: "error",
      metadata: {
        fileName: "policy.md"
      },
      userId: "user-123"
    });
  });
});
