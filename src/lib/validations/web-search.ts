import { z } from "zod";

const webSearchInputSchema = z.object({
  maxResults: z.coerce.number().int().min(1).max(5).default(3),
  query: z.string().trim().min(1, "Enter a web search query.")
});

export type WebSearchInput = z.infer<typeof webSearchInputSchema>;

export function parseWebSearchInput(input: unknown): WebSearchInput {
  return webSearchInputSchema.parse(input);
}
