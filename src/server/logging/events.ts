type AppEventBase = {
  documentId?: string;
  durationMs?: number;
  errorMessage?: string;
  event: string;
  langsmithRunId?: string | null;
  metadata?: Record<string, unknown>;
  sessionId?: string;
  userId?: string;
};

type AppEventSink = (payload: string) => void;

type CreateAppEventLoggerDeps = {
  errorSink?: AppEventSink;
  infoSink?: AppEventSink;
};

export function createAppEventLogger(deps?: CreateAppEventLoggerDeps) {
  return {
    error: (event: AppEventBase) => {
      const payload = buildEventPayload("error", event);
      (deps?.errorSink ?? console.error)(JSON.stringify(payload));

      return payload;
    },
    info: (event: AppEventBase) => {
      const payload = buildEventPayload("info", event);
      (deps?.infoSink ?? console.info)(JSON.stringify(payload));

      return payload;
    }
  };
}

export const appEventLogger = createAppEventLogger();

function buildEventPayload(level: "error" | "info", event: AppEventBase) {
  return {
    event: event.event,
    level,
    timestamp: new Date().toISOString(),
    ...(event.userId ? { userId: event.userId } : {}),
    ...(event.sessionId ? { sessionId: event.sessionId } : {}),
    ...(event.documentId ? { documentId: event.documentId } : {}),
    ...(typeof event.durationMs === "number"
      ? {
          durationMs: event.durationMs
        }
      : {}),
    ...(event.langsmithRunId
      ? {
          langsmithRunId: event.langsmithRunId
        }
      : {}),
    ...(event.errorMessage
      ? {
          error: {
            message: event.errorMessage
          }
        }
      : {}),
    ...(event.metadata && Object.keys(event.metadata).length
      ? {
          metadata: event.metadata
        }
      : {})
  };
}
