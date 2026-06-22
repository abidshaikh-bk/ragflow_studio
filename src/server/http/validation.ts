import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";

export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  request: NextRequest,
  schema: TSchema,
  invalidPayloadMessage: string
): Promise<
  | {
      data: z.infer<TSchema>;
      response: null;
    }
  | {
      data: null;
      response: Response;
    }
> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      data: null,
      response: NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      )
    };
  }

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return {
      data: null,
      response: NextResponse.json(
        {
          error: invalidPayloadMessage,
          fieldErrors: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    };
  }

  return {
    data: parsed.data,
    response: null
  };
}
