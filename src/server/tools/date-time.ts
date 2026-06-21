import type { SupabaseClient } from "@supabase/supabase-js";
import { parseDateTimeToolInput } from "@/lib/validations/date-time";

type DateTimeToolParams = {
  locale?: string;
  sessionId?: string;
  supabase: SupabaseClient;
  timeZone?: string;
  userId: string;
};

type DateTimeToolDeps = {
  now: () => Date;
};

export async function getCurrentDateTime(
  {
    locale,
    sessionId,
    supabase,
    timeZone,
    userId
  }: DateTimeToolParams,
  deps?: Partial<DateTimeToolDeps>
) {
  const input = parseDateTimeToolInput({
    locale,
    timeZone
  });
  const startedAt = Date.now();

  try {
    const now = deps?.now?.() ?? new Date();
    const resolvedTimeZone =
      input.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
    const resolvedLocale = input.locale ?? "en-US";
    const isoDateTime = now.toISOString();
    const friendlyDateTime = new Intl.DateTimeFormat(resolvedLocale, {
      dateStyle: "full",
      timeStyle: "long",
      timeZone: resolvedTimeZone
    }).format(now);

    const result = {
      friendlyDateTime,
      isoDateTime,
      timeZone: resolvedTimeZone
    };

    await logToolCall(supabase, {
      input,
      latencyMs: Date.now() - startedAt,
      output: result,
      sessionId,
      status: "success",
      userId
    });

    return result;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to resolve the current date and time.";

    await logToolCall(supabase, {
      input,
      latencyMs: Date.now() - startedAt,
      output: {
        error: message
      },
      sessionId,
      status: "failed",
      userId
    });

    throw new Error(message);
  }
}

async function logToolCall(
  supabase: SupabaseClient,
  input: {
    input: {
      locale?: string;
      timeZone?: string;
    };
    latencyMs: number;
    output: object;
    sessionId?: string;
    status: string;
    userId: string;
  }
) {
  if (!input.sessionId) {
    return;
  }

  const result = await supabase.from("agent_tool_calls").insert({
    latency_ms: input.latencyMs,
    session_id: input.sessionId,
    status: input.status,
    tool_input: input.input,
    tool_name: "date.now",
    tool_output: input.output,
    user_id: input.userId
  });

  if (result.error) {
    throw new Error("Unable to log the date/time tool call.");
  }
}
