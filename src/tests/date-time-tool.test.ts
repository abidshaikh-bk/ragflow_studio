import { describe, expect, it, vi } from "vitest";
import { getCurrentDateTime } from "@/server/tools/date-time";

const insertMock = vi.fn();
const supabaseMock = {
  from: vi.fn(() => ({
    insert: insertMock
  }))
};

describe("date/time tool", () => {
  it("returns a valid ISO datetime and timezone", async () => {
    insertMock.mockResolvedValue({ error: null });

    const result = await getCurrentDateTime(
      {
        supabase: supabaseMock as never,
        timeZone: "UTC",
        userId: "user-123"
      },
      {
        now: () => new Date("2026-06-21T12:34:56.000Z")
      }
    );

    expect(result.isoDateTime).toBe("2026-06-21T12:34:56.000Z");
    expect(result.timeZone).toBe("UTC");
    expect(result.friendlyDateTime).toContain("2026");
  });

  it("logs the tool call when a chat session id is provided", async () => {
    insertMock.mockResolvedValue({ error: null });

    await getCurrentDateTime(
      {
        locale: "en-US",
        sessionId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef",
        supabase: supabaseMock as never,
        timeZone: "UTC",
        userId: "user-123"
      },
      {
        now: () => new Date("2026-06-21T12:34:56.000Z")
      }
    );

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef",
        status: "success",
        tool_name: "date.now",
        user_id: "user-123"
      })
    );
  });
});
