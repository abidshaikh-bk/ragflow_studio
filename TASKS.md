# MVP phase gate update

The task list is now gated. Agents must complete the default working MVP before later configurable features.

## MVP-complete requirement

The project is not MVP-complete until these flows pass:

1. Register.
2. Login.
3. Upload TXT/Markdown document.
4. Parse document.
5. Chunk document.
6. Embed chunks with default server-side embedding model.
7. Store vectors in Pinecone under the authenticated user's namespace.
8. Start or select a chat session.
9. Ask a question answered from the user's own document chunks.
10. Persist chat messages.
11. Run smoke tests.

Later-phase tasks for model configuration, thinking levels, Tavily, and runtime MCP must not block this MVP.

# TASKS.md — Granular Development Tasks

## Status values

Use only:

- `not_started`
- `in_progress`
- `blocked`
- `validated`
- `review_required`
- `done`


## Required completion workflow for every task

A task can move to `done` only after the agent has:

1. Picked one task and worked only on that task.
2. Created or used a task-specific Git branch.
3. Implemented the task.
4. Added or updated tests.
5. Run validation commands.
6. Updated impacted documentation.
7. Updated `PROGRESS_LOG.md` with result and files changed.
8. Created a task-scoped Git commit.
9. Added the commit hash to `PROGRESS_LOG.md`.
10. Confirmed `git status` is clean.

See `VCS_WORKFLOW.md` for exact Git commands.

## Phase 1 — Repository and Project Foundation

### TASK-001: Initialize Next.js project

Status: done

Objective: Create the Next.js App Router project with TypeScript and Tailwind.

Implementation:

- Use Next.js App Router.
- Add TypeScript.
- Add Tailwind CSS.
- Add base folder structure.
- Add `.env.example`.
- Add `README.md`.
- Add this documentation pack.

Tests:

- App starts locally.
- Homepage renders.
- TypeScript compiles.

Validation:

```bash
npm run lint
npm run typecheck
npm run test
npm run dev
```

Acceptance criteria:

- Next.js app boots successfully.
- No TypeScript errors.
- No lint errors.

---

### TASK-002: Add shared UI shell

Status: done

Objective: Create reusable app layout, navigation, loading states, error components, and protected page shell.

Implementation:

- Add top navigation.
- Add links for Chat, Documents, Settings.
- Add loading spinner.
- Add empty state component.
- Add error alert component.
- Add authenticated layout placeholder.
- Apply style tokens from `design.md`.

Tests:

- Navigation renders expected links.
- Loading and error components render correctly.

Acceptance criteria:

- Protected app shell exists.
- UI is reusable across protected pages.

---



---

## Phase 2 — UI Mockups and Page Scaffolding

### TASK-002A: Add UI mockup reference docs

Status: done

Objective: Add and maintain implementation-ready UI mockups and page specs.

Implementation:

- Add `UI_MOCKUPS.md`.
- Add `UI_PAGES.md`.
- Ensure page/task docs reference these files.
- Ensure styling follows `source/styling.md` tokens.

Tests:

- Documentation files exist.
- UI implementation tasks reference mockups.

Validation:

```bash
test -f UI_MOCKUPS.md
test -f UI_PAGES.md
```

Acceptance criteria:

- Agents have clear UI wireframes and page-level implementation specs.
- Future UI changes update these docs before task completion.

---

### TASK-002B: Implement shared design system primitives

Status: done

Objective: Create reusable UI primitives matching the dark glowing RAGFlow Studio design language.

Implementation:

- Add Button, Input, Select, Card, Badge, Progress, Spinner, EmptyState, ErrorAlert, and Toast components.
- Add typography/font setup for Sora, Inter, and JetBrains Mono.
- Add Tailwind tokens for Black Pearl, Violet, Aqua, Ice White, Magenta, Emerald, and Blue Glow.
- Add focus-visible and disabled states.

Tests:

- Each component renders correctly.
- Disabled and loading states are accessible.
- Focus styles are present.

Validation:

```bash
npm run lint
npm run typecheck
npm run test
```

Acceptance criteria:

- Shared UI primitives are ready for page implementation.
- Components follow `UI_MOCKUPS.md` and `design.md`.

---

### TASK-002C: Scaffold all MVP pages from mockups

Status: done

Objective: Create initial page scaffolds for Login, Register, Chat, Documents, and Settings.

Implementation:

- Implement `/login` using the login mockup.
- Implement `/register` using the register mockup.
- Implement protected app shell.
- Implement `/chat` static shell.
- Implement `/documents` static shell.
- Implement `/settings` static shell.
- Use placeholder data only where backend is not ready.

Tests:

- Each route renders.
- Navigation links work.
- Empty states render.
- Forms expose labels.

Validation:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

Acceptance criteria:

- All MVP pages are visible and match the mockup structure.
- Later tasks can wire backend logic into these pages.


## Phase 3 — Supabase Auth and Database

### TASK-003: Configure Supabase client/server utilities

Status: done

Objective: Set up Supabase client and server helpers.

Implementation:

- Create browser Supabase client.
- Create server Supabase client.
- Ensure session retrieval works in server components and route handlers.
- Add middleware for protected routes.

Tests:

- Unauthenticated user is redirected from protected pages.
- Authenticated session can access protected pages.

Acceptance criteria:

- Supabase Auth is connected.
- Middleware protects `/chat`, `/documents`, and `/settings`.

---

### TASK-004: Create registration page

Status: done

Objective: Build registration page using Supabase Auth.

Implementation:

- Fields: email, password, confirm password.
- Validate password match.
- Show success/error states.
- Redirect to login or chat after success.

Tests:

- Required fields are validated.
- Password mismatch shows error.
- Successful signup calls Supabase.

Acceptance criteria:

- User can register.
- Errors are visible and understandable.

---

### TASK-005: Create login page

Status: done

Objective: Build login page using Supabase Auth.

Implementation:

- Fields: email, password.
- Show login errors.
- Redirect authenticated users to `/chat`.

Tests:

- Required fields are validated.
- Successful login redirects.
- Invalid login shows error.

Acceptance criteria:

- User can log in.
- Protected routes work after login.

---

### TASK-006: Create Supabase schema and RLS policies

Status: done

Objective: Create database tables and row-level security policies.

Implementation:

- Create tables from `design.md`.
- Enable RLS on all user-owned tables.
- Users can only access their own records.
- Service role can perform processing writes.

Tests:

- User A cannot read User B documents.
- User A cannot read User B chats.
- User can insert own document metadata.
- User can insert own chat messages.

Acceptance criteria:

- RLS is enabled and verified.
- Schema supports MVP flows.

---

## Phase 4 — Settings Page

### TASK-007: Build settings UI

Status: done

Objective: Create settings page for model and embedding configuration.

Implementation:

- Provider dropdowns: OpenAI, Anthropic, Gemini, Hugging Face.
- Chat model input.
- Chat API key input.
- Embedding model input.
- Embedding API key input.
- Save button.
- Mask existing key values.

Tests:

- Form renders all fields.
- Save button disables while submitting.
- Validation prevents empty provider/model.

Acceptance criteria:

- User can configure model settings.
- Secrets are never exposed in plain text after save.

---

### TASK-008: Build settings API

Status: done

Objective: Persist and retrieve model settings.

Implementation:

- `GET /api/settings`
- `POST /api/settings`
- Server-side validation with Zod.
- Store settings per user.
- Do not return raw API keys.

Tests:

- Unauthenticated request fails.
- Authenticated user can save settings.
- API never returns raw stored keys.

Acceptance criteria:

- Settings page works end-to-end.
- API is secure.

---

## Phase 5 — Document Upload and Processing

### TASK-009: Build document upload page

Status: done

Objective: Create document upload UI with live progress.

Implementation:

- Upload box/dropzone.
- Support PDF, TXT, DOCX, Markdown in UI.
- MVP parser may support TXT/Markdown first.
- Show upload progress.
- Show stages: uploaded, parsing, chunking, embedding, indexing, completed, failed.
- Show failed state with error message.

Tests:

- Upload form validates file.
- Unsupported file shows error.
- Progress UI updates when status changes.

Acceptance criteria:

- User can upload a document.
- User can see processing progress.

---

### TASK-010: Implement S3 upload API

Status: done

Objective: Upload raw files to S3 and create Supabase document record.

Implementation:

- `POST /api/documents/upload`
- Authenticate user.
- Validate file type and size.
- Generate private S3 key.
- Upload file to S3.
- Insert document record with status `uploaded`.
- Return document ID.

Tests:

- Unauthenticated upload fails.
- Invalid file type fails.
- Valid file creates S3 object and Supabase document row.

Acceptance criteria:

- Files are stored privately in S3.
- User does not see S3 implementation details.

---

### TASK-011: Implement document parser

Status: done

Objective: Extract text from uploaded files.

Implementation:

- Support TXT and Markdown first.
- Add PDF and DOCX if time permits.
- Update document status to `parsing`.
- Store parse error on failure.

Tests:

- TXT parsing returns text.
- Markdown parsing returns text.
- Empty document fails gracefully.
- Failed parse sets status `failed`.

Acceptance criteria:

- Text can be extracted for supported files.
- Failures are logged.

---

### TASK-012: Implement chunking pipeline

Status: done

Objective: Chunk parsed text for embedding.

Implementation:

- Use configurable chunk size.
- Use overlap.
- Preserve document ID, file name, chunk index, user ID.
- Insert chunk metadata into `document_chunks`.

Tests:

- Long text produces multiple chunks.
- Chunk metadata is correct.
- Empty input fails gracefully.

Acceptance criteria:

- Chunks are ready for embedding.
- Chunk metadata links back to source document.

---

### TASK-013: Implement embedding generation

Status: done

Objective: Generate embeddings for document chunks.

Implementation:

- Use user embedding settings where available.
- Use the saved encrypted embedding credential when the selected provider is supported.
- Fall back to server default embedding provider.
- Fall back to the provider environment key when no user-scoped credential is available.
- Persist the embedding dimension alongside the user embedding config and ensure it matches the Pinecone index dimension configured on the server.
- Batch embeddings.
- Update document status to `embedding`.
- Track processed chunk count.

Tests:

- Embedding client receives expected chunk text.
- Batching works.
- Failure marks document as failed.

Acceptance criteria:

- Chunks are converted into embeddings.
- Progress is visible.

---

### TASK-014: Implement Pinecone indexing

Status: done

Objective: Store vectors in Pinecone.

Implementation:

- Create namespace per user or per document.
- Use vector IDs: `userId:documentId:chunkIndex`.
- Store user ID, document ID, file name, chunk index, and content preview metadata.
- Update status to `indexing`, then `completed`.

Tests:

- Pinecone upsert receives expected vectors.
- Metadata is attached.
- Completed status is set.

Acceptance criteria:

- Documents are queryable from Pinecone.
- Supabase document status becomes `completed`.

---

### TASK-015: Add live document status polling

Status: done

Objective: Show processing progress live.

Implementation:

- `GET /api/documents/:id/status`
- Poll every 1-2 seconds while processing.
- Stop polling on `completed` or `failed`.
- Show processed chunks vs total chunks.

Tests:

- Polling stops on completed.
- Polling stops on failed.
- UI displays correct stage.

Acceptance criteria:

- User sees live upload and processing progress.

---

## Phase 6 — Chat and Agentic RAG

### TASK-016: Build chat UI

Status: done

Objective: Create chat page with message history and response area.

Implementation:

- Chat input.
- Message list.
- Session creation.
- Loading state.
- Tool activity indicator.
- Error state.

Tests:

- User can submit message.
- Assistant response renders.
- Empty input is blocked.

Acceptance criteria:

- Chat page is usable.
- Messages are visually clear.

---

### TASK-017: Implement chat persistence

Status: done

Objective: Persist chat sessions and messages in Supabase.

Implementation:

- Create session if no session exists.
- Save user messages.
- Save assistant messages.
- Save metadata and LangSmith run IDs where available.

Tests:

- User message is stored.
- Assistant message is stored.
- User cannot access another user's chat session.

Acceptance criteria:

- Chat history survives refresh.
- Data is user-scoped.

---

### TASK-018: Implement vector search tool

Status: done

Objective: Create an agent tool for querying Pinecone.

Implementation:

- Tool input: query, topK, optional document IDs.
- Generate query embedding.
- Query Pinecone namespace for current user.
- Return relevant chunks with metadata.
- Log tool call.

Tests:

- Tool validates input.
- Tool queries correct namespace.
- Tool returns chunk metadata.
- Tool does not return another user's vectors.

Acceptance criteria:

- Agent can retrieve relevant document chunks.

---

### TASK-019: Implement date/time tool

Status: done

Objective: Create deterministic date/time tool.

Implementation:

- Return current ISO datetime.
- Return user-friendly date.
- Include timezone.
- Log tool call.

Tests:

- Tool returns valid ISO datetime.
- Tool output includes timezone.

Acceptance criteria:

- Agent can answer date-aware questions.

---

### TASK-020: Implement Tavily web search tool

Status: done

Objective: Create Tavily-powered web search tool.

Implementation:

- Tool input: query, max results.
- Call Tavily server-side.
- Return title, URL, snippet, and source metadata.
- Log tool call.
- Add timeout and error handling.

Tests:

- Tool validates input.
- Tool handles Tavily failure.
- Tool returns normalized search results.

Acceptance criteria:

- Agent can search the web when document knowledge is insufficient.

---

### TASK-021: Implement LangGraph agent

Status: done

Objective: Create Agentic RAG workflow using LangGraph.js.

Implementation:

- Agent receives user message and chat history.
- Agent has vector search, date/time, and web-search tools.
- Prefer vector search for document questions.
- Use Tavily only for current web questions, explicit internet requests, or low-confidence document retrieval.
- Response must cite document chunks or web results in metadata.
- Add LangSmith tracing.

Tests:

- Agent calls vector search for document question.
- Agent calls date tool for date question.
- Agent calls web search for current information question.
- Agent stores assistant response.
- Tool calls are logged.

Acceptance criteria:

- Agent can answer document-grounded questions.
- Agent can use tools.
- Agent execution is observable.

---

### TASK-022: Implement `/api/chat`

Status: done

Objective: Create chat API endpoint that invokes the LangGraph agent.

Implementation:

- Authenticate user.
- Validate request body.
- Load session history.
- Invoke agent.
- Store messages.
- Return assistant answer and metadata.
- Include LangSmith run ID if available.

Tests:

- Unauthenticated request fails.
- Valid request returns answer.
- Messages are persisted.
- Tool calls are logged.

Acceptance criteria:

- Chat flow works end-to-end.

---

## Phase 7 — Observability

### TASK-023: Add LangSmith tracing

Status: done

Objective: Trace agent runs, tool calls, and retrieval behavior.

Acceptance criteria:

- Agent run creates trace.
- Trace ID is saved.
- Sensitive fields are redacted.

---

### TASK-024: Add app-level event logging

Status: done

Objective: Log document and chat lifecycle events.

Acceptance criteria:

- Upload, processing, chat, and failure logs exist.
- Logs are structured.

---

## Phase 8 — Security and Validation

### TASK-025: Add server-side auth guards

Status: done

Objective: Ensure all protected APIs enforce auth.

Acceptance criteria:

- Protected APIs reject unauthenticated requests.
- Client-submitted user ID is ignored.

---

### TASK-026: Validate all API inputs with Zod

Status: done

Objective: Add schema validation to all API routes.

Acceptance criteria:

- Invalid input returns 400.
- Valid input proceeds.

---

### TASK-027: Add secret handling safeguards

Status: done

Objective: Prevent provider key leakage.

Acceptance criteria:

- APIs do not return raw keys.
- Logs do not include keys.
- UI masks saved keys.

---

## Phase 9 — QA, Deployment, and Smoke Tests

### TASK-028: Add E2E auth test

Status: done

Objective: Validate login and protected routing.

Acceptance criteria:

- Login redirects to `/chat`.
- `/settings` is accessible after login.

---

### TASK-029: Add E2E document upload test

Status: done

Objective: Validate document upload and processing flow.

Acceptance criteria:

- Test TXT upload reaches `completed`.
- Document appears in list.

---

### TASK-030: Add E2E chat RAG test

Status: done

Objective: Validate document-grounded chat.

Acceptance criteria:

- Known fact from uploaded document is retrieved in answer.
- Chat persists after refresh.

---

### TASK-031: Add E2E tool-routing test

Status: done

Objective: Validate agent tool routing.

Acceptance criteria:

- Date question uses date tool.
- Document question uses vector search.
- Current web question uses Tavily.

---

### TASK-032: Add production deployment config

Status: done

Objective: Prepare app for deployment.

Acceptance criteria:

- Production build succeeds.
- Required env vars are documented.

---

### TASK-033: Add MVP smoke test checklist

Status: done

Objective: Create final launch validation checklist.

Acceptance criteria:

- All smoke tests in `TESTING.md` pass.

---

## Phase 10 — Runtime Agentic RAG MCP Configuration

These tasks are later-phase tasks. Do not implement them before the MVP smoke test passes unless explicitly instructed.

### TASK-034: Add runtime MCP schema

Status: done

Objective: Add database support for configurable runtime MCP servers.

Implementation:

- Add `mcp_server_configs` table.
- Add `mcp_tool_invocations` table.
- Add RLS policies.
- Add redaction rules.
- Support both `stdio` and `http` transports in schema.

Tests:

- User A cannot read User B MCP configs.
- Browser API does not return encrypted headers/env values.
- Invalid transport is rejected.

Acceptance criteria:

- Runtime MCP configs can be stored securely.
- Secrets are encrypted and never returned raw.

---

### TASK-035: Add runtime MCP backend adapter

Status: done

Objective: Create a server-only MCP client layer for Agentic RAG tools.

Implementation:

- Add `src/server/mcp/registry.ts`.
- Add `src/server/mcp/client.ts`.
- Add `src/server/mcp/tools.ts`.
- Add `src/server/mcp/redaction.ts`.
- Add support for `stdio` and `http` MCP transports.
- Add timeouts.
- Add production allowlist for stdio commands.

Tests:

- HTTP config creates HTTP MCP client.
- stdio config creates stdio MCP client only if command is allowed.
- Disabled servers are not loaded.
- Tool input/output logs are redacted.

Acceptance criteria:

- LangGraph can receive tools from enabled MCP configs.
- MCP never runs in client/browser context.

---

### TASK-036: Add MCP configuration APIs

Status: done

Objective: Add backend APIs for managing runtime MCP server configs.

Routes:

- `GET /api/mcp/servers`
- `POST /api/mcp/servers`
- `GET /api/mcp/servers/:id`
- `PATCH /api/mcp/servers/:id`
- `DELETE /api/mcp/servers/:id`
- `POST /api/mcp/servers/:id/test`
- `GET /api/mcp/servers/:id/tools`

Tests:

- Unauthenticated requests fail.
- User can CRUD own configs.
- User cannot access another user's configs.
- Test connection does not leak secrets.

Acceptance criteria:

- MCP configs are manageable through secure server APIs.

---

### TASK-037: Add MCP Tools Settings UI

Status: done

Objective: Add a Settings tab for configurable runtime MCP tools.

Implementation:

- Add `MCP Tools` tab in `/settings`.
- Add server list.
- Add add/edit modal.
- Add transport selector: `stdio` or `http`.
- Add HTTP URL/header fields.
- Add stdio command/args/env fields.
- Add test connection action.
- Add available tools preview.
- Add enabled toggle.

Tests:

- UI renders empty state.
- User can choose transport.
- HTTP fields render only for HTTP.
- stdio fields render only for stdio.
- Save/test actions call correct APIs.

Acceptance criteria:

- Users can configure runtime MCP tools without seeing raw stored secrets.

---

### TASK-038: Integrate runtime MCP tools into Agentic RAG

Status: validated

Objective: Allow the Agentic RAG assistant to use enabled MCP tools after document retrieval.

Implementation:

- Load enabled MCP configs for user/global scope.
- Convert MCP tools into LangGraph-compatible tools.
- Add tool-selection policy.
- Preserve MVP vector search as default first tool.
- Log MCP tool invocations.
- Attach LangSmith trace IDs.

Tests:

- Agent answers document-only questions without MCP.
- Agent can call enabled HTTP MCP tool.
- Agent does not call disabled MCP tool.
- Tool calls are logged.
- User isolation is enforced.

Acceptance criteria:

- Runtime MCP is configurable and safely integrated without breaking MVP RAG.
