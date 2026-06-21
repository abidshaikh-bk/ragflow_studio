import { z } from "zod";

const vectorSearchSchema = z.object({
  documentIds: z.array(z.string().uuid("Invalid document id.")).max(25).optional(),
  query: z.string().trim().min(1, "Enter a search query."),
  topK: z.number().int().min(1, "topK must be at least 1.").max(10, "topK must be 10 or smaller.").default(4)
});

export type VectorSearchInput = z.infer<typeof vectorSearchSchema>;

export function parseVectorSearchInput(input: {
  documentIds?: string[];
  query: string;
  topK?: number;
}) {
  const parsed = vectorSearchSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid vector search input.");
  }

  return parsed.data;
}
