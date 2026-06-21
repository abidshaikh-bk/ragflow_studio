import { z } from "zod";

const optionalSessionIdSchema = z.string().uuid().optional();

export const chatMessagePayloadSchema = z.object({
  message: z.string().trim().min(1, "Ask a question about your indexed documents."),
  sessionId: optionalSessionIdSchema
});

const chatSessionParamsSchema = z.object({
  sessionId: z.string().uuid("Invalid chat session id.")
});

export function parseChatSessionParams(input: {
  sessionId?: string;
}) {
  const parsed = chatSessionParamsSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid chat session id.");
  }

  return parsed.data;
}
