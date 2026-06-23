import { z } from "zod";

export const mcpTransportSchema = z.enum(["stdio", "http"]);

const encryptedObjectSchema = z.record(z.string(), z.string());

export const mcpServerConfigSchema = z
  .object({
    allowed_tools: z.array(z.string().trim().min(1)).default([]),
    args: z.array(z.string().trim()).default([]),
    command: z.string().trim().optional(),
    description: z.string().trim().max(500).optional(),
    enabled: z.boolean().default(false),
    env_encrypted: encryptedObjectSchema.default({}),
    headers_encrypted: encryptedObjectSchema.default({}),
    is_default: z.boolean().default(false),
    name: z.string().trim().min(1, "Enter a server name."),
    timeout_ms: z.number().int().min(1000).max(120000).default(30000),
    transport: mcpTransportSchema,
    url: z.string().trim().url("Enter a valid MCP server URL.").optional(),
    user_id: z.string().uuid().nullable().optional()
  })
  .superRefine((value, ctx) => {
    if (value.transport === "stdio") {
      if (!value.command) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Stdio transport requires a command.",
          path: ["command"]
        });
      }

      if (value.url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Stdio transport does not allow a URL.",
          path: ["url"]
        });
      }
    }

    if (value.transport === "http") {
      if (!value.url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "HTTP transport requires a URL.",
          path: ["url"]
        });
      }

      if (value.command) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "HTTP transport does not allow a command.",
          path: ["command"]
        });
      }
    }
  });

export type McpServerConfigInput = z.infer<typeof mcpServerConfigSchema>;
