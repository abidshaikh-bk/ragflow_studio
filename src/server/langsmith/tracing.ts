import { randomUUID } from "node:crypto";
import { traceable } from "langsmith/traceable";

type TraceExecutionOptions<T> = {
  invoke: () => Promise<T>;
  metadata?: Record<string, unknown>;
  name: string;
  runType: "chain" | "tool";
  serializeResult?: (result: T) => unknown;
  tags?: string[];
  traceInput?: Record<string, unknown>;
};

export async function traceServerExecution<T>({
  invoke,
  metadata,
  name,
  runType,
  serializeResult,
  tags,
  traceInput
}: TraceExecutionOptions<T>) {
  const fallbackRunId = randomUUID();
  let runId: string | null = null;
  let actualResult!: T;
  let hasResult = false;

  const tracedInvoke = traceable(
    async () => {
      const result = await invoke();
      actualResult = result;
      hasResult = true;

      return serializeResult ? serializeResult(result) : null;
    },
    {
      metadata,
      name,
      on_start: (runTree) => {
        runId = runTree?.id ?? null;
      },
      processInputs: () => traceInput ?? {},
      run_type: runType,
      tags
    }
  );

  await tracedInvoke();

  if (!hasResult) {
    throw new Error(`Trace execution "${name}" did not produce a result.`);
  }

  return {
    result: actualResult,
    runId: runId ?? fallbackRunId
  };
}

export function createTracePreview(value: string, maxLength = 160) {
  return value.trim().slice(0, maxLength);
}
