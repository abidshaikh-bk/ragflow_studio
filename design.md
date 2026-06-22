# design.md — RAGFlow Studio Product and Technical Design

## 1. Product summary

**RAGFlow Studio** is a one-day MVP Agentic RAG application. Users can register, log in, configure AI model settings, upload documents, track live ingestion progress, and chat with an agent that uses document retrieval, date/time tools, and web search.

## 2. MVP goals

- Supabase Auth-based registration and login.
- Authenticated app shell with Chat, Documents, and Settings pages.
- Settings for chat model and embedding model configuration.
- Document upload with private S3 storage.
- Document parsing, chunking, embedding, and Pinecone indexing.
- Live document processing progress.
- Agentic RAG chat with LangChain.js/LangGraph.js.
- Tool support for Pinecone search, date/time, and Tavily web search.
- Persistent chat history, document metadata, tool calls, and LangSmith trace IDs.

## 3. Tech stack

| Layer | Choice |
|---|---|
| App framework | Next.js App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | Supabase Auth |
| Database | Supabase Postgres |
| File storage | AWS S3 |
| Vector DB | Pinecone |
| Agent framework | LangChain.js + LangGraph.js |
| Observability | LangSmith |
| Web search | Tavily |
| Validation | Zod |
| Tests | Vitest, React Testing Library, Playwright |

## 4. Pages

### `/login`

Purpose: authenticate existing users.

UI:

- Email input
- Password input
- Login button
- Link to register
- Error/success state

### `/register`

Purpose: create new users.

UI:

- Email input
- Password input
- Confirm password input
- Register button
- Link to login
- Error/success state

### `/chat`

Purpose: chat with Agentic RAG assistant.

UI:

- Chat session list or lightweight session selector
- Message list
- Chat input
- Send button
- Streaming/loading indicator
- Tool activity indicator
- Source/citation metadata panel when available

### `/documents`

Purpose: upload and process documents.

UI:

- File upload dropzone
- Supported type hint: PDF, TXT, DOCX, Markdown
- Upload progress
- Processing progress stages:
  - uploaded
  - parsing
  - chunking
  - embedding
  - indexing
  - completed
  - failed
- Document list
- Error state with retry option if feasible

### `/settings`

Purpose: configure model providers.

UI:

- Chat provider select: OpenAI, Anthropic, Gemini, Hugging Face
- Chat model input
- Chat API key input, masked after save
- Embedding provider select
- Embedding model input
- Embedding API key input, masked after save
- Save button



## 4A. UI mockup source of truth

The implementation source of truth for screens is split across:

- `UI_MOCKUPS.md` for low-fidelity wireframes, states, and layout intent.
- `UI_PAGES.md` for route-level implementation details and component breakdown.

Any UI implementation that changes layout, state behavior, visual hierarchy, or component structure must update these files in the same Git commit.

## 4B. Design system tokens

Use these tokens consistently across Tailwind config and components:

| Token | Value | Usage |
|---|---:|---|
| Black Pearl | `#050816` | app background |
| Violet | `#7C3AED` | primary buttons, active nav, key focus |
| Aqua | `#06B6D4` | secondary highlights, network glow |
| Ice White | `#F9FAFB` | primary text |
| Magenta | `#D946EF` | accent, error highlight where appropriate |
| Emerald | `#10B981` | completed/success states |
| Blue Glow | `#2563EB` | links, info, graph glow |

Typography:

- Headings: Sora.
- Body: Inter.
- Code and technical IDs: JetBrains Mono.

## 5. API routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/callback` | Supabase auth callback if needed |
| GET | `/api/settings` | Get masked settings |
| POST | `/api/settings` | Save settings |
| GET | `/api/documents` | List current user's documents |
| POST | `/api/documents/upload` | Upload raw document to S3 and create record |
| POST | `/api/documents/:id/process` | Process uploaded document |
| GET | `/api/documents/:id/status` | Poll processing status |
| GET | `/api/chat/sessions` | List chat sessions |
| GET | `/api/chat/sessions/:id` | Get chat messages |
| POST | `/api/chat` | Invoke agent |
| POST | `/api/tools/date` | Date/time tool endpoint if exposed internally |
| POST | `/api/tools/vector-search` | Vector search tool endpoint if exposed internally |
| POST | `/api/tools/web-search` | Tavily web-search tool endpoint if exposed internally |

## 6. Data model

### `profiles`

```sql
id uuid primary key references auth.users(id)
email text
display_name text
created_at timestamptz default now()
updated_at timestamptz default now()
```

### `user_model_settings`

```sql
id uuid primary key default gen_random_uuid()
user_id uuid references auth.users(id)
chat_provider text
chat_model text
chat_api_key_encrypted text
embedding_provider text
embedding_model text
embedding_api_key_encrypted text
created_at timestamptz default now()
updated_at timestamptz default now()
```

MVP rule: prefer server environment keys. Do not store plaintext API keys. If encryption is not implemented, store only masked metadata or provider/model choices.

### `documents`

```sql
id uuid primary key default gen_random_uuid()
user_id uuid references auth.users(id)
file_name text
file_type text
file_size bigint
s3_key text
status text
error_message text
total_chunks int default 0
processed_chunks int default 0
pinecone_namespace text
created_at timestamptz default now()
updated_at timestamptz default now()
```

Allowed status values:

- uploaded
- parsing
- chunking
- embedding
- indexing
- completed
- failed

### `document_chunks`

```sql
id uuid primary key default gen_random_uuid()
document_id uuid references documents(id)
user_id uuid references auth.users(id)
chunk_index int
content_preview text
token_count int
pinecone_vector_id text
created_at timestamptz default now()
```

### `chat_sessions`

```sql
id uuid primary key default gen_random_uuid()
user_id uuid references auth.users(id)
title text
created_at timestamptz default now()
updated_at timestamptz default now()
```

### `chat_messages`

```sql
id uuid primary key default gen_random_uuid()
session_id uuid references chat_sessions(id)
user_id uuid references auth.users(id)
role text
content text
metadata jsonb
langsmith_run_id text
created_at timestamptz default now()
```

Allowed roles:

- user
- assistant
- system
- tool

### `agent_tool_calls`

```sql
id uuid primary key default gen_random_uuid()
session_id uuid references chat_sessions(id)
message_id uuid references chat_messages(id)
user_id uuid references auth.users(id)
tool_name text
tool_input jsonb
tool_output jsonb
status text
latency_ms int
langsmith_run_id text
created_at timestamptz default now()
```

## 7. Document processing pipeline

```txt
Upload file
  -> Validate auth, file type, file size
  -> Store raw file privately in S3
  -> Insert documents row with status uploaded
  -> Parse text
  -> Update status parsing
  -> Chunk text
  -> Update status chunking and total_chunks
  -> Generate embeddings in batches
  -> Update status embedding and processed_chunks
  -> Upsert vectors to Pinecone
  -> Update status indexing
  -> Mark completed
```

Failure rule: any unrecoverable error must set `documents.status = failed` and write a safe `error_message`.

## 8. Agentic RAG design

The chat agent should be built with LangGraph.js and exposed through `/api/chat`.

Inputs:

- Authenticated user ID
- Session ID, optional
- User message
- Recent chat history
- User model settings or server defaults

Tools:

1. `vectorSearchTool`
   - Generates query embedding.
   - Queries Pinecone namespace for the current user.
   - Returns top chunks with metadata.

2. `dateTimeTool`
   - Returns current ISO datetime.
   - Returns user-friendly date and timezone.

3. `webSearchTool`
   - Uses Tavily.
   - Returns normalized title, URL, snippet, and source metadata.

Routing policy:

- Prefer vector search for document questions.
- Use date/time tool for temporal questions.
- Use Tavily only when the user asks for current web information, explicitly asks for internet search, or vector search confidence is low.

Persistence:

- Save user message before agent call.
- Save assistant response after agent call.
- Save tool calls in `agent_tool_calls`.
- Save LangSmith run IDs where available.

Initial MVP execution shape:

- LangGraph state graph routes each chat turn into date/time, vector search, or Tavily web search.
- Low-confidence vector retrieval may fall back to Tavily web search.
- A server-side chat model composes the final answer from the selected tool context.

## 9. UI design system

### Visual direction

Dark, glowing, graph/network visual language.

### Colors

| Token | Hex | Use |
|---|---:|---|
| Black Pearl | `#050816` | App background |
| Violet | `#7C3AED` | Primary actions, focus rings |
| Aqua | `#06B6D4` | Secondary highlights, progress |
| Ice White | `#F9FAFB` | Primary text |
| Magenta | `#D946EF` | Accent glow, errors/attention where appropriate |
| Emerald | `#10B981` | Success/completed states |
| Blue Glow | `#2563EB` | Links, info states, active nav |

### Fonts

- Headings: Sora
- Body: Inter
- Code: JetBrains Mono

### Component style

- Background: near-black with subtle radial gradients.
- Cards: translucent dark panels with soft border and glow.
- Buttons: violet primary, aqua secondary, emerald success.
- Inputs: dark filled fields with violet focus ring.
- Progress: staged timeline with aqua active state and emerald completed state.
- Chat bubbles: user and assistant visually distinct without sacrificing readability.

## 10. MVP tradeoffs

Accepted for day-one launch:

- Poll document status instead of WebSockets.
- Support TXT and Markdown first; add PDF/DOCX if time permits.
- Use environment model keys as fallback.
- Use simple chunking before advanced semantic chunking.
- Store LangSmith trace IDs instead of building a custom observability dashboard.
- Use private S3 storage while hiding storage implementation from users.


## 15. Version-control and documentation design

RAGFlow Studio is built by autonomous coding agents, so version control is part of the product workflow.

Every task must produce an auditable Git history:

1. One task branch per task.
2. One task-scoped commit per completed task.
3. Tests run before commit.
4. Relevant docs updated in the same commit.
5. `PROGRESS_LOG.md` updated with validation result and commit hash.

See `VCS_WORKFLOW.md` and `GITHUB.md` for the full Git/GitHub workflow.

# MVP-first architecture update

## Priority architecture for the first release

The first release must optimize for the shortest reliable path to a working private-document RAG product.

```txt
Supabase Auth
  -> Protected Next.js pages
  -> S3 upload
  -> Supabase document row
  -> Parser
  -> Chunker
  -> Default embedding model
  -> Pinecone user namespace
  -> Chat session
  -> Vector retrieval over user's namespace
  -> Assistant answer
  -> Supabase message persistence
```

## MVP backend modules

```txt
src/server/auth/require-user.ts
src/server/storage/s3.ts
src/server/documents/parser.ts
src/server/documents/chunker.ts
src/server/documents/process-document.ts
src/server/embeddings/default-embedder.ts
src/server/vector/pinecone.ts
src/server/rag/simple-rag.ts
src/server/chat/persistence.ts
```

## MVP UI pages

The MVP UI should expose only the pages needed for the working flow:

- `/login`
- `/register`
- `/documents`
- `/chat`

`/settings` may exist as a simple placeholder showing the active default model configuration. Advanced editable model/MCP configuration belongs to later phases.

## Runtime Agentic RAG MCP design

The future runtime MCP layer must support both `stdio` and `http` transports and must be configurable through backend APIs and later Settings UI. See `AGENTIC_RAG_MCP.md`.

MVP default behavior must not depend on runtime MCP. The simple RAG chain should be usable even when no MCP server is configured.
