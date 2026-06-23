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
    expect(session.messages[1]?.metadata?.sources).toEqual(["team-facts.md chunk 1"]);

    const hydratedSessions = listE2EChatSessions();

    expect(hydratedSessions).toHaveLength(1);
    expect(hydratedSessions[0]?.messages[0]?.content).toBe("What is the launch city?");
    expect(hydratedSessions[0]?.messages[1]?.content).toBe("The launch city is Pune.");
  });
});
