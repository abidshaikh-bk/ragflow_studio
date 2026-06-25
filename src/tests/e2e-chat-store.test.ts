import { beforeEach, describe, expect, it } from "vitest";
import {
  createE2EChatReply,
  listE2EChatSessions,
  resetE2EChatState
} from "@/server/e2e/chat-store";

describe("E2E chat store", () => {
  beforeEach(() => {
    resetE2EChatState();
  });

  it("stores chat turns and keeps them available for a later refresh", () => {
    const session = createE2EChatReply({
      message: "What is the launch city?"
    });

    expect(session.messages).toHaveLength(2);
    expect(session.messages[1]?.content).toBe("The launch city is Pune.");
    expect(session.messages[1]?.metadata?.citations).toEqual([
      expect.objectContaining({
        fileName: "team-facts.md",
        linkTarget: "/documents/fixture-doc-1#chunk-1",
        sourceType: "document"
      })
    ]);

    const hydratedSessions = listE2EChatSessions();

    expect(hydratedSessions).toHaveLength(1);
    expect(hydratedSessions[0]?.messages[0]?.content).toBe("What is the launch city?");
    expect(hydratedSessions[0]?.messages[1]?.content).toBe("The launch city is Pune.");
  });

  it("classifies date and web prompts into deterministic tool metadata", () => {
    const dateSession = createE2EChatReply({
      message: "What date is it today?"
    });
    const webSession = createE2EChatReply({
      message: "What is the latest AI news on the web?"
    });

    expect(dateSession.messages[1]?.metadata?.toolActivity).toEqual([
      "date.now -> resolved UTC time context"
    ]);
    expect(webSession.messages[1]?.metadata?.toolActivity).toEqual([
      "tavily.search -> returned 1 web result"
    ]);
    expect(webSession.messages[1]?.metadata?.citations).toEqual([
      expect.objectContaining({
        fileName: "Latest AI update",
        linkTarget: "https://example.com/latest-ai",
        sourceType: "web"
      })
    ]);
  });
});
