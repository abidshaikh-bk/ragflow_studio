import { z } from "zod";

export const mcpTransportSchema = z.enum(["stdio", "http"]);

const encryptedObjectSchema = z.record(z.string(), z.string());
const secretRecordSchema = z.record(
  z.string().trim().min(1, "Secret names cannot be empty."),
  z.string().trim().max(4000, "Secret values must be 4000 characters or fewer.")
);

const mcpServerConfigPayloadShape = {
  allowedTools: z.array(z.string().trim().min(1)).default([]),
  args: z.array(z.string().trim()).default([]),
  command: z.string().trim().optional(),
  description: z.string().trim().max(500).optional(),
  enabled: z.boolean().default(false),
  env: secretRecordSchema.default({}),
  headers: secretRecordSchema.default({}),
  isDefault: z.boolean().default(false),
  name: z.string().trim().min(1, "Enter a server name."),
  timeoutMs: z.number().int().min(1000).max(120000).default(30000),
  transport: mcpTransportSchema,
  url: z.string().trim().url("Enter a valid MCP server URL.").optional()
} as const;

function withMcpTransportValidation<TSchema extends z.ZodObject<any>>(schema: TSchema) {
  return schema.superRefine((value, ctx) => {
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
}

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
export const mcpServerConfigPayloadSchema = withMcpTransportValidation(
  z.object(mcpServerConfigPayloadShape)
);
export const mcpServerConfigUpdatePayloadSchema = withMcpTransportValidation(
  z.object(mcpServerConfigPayloadShape).partial()
).refine((value) => Object.keys(value).length > 0, {
  message: "Provide at least one field to update."
});
export const mcpServerIdSchema = z.string().uuid("Invalid MCP server id.");

export type McpServerConfigPayload = z.infer<typeof mcpServerConfigPayloadSchema>;
export type McpServerConfigUpdatePayload = z.infer<
  typeof mcpServerConfigUpdatePayloadSchema
>;
