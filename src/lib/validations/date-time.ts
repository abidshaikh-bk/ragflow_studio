import { z } from "zod";

const dateTimeToolSchema = z.object({
  locale: z.string().trim().min(2).max(35).optional(),
  timeZone: z.string().trim().min(1).max(100).optional()
});

export function parseDateTimeToolInput(input: {
  locale?: string;
  timeZone?: string;
}) {
  const parsed = dateTimeToolSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid date/time input.");
  }

  return parsed.data;
}
