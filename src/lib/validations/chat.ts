import { z } from "zod";

const optionalSessionIdSchema = z.string().uuid().optional();
const optionalModelConfigIdSchema = z.string().uuid().nullable().optional();

export const thinkingLevelSchema = z.enum(["low", "medium", "high"]);

export const chatMessagePayloadSchema = z.object({
  message: z.string().trim().min(1, "Ask a question about your indexed documents."),
  modelConfigId: optionalModelConfigIdSchema,
  sessionId: optionalSessionIdSchema,
  thinkingLevel: thinkingLevelSchema.optional()
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
