# TESTING.md — Validation Strategy

## Test layers

Use four validation layers:

1. Unit tests with Vitest.
2. Component tests with React Testing Library.
3. API/integration tests for route handlers and server utilities.
4. E2E tests with Playwright.

## Required package scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "rm -f tsconfig.tsbuildinfo && next typegen && sleep 1 && tsc --noEmit",
    "test": "vitest run",
    "test:db": "RUN_DB_TESTS=true vitest run src/tests/database-schema.test.ts",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

## Unit test targets

- Zod schemas.
- Auth helper behavior.
- File validation.
- Chunking logic.
- Embedding batching logic.
- Pinecone vector ID generation.
- Tool input/output normalization.
- Secret masking utilities.
- Tavily tool query validation, result normalization, and timeout/failure handling.

## Component test targets

- Login form validation.
- Register form validation.
- Settings form validation and masked key rendering.
- Document upload form.
- Document progress component.
- Chat input and message list.
- Error and loading states.

## API test targets

- All protected APIs return 401 when unauthenticated.
- Settings API never returns raw keys.
- Saved encrypted provider credentials can drive embedding requests when environment keys are absent.
- Settings API rejects embedding dimensions that do not match the Pinecone dimension configured on the server.
- Upload API validates type and size.
- Document list API returns only the authenticated user's documents.
- Document status API is user-scoped.
- Chat API persists messages and logs tool calls.
- Tool endpoints validate input and handle upstream failures.

## E2E tests

### Auth flow

1. Open `/login`.
2. Login with test user.
3. Confirm redirect to `/chat`.
4. Open `/settings`.
5. Confirm settings page loads.

### Document upload flow

1. Login.
2. Go to `/documents`.
3. Upload test TXT file.
4. Confirm progress stages appear.
5. Confirm status becomes `completed`.
6. Confirm document appears in list.

### RAG chat flow

1. Upload test document containing a known fact.
2. Wait for indexing.
3. Ask a question about the known fact.
4. Confirm answer includes the known fact.
5. Refresh.
6. Confirm chat history remains.

### Tool routing flow

1. Ask “What date is it?”
2. Confirm date tool is used.
3. Ask a document-specific question.
4. Confirm vector search is used.
5. Ask a current web question.
6. Confirm Tavily tool is used.

## Security tests

- User A cannot read User B documents.
- User A cannot read User B chats.
- User A cannot query User B vectors.
- Client-submitted `user_id` is ignored.
- Raw API keys are never returned.
- Logs and LangSmith traces redact secrets.

## Database migration validation

Use a dedicated live-database validation step for schema and RLS work:

```bash
npm run db:migrate
npm run test:db
```

These commands require a working `DATABASE_URL`. They should apply the SQL migration, create disposable test users, and verify cross-user isolation against the real Supabase database.

## Smoke checklist before launch

- User can register.
- User can log in.
- User can save model settings.
- User can upload document.
- Document reaches completed status.
- User can ask document question.
- Agent retrieves from Pinecone.
- Agent uses date tool.
- Agent uses Tavily web search.
- Chat history persists.
- LangSmith trace exists.
- No secrets appear in browser or logs.
- RLS prevents cross-user access.
- Production build succeeds.

## Current tool coverage

- `src/tests/vector-search-tool.test.ts` validates Pinecone namespace isolation and tool logging.
- `src/tests/document-embeddings.test.ts` validates batch progress, provider fallback, and settings-backed embedding API key resolution.
- `src/tests/document-embeddings.test.ts` also verifies Gemini embedding requests use the saved provider credential and that unsupported providers fall back to the configured default provider instead of hard-coding OpenAI.
- `src/tests/document-embeddings.test.ts` also verifies the runtime rejects vectors whose returned dimensions do not match the configured embedding dimension.
- `src/tests/documents-route.test.ts` validates `/api/documents` auth and authenticated document listing.
- `src/tests/date-time-tool.test.ts` validates deterministic date/time formatting and tool logging.
- `src/tests/web-search-tool.test.ts` validates Tavily query validation, normalized results, and failure logging.
- `src/tests/agent-workflow.test.ts` validates LangGraph routing, saved Gemini chat configuration resolution, and default-provider fallback for unsupported chat providers.
- `src/tests/chat-route.test.ts` validates `/api/chat` auth, user-message persistence, JSON error handling for malformed requests, agent invocation, and LangSmith-aware assistant persistence.
- `src/tests/langsmith-tracing.test.ts` validates that LangSmith tracing keeps the real server result out of trace payloads, uses redacted previews, and still returns a stable run ID to the application.
- `src/tests/app-event-logger.test.ts`, `src/tests/document-processing.test.ts`, and `src/tests/document-upload-route.test.ts` validate structured app-level lifecycle logging for chat, upload, processing, and failure paths.


## UI testing requirements

For every UI page or component task:

- Add React Testing Library coverage for render states.
- Verify accessible labels for form inputs.
- Verify loading, empty, error, and success states where applicable.
- Verify keyboard submit behavior for chat and auth forms.
- Verify that raw API keys are never rendered after settings save.

For page scaffolding tasks, add route-level smoke tests where possible.

For UI tasks in GitHub PRs, include screenshots or a short visual verification note.

# MVP-first smoke tests and MCP later-phase tests

## MVP smoke test priority

The first required E2E smoke path is:

1. Register user.
2. Login user.
3. Upload TXT or Markdown document.
4. Wait for completed document status.
5. Start new chat.
6. Ask a question whose answer exists in the uploaded document.
7. Confirm answer uses the user's uploaded content.
8. Confirm chat messages persist after refresh.
9. Confirm User B cannot query User A's document content.

## Runtime MCP tests

Only after Phase 4 begins:

- HTTP MCP config validation.
- stdio MCP config validation with allowlist.
- disabled MCP server is not loaded.
- MCP tool call logging redacts inputs/outputs.
- MCP tools do not break default vector-search RAG.
