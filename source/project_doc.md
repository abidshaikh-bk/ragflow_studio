# RAGFlow Studio — Agentic RAG MVP Development Plan

## 0. Product Objective

Build a 1-day MVP of **RAGFlow Studio**, a Next.js full-stack application where users can:

1. Register and log in.
2. Configure AI and embedding model providers.
3. Upload documents.
4. Track live document processing progress.
5. Chat with an Agentic RAG assistant.
6. Persist chat, agent calls, document metadata, and observability references.

The system will be developed by coding agents. Each task below must be completed, tested, and logged before the next dependent task starts.

---

# 1. MVP Architecture

## 1.1 Stack

* Framework: Next.js App Router
* Language: TypeScript
* Auth: Supabase Auth
* Database: Supabase Postgres
* File storage: AWS S3
* Vector DB: Pinecone
* RAG/Agent framework: LangChain.js + LangGraph.js
* Observability: LangSmith
* Web search tool: Tavily
* Styling: Tailwind CSS
* Testing: Vitest, React Testing Library, Playwright
* Validation: Zod
* Background processing: Initial MVP can use API route-triggered async jobs; if time permits, add queue abstraction.

## 1.2 MCP Servers for Coding Agents

Coding agents should use the following MCP servers during development:

| Area                     | MCP Server                                   | Purpose                                                                                       |
| ------------------------ | -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Next.js frontend/backend | Next.js DevTools MCP                         | Inspect app routes, runtime errors, hydration issues, and Next.js internals.                  |
| Supabase                 | Supabase MCP                                 | Manage schema, inspect tables, validate RLS, query test data, and debug auth/database issues. |
| Pinecone                 | Pinecone MCP                                 | Create/check indexes, validate upserts, test vector queries, and inspect retrieval results.   |
| LangSmith                | LangSmith MCP                                | Inspect traces, runs, prompts, datasets, and agent execution history.                         |
| Tavily                   | Tavily MCP                                   | Validate web-search tool behavior and extraction responses.                                   |
| AWS/S3                   | AWS MCP or S3-compatible MCP where available | Validate bucket policies, object writes, and signed access patterns.                          |

## 1.3 Core User Flow

1. User opens app.
2. If unauthenticated, user sees login/register.
3. After login, user lands on chat page.
4. User can open settings and configure:

   * Chat model provider.
   * Chat model name.
   * API key.
   * Embedding provider.
   * Embedding model name.
5. User uploads documents.
6. App uploads raw files to S3.
7. App creates document record in Supabase.
8. App parses document.
9. App chunks parsed text.
10. App generates embeddings.
11. App upserts vectors into Pinecone.
12. App shows live progress.
13. User chats with agent.
14. Agent can:

* Query Pinecone.
* Use current date/time tool.
* Use Tavily web search.

15. App stores chat messages, tool calls, retrieval references, and LangSmith trace IDs.

---

# 2. Environment Variables

Create `.env.example` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

DATABASE_URL=

AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=

PINECONE_API_KEY=
PINECONE_INDEX_NAME=

LANGSMITH_API_KEY=
LANGSMITH_PROJECT=ragflow-studio
LANGCHAIN_TRACING_V2=true

TAVILY_API_KEY=

OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
HUGGINGFACE_API_KEY=

APP_URL=http://localhost:3000
```

Security rule: never expose provider API keys to the browser except Supabase public keys.

---

# 3. Database Schema

## 3.1 Tables

### `profiles`

Stores basic user profile data.

Fields:

* `id uuid primary key references auth.users(id)`
* `email text`
* `display_name text`
* `created_at timestamptz default now()`
* `updated_at timestamptz default now()`

### `user_model_settings`

Stores user-level AI settings.

Fields:

* `id uuid primary key default gen_random_uuid()`
* `user_id uuid references auth.users(id)`
* `chat_provider text`
* `chat_model text`
* `chat_api_key_encrypted text`
* `embedding_provider text`
* `embedding_model text`
* `embedding_api_key_encrypted text`
* `created_at timestamptz default now()`
* `updated_at timestamptz default now()`

MVP note: if encryption is not implemented on day 1, store only references or use server-side environment keys. Do not store plaintext API keys unless explicitly accepted as a temporary local-only dev limitation.

### `documents`

Stores uploaded document metadata.

Fields:

* `id uuid primary key default gen_random_uuid()`
* `user_id uuid references auth.users(id)`
* `file_name text`
* `file_type text`
* `file_size bigint`
* `s3_key text`
* `status text`
* `error_message text`
* `total_chunks int default 0`
* `processed_chunks int default 0`
* `pinecone_namespace text`
* `created_at timestamptz default now()`
* `updated_at timestamptz default now()`

Allowed statuses:

* `uploaded`
* `parsing`
* `chunking`
* `embedding`
* `indexing`
* `completed`
* `failed`

### `document_chunks`

Stores chunk metadata, not necessarily full chunk content if Pinecone metadata is enough.

Fields:

* `id uuid primary key default gen_random_uuid()`
* `document_id uuid references documents(id)`
* `user_id uuid references auth.users(id)`
* `chunk_index int`
* `content_preview text`
* `token_count int`
* `pinecone_vector_id text`
* `created_at timestamptz default now()`

### `chat_sessions`

Stores chat sessions.

Fields:

* `id uuid primary key default gen_random_uuid()`
* `user_id uuid references auth.users(id)`
* `title text`
* `created_at timestamptz default now()`
* `updated_at timestamptz default now()`

### `chat_messages`

Stores chat messages.

Fields:

* `id uuid primary key default gen_random_uuid()`
* `session_id uuid references chat_sessions(id)`
* `user_id uuid references auth.users(id)`
* `role text`
* `content text`
* `metadata jsonb`
* `langsmith_run_id text`
* `created_at timestamptz default now()`

Allowed roles:

* `user`
* `assistant`
* `system`
* `tool`

### `agent_tool_calls`

Stores agent tool usage.

Fields:

* `id uuid primary key default gen_random_uuid()`
* `session_id uuid references chat_sessions(id)`
* `message_id uuid references chat_messages(id)`
* `user_id uuid references auth.users(id)`
* `tool_name text`
* `tool_input jsonb`
* `tool_output jsonb`
* `status text`
* `latency_ms int`
* `langsmith_run_id text`
* `created_at timestamptz default now()`

---

# 4. Routing Plan

## 4.1 Public routes

* `/login`
* `/register`

## 4.2 Protected routes

* `/chat`
* `/documents`
* `/settings`

## 4.3 API routes

* `POST /api/auth/callback`
* `GET /api/settings`
* `POST /api/settings`
* `POST /api/documents/upload`
* `POST /api/documents/:id/process`
* `GET /api/documents/:id/status`
* `GET /api/documents`
* `POST /api/chat`
* `GET /api/chat/sessions`
* `GET /api/chat/sessions/:id`
* `POST /api/tools/date`
* `POST /api/tools/vector-search`
* `POST /api/tools/web-search`

---

# 5. Agent Development Rules

Every coding agent must follow these rules:

1. Work only on assigned task ID.
2. Before starting, update task status to `in_progress`.
3. After code completion, run all task-level tests.
4. If tests pass, update task status to `validated`.
5. If manual review is required, update task status to `review_required`.
6. If task is complete and validated, update task status to `done`.
7. Log blockers under the task.
8. Do not mark tasks as done without tests.
9. Do not store secrets in frontend code.
10. Do not bypass RLS for user-facing API routes.

---

# 6. Progress Log Format

Each task should be logged like this:

````md
## TASK-ID: Short task title

Status: not_started | in_progress | blocked | validated | review_required | done

Owner Agent:
Started:
Completed:

### Objective
...

### Files Changed
- ...

### Implementation Notes
...

### Tests Added
- ...

### Validation Commands
```bash
...
````

### Result

Pass | Fail

### Blockers

* ...

### Follow-up

* ...

````

---

# 7. Phase Plan

# Phase 1 — Repository and Project Foundation

## TASK-001: Initialize Next.js project

Status: not_started

### Objective
Create the Next.js App Router project with TypeScript and Tailwind.

### Implementation Requirements
- Use Next.js App Router.
- Add TypeScript.
- Add Tailwind.
- Add base folder structure.
- Add `.env.example`.
- Add `README.md`.
- Add `PLAN.md`.

### Suggested folders

```txt
src/
  app/
  components/
  lib/
  server/
  types/
  tests/
````

### Tests

* App starts locally.
* Homepage renders.
* TypeScript compiles.

### Validation Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run dev
```

### Acceptance Criteria

* Next.js app boots successfully.
* No TypeScript errors.
* No lint errors.

---

## TASK-002: Add shared UI shell

Status: not_started

### Objective

Create reusable app layout, navigation, loading states, error components, and protected page shell.

### Implementation Requirements

* Add top navigation.
* Add route links for Chat, Documents, Settings.
* Add loading spinner.
* Add empty state component.
* Add error alert component.
* Add authenticated layout placeholder.

### Tests

* Navigation renders expected links.
* Loading and error components render correctly.

### Acceptance Criteria

* Protected app shell exists.
* UI is reusable across all protected pages.

---

# Phase 2 — Supabase Auth and Database

## TASK-003: Configure Supabase client/server utilities

Status: not_started

### Objective

Set up Supabase client and server helpers.

### Implementation Requirements

* Create browser Supabase client.
* Create server Supabase client.
* Ensure session retrieval works in server components and route handlers.
* Add middleware for protected routes.

### Tests

* Unauthenticated user is redirected from protected pages.
* Authenticated session can access protected pages.

### Acceptance Criteria

* Supabase Auth is connected.
* Middleware protects `/chat`, `/documents`, and `/settings`.

---

## TASK-004: Create registration page

Status: not_started

### Objective

Build user registration page using Supabase Auth.

### Implementation Requirements

* Fields: email, password, confirm password.
* Validate password match.
* Show success/error states.
* Redirect to login or chat after success.

### Tests

* Form validates required fields.
* Password mismatch shows error.
* Successful signup calls Supabase.

### Acceptance Criteria

* User can register.
* Errors are visible and understandable.

---

## TASK-005: Create login page

Status: not_started

### Objective

Build user login page using Supabase Auth.

### Implementation Requirements

* Fields: email, password.
* Show login errors.
* Redirect authenticated users to `/chat`.

### Tests

* Form validates required fields.
* Successful login redirects.
* Invalid login shows error.

### Acceptance Criteria

* User can log in.
* Protected routes work after login.

---

## TASK-006: Create Supabase schema and RLS policies

Status: not_started

### Objective

Create database tables and row-level security policies.

### Implementation Requirements

* Create all tables listed in section 3.
* Enable RLS on all user-owned tables.
* Users can only access their own records.
* Service role can perform processing writes.

### Tests

* User A cannot read User B documents.
* User A cannot read User B chats.
* User can insert own document metadata.
* User can insert own chat messages.

### Acceptance Criteria

* RLS is enabled and verified.
* Schema supports MVP flows.

---

# Phase 3 — Settings Page

## TASK-007: Build settings UI

Status: not_started

### Objective

Create settings page for model and embedding configuration.

### Implementation Requirements

* Provider dropdown:

  * OpenAI
  * Anthropic
  * Gemini
  * Hugging Face
* Chat model input.
* Chat API key input.
* Embedding provider dropdown.
* Embedding model input.
* Embedding API key input.
* Save button.
* Mask existing key values.

### Tests

* Form renders all fields.
* Save button disabled while submitting.
* Validation prevents empty provider/model.

### Acceptance Criteria

* User can configure model settings.
* Secrets are never exposed in plain text after save.

---

## TASK-008: Build settings API

Status: not_started

### Objective

Persist and retrieve model settings.

### Implementation Requirements

* `GET /api/settings`
* `POST /api/settings`
* Server-side validation with Zod.
* Store settings per user.
* Do not return raw API keys.

### Tests

* Unauthenticated request fails.
* Authenticated user can save settings.
* API never returns raw stored keys.

### Acceptance Criteria

* Settings page works end-to-end.
* API is secure.

---

# Phase 4 — Document Upload and Processing

## TASK-009: Build document upload page

Status: not_started

### Objective

Create document upload UI with live progress.

### Implementation Requirements

* Upload box.
* Supported file types:

  * PDF
  * TXT
  * DOCX
  * Markdown
* Show upload progress.
* Show processing stages:

  * Uploaded
  * Parsing
  * Chunking
  * Embedding
  * Indexing
  * Completed
* Show failed state with error message.

### Tests

* Upload form validates file.
* Unsupported file shows error.
* Progress UI updates when status changes.

### Acceptance Criteria

* User can upload a document.
* User can see processing progress.

---

## TASK-010: Implement S3 upload API

Status: not_started

### Objective

Upload raw files to S3 and create Supabase document record.

### Implementation Requirements

* `POST /api/documents/upload`
* Authenticate user.
* Validate file type and size.
* Generate private S3 key.
* Upload file to S3.
* Insert document record with status `uploaded`.
* Return document ID.

### Tests

* Unauthenticated upload fails.
* Invalid file type fails.
* Valid file creates S3 object and Supabase document row.

### Acceptance Criteria

* Files are stored privately in S3.
* User does not see S3 implementation details.

---

## TASK-011: Implement document parser

Status: not_started

### Objective

Extract text from uploaded files.

### Implementation Requirements

* Support TXT and Markdown first.
* Add PDF and DOCX support if time permits.
* Update document status to `parsing`.
* Store parse error on failure.

### Tests

* TXT parsing returns text.
* Markdown parsing returns text.
* Empty document fails gracefully.
* Failed parse sets document status `failed`.

### Acceptance Criteria

* Text can be extracted for supported files.
* Failures are logged.

---

## TASK-012: Implement chunking pipeline

Status: not_started

### Objective

Chunk parsed text for embedding.

### Implementation Requirements

* Use configurable chunk size.
* Use overlap.
* Preserve source metadata:

  * document ID
  * file name
  * chunk index
  * user ID
* Insert chunk metadata into `document_chunks`.

### Tests

* Long text produces multiple chunks.
* Chunk metadata is correct.
* Empty input fails gracefully.

### Acceptance Criteria

* Chunks are ready for embedding.
* Chunk metadata links back to source document.

---

## TASK-013: Implement embedding generation

Status: not_started

### Objective

Generate embeddings for document chunks.

### Implementation Requirements

* Use user embedding settings where available.
* Fall back to server default embedding provider.
* Batch embeddings.
* Update document status to `embedding`.
* Track processed chunk count.

### Tests

* Embedding client receives expected chunk text.
* Batching works.
* Failure marks document as failed.

### Acceptance Criteria

* Chunks are converted into embeddings.
* Progress is visible.

---

## TASK-014: Implement Pinecone indexing

Status: not_started

### Objective

Store vectors in Pinecone.

### Implementation Requirements

* Create namespace per user or per document.
* Use vector IDs with deterministic format:

  * `userId:documentId:chunkIndex`
* Store metadata:

  * user ID
  * document ID
  * file name
  * chunk index
  * content preview
* Update document status to `indexing`, then `completed`.

### Tests

* Pinecone upsert receives expected vectors.
* Metadata is correctly attached.
* Completed document status is set.

### Acceptance Criteria

* Documents are queryable from Pinecone.
* Supabase document status becomes `completed`.

---

## TASK-015: Add live document status polling

Status: not_started

### Objective

Show processing progress live on the document page.

### Implementation Requirements

* `GET /api/documents/:id/status`
* Poll every 1–2 seconds while processing.
* Stop polling on `completed` or `failed`.
* Show processed chunks vs total chunks.

### Tests

* Polling stops on completed.
* Polling stops on failed.
* UI displays correct stage.

### Acceptance Criteria

* User sees live upload and processing progress.

---

# Phase 5 — Chat and Agentic RAG

## TASK-016: Build chat UI

Status: not_started

### Objective

Create chat page with message history and streaming response area.

### Implementation Requirements

* Chat input.
* Message list.
* Session creation.
* Loading state.
* Tool activity indicator.
* Error state.

### Tests

* User can submit message.
* Assistant response renders.
* Empty input is blocked.

### Acceptance Criteria

* Chat page is usable.
* Messages are visually clear.

---

## TASK-017: Implement chat persistence

Status: not_started

### Objective

Persist chat sessions and messages in Supabase.

### Implementation Requirements

* Create session if no session exists.
* Save user messages.
* Save assistant messages.
* Save metadata and LangSmith run IDs where available.

### Tests

* User message is stored.
* Assistant message is stored.
* User cannot access another user’s chat session.

### Acceptance Criteria

* Chat history survives refresh.
* Data is user-scoped.

---

## TASK-018: Implement vector search tool

Status: not_started

### Objective

Create an agent tool for querying Pinecone.

### Implementation Requirements

* Tool input:

  * query
  * topK
  * optional document IDs
* Generate query embedding.
* Query Pinecone namespace for user.
* Return relevant chunks with metadata.
* Log tool call.

### Tests

* Tool validates input.
* Tool queries correct namespace.
* Tool returns chunk metadata.
* Tool does not return another user’s vectors.

### Acceptance Criteria

* Agent can retrieve relevant document chunks.

---

## TASK-019: Implement date/time tool

Status: not_started

### Objective

Create a simple deterministic date/time tool.

### Implementation Requirements

* Return current ISO datetime.
* Return user-friendly date.
* Include timezone.
* Log tool call.

### Tests

* Tool returns valid ISO datetime.
* Tool output includes timezone.

### Acceptance Criteria

* Agent can answer date-aware questions.

---

## TASK-020: Implement Tavily web search tool

Status: not_started

### Objective

Create a Tavily-powered web search tool for the agent.

### Implementation Requirements

* Tool input:

  * query
  * max results
* Call Tavily server-side.
* Return title, URL, snippet, and source metadata.
* Log tool call.
* Add timeout and error handling.

### Tests

* Tool validates input.
* Tool handles Tavily failure.
* Tool returns normalized search results.

### Acceptance Criteria

* Agent can search the web when document knowledge is insufficient.

---

## TASK-021: Implement LangGraph agent

Status: not_started

### Objective

Create Agentic RAG workflow using LangGraph.js.

### Implementation Requirements

* Agent receives user message and chat history.
* Agent has tools:

  * vector search
  * date/time
  * web search
* Agent should prefer vector search for document questions.
* Agent should use Tavily only when:

  * user asks for current web information
  * document search has low confidence
  * user explicitly asks for internet search
* Agent response must cite document chunks or web results in metadata.
* Add LangSmith tracing.

### Tests

* Agent calls vector search for document question.
* Agent calls date tool for date question.
* Agent calls web search for current information question.
* Agent stores assistant response.
* Tool calls are logged.

### Acceptance Criteria

* Agent can answer document-grounded questions.
* Agent can use tools.
* Agent execution is observable.

---

## TASK-022: Implement `/api/chat`

Status: not_started

### Objective

Create chat API endpoint that invokes the LangGraph agent.

### Implementation Requirements

* Authenticate user.
* Validate request body.
* Load session history.
* Invoke agent.
* Store messages.
* Return assistant answer and metadata.
* Include LangSmith run ID if available.

### Tests

* Unauthenticated request fails.
* Valid request returns answer.
* Messages are persisted.
* Tool calls are logged.

### Acceptance Criteria

* Chat flow works end-to-end.

---

# Phase 6 — Observability and Logging

## TASK-023: Add LangSmith tracing

Status: not_started

### Objective

Trace agent runs, tool calls, and retrieval behavior.

### Implementation Requirements

* Enable LangSmith project.
* Attach session ID and user ID as metadata.
* Store run ID in `chat_messages` and `agent_tool_calls`.
* Ensure sensitive API keys are not logged.

### Tests

* Agent run creates trace.
* Trace ID is saved in database.
* Sensitive fields are redacted.

### Acceptance Criteria

* Agent behavior is observable.
* Debugging can happen through LangSmith.

---

## TASK-024: Add app-level event logging

Status: not_started

### Objective

Log important user and system events.

### Implementation Requirements

* Log document upload started/completed/failed.
* Log document processing stage changes.
* Log chat request started/completed/failed.
* Use structured logs.

### Tests

* Logs are emitted for key flows.
* Error logs include useful context.

### Acceptance Criteria

* Failures are diagnosable.

---

# Phase 7 — Security and Hardening

## TASK-025: Add server-side auth guards

Status: not_started

### Objective

Ensure all protected APIs enforce user authentication.

### Implementation Requirements

* Create shared auth helper.
* Use helper in all protected API routes.
* Return 401 for unauthenticated users.
* Ensure user ID is server-derived, not client-submitted.

### Tests

* Protected APIs reject unauthenticated requests.
* Client-submitted user ID is ignored.

### Acceptance Criteria

* APIs are protected.

---

## TASK-026: Validate all API inputs with Zod

Status: not_started

### Objective

Add schema validation to all API routes.

### Implementation Requirements

* Create schemas for:

  * settings
  * upload
  * chat
  * vector search
  * web search
* Return consistent validation errors.

### Tests

* Invalid request body returns 400.
* Valid request body proceeds.

### Acceptance Criteria

* Bad inputs cannot break API logic.

---

## TASK-027: Add secret handling safeguards

Status: not_started

### Objective

Prevent leakage of provider API keys.

### Implementation Requirements

* Never return raw API keys from APIs.
* Never log API keys.
* Mask keys in UI.
* Prefer server environment keys for MVP.
* Add TODO for production encryption/KMS.

### Tests

* Settings API does not return raw key.
* Logs do not include key-like values.
* UI shows masked key.

### Acceptance Criteria

* Secrets are not exposed.

---

# Phase 8 — End-to-End Validation

## TASK-028: Add E2E auth test

Status: not_started

### Objective

Validate login and protected routing.

### Test Flow

1. Open `/login`.
2. Login with test user.
3. Confirm redirect to `/chat`.
4. Visit `/settings`.
5. Confirm settings page loads.

### Acceptance Criteria

* Auth flow works end-to-end.

---

## TASK-029: Add E2E document upload test

Status: not_started

### Objective

Validate document upload and processing flow.

### Test Flow

1. Login.
2. Go to `/documents`.
3. Upload test TXT file.
4. Confirm progress stages appear.
5. Confirm status becomes completed.
6. Confirm document appears in list.

### Acceptance Criteria

* Document processing works end-to-end.

---

## TASK-030: Add E2E chat RAG test

Status: not_started

### Objective

Validate document-grounded chat.

### Test Flow

1. Upload test document containing known fact.
2. Wait for indexing.
3. Ask question about known fact.
4. Confirm answer includes correct fact.
5. Confirm chat history persists after refresh.

### Acceptance Criteria

* Chat can retrieve from uploaded document.

---

## TASK-031: Add E2E tool-routing test

Status: not_started

### Objective

Validate agent tool routing.

### Test Flow

1. Ask “What date is it?”
2. Confirm date tool is used.
3. Ask document-specific question.
4. Confirm vector search is used.
5. Ask current web question.
6. Confirm Tavily tool is used.

### Acceptance Criteria

* Agent uses correct tools for correct question types.

---

# Phase 9 — Launch Readiness

## TASK-032: Add production deployment config

Status: not_started

### Objective

Prepare app for deployment.

### Implementation Requirements

* Add deployment README.
* Add environment variable checklist.
* Add build command.
* Add post-deploy smoke test checklist.

### Tests

* Production build succeeds.
* Required env vars are documented.

### Acceptance Criteria

* App can be deployed.

---

## TASK-033: Add MVP smoke test checklist

Status: not_started

### Objective

Create final launch validation checklist.

### Checklist

* User can register.
* User can log in.
* User can save model settings.
* User can upload document.
* Document reaches completed status.
* User can ask document question.
* Agent can retrieve from Pinecone.
* Agent can use date tool.
* Agent can use Tavily web search.
* Chat history persists.
* LangSmith trace exists.
* No secrets appear in browser or logs.
* RLS prevents cross-user access.

### Acceptance Criteria

* All smoke tests pass before launch.

---

# 8. Suggested 1-Day Execution Timeline

## Hour 0–1: Foundation

* TASK-001
* TASK-002
* TASK-003

## Hour 1–2: Auth and Schema

* TASK-004
* TASK-005
* TASK-006

## Hour 2–3: Settings

* TASK-007
* TASK-008

## Hour 3–5: Document Pipeline

* TASK-009
* TASK-010
* TASK-011
* TASK-012
* TASK-013
* TASK-014
* TASK-015

## Hour 5–7: Chat and Agent

* TASK-016
* TASK-017
* TASK-018
* TASK-019
* TASK-020
* TASK-021
* TASK-022

## Hour 7–8: Observability and Security

* TASK-023
* TASK-024
* TASK-025
* TASK-026
* TASK-027

## Hour 8–10: E2E and Launch Readiness

* TASK-028
* TASK-029
* TASK-030
* TASK-031
* TASK-032
* TASK-033

---

# 9. Agent Assignment Strategy

## Agent A — Foundation/Auth

Responsible for:

* Next.js setup
* Supabase auth
* protected routing
* base layout

Tasks:

* TASK-001 to TASK-006

## Agent B — Settings/Documents

Responsible for:

* settings page
* document upload
* S3 storage
* parsing/chunking/embedding/indexing

Tasks:

* TASK-007 to TASK-015

## Agent C — Chat/Agentic RAG

Responsible for:

* chat UI
* chat persistence
* vector search tool
* date tool
* Tavily tool
* LangGraph agent

Tasks:

* TASK-016 to TASK-022

## Agent D — Observability/Security/QA

Responsible for:

* LangSmith
* structured logging
* Zod validation
* RLS verification
* E2E tests
* launch checklist

Tasks:

* TASK-023 to TASK-033

---

# 10. Definition of Done

A task is done only when:

1. Implementation is complete.
2. Tests are added.
3. Validation commands pass.
4. No known critical blocker remains.
5. `PLAN.md` task status is updated.
6. Files changed are listed.
7. Any follow-up work is documented.

---

# 11. MVP Tradeoffs

For the 1-day launch, these are acceptable tradeoffs:

1. Use polling for document progress instead of WebSockets.
2. Support TXT and Markdown first; add PDF/DOCX if time permits.
3. Use server environment model keys as fallback.
4. Use basic chat session management.
5. Use simple chunking before advanced semantic chunking.
6. Use LangSmith trace IDs rather than building full internal observability dashboards.
7. Use S3 private storage but hide storage details from end users.

---

# 12. Non-Negotiables

The following must not be skipped:

1. Supabase Auth.
2. RLS on user-owned tables.
3. Server-side API key handling.
4. Document status tracking.
5. Pinecone namespace isolation by user or document.
6. Chat persistence.
7. Tool call logging.
8. LangSmith tracing.
9. End-to-end smoke test before launch.
10. No plaintext secrets in frontend code.
