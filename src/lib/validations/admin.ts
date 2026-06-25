import { z } from "zod";

export const assistantToolPolicySchema = z.object({
  enableDateTime: z.boolean().default(true),
  enableVectorSearch: z.boolean().default(true),
  enableWebSearch: z.boolean().default(true)
});

export const assistantRuntimeSettingsPayloadSchema = z.object({
  systemPrompt: z
    .string()
    .max(4000, "System prompt must be 4000 characters or fewer.")
    .default(""),
  toolPolicy: assistantToolPolicySchema.default({
    enableDateTime: true,
    enableVectorSearch: true,
    enableWebSearch: true
  })
});

export type AssistantRuntimeSettingsPayload = z.infer<
  typeof assistantRuntimeSettingsPayloadSchema
>;
export type AssistantToolPolicy = z.infer<typeof assistantToolPolicySchema>;
