import { z } from "zod";

export const settingsProviderSchema = z.enum([
  "openai",
  "anthropic",
  "gemini",
  "huggingface"
]);

export const settingsPayloadSchema = z.object({
  chatApiKey: z.string().trim().max(512).default(""),
  chatModel: z.string().trim().min(1, "Enter a chat model."),
  chatProvider: settingsProviderSchema,
  embeddingApiKey: z.string().trim().max(512).default(""),
  embeddingDimensions: z.coerce
    .number()
    .int("Embedding dimension must be a whole number.")
    .positive("Embedding dimension must be greater than zero."),
  embeddingModel: z.string().trim().min(1, "Enter an embedding model."),
  embeddingProvider: settingsProviderSchema
});

export type SettingsPayload = z.infer<typeof settingsPayloadSchema>;
